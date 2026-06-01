import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (tokenRecu, userRecu) => {
    localStorage.setItem('token', tokenRecu);
    localStorage.setItem('user', JSON.stringify(userRecu));
    setToken(tokenRecu);
    setUser(userRecu);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  // Helpers de rôle
  const isAdmin = user?.role === 'ADMINISTRATEUR';
  const isManager = user?.role === 'MANAGER' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);