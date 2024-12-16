import axios from "axios";

// Crée une instance d'Axios
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL,
});

// Ajouter un intercepteur pour gérer les tokens
axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = localStorage.getItem("token");
    const refreshToken = localStorage.getItem("refreshToken");

    // Ajouter le token à l'en-tête si disponible
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Vérifier si le token est expiré
    const tokenExpiration = parseJwt(accessToken)?.exp * 1000;
    if (Date.now() >= tokenExpiration && refreshToken) {
      try {
        // Rafraîchir l'access token
        const response = await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken: newAccessToken } = response.data;

        // Mettre à jour le nouveau token
        localStorage.setItem("accessToken", newAccessToken);
        config.headers.Authorization = `Bearer ${newAccessToken}`;
      } catch (err) {
        console.error("Erreur lors du rafraîchissement du token :", err);
        localStorage.clear(); // Supprimer les données utilisateur
        window.location.href = "/login"; // Rediriger vers la page de connexion
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Fonction pour décoder un JWT
const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    return null;
  }
};

export default axiosInstance;
