export interface Cliente {
  id: number;
  ragioneSociale: string;
  email?: string;
  telefono?: string;
  nomeReferente?: string;
  telefonoReferente?: string;
  indirizzo?: string;
  comune?: string;
  cap?: string;
  provincia?: string;
  paese?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  indirizzoPEC?: string;
  iban?: string;
  emailFatturazione?: string;
  sdi?: string;
  bancaAppoggio?: string;
  logo?: string; // Base64 encoded image
  sitoWeb?: string;
  createdAt: Date;
  updatedAt: Date;
  inAssistenza: boolean;
  passZendesk?: string;
}

export interface Software {
  id: number;
  nomeSoftware: string;
  versione?: string;
  tipoLicenza?: 'PLC' | 'ALC' | 'YLC' | 'QLC';
  codice?: string;
  categoria?: 'Manutenzione Software' | 'Licenza Software' | 'Abbonamento Software';
  logo?: string; // Base64 encoded image
  descrizione?: string;
  costo?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Licenza {
  id: number;
  clienteId: number;
  softwareId: number;
  numeroLicenze: number;
  seriali?: string; // Multiple serials separated by newlines
  dataAttivazione: Date;
  dataScadenza: Date;
  dataOrdine?: Date;
  resellerCode?: string;
  note?: string;
  riferimentoContratto?: string;
  stato: 'valida' | 'in_scadenza' | 'scaduta';
  createdAt: Date;
  updatedAt: Date;
  // Joined fields
  clienteNome?: string;
  nomeSoftware?: string;
  softwareCosto?: number;
}

export interface DashboardStats {
  licenzeTotali: number;
  licenzeValide: number;
  licenzeInScadenza: number;
  licenzeScadute: number;
}

export interface DocumentManager {
    id: number;
    clienteId: number;
    documentManagerKey: string;
    anno: number;
    note?: string | null;
    createdAt: Date;
    updatedAt: Date;
    Cliente?: Cliente;
}

export type SortField = 'ragioneSociale' | 'nomeSoftware' | 'dataScadenza' | 'dataAttivazione';
export type SortDirection = 'asc' | 'desc';
export type FilterStato = 'all' | 'valida' | 'in_scadenza' | 'scaduta';
export type FilterScadenza = 'all' | '1month' | '3months' | '6months' | '1year';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}