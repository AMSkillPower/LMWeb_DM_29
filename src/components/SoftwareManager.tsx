import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Edit, Trash2, Search, Package, Grid, List, Filter } from 'lucide-react';
import { Software } from '../types';
import { formatCurrency } from '../utils/licenseUtils';
import { apiService } from '../services/api';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

interface SoftwareManagerProps {
  searchTerm?: string;
}

const SoftwareManager: React.FC<SoftwareManagerProps> = ({ searchTerm: externalSearchTerm = '' }) => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [showForm, setShowForm] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState<Software | null>(null);
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
    nomeSoftware: '',
    tipoLicenza: '',
    codice: '',
    categoria: '',
    logo: '',
    descrizione: '',
    costo: ''
  });
  const [filterTipoLicenza, setFilterTipoLicenza] = useState('all');
  

  // Update search term when external prop changes
  React.useEffect(() => {
    // Auto-precompila categoria basata su tipo licenza
    if (formData.tipoLicenza) {
      let categoria = '';
      switch (formData.tipoLicenza) {
        case 'PLC':
          categoria = 'Licenza Software';
          break;
        case 'ALC':
          categoria = 'Manutenzione Software';
          break;
        case 'YLC':
        case 'QLC':
          categoria = 'Abbonamento Software';
          break;
        default:
          categoria = '';
      }
      if (categoria !== formData.categoria) {
        setFormData(prev => ({ ...prev, categoria }));
      }
    }
  }, [formData.tipoLicenza]);

  React.useEffect(() => {
    if (externalSearchTerm !== searchTerm) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  const filteredSoftware = state.software.filter(software =>
  (filterTipoLicenza === 'all' || software.tipoLicenza === filterTipoLicenza) &&
  (software.nomeSoftware.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (software.codice && software.codice.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (software.categoria && software.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
  (software.descrizione && software.descrizione.toLowerCase().includes(searchTerm.toLowerCase()))
)
  );

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
      const softwareData = {
        ...formData,
        costo: formData.costo ? parseFloat(formData.costo) : null
      };

      if (editingSoftware) {
        const updatedSoftware = await apiService.updateSoftware(editingSoftware.id, softwareData) as Software;
        dispatch({ type: 'UPDATE_SOFTWARE', payload: {
          ...updatedSoftware,
          createdAt: new Date(updatedSoftware.createdAt),
          updatedAt: new Date(updatedSoftware.updatedAt)
        }});
      } else {
        const newSoftware = await apiService.createSoftware(softwareData) as Software;
        dispatch({ type: 'ADD_SOFTWARE', payload: {
          ...newSoftware,
          createdAt: new Date(newSoftware.createdAt),
          updatedAt: new Date(newSoftware.updatedAt)
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
      nomeSoftware: '',
      tipoLicenza: '',
      codice: '',
      categoria: '',
      logo: '',
      descrizione: '',
      costo: ''
    });
    setEditingSoftware(null);
    setShowForm(false);
  };

  const handleEdit = (software: Software) => {
    setFormData({
      nomeSoftware: software.nomeSoftware,
      tipoLicenza: software.tipoLicenza || '',
      codice: software.codice || '',
      categoria: software.categoria || '',
      logo: software.logo || '',
      descrizione: software.descrizione || '',
      costo: software.costo ? software.costo.toString() : ''
    });
    setEditingSoftware(software);
    setShowForm(true);
  };

  const handleDelete = (id: number, nomeSoftware: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Conferma Eliminazione',
      message: `Sei sicuro di voler eliminare il software "${nomeSoftware}"? Tutte le licenze associate verranno eliminate.`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await apiService.deleteSoftware(id);
          dispatch({ type: 'DELETE_SOFTWARE', payload: id });
        } catch (error) {
          toast.error(`Errore: ${(error as Error).message}`);
        } finally {
          setLoading(false);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const handleSoftwareClick = (software: Software) => {
    window.dispatchEvent(new CustomEvent('navigateWithSearch', { 
      detail: { 
        page: 'licenze', 
        searchTerm: software.nomeSoftware 
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestione Software</h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">Gestisci il catalogo software e le relative informazioni</p>
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
            <span>Nuovo Software</span>
          </button>
        </div>
      </div>


      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca software per nome, versione, codice, categoria o descrizione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          />
        </div>

        {/* Filtro tipo licenza */}
        <div className="relative">
          <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <select
            value={filterTipoLicenza}
            onChange={(e) => setFilterTipoLicenza(e.target.value)}
            className="w-full sm:w-auto pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
          >
            <option value="all">Tutti i tipi</option>
            <option value="PLC">PLC</option>
            <option value="ALC">ALC</option>
            <option value="YLC">YLC</option>
            <option value="QLC">QLC</option>
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg lg:text-xl font-bold mb-4">
              {editingSoftware ? 'Modifica Software' : 'Nuovo Software'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Software *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nomeSoftware}
                  onChange={(e) => setFormData({ ...formData, nomeSoftware: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice
                </label>
                <input
                  type="text"
                  value={formData.codice}
                  onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Licenza
                </label>
                <select
                  value={formData.tipoLicenza}
                  onChange={(e) => setFormData({ ...formData, tipoLicenza: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                >
                  <option value="">Seleziona tipo</option>
                  <option value="PLC">PLC</option>
                  <option value="ALC">ALC</option>
                  <option value="YLC">YLC</option>
                  <option value="QLC">QLC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prezzo Listino (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.costo}
                  onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                >
                  <option value="">Seleziona categoria</option>
                  <option value="Licenza Software">Licenza Software</option>
                  <option value="Abbonamento Software">Abbonamento Software</option>
                  <option value="Manutenzione Software">Manutenzione Software</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione
                </label>
                <textarea
                  value={formData.descrizione}
                  onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
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
              <div className="md:col-span-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  {loading ? 'Salvataggio...' : (editingSoftware ? 'Aggiorna' : 'Salva')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Software Grid */}
      {viewMode === 'cards' ? (
        /* Cards View */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredSoftware.map((software) => {
            const licenzeSoftware = state.licenze.filter(l => l.softwareId === software.id);
            return (
              <div 
                key={software.id} 
                onClick={() => handleSoftwareClick(software)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                      {software.logo ? (
                        <img 
                          src={software.logo} 
                          alt={software.nomeSoftware} 
                          className="h-6 w-6 lg:h-8 lg:w-8 object-cover rounded" 
                        />
                      ) : (
                        <Package className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base lg:text-lg font-semibold text-gray-900 truncate">{software.nomeSoftware}</h3>
                      <div className="flex items-center space-x-2 text-xs lg:text-sm text-gray-500">
                        {software.codice && <span className="font-mono">{software.codice}</span>}
                        {software.versione && <span>v{software.versione}</span>}
                        {software.tipoLicenza && (
                          <>
                            {(software.codice || software.versione) && <span>•</span>}
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">{software.tipoLicenza}</span>
                          </>
                        )}
                        {software.costo && (
                          <>
                            {(software.codice || software.versione || software.tipoLicenza) && <span>•</span>}
                            <span>{formatCurrency(software.costo)}</span>
                          </>
                        )}
                      </div>
                      {software.categoria && (
                        <div className="text-xs text-gray-400 mt-1">
                          {software.categoria}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(software); }}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(software.id, software.nomeSoftware); }}
                      disabled={loading}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {software.descrizione && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs lg:text-sm text-gray-600">{software.descrizione}</p>
                  </div>
                )}
                                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Licenze attive</span>
                    <span className="text-sm font-medium text-green-600">{licenzeSoftware.length}</span>
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
                    Software
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dettagli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo / Costo
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
                {filteredSoftware.map((software) => {
                  const licenzeSoftware = state.licenze.filter(l => l.softwareId === software.id);
                  return (
                    <tr 
                      key={software.id} 
                      onClick={() => handleSoftwareClick(software)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="bg-green-100 rounded-lg p-2">
                              {software.logo ? (
                                <img 
                                  src={software.logo} 
                                  alt={software.nomeSoftware} 
                                  className="h-6 w-6 object-cover rounded" 
                                />
                              ) : (
                                <Package className="h-5 w-5 text-green-600" />
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{software.nomeSoftware}</div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              {software.codice && <span className="font-mono">{software.codice}</span>}
                              {software.categoria && (
                                <>
                                  {software.codice && <span>•</span>}
                                  <span>📂 {software.categoria}</span>
                                </>
                              )}
                            </div>
                            {software.descrizione && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{software.descrizione}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {software.versione && <div>v{software.versione}</div>}
                          {software.tipoLicenza && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {software.tipoLicenza}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {software.costo ? formatCurrency(software.costo) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {licenzeSoftware.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(software); }}
                            disabled={loading}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(software.id, software.nomeSoftware); }}
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

      {filteredSoftware.length === 0 && (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessun software trovato</p>
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

export default SoftwareManager;