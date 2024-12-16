// src/context/TokenContext.js
import React, { createContext, useState, useEffect } from 'react';

// Crée un contexte pour le token
export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
    } else {
      localStorage.removeItem('token');
      setToken(null);
    }
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <TokenContext.Provider value={{ token, setToken, handleLogin, handleLogout }}>
      {children}
    </TokenContext.Provider>
  );
};

// Fonction pour vérifier si le token est expiré
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    return Date.now() >= exp * 1000;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return true;
  }
};
