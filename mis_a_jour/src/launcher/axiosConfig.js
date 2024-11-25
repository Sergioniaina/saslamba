import axios from 'axios';

// Intercepte toutes les réponses d'axios
axios.interceptors.response.use(
  (response) => {
    // Si la réponse est réussie, on la retourne simplement
    return response;
  },
  (error) => {
    // Si la réponse est une erreur 401 (token expiré)
    if (error.response && error.response.status === 401) {
      // Déconnecter l'utilisateur et rediriger vers la page de connexion
      localStorage.removeItem('token');
      window.location.href = '/signin'; // Redirige l'utilisateur vers la page de connexion
    }
    return Promise.reject(error);
  }
);
