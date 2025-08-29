import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ClientiManager from './components/ClientiManager';
import SoftwareManager from './components/SoftwareManager';
import LicenzeManager from './components/LicenzeManager';
import DocumentManagerComponent from './components/DocumentManager';
import { Toaster } from 'react-hot-toast';

function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    if (path === '/clienti') return 'clienti';
    if (path === '/software') return 'software';
    if (path === '/licenze') return 'licenze';
    if (path === '/documentManager') return 'documentManager';
    return 'dashboard';
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      const page = event.detail;
      setCurrentPage(page);
      setSearchTerm(''); // Pulisce sempre la ricerca quando si cambia pagina
      window.history.pushState({}, '', `/${page === 'dashboard' ? '' : page}`);
    };

    const handleNavigateWithSearch = (event: CustomEvent) => {
      const { page, searchTerm: term } = event.detail;
      setCurrentPage(page);
      setSearchTerm(term || ''); // Usa il termine fornito o stringa vuota
      window.history.pushState({}, '', `/${page === 'dashboard' ? '' : page}`);
    };

    const handlePopState = () => {
      const path = window.location.pathname;
      setSearchTerm(''); // Pulisce la ricerca anche con il back/forward del browser
      if (path === '/clienti') setCurrentPage('clienti');
      else if (path === '/software') setCurrentPage('software');
      else if (path === '/licenze') setCurrentPage('licenze');
      else if (path === '/documentManager') setCurrentPage('documentManager');
      else setCurrentPage('dashboard');
    };
    window.addEventListener('navigate', handleNavigate as EventListener);
    window.addEventListener('navigateWithSearch', handleNavigateWithSearch as EventListener);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
      window.removeEventListener('navigateWithSearch', handleNavigateWithSearch as EventListener);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'clienti':
        return <ClientiManager searchTerm={searchTerm} />;
      case 'software':
        return <SoftwareManager searchTerm={searchTerm} />;
      case 'licenze':
        return <LicenzeManager searchTerm={searchTerm} />;
      case 'documentManager':
        return <DocumentManagerComponent />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppProvider>
      {/* Aggiungi il Toaster qui, fuori dal Layout per evitare problemi di z-index */}
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      
      <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
        {renderPage()}
      </Layout>
    </AppProvider>
  );
}

export default App;