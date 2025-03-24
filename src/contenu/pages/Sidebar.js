import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "../css/sidebar.css";
import {
  FaHome,
  FaCogs,
  FaHistory,
  // FaArrowLeft,
  // FaArrowRight,
  FaUser,
  FaFileAlt,
  FaBoxes,
  FaTasks,
  FaMoneyCheck,
  FaFileInvoice,
  FaTools,
} from "react-icons/fa"; // Import des icônes
import ss from "../../images/ss.png";

const Sidebar = ({
  isLeft,
  toggleSidebarVisibility,
  // toggleSidebarPosition,
  toggleFixedDiv,
}) => {
  const [user, setUser] = useState([]);
  const PORT = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
  }, []);
  //const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sidebar-content">
      <div className="content-modal" onClick={toggleSidebarVisibility}></div>
      <div className={`sidebar ${isLeft ? "left" : "right"}`}>
        <div className="sidebar-header">
          <button className="close-button" onClick={toggleSidebarVisibility}>
            {isLeft ? "x" : "x"}
          </button>
          {/* <div className="sidebar-buttons">
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
        </div> */}
        </div>
        <div className="profil">
          <div className="sary">
            {user && user.photo ? (
              <img className="img" src={`${PORT}/${user.photo}`} alt="profil" />
            ) : (
              <img className="img" src={ss} alt="profil par défaut" />
            )}
          </div>
          <span>{user ? `${user.name}` : "ANARANA prenom(s)"}</span>
        </div>

        <div className="ul">
          <NavLink className="li" to="/home/demande">
            <span>
              <FaCogs style={{ color: "green" }} className="icon" />
            </span>
            <span>Demande</span>
          </NavLink>
          <NavLink className="li" to="/home/machines">
            <span>
              <FaTools style={{ color: "white" }} className="icon" />
            </span>
            <span>Machines</span>
          </NavLink>
          {/* <NavLink className="li" to="/home/app">
          <span>
            <FaTools style={{color:'white'}} className="icon" />
          </span>
          <span>App</span>
        </NavLink> */}
          <NavLink className="li" to="/home/dashboard">
            <span>
              <FaHome style={{ color: "blue" }} className="icon" />
            </span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink className="li" to="/home/FactureId">
            <span>
              <FaFileInvoice className="icon" style={{ color: "green" }} />
            </span>
            <span>FactureList</span>
          </NavLink>
          <NavLink className="li" to="/home/user">
            <span>
              <FaUser style={{ color: "purple" }} className="icon" />
            </span>
            <span>User</span>
          </NavLink>
          {user.role === "admin" && (
            <NavLink className="li" to="/home/privilege">
              <span>
                <FaTasks style={{ color: "white" }} className="icon" />
              </span>
              <span>Privilege</span>
            </NavLink>
          )}
          <NavLink className="li" to="/home/historique">
            <span>
              <FaHistory style={{ color: "orange" }} className="icon" />
            </span>
            <span>Historique</span>
          </NavLink>
          <NavLink className="li" to="/home/article">
            <span>
              <FaFileAlt style={{ color: "red" }} className="icon" />
            </span>
            <span>Offres</span>
          </NavLink>
          <NavLink className="li" to="/home/inventaire">
            <span>
              <FaBoxes style={{ color: "white" }} className="icon" />
            </span>
            <span>Inventaire</span>
          </NavLink>
          <NavLink className="li" to="/home/paymentHistorique">
            <span>
              <FaMoneyCheck style={{ color: "brown" }} className="icon" />
            </span>
            <span>Payement</span>
          </NavLink>

          <div className="li" onClick={toggleFixedDiv}>
            <span>
              <FaTasks style={{ color: "teal" }} className="icon" />
            </span>
            <span>Gestion</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
