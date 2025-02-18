// src/connexion/pages/SignIn.js
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import "../css/login.css";

const SignIn = ({ onLogin }) => {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  //  const [canShowSignup, setCanShowSignup] = useState(true);

  //   useEffect(() => {
  //     const checkAdminCount = async () => {
  //       try {
  //         const response = await axios.get('http://localhost:5000/api/auth/admin-count');
  //         const { adminCount } = response.data;
  //         if (adminCount >= 2) {
  //           setCanShowSignup(false);
  //         }
  //       } catch (error) {
  //         console.error('Error fetching admin count', error);
  //       }
  //     };
  //     checkAdminCount();
  //   }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        { name, password }
      );
      const { token, user } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.photo) {
        localStorage.setItem("userPhoto", user.photo);
      } else {
        localStorage.setItem("userPhoto", "");
      }
      const caisseResponse = await axios.post(
        "http://localhost:5000/api/caisses/open-all-closed",
        {},
        {
          headers: { Authorization: `Bearer ${token}` }, // Ajout du token dans l'en-tête
        }
      );

      console.log(caisseResponse.data.message); // Log de confirmation
      onLogin(token);
    } catch (err) {
      setError("Invalid information");
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
