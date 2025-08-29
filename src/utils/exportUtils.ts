import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { Licenza, Cliente, Software } from '../types';
import { formatDate, formatCurrency } from './licenseUtils';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const exportToExcel = (data: any[], filename: string, sheetName: string = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

export const exportToPDF = (data: any[], columns: any[], title: string, filename: string) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 22);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generato il: ${formatDate(new Date())}`, 14, 32);
  
  // Table
  doc.autoTable({
    head: [columns.map(col => col.header)],
    body: data.map(row => columns.map(col => row[col.dataKey] || '')),
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(`${filename}.pdf`);
};

export const exportLicenseDocument = async (
  licenze: Licenza[],
  cliente: Cliente,
  software: Software[]
) => {
  const softwareMap = software.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<number, Software>);


  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: "DOCUMENTO LICENZE SOFTWARE",
              bold: true,
              size: 32
            })
          ],
          spacing: { after: 400 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({
              text: "DATI CLIENTE",
              bold: true,
              size: 24
            })
          ],
          spacing: { after: 200 }
        }),
        
        new Paragraph({
          children: [
            new TextRun(`Azienda: ${cliente.ragioneSociale}`)
          ]
        }),
        
        ...(cliente.email ? [new Paragraph({
          children: [new TextRun(`Email: ${cliente.email}`)]
        })] : []),
        
        ...(cliente.telefono ? [new Paragraph({
          children: [new TextRun(`Telefono: ${cliente.telefono}`)]
        })] : []),
        
        ...(cliente.comune ? [new Paragraph({
          children: [new TextRun(`Comune: ${cliente.comune}`)]
        })] : []),
        
        ...(cliente.cap ? [new Paragraph({
          children: [new TextRun(`CAP: ${cliente.cap}`)]
        })] : []),
        
        ...(cliente.provincia ? [new Paragraph({
          children: [new TextRun(`Provincia: ${cliente.provincia}`)]
        })] : []),
        
        ...(cliente.paese ? [new Paragraph({
          children: [new TextRun(`Paese: ${cliente.paese}`)]
        })] : []),
        
        ...(cliente.partitaIva ? [new Paragraph({
          children: [new TextRun(`P.IVA: ${cliente.partitaIva}`)]
        })] : []),
        
        new Paragraph({
          children: [
            new TextRun({
              text: "LICENZE",
              bold: true,
              size: 24
            })
          ],
          spacing: { before: 400, after: 200 }
        }),
        
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("Software")] }),
                new TableCell({ children: [new Paragraph("Licenze")] }),
                new TableCell({ children: [new Paragraph("Seriali")] }),
                new TableCell({ children: [new Paragraph("Reseller")] })
              ]
            }),
            ...licenze.map(licenza => new TableRow({
              children: [
                new TableCell({ 
                  children: [new Paragraph(softwareMap[licenza.softwareId]?.nomeSoftware || '')] 
                }),
                new TableCell({ 
                  children: [new Paragraph(licenza.numeroLicenze.toString())] 
                }),
                new TableCell({ 
                  children: [new Paragraph(licenza.seriali || '')] 
                }),
                new TableCell({ 
                  children: [new Paragraph(licenza.resellerCode || '')] 
                })
              ]
            }))
          ]
        }),
        
      ]
    }]
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `Licenze_${cliente.ragioneSociale}.docx`);
};


export const exportDashboardData = (stats: any, licenze: Licenza[]) => {
  const dashboardData = [
    { Metrica: 'Licenze Totali', Valore: stats.licenzeTotali },
    { Metrica: 'Licenze Valide', Valore: stats.licenzeValide },
    { Metrica: 'Licenze in Scadenza', Valore: stats.licenzeInScadenza },
    { Metrica: 'Licenze Scadute', Valore: stats.licenzeScadute }
  ];
  
  exportToExcel(dashboardData, 'Dashboard_Statistics', 'Statistiche');

  };