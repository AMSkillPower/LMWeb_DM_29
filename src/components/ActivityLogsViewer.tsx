import React, { useState, useEffect } from 'react';
import { Activity, Filter, Calendar, User, Package, FileText, Trash2, Download } from 'lucide-react';
import { formatDate } from '../utils/licenseUtils';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: number;
  userId: number;
  username: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT';
  entityType: 'Cliente' | 'Software' | 'Licenza' | 'DocumentManager' | 'User';
  entityId: number;
  entityName: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface ActivityLogsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ActivityLogsViewer: React.FC<ActivityLogsViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    dateFrom: '',
    dateTo: '',
    limit: '100'
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/activity-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento log');
      }

      const data = await response.json();
      setLogs(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, filters]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'LOGIN':
        return 'bg-purple-100 text-purple-800';
      case 'LOGOUT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Cliente':
        return <User className="h-4 w-4" />;
      case 'Software':
        return <Package className="h-4 w-4" />;
      case 'Licenza':
        return <FileText className="h-4 w-4" />;
      case 'DocumentManager':
        return <FileText className="h-4 w-4" />;
      case 'User':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const handleExport = async () => {
    try {
      const data = logs.map(log => ({
        'Data/Ora': formatDate(new Date(log.createdAt)) + ' ' + new Date(log.createdAt).toLocaleTimeString('it-IT'),
        'Utente': log.username,
        'Azione': log.action,
        'Tipo Entità': log.entityType,
        'Nome Entità': log.entityName,
        'IP Address': log.ipAddress || '',
        'User Agent': log.userAgent || ''
      }));

      const { exportToExcel } = await import('../utils/exportUtils');
      exportToExcel(data, 'Activity_Logs', 'Log Attività');
    } catch (error) {
      toast.error('Errore nell\'esportazione log');
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Sei sicuro di voler eliminare i log più vecchi di 365 giorni?')) {
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/activity-logs/cleanup', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ daysToKeep: 365 }),
      });

      if (!response.ok) {
        throw new Error('Errore nella pulizia log');
      }

      const data = await response.json();
      toast.success(data.message);
      loadLogs(); // Ricarica i log
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Log Attività Sistema</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExport}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Download className="h-4 w-4" />
                <span>Esporta</span>
              </button>
              <button
                onClick={handleCleanup}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 text-sm"
              >
                <Trash2 className="h-4 w-4" />
                <span>Pulizia</span>
              </button>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Tutte le azioni</option>
              <option value="CREATE">Creazione</option>
              <option value="UPDATE">Modifica</option>
              <option value="DELETE">Eliminazione</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>

            <select
              value={filters.entityType}
              onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Tutte le entità</option>
              <option value="Cliente">Clienti</option>
              <option value="Software">Software</option>
              <option value="Licenza">Licenze</option>
              <option value="DocumentManager">DocumentManager</option>
              <option value="User">Utenti</option>
            </select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Data da"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Data a"
            />

            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="50">50 record</option>
              <option value="100">100 record</option>
              <option value="200">200 record</option>
              <option value="500">500 record</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nessun log trovato</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="bg-white rounded-lg p-2 border">
                        {getEntityIcon(log.entityType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                          <span className="text-sm font-medium text-gray-900">{log.entityType}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-700 truncate">{log.entityName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{log.username}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(new Date(log.createdAt))} {new Date(log.createdAt).toLocaleTimeString('it-IT')}</span>
                          </div>
                          {log.ipAddress && (
                            <span>IP: {log.ipAddress}</span>
                          )}
                        </div>

                        {/* Dettagli modifiche per UPDATE */}
                        {log.action === 'UPDATE' && log.oldValues && log.newValues && (
                          <div className="mt-2 text-xs">
                            <details className="cursor-pointer">
                              <summary className="text-blue-600 hover:text-blue-800">Visualizza modifiche</summary>
                              <div className="mt-2 p-2 bg-white rounded border">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  <div>
                                    <strong className="text-red-600">Prima:</strong>
                                    <pre className="text-xs bg-red-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                      {JSON.stringify(JSON.parse(log.oldValues), null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <strong className="text-green-600">Dopo:</strong>
                                    <pre className="text-xs bg-green-50 p-2 rounded mt-1 overflow-auto max-h-32">
                                      {JSON.stringify(JSON.parse(log.newValues), null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogsViewer;