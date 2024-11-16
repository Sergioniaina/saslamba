import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../css/sidebar.css";
import {
  FaHome,
  FaCogs,
  FaHistory,
  FaClipboard,
  FaArrowLeft,
  FaArrowRight,
  FaUser,
  FaFileAlt,
  FaBoxes,
  FaTasks,
  FaMoneyCheck
} from "react-icons/fa"; // Import des icônes
import ss from "../../images/ss.png";

const Sidebar = ({
  isLeft,
  toggleSidebarVisibility,
  toggleSidebarPosition,
  toggleFixedDiv,
}) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    let scrollbarTimeout;

    const showScrollbar = () => {
      document.documentElement.classList.add("show-scrollbar");

      // Masquer la scrollbar après 3 secondes d'inactivité
      clearTimeout(scrollbarTimeout);
      scrollbarTimeout = setTimeout(() => {
        document.documentElement.classList.remove("show-scrollbar");
      }, 3000);
    };

    // Événement de défilement
    window.addEventListener("scroll", showScrollbar);

    // Nettoyage de l'événement de défilement à la suppression du composant
    return () => {
      window.removeEventListener("scroll", showScrollbar);
      clearTimeout(scrollbarTimeout);
    };
  }, []);

  return (
    <div className={`sidebar ${isLeft ? "left" : "right"}`}>
      <div className="sidebar-header">
        <button className="close-button" onClick={toggleSidebarVisibility}>
          {isLeft ? "❌" : "❌"}
        </button>
        <div className="sidebar-buttons">
          {!isLeft && (
            <button onClick={() => toggleSidebarPosition("left")}>
              <FaArrowLeft />
            </button>
          )}
          {isLeft && (
            <button onClick={() => toggleSidebarPosition("right")}>
              <FaArrowRight />
            </button>
          )}
        </div>
      </div>
      <div className="profil">
        <div className="sary">
          {user && user.photo ? (
            <img
              className="img"
              src={`http://localhost:5000/${user.photo}`}
              alt="profil"
            />
          ) : (
            <img className="img" src={ss} alt="profil par défaut" />
          )}
        </div>
        <span>{user ? `${user.name}` : "ANARANA prenom(s)"}</span>
      </div>

      <div className="ul">
        <NavLink className="li" to="/home/demande">
          <span>
            <FaCogs style={{color:'green'}} className="icon" />
          </span>
          <span>Demande</span>
        </NavLink>
        <NavLink style={{color:'blue'}} className="li" to="/home/dashboard">
          <span>
            <FaHome className="icon" />
          </span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink className="li" to="/home/user">
          <span>
            <FaUser  style={{ color: 'purple' }} className="icon" />
          </span>
          <span>User</span>
        </NavLink>
        <NavLink className="li" to="/home/historique">
          <span>
            <FaHistory style={{ color: 'orange' }} className="icon" />
          </span>
          <span>Historique</span>
        </NavLink>
        <NavLink className="li" to="/home/article">
          <span>
            <FaFileAlt style={{ color: 'red' }} className="icon" />
          </span>
          <span>Offres</span>
        </NavLink>
        <NavLink className="li" to="/home/inventaire">
          <span>
            <FaBoxes style={{ color: 'brown' }} className="icon" />
          </span>
          <span>Inventaire</span>
        </NavLink>
        <NavLink className="li" to="/home/paymentHistorique">
          <span>
            <FaMoneyCheck style={{ color: 'brown' }} className="icon" />
          </span>
          <span>Payement</span>
        </NavLink>
        
        <div className="li" onClick={toggleFixedDiv}>
          <span>
            <FaTasks style={{ color: 'teal' }} className="icon" />
          </span>
          <span>Gestion</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
