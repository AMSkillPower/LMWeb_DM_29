import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  Calendar,
  Download,
  X,
  Copy,
} from "lucide-react";
import { DocumentManager } from "../types";
import { formatDate } from "../utils/licenseUtils";
import ConfirmModal from "./ConfirmModal";
import { apiService } from "../services/api";
import toast from "react-hot-toast";

interface DocumentManagerProps {
  searchTerm?: string;
}

const DocumentManagerComponent: React.FC<DocumentManagerProps> = ({
  searchTerm: externalSearchTerm = "",
}) => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState(externalSearchTerm);
  const [showForm, setShowForm] = useState(false);
  const [editingDocument, setEditingDocument] =
    useState<DocumentManager | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [clienteSearch, setClienteSearch] = useState("");
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: "",
    documentManagerKey: "",
    anno: new Date().getFullYear().toString(),
    note: "",
  });
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
  };

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



  // Update search term when external prop changes
  useEffect(() => {
    if (externalSearchTerm !== searchTerm) {
      setSearchTerm(externalSearchTerm);
    }
  }, [externalSearchTerm]);

  // Filter documents based on search term
  const filteredDocuments = state.documenti.filter((documento) => {
    const cliente = state.clienti.find((c) => c.id === documento.clienteId);

    return (
      !searchTerm ||
      (documento.documentManagerKey &&
        documento.documentManagerKey
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (documento.note &&
        documento.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
      documento.anno.toString().includes(searchTerm) ||
      (cliente &&
        cliente.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  // Filtered clienti for dropdown
  const filteredClienti = state.clienti.filter((cliente) =>
    cliente.ragioneSociale.toLowerCase().includes(clienteSearch.toLowerCase())
  );

  // Handle cliente selection
  const handleClienteSelect = (cliente: any) => {
    setFormData((prev) => ({ ...prev, clienteId: cliente.id.toString() }));
    setClienteSearch(cliente.ragioneSociale);
    setShowClienteDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const documentData: Omit<
        DocumentManager,
        "id" | "createdAt" | "updatedAt"
      > & {
        clienteId: number;
        anno: number;
        note?: string | null;
      } = {
        clienteId: parseInt(formData.clienteId),
        documentManagerKey: formData.documentManagerKey,
        anno: parseInt(formData.anno),
        note: formData.note || undefined, // Usa undefined invece di null se preferisci
      };

      if (editingDocument) {
        const updatedDocument = (await apiService.updateDocument(
          editingDocument.id,
          documentData
        )) as DocumentManager;

        dispatch({
          type: "UPDATE_DOCUMENTO",
          payload: {
            ...updatedDocument,
            createdAt: new Date(updatedDocument.createdAt),
            updatedAt: new Date(updatedDocument.updatedAt),
          },
        });
      } else {
        const newDocument = (await apiService.createDocument(
          documentData
        )) as DocumentManager;

        dispatch({
          type: "ADD_DOCUMENTO",
          payload: {
            ...newDocument,
            createdAt: new Date(newDocument.createdAt),
            updatedAt: new Date(newDocument.updatedAt),
          },
        });
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
      clienteId: "",
      documentManagerKey: "",
      anno: new Date().getFullYear().toString(),
      note: "",
    });
    setClienteSearch("");
    setShowClienteDropdown(false);
    setEditingDocument(null);
    setShowForm(false);
  };

  const handleEdit = (documento: DocumentManager) => {
    const cliente = state.clienti.find((c) => c.id === documento.clienteId);

    setFormData({
      clienteId: documento.clienteId.toString(),
      documentManagerKey: documento.documentManagerKey,
      anno: documento.anno.toString(),
      note: documento.note || "",
    });

    setClienteSearch(cliente?.ragioneSociale || "");
    setEditingDocument(documento);
    setShowForm(true);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDelete = (
    id: number,
    documentKey: string,
    clienteNome: string
  ) => {
    setConfirmModal({
      isOpen: true,
      title: "Conferma Eliminazione",
      message: `Sei sicuro di voler eliminare il documento "${documentKey}" per "${clienteNome}"?`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await apiService.deleteDocument(id);
          dispatch({ type: "DELETE_DOCUMENTO", payload: id });
        } catch (error) {
          toast.error(`Errore: ${(error as Error).message}`);
        } finally {
          setLoading(false);
          closeConfirmModal();
        }
      },
    });
  };

  const handleSelectDocument = (id: number) => {
    setSelectedDocuments((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map((d) => d.id));
    }
  };

  const handleExportSelected = async () => {
    if (selectedDocuments.length === 0) {
      toast.error("Seleziona almeno un documento per l'esportazione");
      return;
    }

    const docsSelezionati = filteredDocuments.filter((d) =>
      selectedDocuments.includes(d.id)
    );

    const data = docsSelezionati.map((doc) => {
      const cliente = state.clienti.find((c) => c.id === doc.clienteId);
      return {
        "Ragione Sociale": cliente?.ragioneSociale || "",
        "Chiave Documento": doc.documentManagerKey,
        Anno: doc.anno,
        Note: doc.note || "",
        "Data Creazione": formatDate(new Date(doc.createdAt)),
        "Ultima Modifica": formatDate(new Date(doc.updatedAt)),
      };
    });

    try {
      const { exportToExcel } = await import("../utils/exportUtils");
      exportToExcel(data, "Documenti_Selezionati", "Documenti Selezionati");
      setSelectedDocuments([]);
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            DocumentManager Key
          </h1>
          <p className="text-gray-600 mt-1 text-sm lg:text-base">
            Gestione DocumentManager Key dei clienti
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedDocuments.length > 0 && (
            <button
              onClick={handleExportSelected}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 text-sm lg:text-base"
            >
              <Download className="h-4 w-4" />
              <span>Esporta ({selectedDocuments.length})</span>
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm lg:text-base disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Nuovo Documento</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca per cliente, chiave documento, note o anno..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg lg:text-xl font-bold mb-4">
              {editingDocument ? "Modifica Documento" : "Nuovo Documento"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        setFormData((prev) => ({ ...prev, clienteId: "" }));
                      }
                    }}
                    onFocus={() => setShowClienteDropdown(true)}
                    placeholder="Cerca e seleziona cliente..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  />
                  {clienteSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setClienteSearch("");
                        setFormData((prev) => ({ ...prev, clienteId: "" }));
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
                        filteredClienti.map((cliente) => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => handleClienteSelect(cliente)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                          >
                            <div className="font-medium">
                              {cliente.ragioneSociale}
                            </div>
                            {cliente.email && (
                              <div className="text-xs text-gray-500">
                                {cliente.email}
                              </div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Nessun cliente trovato
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Anno *
                </label>
                <input
                  type="number"
                  required
                  min="2000"
                  max="2100"
                  value={formData.anno}
                  onChange={(e) =>
                    setFormData({ ...formData, anno: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chiave Documento *
                </label>
                {/* <input
                  type="text"
                  required
                  value={formData.documentManagerKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentManagerKey: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                /> */}
                <textarea
                  required
                  value={formData.documentManagerKey}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      documentManagerKey: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  rows={6}
                />

              </div>

              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                  rows={2}
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm lg:text-base disabled:opacity-50"
                >
                  {loading
                    ? "Salvando..."
                    : editingDocument
                    ? "Aggiorna"
                    : "Crea Documento"}
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

      {/* Click outside to close dropdown */}
      {showClienteDropdown && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowClienteDropdown(false)}
        />
      )}

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {filteredDocuments.map((documento) => {
          const cliente = state.clienti.find(
            (c) => c.id === documento.clienteId
          );
          return (
            <div
              key={documento.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(documento.id)}
                    onChange={() => handleSelectDocument(documento.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="bg-blue-100 rounded-lg p-2 flex-shrink-0">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium black text-sm truncate">
                      {cliente?.ragioneSociale}
                    </h3>
                    {/* <p className="text-xs text-gray-500 truncate">
                      {documento.documentManagerKey}
                    </p> */}
                    <p className="text-xs text-gray-500 truncate">
                      {truncateText(documento.documentManagerKey, 30)}
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(documento.documentManagerKey);
                        }}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                        title="Copia"
                    >
                        <Copy className="h-4 w-4" />
                    </button>
                    </p>
                  </div>
                </div>
                <div className="flex space-x-1 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(documento)}
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(
                        documento.id,
                        documento.documentManagerKey,
                        cliente?.ragioneSociale || ""
                      )
                    }
                    disabled={loading}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Anno:</span>
                  <span className="text-gray-900">{documento.anno}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Creazione:</span>
                  <span className="text-gray-900">
                    {formatDate(new Date(documento.createdAt))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Ultima modifica:</span>
                  <span className="text-gray-900">
                    {formatDate(new Date(documento.updatedAt))}
                  </span>
                </div>
                {documento.note && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 mb-1">Note:</p>
                    <p className="text-xs text-gray-700">{documento.note}</p>
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
                    checked={
                      selectedDocuments.length === filteredDocuments.length &&
                      filteredDocuments.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente / Chiave Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Anno
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Note
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((documento) => {
                const cliente = state.clienti.find(
                  (c) => c.id === documento.clienteId
                );
                return (
                  <tr key={documento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(documento.id)}
                        onChange={() => handleSelectDocument(documento.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm black">
                        {cliente?.ragioneSociale || "N/A"} </div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <span>{truncateText(documento.documentManagerKey, 50)}</span>
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(documento.documentManagerKey);
                              }}
                              className="ml-2 text-blue-500 hover:text-blue-700"
                          >
                              <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {documento.anno}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            Creazione:{" "}
                            {formatDate(new Date(documento.createdAt))}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            Modifica:{" "}
                            {formatDate(new Date(documento.updatedAt))}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {documento.note || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(documento)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(
                              documento.id,
                              documento.documentManagerKey,
                              cliente?.ragioneSociale || ""
                            )
                          }
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

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nessuna DocumentManager key trovata</p>
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

export default DocumentManagerComponent;
