import React, { createContext, useState, useContext, useEffect } from 'react';

// Crée un contexte pour l'utilisateur
const UserContext = createContext();

// Un hook personnalisé pour accéder au contexte utilisateur
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    // Vérifie si une donnée existe avant d'essayer de la parser
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Erreur lors du parsing de l'utilisateur stocké", error);
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, handleLogin, handleLogout }}>
      {children}
    </UserContext.Provider>
  );
};
