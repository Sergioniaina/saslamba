import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUserPlus,
  faSignInAlt,
} from "@fortawesome/free-solid-svg-icons";
import "../css/signUp.css";
import ModalInfo from "../../contenu/modal/ModalInfo";
import { FaFile } from "react-icons/fa";

const Signup = () => {
  const backend_url = process.env.REACT_APP_BACKEND_URL;
  const [modalInfo, setModalInfo] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null); // Pour la prévisualisation
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [canShowSignup, setCanShowSignup] = useState(true);
  const fileInputRef = useRef(null); // Référence pour l'input file

  useEffect(() => {
    const checkAdminCount = async () => {
      try {
        const response = await axios.get(`${backend_url}/api/auth/admin-count`);
        const { adminCount } = response.data;
        if (adminCount >= 1) {
          setCanShowSignup(false);
        }
      } catch (error) {
        console.error("Error fetching admin count", error);
      }
    };
    checkAdminCount();
  }, [backend_url]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    formData.append("role", role);
    if (photo) {
      formData.append("photo", photo);
    }

    try {
      await axios.post(`${backend_url}/api/auth/signup`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      navigate("/signin");
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setMessage("Cet utilisateur existe déjà.");
        setModalInfo(true);
      } else {
        setMessage("Erreur lors de l'inscription.");
        setModalInfo(true);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const imageUrl = URL.createObjectURL(file); // Générer une URL pour la prévisualisation
      setPreview(imageUrl);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current.click(); // Déclencher le clic sur l'input file caché
  };

  const signin = () => {
    navigate("/signin");
  };

  const onOk = () => {
    setModalInfo(false);
  };

  return (
    <div className="signup">
      <div className="login-afara"></div>
      <div className="form-container">
        <h2>INSCRIPTION</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <FontAwesomeIcon className="icon" icon={faUser} />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
              required
            />
            <label>Nom :</label>
          </div>
          <div className="form-group">
            <input
              type="password"
              value={password}
              placeholder=""
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label>Mot de passe :</label>
          </div>
          {canShowSignup && (
            <div className="form-group">
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">Utilisateur</option>
                <option value="admin">Administrateur</option>
              </select>
              <label>Rôle :</label>
            </div>
          )}
          <div className="form-group">
            <input
              type="file"
              accept="image/jpeg,image/png"
              ref={fileInputRef}
              onChange={handleFileChange}
              hidden // Cacher l'input file
            />
            <button
              type="button"
              className="select-file"
              onClick={handleIconClick}
            >
              <FaFile /> Sélectionner une photo
            </button>
          </div>
          <div className="form-photo">
            <div className={`form-group ${photo ? "filled" : ""}`}>
              <input value={photo ? photo.name : ""} placeholder="" readOnly />
              <label>Photo (facultatif) :</label>
            </div>

            {/* Prévisualisation */}
            {preview && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={preview}
                  alt="Aperçu de profil"
                  style={{
                    maxWidth: "100px",
                    minWidth: "100px",
                    height: "80px",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}
          </div>
          <button type="submit">
            <FontAwesomeIcon icon={faUserPlus} /> S'inscrire
          </button>
          <button type="button" onClick={signin}>
            <FontAwesomeIcon icon={faSignInAlt} /> Se connecter
          </button>
        </form>
        {modalInfo && <ModalInfo message={message} onOk={onOk} />}
      </div>
    </div>
  );
};

export default Signup;
