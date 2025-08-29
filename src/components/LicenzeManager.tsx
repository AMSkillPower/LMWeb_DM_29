import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit, Trash2, Search, Filter, FileText, Calendar, Download, X, Copy } from 'lucide-react';
import { Licenza, FilterStato } from '../types';
import { formatDate, getStatoColor, getStatoText, formatCurrency } from '../utils/licenseUtils';
import { apiService } from '../services/api';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

interface LicenzeManagerProps {
  searchTerm?: string;
}

const LicenzeManager: React.FC<LicenzeManagerProps> = ({ searchTerm: externalSearchTerm = '' }) => {
  const [tipoSoftwareFilter, setTipoSoftwareFilter] = useState('');
  const { state, dispatch, getClienteById, getSoftwareById } = useApp();
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [filterStato, setFilterStato] = useState<FilterStato>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLicenza, setEditingLicenza] = useState<Licenza | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLicenze, setSelectedLicenze] = useState<number[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [softwareSearch, setSoftwareSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showSoftwareDropdown, setShowSoftwareDropdown] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  const [formData, setFormData] = useState({
    clienteId: '',
    softwareId: '',
    numeroLicenze: '',
    seriali: '',
    dataAttivazione: '',
    dataScadenza: '',
    dataOrdine: '',
    resellerCode: 'R271',
    note: '',
    riferimentoContratto: ''
  });

const copyToClipboard = async (text: string) => {
  if (!text) {
    toast.error('Nessun testo da copiare');
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      toast.success('Copiato negli appunti!');
    } else {
      toast.error('Errore durante la copia');
    }
  } catch (err) {
    toast.error('Errore durante la copia');
    console.error('Errore copia:', err);
  } finally {
    document.body.removeChild(textArea);
  }
};


  // Filtered options for dropdowns
  const filteredClienti = state.clienti.filter(cliente =>
    cliente.ragioneSociale.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  const filteredSoftwareOptions = state.software.filter(software => {
  const matchesTipo =
    !tipoSoftwareFilter || 
    (software.tipoLicenza && software.tipoLicenza.toLowerCase() === tipoSoftwareFilter.toLowerCase());

  const matchesSearch =
    !softwareSearch ||
    software.nomeSoftware.toLowerCase().includes(softwareSearch.toLowerCase()) ||
    (software.codice && software.codice.toLowerCase().includes(softwareSearch.toLowerCase()));

  return matchesTipo && matchesSearch;
});

const uniqueTipiSoftware = Array.from(
  new Set(state.software.map(s => s.tipoLicenza).filter(Boolean))
);


  

  // Update search term when external prop changes
  React.useEffect(() => {
      if (externalSearchTerm !== searchTerm) {
        setSearchTerm(externalSearchTerm);
      }
    }, [externalSearchTerm]);

  // Apply search and filters
  const filteredLicenze = state.licenze.filter(licenza => {
    const cliente = getClienteById(licenza.clienteId);
    const software = getSoftwareById(licenza.softwareId);
    
    // Handle special search terms for status filtering
    if (searchTerm.startsWith('stato:')) {
      const statusFilter = searchTerm.replace('stato:', '');
      return licenza.stato === statusFilter;
    }
    
    const matchesSearch = !searchTerm ||
      cliente?.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      software?.nomeSoftware.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (licenza.seriali && licenza.seriali.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (licenza.riferimentoContratto && licenza.riferimentoContratto.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = filterStato === 'all' || licenza.stato === filterStato;
    
    return matchesSearch && matchesFilter;
    });


  // Auto-calculate cost when software changes
  React.useEffect(() => {
    if (formData.softwareId && formData.numeroLicenze) {
      const software = getSoftwareById(parseInt(formData.softwareId));
      if (software?.costo) {
        const resellerCode = software.costo * parseInt(formData.numeroLicenze);
        setFormData(prev => ({ ...prev, resellerCode: resellerCode.toString() }));
      }
    }
   }, [formData.softwareId, formData.numeroLicenze, getSoftwareById]);


  // Handle cliente selection
  const handleClienteSelect = (cliente: any) => {
    setFormData(prev => ({ ...prev, clienteId: cliente.id.toString() }));
    setClienteSearch(cliente.ragioneSociale);
    setShowClienteDropdown(false);
  };


  // Handle software selection
  const handleSoftwareSelect = (software: any) => {
    setFormData(prev => ({ ...prev, softwareId: software.id.toString() }));
    const displayName = `${software.tipoLicenza || ''} - ${software.nomeSoftware}`.replace(/^[\s-]+|[\s-]+$/g, '');
    setSoftwareSearch(displayName);
    setShowSoftwareDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const licenzaData = {
        ...formData,
        clienteId: parseInt(formData.clienteId),
        softwareId: parseInt(formData.softwareId),
        numeroLicenze: parseInt(formData.numeroLicenze),
        resellerCode: formData.resellerCode ? parseFloat(formData.resellerCode) : null,
        dataAttivazione: formData.dataAttivazione,
        dataScadenza: formData.dataScadenza,
        dataOrdine: formData.dataOrdine || null
      };

      if (editingLicenza) {
        const updatedLicenza = await apiService.updateLicenza(editingLicenza.id, licenzaData) as Licenza;
        dispatch({ type: 'UPDATE_LICENZA', payload: {
          ...updatedLicenza,
          dataAttivazione: new Date(updatedLicenza.dataAttivazione),
          dataScadenza: new Date(updatedLicenza.dataScadenza),
          dataOrdine: updatedLicenza.dataOrdine ? new Date(updatedLicenza.dataOrdine) : undefined,
          createdAt: new Date(updatedLicenza.createdAt),
          updatedAt: new Date(updatedLicenza.updatedAt)
        }});
      } else {
        const newLicenza = await apiService.createLicenza(licenzaData) as Licenza; 
        dispatch({ type: 'ADD_LICENZA', payload: {
          ...newLicenza,
          dataAttivazione: new Date(newLicenza.dataAttivazione),
          dataScadenza: new Date(newLicenza.dataScadenza),
          dataOrdine: newLicenza.dataOrdine ? new Date(newLicenza.dataOrdine) : undefined,
          createdAt: new Date(newLicenza.createdAt),
          updatedAt: new Date(newLicenza.updatedAt)
        }});
      }
      resetForm();
    } catch (error) {
      toast.error(`Errore: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      softwareId: '',
      numeroLicenze: '',
      seriali: '',
      dataAttivazione: '',
      dataScadenza: '',
      dataOrdine: '',
      resellerCode: '',
      note: '',
      riferimentoContratto: ''
    });
    setClienteSearch('');
    setSoftwareSearch('');
    setShowClienteDropdown(false);
    setShowSoftwareDropdown(false);
    setEditingLicenza(null);
    setShowForm(false);
  };

  const handleEdit = (licenza: Licenza) => {
    const cliente = state.clienti.find(c => c.id === licenza.clienteId);
    const software = state.software.find(s => s.id === licenza.softwareId);
    
    setFormData({
      clienteId: licenza.clienteId.toString(),
      softwareId: licenza.softwareId.toString(),
      numeroLicenze: licenza.numeroLicenze.toString(),
      seriali: licenza.seriali || '',
      dataAttivazione: licenza.dataAttivazione.toISOString().split('T')[0],
      dataScadenza: licenza.dataScadenza.toISOString().split('T')[0],	  
      dataOrdine: (() => {
	    let d: Date | undefined;
      if (licenza.dataOrdine) {
        d = new Date(licenza.dataOrdine);
      }
	    return d instanceof Date && !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
	  })(),
      resellerCode: licenza.resellerCode ? licenza.resellerCode.toString() : '',
      note: licenza.note || '',
      riferimentoContratto: licenza.riferimentoContratto || ''
    });
    
    setClienteSearch(cliente?.ragioneSociale || '');
    const softwareDisplayName = software ? `${software.tipoLicenza || ''} - ${software.nomeSoftware}`.replace(/^[\s-]+|[\s-]+$/g, '') : '';
    setSoftwareSearch(softwareDisplayName);
    
    setEditingLicenza(licenza);
    setShowForm(true);
  };

  const closeConfirmModal = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };
  const handleDelete = (id: number, clienteNome: string, softwareNome: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare la licenza di "${softwareNome}" per "${clienteNome}"?`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await apiService.deleteLicenza(id);
          dispatch({ type: 'DELETE_LICENZA', payload: id });
        } catch (error) {
          toast.error(`Errore: ${(error as Error).message}`);
        } finally {
          setLoading(false);
          closeConfirmModal(); // ✅ chiude il modal senza re-render infiniti
        }
      }
    });
  };

  const handleSelectLicenza = (id: number) => {
    setSelectedLicenze(prev => 
      prev.includes(id) 
        ? prev.filter(licenzaId => licenzaId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLicenze.length === filteredLicenze.length) {
      setSelectedLicenze([]);
    } else {
      setSelectedLicenze(filteredLicenze.map(l => l.id));
    }
  };

  const handleExportSelected = async () => {
    if (selectedLicenze.length === 0) {
      toast.error('Seleziona almeno una licenza per l\'esportazione');
      return;
    }

    const licenzeSelezionate = filteredLicenze.filter(l => selectedLicenze.includes(l.id));
    
    // Esporta in Excel con tutti i dati
    const data = licenzeSelezionate.map(licenza => {
      const cliente = getClienteById(licenza.clienteId);
      const software = getSoftwareById(licenza.softwareId);
      return {
        'Ragione Sociale': cliente?.ragioneSociale || '',
        'Email': cliente?.email || '',
        'Telefono': cliente?.telefono || '',
        'Nome Referente': cliente?.nomeReferente || '',
        'Telefono Referente': cliente?.telefonoReferente || '',
        'Indirizzo': cliente?.indirizzo || '',
        'Comune': cliente?.comune || '',
        'CAP': cliente?.cap || '',
        'Provincia': cliente?.provincia || '',
        'Paese': cliente?.paese || '',
        'Partita IVA': cliente?.partitaIva || '',
        'Codice Fiscale': cliente?.codiceFiscale || '',
        'PEC': cliente?.indirizzoPEC || '',
        'IBAN': cliente?.iban || '',
        'Email Fatturazione': cliente?.emailFatturazione || '',
        'SDI': cliente?.sdi || '',
        'Banca Appoggio': cliente?.bancaAppoggio || '',
        //'Sito Web': cliente?.sitoWeb || '',
        'Software': software?.nomeSoftware || '',
        //'Versione': software?.versione || '',
        'Tipo Licenza': software?.tipoLicenza || '',
        //'Codice Software': software?.codice || '',
        //'Categoria Software': software?.categoria || '',
        //'Descrizione Software': software?.descrizione || '',
        'Costo Unitario': software?.costo ? formatCurrency(software.costo) : '',
        'Seriali': licenza.seriali || '',
        'Data Scadenza': formatDate(licenza.dataScadenza),
        'Data Attivazione': formatDate(licenza.dataAttivazione),
        'Data Ordine': licenza.dataOrdine ? formatDate(licenza.dataOrdine) : '',
        'Numero Licenze': licenza.numeroLicenze,
        'Reseller Code': licenza.resellerCode ? licenza.resellerCode : '',
        'Riferimento Contratto': licenza.riferimentoContratto || '',
        'Note': licenza.note || '',
        'Stato': getStatoText(licenza.stato)
      };
    });
    
    try {
      const { exportToExcel } = await import('../utils/exportUtils');
      exportToExcel(data, 'Licenze_Selezionate', 'Licenze Selezionate');
      setSelectedLicenze([]); // Reset selection after export
    } catch (error) {
      toast.error(`Errore nell'esportazione: ${(error as Error).message}`);
    }
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  
  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestione Licenze</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Gestisci le licenze software dei tuoi clienti
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedLicenze.length > 0 && (
            <button
              onClick={handleExportSelected}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 text-sm lg:text-base"
            >
              <Download className="h-4 w-4" />
              <span>Esporta ({selectedLicenze.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm lg:text-base disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuova Licenza</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per cliente, software, seriale o contratto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterStato}
            onChange={(e) => setFilterStato(e.target.value as FilterStato)}
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutti gli stati</option>
            <option value="valida">Valide</option>
            <option value="in_scadenza">In scadenza</option>
            <option value="scaduta">Scadute</option>
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg lg:text-xl font-bold">
                {editingLicenza ? 'Modifica Licenza' : 'Nuova Licenza'}
              </h2>
              <button 
                onClick={resetForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sezione Cliente e Software */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cliente */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Cliente *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={clienteSearch}
                      onChange={(e) => {
                        setClienteSearch(e.target.value);
                        setShowClienteDropdown(true);
                        if (!e.target.value) {
                          setFormData(prev => ({ ...prev, clienteId: '' }));
                        }
                      }}
                      onFocus={() => setShowClienteDropdown(true)}
                      placeholder="Cerca cliente..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    {clienteSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setClienteSearch('');
                          setFormData(prev => ({ ...prev, clienteId: '' }));
                          setShowClienteDropdown(false);
                        }}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    {showClienteDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredClienti.length > 0 ? (
                          filteredClienti.map(cliente => (
                            <button
                              key={cliente.id}
                              type="button"
                              onClick={() => handleClienteSelect(cliente)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            >
                              <div className="font-medium">{cliente.ragioneSociale}</div>
                              {cliente.email && (
                                <div className="text-xs text-gray-500">{cliente.email}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">Nessun cliente trovato</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Software */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Software *
                  </label>
                  <div className="space-y-2">
                    <select
                      value={tipoSoftwareFilter}
                      onChange={(e) => {
                        setTipoSoftwareFilter(e.target.value);
                        setSoftwareSearch('');
                        setFormData(prev => ({ ...prev, softwareId: '' }));
                        setShowSoftwareDropdown(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    >
                      <option value="">Tutti i tipi</option>
                      {uniqueTipiSoftware.map((tipo, index) => (
                        <option key={index} value={tipo || ''}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                    
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={softwareSearch}
                        onChange={(e) => {
                          setSoftwareSearch(e.target.value);
                          setShowSoftwareDropdown(true);
                          if (!e.target.value) {
                            setFormData(prev => ({ ...prev, softwareId: '' }));
                          }
                        }}
                        onFocus={() => setShowSoftwareDropdown(true)}
                        placeholder="Cerca software..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                      {softwareSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setSoftwareSearch('');
                            setFormData(prev => ({ ...prev, softwareId: '' }));
                            setShowSoftwareDropdown(false);
                          }}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {showSoftwareDropdown && (
                    <div className="relative z-10">
                      <div className="absolute w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredSoftwareOptions.length > 0 ? (
                          filteredSoftwareOptions.map(software => (
                            <button
                              key={software.id}
                              type="button"
                              onClick={() => handleSoftwareSelect(software)}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                            >
                              <div className="font-medium">
                                {software.nomeSoftware}
                                {software.versione && ` v${software.versione}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {software.tipoLicenza && `${software.tipoLicenza} • `}
                                {software.codice && `Codice: ${software.codice} • `}
                                {software.costo && `Prezzo: ${formatCurrency(software.costo)}`}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Nessun software trovato
                            {tipoSoftwareFilter && ` per il tipo "${tipoSoftwareFilter}"`}
                            {softwareSearch && ` con nome "${softwareSearch}"`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sezione Dettagli Licenza */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Colonna 1 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Numero Licenze *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.numeroLicenze}
                      onChange={(e) => setFormData({ ...formData, numeroLicenze: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Reseller Code
                    </label>
                    <input
                      type="text"
                      value={formData.resellerCode}
                      onChange={(e) => setFormData({ ...formData, resellerCode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Colonna 2 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Data Ordine
                    </label>
                    <input
                      type="date"
                      value={formData.dataOrdine}
                      onChange={(e) => setFormData({ ...formData, dataOrdine: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Data Attivazione *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dataAttivazione}
                      onChange={(e) => setFormData({ ...formData, dataAttivazione: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Colonna 3 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Data Scadenza *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.dataScadenza}
                      onChange={(e) => setFormData({ ...formData, dataScadenza: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Riferimento Contratto
                    </label>
                    <input
                      type="text"
                      value={formData.riferimentoContratto}
                      onChange={(e) => setFormData({ ...formData, riferimentoContratto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione Seriali e Note */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Seriali *
                  </label>
                  <textarea
                    value={formData.seriali}
                    required
                    onChange={(e) => setFormData({ ...formData, seriali: e.target.value })}
                    placeholder="Inserisci i seriali, uno per riga"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">Separare i seriali con una nuova riga</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Note
                  </label>
                  <textarea
                    placeholder="Codice MW e Customer code"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              {/* Pulsanti */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 text-sm"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingLicenza ? 'Aggiornamento...' : 'Creazione...'}
                    </span>
                  ) : (
                    editingLicenza ? 'Aggiorna Licenza' : 'Crea Licenza'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Click outside to close dropdowns */}
      {(showClienteDropdown || showSoftwareDropdown) && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowClienteDropdown(false);
            setShowSoftwareDropdown(false);
          }}
        />
      )}

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {filteredLicenze.map((licenza) => {
          const cliente = getClienteById(licenza.clienteId);
          const software = getSoftwareById(licenza.softwareId);
          return (
            <div key={licenza.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedLicenze.includes(licenza.id)}
                    onChange={() => handleSelectLicenza(licenza.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{cliente?.ragioneSociale}</h3>
                    <p className="text-xs text-gray-500 truncate">
                      {software?.nomeSoftware} {software?.versione && `v${software.versione}`}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(licenza)}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(licenza.id, cliente?.ragioneSociale || '', software?.nomeSoftware || '')}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Licenze:</span>
                  <span className="text-gray-900">{licenza.numeroLicenze}</span>
                </div>
                {licenza.resellerCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Reseller code:</span>
                    <span className="text-gray-900">{licenza.resellerCode}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Attivazione:</span>
                  <span className="text-gray-900">{formatDate(licenza.dataAttivazione)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Scadenza:</span>
                  <span className="text-gray-900">{formatDate(licenza.dataScadenza)}</span>
                </div>
                {licenza.riferimentoContratto && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Contratto:</span>
                    <span className="text-gray-900 font-mono text-xs">{licenza.riferimentoContratto}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Stato:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatoColor(licenza.stato)}`}>
                    {getStatoText(licenza.stato)}
                  </span>
                </div>
                {licenza.seriali && (
                  <div className="text-xs text-gray-500 font-mono truncate max-w-xs flex items-center gap-1">
                    {/* Prima riga del seriale */}
                    {licenza.seriali.split('\n')[0]}
                    
                    {/* Se ci sono altri seriali, mostra '...' + pulsante copia */}
                    {licenza.seriali.split('\n').length > 1 && (
                      <>
                        <span>...</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(licenza.seriali || '');
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Copia tutti i seriali"
                        >
                          <Copy className="h-4 w-4 inline-block" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLicenze.length === filteredLicenze.length && filteredLicenze.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente / Software
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licenze
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contratto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicenze.map((licenza) => {
                const cliente = getClienteById(licenza.clienteId);
                const software = getSoftwareById(licenza.softwareId);
                return (
                  <tr key={licenza.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLicenze.includes(licenza.id)}
                        onChange={() => handleSelectLicenza(licenza.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="bg-blue-100 rounded-lg p-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{cliente?.ragioneSociale}</div>
                          <div className="text-sm text-gray-500">
                            {software?.nomeSoftware}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      { <div className="text-sm text-gray-900">{licenza.numeroLicenze}</div>
                      /* {licenza.costoTotale && (
                        <div className="text-sm text-gray-500">{formatCurrency(licenza.costoTotale)}</div>
                      )} */}
                      {licenza.seriali && (
                        <div className="flex items-center max-w-xs text-xs font-mono text-gray-500 truncate">
                          <span className="truncate">
                            {licenza.seriali.split('\n')[0]}
                            {licenza.seriali.split('\n').length > 1 && '...'}
                          </span>
                          
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(licenza.seriali ?? '');
                            }}
                            className="ml-2 text-blue-500 hover:text-blue-700 shrink-0"
                            title="Copia seriali"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {licenza.dataOrdine && (
                          <div className="flex items-center space-x-1 mb-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-xs">Ord: {formatDate(licenza.dataOrdine)}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(licenza.dataAttivazione)}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(licenza.dataScadenza)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {licenza.riferimentoContratto || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatoColor(licenza.stato)}`}>
                        {getStatoText(licenza.stato)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(licenza)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(licenza.id, cliente?.ragioneSociale || '', software?.nomeSoftware || '')}
                          disabled={loading}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLicenze.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessuna licenza trovata</p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="danger"
      />
    </div>
  );
};

export default LicenzeManager;