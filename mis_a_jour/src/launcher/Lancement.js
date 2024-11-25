// src/Lancement.js (ou App.js)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from '../contenu/pages/Home';
import SignIn from '../connexion/pages/SignIn';
import SignUp from '../connexion/pages/SignUp';
import './theme.css'
import './axiosConfig';  // Importation du fichier d'intercepteur axios
//import '../contenu/css/input.css';
//import './launcher.css'
const Lancement = () => {
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
    <Router>
      <Routes>
        <Route path="/signin" element={token ? <Navigate to="/home/demande" /> : <SignIn onLogin={handleLogin} />} />
        <Route path="/signup" element={token ? <Navigate to="/home/demande" /> : <SignUp />} />
        <Route path="/home/*" element={token ? <Home onLogout={handleLogout} /> : <Navigate to="/signin" />} />
        <Route path="/" element={<Navigate to={token ? "/home/demande" : "/signin"} />} />
      </Routes>
    </Router>
  );
};

// Fonction pour vérifier si le token est expiré
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // Décode le payload du token JWT
    const payload = JSON.parse(atob(token.split('.')[1])); 

    // Vérifie si l'expiration du token est passée
    const exp = payload.exp;
    return Date.now() >= exp * 1000;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return true; // Si une erreur se produit, considérez le token expiré
  }
};


export default Lancement;
