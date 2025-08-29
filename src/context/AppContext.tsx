
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Cliente, Software, Licenza, DashboardStats, DocumentManager  } from '../types';
import { apiService } from '../services/api';
import { calcolaStatoLicenza } from '../utils/licenseUtils';
import DocumentManagerComponent from '../components/DocumentManager';

interface AppState {
  clienti: Cliente[];
  software: Software[];
  licenze: Licenza[];
  documenti: DocumentManager[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CLIENTI'; payload: Cliente[] }
  | { type: 'ADD_CLIENTE'; payload: Cliente }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'DELETE_CLIENTE'; payload: number }
  | { type: 'SET_SOFTWARE'; payload: Software[] }
  | { type: 'ADD_SOFTWARE'; payload: Software }
  | { type: 'UPDATE_SOFTWARE'; payload: Software }
  | { type: 'DELETE_SOFTWARE'; payload: number }
  | { type: 'SET_LICENZE'; payload: Licenza[] }
  | { type: 'ADD_LICENZA'; payload: Licenza }
  | { type: 'UPDATE_LICENZA'; payload: Licenza }
  | { type: 'DELETE_LICENZA'; payload: number }
  | { type: 'SET_STATS'; payload: DashboardStats }
  | { type: 'SET_DOCUMENTI'; payload: DocumentManager[] }
  | { type: 'ADD_DOCUMENTO'; payload: DocumentManager }
  | { type: 'UPDATE_DOCUMENTO'; payload: DocumentManager }
  | { type: 'UPDATE_DOCUMENTO';  payload: DocumentManager }
  | { type: 'ADD_DOCUMENTO'; payload: DocumentManager }
  | { type: 'DELETE_DOCUMENTO'; payload: number };

const initialState: AppState = {
  clienti: [],
  software: [],
  licenze: [],
  documenti: [],
  stats: { licenzeTotali: 0, licenzeValide: 0, licenzeInScadenza: 0, licenzeScadute: 0 },
  loading: false,
  error: null
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CLIENTI':
      return { ...state, clienti: action.payload };
    case 'ADD_CLIENTE':
      return { ...state, clienti: [...state.clienti, action.payload] };
    case 'UPDATE_CLIENTE':
      return {
        ...state,
        clienti: state.clienti.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'DELETE_CLIENTE':
      return {
        ...state,
        clienti: state.clienti.filter(c => c.id !== action.payload),
        licenze: state.licenze.filter(l => l.clienteId !== action.payload)
      };
    case 'SET_SOFTWARE':
      return { ...state, software: action.payload };
    case 'ADD_SOFTWARE':
      return { ...state, software: [...state.software, action.payload] };
    case 'UPDATE_SOFTWARE':
      return {
        ...state,
        software: state.software.map(s => s.id === action.payload.id ? action.payload : s)
      };
    case 'DELETE_SOFTWARE':
      return {
        ...state,
        software: state.software.filter(s => s.id !== action.payload),
        licenze: state.licenze.filter(l => l.softwareId !== action.payload)
      };
    case 'SET_LICENZE':
      return { ...state, licenze: action.payload };
    case 'ADD_LICENZA':
      return { ...state, licenze: [...state.licenze, action.payload] };
    case 'UPDATE_LICENZA':
      return {
        ...state,
        licenze: state.licenze.map(l => l.id === action.payload.id ? action.payload : l)
      };
    case 'DELETE_LICENZA':
      return {
        ...state,
        licenze: state.licenze.filter(l => l.id !== action.payload)
      };

    case 'SET_DOCUMENTI':
      return { ...state, documenti: action.payload };
    case 'ADD_DOCUMENTO':
      return { ...state, documenti: [...state.documenti, action.payload] };
    case 'UPDATE_DOCUMENTO':
      return {
        ...state,
        documenti: state.documenti.map(d => d.id === action.payload.id ? action.payload : d)
      };
    case 'DELETE_DOCUMENTO':
      return {
        ...state,
        documenti: state.documenti.filter(d => d.id !== action.payload)
      };

    case 'SET_STATS':
      return { ...state, stats: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
  loadData: () => Promise<void>;
  getClienteById: (id: number) => Cliente | undefined;
  getSoftwareById: (id: number) => Software | undefined;
  getLicenzeByCliente: (clienteId: number) => Licenza[];
  getDocumentiByCliente: (clienteId: number) => DocumentManager[];
} | null>(null);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const loadData = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [clienti, software, licenze, documenti, stats] = await Promise.all([
        apiService.getClienti(),
        apiService.getSoftware(),
        apiService.getLicenze(),
        apiService.getDocuments(),
        apiService.getLicenzeStats(),
      ]);

      // Convert date strings to Date objects
      const clientiWithDates = (clienti as any[]).map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }));

      const softwareWithDates = (software as any[]).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt)
      }));

      const licenzeWithDates = (licenze as any[]).map((l: any) => ({
        ...l,
        dataAttivazione: new Date(l.dataAttivazione),
        dataScadenza: new Date(l.dataScadenza),
        createdAt: new Date(l.createdAt),
        updatedAt: new Date(l.updatedAt)
      }));

      const documentiWithDates = (documenti as any[]).map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt)
      }));

      dispatch({ type: 'SET_CLIENTI', payload: clientiWithDates });
      dispatch({ type: 'SET_SOFTWARE', payload: softwareWithDates });
      dispatch({ type: 'SET_LICENZE', payload: licenzeWithDates });
      dispatch({ type: 'SET_DOCUMENTI', payload: documentiWithDates });
      dispatch({ type: 'SET_STATS', payload: stats as DashboardStats });
      //dispatch({ type: 'SET_STATS', payload: stats });
      
      // Force re-render of components that depend on this data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dataUpdated'));
      }, 100);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: (error as Error).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update stats when licenze change
  useEffect(() => {
    if (state.licenze.length > 0) {
      const newStats = {
        licenzeTotali: state.licenze.length,
        licenzeValide: state.licenze.filter(l => l.stato === 'valida').length,
        licenzeInScadenza: state.licenze.filter(l => l.stato === 'in_scadenza').length,
        licenzeScadute: state.licenze.filter(l => l.stato === 'scaduta').length
      };
      dispatch({ type: 'SET_STATS', payload: newStats });
    }
  }, [state.licenze]);

  const getClienteById = (id: number) => state.clienti.find(c => c.id === id);
  const getSoftwareById = (id: number) => state.software.find(s => s.id === id);
  const getLicenzeByCliente = (clienteId: number) => state.licenze.filter(l => l.clienteId === clienteId);
  const getDocumentiByCliente = (clienteId: number) => state.documenti.filter(d => d.clienteId === clienteId);

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppContext.Provider value={{
      state,
      dispatch,
      loadData,
      getClienteById,
      getSoftwareById,
      getLicenzeByCliente,
      getDocumentiByCliente 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
