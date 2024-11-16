import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ element }) => {
  const isAuthenticated = !!localStorage.getItem('token'); // Vérifier la présence du token dans le localStorage
  const location = useLocation();

  return isAuthenticated ? element : <Navigate to="/signin" state={{ from: location }} />;
};

export default PrivateRoute;
