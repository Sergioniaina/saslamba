import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import "../css/login.css";

const SignIn = ({ onLogin }) => {
  const backend_url = process.env.REACT_APP_BACKEND_URL;
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Étape 1 : Connexion
      const response = await axios.post(`${backend_url}/api/auth/login`, {
        name,
        password,
      });
      const { token, user } = response.data;

      // Stocker dans localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userPhoto", user.photo || "");

      // Étape 2 : Ouvrir les caisses
      const caisseResponse = await axios.post(
        `${backend_url}/api/caisses/open-all-closed`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(caisseResponse.data.message);

      // Étape 3 : Informer Lancement
      onLogin(token);

      // Étape 4 : Vérifier le statut du dernier paiement
      const paymentResponse = await axios.get(`${backend_url}/api/paiement/last-payment-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const status = paymentResponse.data.status;
      console.log("Statut du dernier paiement:", status);

      // Étape 5 : Rediriger
      if (status !== "success") {
        navigate("/reabonnement", { replace: true });
      } else {
        navigate("/home/demande", { replace: true });
      }
    } catch (err) {
      setError("Invalid information");
      console.error("Erreur lors de la connexion ou de la vérification:", err);
    }
  };

  return (
    <div className="login">
      <div className="login-afara"></div>
      <form className="form" onSubmit={handleSubmit}>
        <div className="login-afara"></div>
        <div className="form1">
          <h2>CONNEXION</h2>
          <div className="input">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder=" "
            />
            <label>Name</label>
          </div>
          <div className="input">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
            />
            <label>Password</label>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="button">
            <button type="submit">
              <FontAwesomeIcon icon={faSignInAlt} />
              CONNECTER
            </button>
            <Link className="link" to="/signup">
              <button type="button">
                <FontAwesomeIcon icon={faUserPlus} />
                INSCRIRE
              </button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SignIn;