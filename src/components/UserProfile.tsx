import React, { useState } from 'react';
import { User, Settings, LogOut, Shield, Mail, Calendar } from 'lucide-react';
import { formatDate } from '../utils/licenseUtils';
import toast from 'react-hot-toast';

interface UserProfileProps {
  user: any;
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }

      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      toast.success('Logout effettuato con successo');
      onLogout();
    } catch (error) {
      console.error('Errore nel logout:', error);
      // Anche se c'è un errore, effettua comunque il logout locale
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      onLogout();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-100 text-red-800';
      case 'User':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Admin':
        return <Shield className="h-3 w-3" />;
      case 'User':
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="bg-blue-100 rounded-full p-2">
          <User className="h-5 w-5 text-blue-600" />
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
          <div className="flex items-center space-x-1">
            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
              {getRoleIcon(user.role)}
              <span>{user.role}</span>
            </span>
          </div>
        </div>
      </button>

      {showDropdown && (
        <>
          {/* Overlay per chiudere dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowDropdown(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            {/* User Info Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-full p-3">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{user.fullName}</h3>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                  {user.email && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{user.email}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${getRoleColor(user.role)}`}>
                  {getRoleIcon(user.role)}
                  <span>{user.role}</span>
                </span>
                {user.createdAt && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>Dal {formatDate(new Date(user.createdAt))}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  // Qui potresti aprire un modal per le impostazioni profilo
                  toast.info('Funzionalità in sviluppo');
                }}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Impostazioni Profilo</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnetti</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;