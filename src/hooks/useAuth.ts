import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: 'User' | 'Admin';
  fullName: string;
  email?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');

      if (!token || !savedUser) {
        setLoading(false);
        return;
      }

      // Verifica la validità del token con il server
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token non valido, rimuovi dati locali
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Errore nella verifica autenticazione:', error);
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'Admin';
  const isUser = () => user?.role === 'User';
  const isAuthenticated = () => !!user;

  return {
    user,
    loading,
    login,
    logout,
    isAdmin,
    isUser,
    isAuthenticated,
    checkAuthStatus
  };
};