import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';
import Home from '../contenu/pages/Home';
import SignIn from '../connexion/pages/SignIn';
import SignUp from '../connexion/pages/SignUp';
import './theme.css';
import './axiosConfig';
import Reabonnement from '../contenu/pages/reabonnement_externe';

const Lancement = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [lastPaymentStatus, setLastPaymentStatus] = useState(null);
  const [globalTime, setGlobalTime] = useState(0);
  // const [showNotification, setShowNotification] = useState(false);
  const backend_url = process.env.REACT_APP_BACKEND_URL;

  // Récupérer le temps global
  const fetchGlobalTime = async () => {
    try {
      const response = await axios.get(`${backend_url}/api/globaltime`); // Correction : utiliser backend_url
      console.log('Temps global récupéré:', response.data.time);
      setGlobalTime(response.data.time);
    } catch (error) {
      console.error("Erreur lors de la récupération du temps global:", error);
    }
  };

  // Récupérer le temps toutes les 10 secondes
  useEffect(() => {
    fetchGlobalTime();
    const intervalId = setInterval(fetchGlobalTime, 10000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, []);

  // Gérer la notification (apparaît 3s, réapparaît toutes les 5s)
  // useEffect(() => {
  //   let showTimeoutId, hideTimeoutId;

  //   const showAndHideNotification = () => {
  //     setShowNotification(true);
  //     hideTimeoutId = setTimeout(() => {
  //       setShowNotification(false);
  //     }, 3000);
  //   };

  //   if (globalTime <= 20 && globalTime > 0) {
  //     showAndHideNotification();
  //     showTimeoutId = setInterval(showAndHideNotification, 5000);
  //   }

  //   return () => {
  //     clearTimeout(hideTimeoutId);
  //     clearInterval(showTimeoutId);
  //   };
  // }, [globalTime]);

  // Gérer le token et le statut du dernier paiement
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      fetchLastPaymentStatus(storedToken);
    } else {
      localStorage.removeItem('token');
      setToken(null);
      setLastPaymentStatus(null);
    }
    // eslint-disable-next-line
  }, []);

  const fetchLastPaymentStatus = async (token) => {
    try {
      const response = await axios.get(`${backend_url}/api/paiement/last-payment-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const status = response.data.status;
      console.log('Statut du dernier paiement:', status);
      setLastPaymentStatus(status);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      setLastPaymentStatus(null);
    }
  };

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setToken(token);
    fetchLastPaymentStatus(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setLastPaymentStatus(null);
  };

  // Protection des routes /home/*
  const ProtectedHomeRoute = ({ children }) => {
    if (!token) return <Navigate to="/signin" replace />;
    if (lastPaymentStatus === null) return <div>Chargement...</div>;
    // Rediriger si le dernier paiement n'est pas "success" OU si globalTime <= 30
    if (lastPaymentStatus !== 'success' || globalTime <= 0) {
      return <Navigate to="/reabonnement" replace />;
    }
    return children;
  };

  return (
    <Router>
      <div className="App">
        {/* Notification globale */}
        {/* {showNotification && (
          <div className="notification-bar">
            Il reste {globalTime} minute{globalTime > 1 ? 's' : ''} pour vous réabonner !
          </div>
        )} */}
        <Routes>
          <Route path="/signin" element={<SignIn onLogin={handleLogin} />} />
          <Route
            path="/signup"
            element={
              token ? (
                <Navigate to={lastPaymentStatus !== 'success' || globalTime <= 0 ? '/reabonnement' : '/signup'} replace />
              ) : (
                <SignUp />
              )
            }
          />
          <Route
            path="/home/*"
            element={
              <ProtectedHomeRoute>
                <Home onLogout={handleLogout} />
              </ProtectedHomeRoute>
            }
          />
          <Route path="/reabonnement" element={token ? <Reabonnement /> : <Navigate to="/signin" replace />} />
          <Route
            path="/"
            element={
              <Navigate
                to={token ? (lastPaymentStatus !== 'success' || globalTime <= 0 ? '/reabonnement' : '/home/demande') : '/signin'}
                replace
              />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

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

export default Lancement;