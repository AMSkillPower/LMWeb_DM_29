import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit, Trash2, Search, User, Mail, Phone, MapPin, FileText, Building, UserCheck, ExternalLink, Grid, List } from 'lucide-react';
import { Cliente } from '../types';
import { formatDate } from '../utils/licenseUtils';
import { apiService } from '../services/api';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

interface ClientiManagerProps {
  searchTerm?: string;
}

const ClientiManager: React.FC<ClientiManagerProps> = ({ searchTerm: externalSearchTerm = '' }) => {
  const [assistenzaFilter, setAssistenzaFilter] = useState<'all' | 'yes' | 'no'>('all');
  const { state, dispatch, getLicenzeByCliente } = useApp();
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [showForm, setShowForm] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'grid'>('cards');
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
    ragioneSociale: '',
    email: '',
    telefono: '',
    nomeReferente: '',
    telefonoReferente: '',
    indirizzo: '',
    comune: '',
    cap: '',
    provincia: '',
    paese: 'Italia',
    partitaIva: '',
    codiceFiscale: '',
    indirizzoPEC: '',
    iban: '',
    emailFatturazione: '',
    sdi: '',
    bancaAppoggio: '',
    logo: '',
    sitoWeb: '',
    inAssistenza: false,
    passZendesk: ''
  });

  // Update search term when external prop changes
  React.useEffect(() => {
    if (externalSearchTerm !== searchTerm) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  /* const filteredClienti = state.clienti.filter(cliente =>
    cliente.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.partitaIva && cliente.partitaIva.includes(searchTerm)) ||
    (cliente.codiceFiscale && cliente.codiceFiscale.includes(searchTerm)) ||
    (cliente.nomeReferente && cliente.nomeReferente.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.comune && cliente.comune.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.provincia && cliente.provincia.toLowerCase().includes(searchTerm.toLowerCase()))
  ); */
  const filteredClienti = state.clienti.filter(cliente => {
  const matchesSearch = 
    cliente.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.partitaIva && cliente.partitaIva.includes(searchTerm)) ||
    (cliente.codiceFiscale && cliente.codiceFiscale.includes(searchTerm)) ||
    (cliente.nomeReferente && cliente.nomeReferente.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.comune && cliente.comune.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cliente.provincia && cliente.provincia.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const matchesAssistenza = 
    assistenzaFilter === 'all' || 
    (assistenzaFilter === 'yes' && cliente.inAssistenza) || 
    (assistenzaFilter === 'no' && !cliente.inAssistenza);
  
  return matchesSearch && matchesAssistenza;
});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Il file è troppo grande. Massimo 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData({ ...formData, logo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCliente) {
        const updatedCliente = await apiService.updateCliente(editingCliente.id, formData) as Cliente;
        dispatch({ type: 'UPDATE_CLIENTE', payload: {
          ...updatedCliente,
          createdAt: new Date(updatedCliente.createdAt),
          updatedAt: new Date(updatedCliente.updatedAt)
        }});
      } else {
        const newCliente = await apiService.createCliente(formData) as Cliente;
        dispatch({ type: 'ADD_CLIENTE', payload: {
          ...newCliente,
          createdAt: new Date(newCliente.createdAt),
          updatedAt: new Date(newCliente.updatedAt)
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
      ragioneSociale: '',
      email: '',
      telefono: '',
      nomeReferente: '',
      telefonoReferente: '',
      indirizzo: '',
      comune: '',
      cap: '',
      provincia: '',
      paese: 'Italia',
      partitaIva: '',
      codiceFiscale: '',
      indirizzoPEC: '',
      iban: '',
      emailFatturazione: '',
      sdi: '',
      bancaAppoggio: '',
      logo: '',
      sitoWeb: '',
      inAssistenza: false,
      passZendesk: ''
    });
    setEditingCliente(null);
    setShowForm(false);
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      ragioneSociale: cliente.ragioneSociale,
      email: cliente.email || '',
      telefono: cliente.telefono || '',
      nomeReferente: cliente.nomeReferente || '',
      telefonoReferente: cliente.telefonoReferente || '',
      indirizzo: cliente.indirizzo || '',
      comune: cliente.comune || '',
      cap: cliente.cap || '',
      provincia: cliente.provincia || '',
      paese: cliente.paese || 'Italia',
      partitaIva: cliente.partitaIva || '',
      codiceFiscale: cliente.codiceFiscale || '',
      indirizzoPEC: cliente.indirizzoPEC || '',
      iban: cliente.iban || '',
      emailFatturazione: cliente.emailFatturazione || '',
      sdi: cliente.sdi || '',
      bancaAppoggio: cliente.bancaAppoggio || '',
      logo: cliente.logo || '',
      sitoWeb: cliente.sitoWeb || '',
      inAssistenza: cliente.inAssistenza || false,
      passZendesk: cliente.passZendesk || ''
    });
    setEditingCliente(cliente);
    setShowForm(true);
  };

  const handleDelete = (id: number, ragioneSociale: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare il cliente "${ragioneSociale}"? Tutte le licenze associate verranno eliminate.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await apiService.deleteCliente(id);
          dispatch({ type: 'DELETE_CLIENTE', payload: id });
        } catch (error) {
          toast.error(`Errore: ${(error as Error).message}`);
        } finally {
          setLoading(false);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleClienteClick = (cliente: Cliente) => {
    window.dispatchEvent(new CustomEvent('navigateWithSearch', { 
      detail: { 
        page: 'licenze', 
        searchTerm: cliente.ragioneSociale 
      } 
    }));
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestione Clienti</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">Gestisci i tuoi clienti e le loro informazioni</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'cards' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm lg:text-base disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Cliente</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca clienti per ragione sociale, email, referente, P.IVA o C.F..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          />
        </div>
        
        {/* Filtri Assistenza */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Filtra per assistenza:</span>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setAssistenzaFilter('all')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                assistenzaFilter === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setAssistenzaFilter('yes')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                assistenzaFilter === 'yes' ? 'bg-white shadow-sm text-green-600' : 'text-gray-600'
              }`}
            >
              In assistenza
            </button>
            <button
              onClick={() => setAssistenzaFilter('no')}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                assistenzaFilter === 'no' ? 'bg-white shadow-sm text-gray-600' : 'text-gray-600'
              }`}
            >
              Non in assistenza
            </button>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-lg lg:text-xl font-bold mb-4">
              {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sezione Informazioni Azienda */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Informazioni Azienda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ragione Sociale *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ragioneSociale}
                      onChange={(e) => setFormData({ ...formData, ragioneSociale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      value={formData.partitaIva}
                      onChange={(e) => setFormData({ ...formData, partitaIva: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Codice Fiscale
                    </label>
                    <input
                      type="text"
                      value={formData.codiceFiscale}
                      onChange={(e) => setFormData({ ...formData, codiceFiscale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sito Web
                    </label>
                    <input
                      type="url"
                      value={formData.sitoWeb}
                      onChange={(e) => setFormData({ ...formData, sitoWeb: e.target.value })}
                      placeholder="https://www.esempio.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione Contatti */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Contatti
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Referente
                    </label>
                    <input
                      type="text"
                      value={formData.nomeReferente}
                      onChange={(e) => setFormData({ ...formData, nomeReferente: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefono Referente
                    </label>
                    <input
                      type="tel"
                      value={formData.telefonoReferente}
                      onChange={(e) => setFormData({ ...formData, telefonoReferente: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione Indirizzo */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Indirizzo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      value={formData.indirizzo}
                      onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comune
                    </label>
                    <input
                      type="text"
                      value={formData.comune}
                      onChange={(e) => setFormData({ ...formData, comune: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CAP
                    </label>
                    <input
                      type="text"
                      value={formData.cap}
                      onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-3 mt-3">
                  <div className="lg:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Paese
                    </label>
                    <input
                      type="text"
                      value={formData.paese}
                      onChange={(e) => setFormData({ ...formData, paese: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione Fatturazione */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Fatturazione
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Indirizzo PEC
                    </label>
                    <input
                      type="email"
                      value={formData.indirizzoPEC}
                      onChange={(e) => setFormData({ ...formData, indirizzoPEC: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Fatturazione
                    </label>
                    <input
                      type="email"
                      value={formData.emailFatturazione}
                      onChange={(e) => setFormData({ ...formData, emailFatturazione: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SDI
                    </label>
                    <input
                      type="text"
                      value={formData.sdi}
                      onChange={(e) => setFormData({ ...formData, sdi: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IBAN
                    </label>
                    <input
                      type="text"
                      value={formData.iban}
                      onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Banca di Appoggio
                    </label>
                    <input
                      type="text"
                      value={formData.bancaAppoggio}
                      onChange={(e) => setFormData({ ...formData, bancaAppoggio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sezione Logo */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Logo Aziendale
                </h3>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  {formData.logo && (
                    <div className="flex items-center space-x-2">
                      <img 
                        src={formData.logo} 
                        alt="Logo preview" 
                        className="h-12 w-12 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logo: '' })}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Rimuovi
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Pulsanti */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 bg-white sticky bottom-0 p-4 -mx-4 -mb-4 rounded-b-lg">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : (editingCliente ? 'Aggiorna Cliente' : 'Crea Cliente')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 text-sm font-medium disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clients View */}
      {viewMode === 'cards' ? (
  /* Cards View */
  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
    {filteredClienti.map((cliente) => {
      const licenzeCliente = getLicenzeByCliente(cliente.id);
      return (
        <div 
          key={cliente.id} 
          onClick={() => handleClienteClick(cliente)}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                {cliente.logo ? (
                  <img 
                    src={cliente.logo} 
                    alt={cliente.ragioneSociale} 
                    className="h-6 w-6 lg:h-8 lg:w-8 object-cover rounded" 
                  />
                ) : (
                  <Building className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{cliente.ragioneSociale}</h3>
                {/* AGGIUNGI QUI IL BADGE PER LO STATO DI ASSISTENZA */}
                {cliente.inAssistenza && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium  bg-green-300 text-green-800">
                    In assistenza
                  </span>
                )}
                <p className="text-xs lg:text-sm text-gray-500">Cliente dal {formatDate(cliente.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    {cliente.sitoWeb && (
                      <a
                        href={cliente.sitoWeb}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(cliente); }}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id, cliente.ragioneSociale); }}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {cliente.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{cliente.email}</span>
                    </div>
                  )}
                  {cliente.telefono && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{cliente.telefono}</span>
                    </div>
                  )}
                  {cliente.nomeReferente && (
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600">{cliente.nomeReferente}</span>
                    </div>
                  )}
                  {cliente.telefonoReferente && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 text-xs lg:text-sm">Ref: {cliente.telefonoReferente}</span>
                    </div>
                  )}
                  {cliente.indirizzo && (
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="text-gray-600 text-xs lg:text-sm">
                        <div>{cliente.indirizzo}</div>
                        {(cliente.comune || cliente.cap || cliente.provincia) && (
                          <div className="mt-1">
                            {cliente.cap && `${cliente.cap} `}
                            {cliente.comune && `${cliente.comune}`}
                            {cliente.provincia && ` (${cliente.provincia})`}
                            {cliente.paese && cliente.paese !== 'Italia' && `, ${cliente.paese}`}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {cliente.partitaIva && (
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 text-xs lg:text-sm">P.IVA: {cliente.partitaIva}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Licenze attive</span>
                    <span className="text-sm font-medium text-blue-600">{licenzeCliente.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azienda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contatti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assistenza
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Licenze
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClienti.map((cliente) => {
                  const licenzeCliente = getLicenzeByCliente(cliente.id);
                  return (
                    <tr 
                      key={cliente.id} 
                      onClick={() => handleClienteClick(cliente)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="bg-blue-100 rounded-lg p-2">
                              {cliente.logo ? (
                                <img 
                                  src={cliente.logo} 
                                  alt={cliente.ragioneSociale} 
                                  className="h-6 w-6 object-cover rounded" 
                                />
                              ) : (
                                <Building className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{cliente.ragioneSociale}</div>
                            <div className="text-sm text-gray-500">{cliente.partitaIva}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cliente.email}</div>
                        <div className="text-sm text-gray-500">{cliente.telefono}</div>
                        {(cliente.comune || cliente.provincia) && (
                          <div className="text-xs text-gray-400">
                            {cliente.comune}{cliente.provincia && ` (${cliente.provincia})`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cliente.nomeReferente}</div>
                        <div className="text-sm text-gray-500">{cliente.telefonoReferente}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cliente.inAssistenza ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-300 text-green-800">
                            Sì
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            No
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {licenzeCliente.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {cliente.sitoWeb && (
                            <a
                              href={cliente.sitoWeb}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(cliente); }}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id, cliente.ragioneSociale); }}
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
      )}

      {filteredClienti.length === 0 && (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessun cliente trovato</p>
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

export default ClientiManager;