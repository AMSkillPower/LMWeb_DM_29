import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  Users, 
  Package, 
  FileText, 
  BarChart3,
  Menu,
  X,
  Key,
  KeyRound,
  FileSignature
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentPage, onPageChange }) => {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', count: null },
    { id: 'clienti', icon: Users, label: 'Clienti', count: state.clienti.length },
    { id: 'software', icon: Package, label: 'Software', count: state.software.length },
    { id: 'licenze', icon: FileSignature, label: 'Licenze', count: state.licenze.length },
    { id: 'documentManager', icon: KeyRound, label: 'DocumentManager', count: state.documenti.length },
  ];

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
    // Dispatch navigate event to clear search term
    window.dispatchEvent(new CustomEvent('navigate', { detail: page }));
  };

  const handleLogoClick = () => {
    onPageChange('dashboard');
    setSidebarOpen(false);
    // Dispatch navigate event to clear search term
    window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }));
  };
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <BarChart3 className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">LicenseManager</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <nav className="mt-4 lg:mt-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handlePageChange(item.id)}
              className={`w-full flex items-center px-4 lg:px-6 py-3 text-left transition-colors duration-200 ${
                currentPage === item.id
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span className="font-medium">{item.label}</span>
              {item.count !== null && (
                <span className="ml-auto bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-lg font-bold text-gray-800">LicenseManager</h1>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;