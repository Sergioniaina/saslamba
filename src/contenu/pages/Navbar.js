import React, { useEffect, useState } from "react";
import axios from "axios";
import ModalConfirm from "../modal/ModalConfirm"; // Import the confirmation modal component
import { Tooltip } from "react-tooltip";
import "../css/navbar.css";
//import eric from "../../images/l1.jpg";
import bg1 from "../background/1.avif";
import bg2 from "../background/2.jpg";
import bg3 from "../background/3.jpg";
import bg4 from "../background/4.jpg";
import bg5 from "../background/5.jpg";
import bg6 from "../background/7.jpg";
import bg7 from "../background/6.jpg";
import bg8 from "../background/8.jpg";
import bg11 from "../background/10.jpg";
import bg9 from "../background/9.avif";
import bg10 from "../background/9.webp";
import {
  FaBars,
  FaBell,
  FaCog,
  FaEye,
  FaEyeSlash,
  FaPhone,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Navbar = ({
  toggleSidebar,
  isSidebarLeft,
  onLogout,
  hideParam,
  resetHideParam,
}) => {
  const [theme, setTheme] = useState("black");
  const [visible, setVisible] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState(0);
  const [unpaidInvoiceList, setUnpaidInvoiceList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false); // State for logout confirmation modal
  const [companyInfo, setCompanyInfo] = useState(null);
  const PORT = process.env.REACT_APP_BACKEND_URL;
  // eslint-disable-next-line 
  const [backgroundImage, setBackgroundImage] = useState(bg10);
  useEffect(() => {
    fetchCompanyInfo(); // Load company info when the component mounts
    loadPreferences();
     // eslint-disable-next-line 
  }, []);
  const loadPreferences = () => {
    const savedTheme = localStorage.getItem("theme");
    const savedBackground = localStorage.getItem("backgroundImage");

    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }

    if (savedBackground) {
      setBackgroundImage(savedBackground);
      changeBackground(savedBackground);
    }
  };

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(
        `${PORT}/api/company-info/list`
      );
      setCompanyInfo(response.data[0]); // Assuming the first entry is the company info
    } catch (error) {
      console.error("Error loading company information:", error);
    }
  };
  const navigate = useNavigate();

  const handleVoir = (id) => {
    navigate(`/home/FactureId?id=${id}`);
    setIsModalOpen(!isModalOpen);
    // Redirection avec l'ID dans l'URL
  };

  const backgroundImages = [
    bg10,
    bg9,
    bg1,
    bg2,
    bg3,
    bg4,
    bg5,
    bg6,
    bg7,
    bg8,
    bg11,
  ];

  const changeBackground = (image) => {
    document.body.style.backgroundImage = `url(${image})`;
    document.body.style.backgroundSize = "100% 100%";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    setBackgroundImage(image);
    localStorage.setItem("backgroundImage", image); // Sauvegarder dans localStorage
  };
  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      try {
        const response = await axios.get(`${PORT}/api/factures`);
        const unpaid = response.data.filter(
          (facture) => facture.reste > 0 && facture.etat !== "annulée"
        );
        setUnpaidInvoices(unpaid.length);
        setUnpaidInvoiceList(unpaid);
      } catch (error) {
        console.error("Erreur lors du chargement des factures:", error);
      }
    };
    fetchUnpaidInvoices();
  }, [PORT]);

  const visibles = () => {
    setVisible(!visible);
  };

  const applyTheme = (theme) => {
    document.documentElement.className = "";
    document.documentElement.classList.add(`${theme}-theme`);
    localStorage.setItem("theme", theme); // Sauvegarder dans localStorage
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (hideParam) {
      setVisible(false);
      resetHideParam();
    }
  }, [hideParam, resetHideParam]);

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };
  const toggleSettingsModal = () => {
    setIsSettingsModalOpen(!isSettingsModalOpen);
  };

  // Toggle logout confirmation modal
  const confirmLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  // Confirm logout and call onLogout
  const handleLogoutConfirm = () => {
    onLogout();
    setIsLogoutConfirmOpen(false);
  };
  const [globalTime, setGlobalTime] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  // Fonction pour récupérer le temps global depuis le backend
  const fetchGlobalTime = async () => {
    try {
      const response = await axios.get(`${PORT}/api/globaltime`);
      console.log('Temps global récupéré:', response.data.time); // Afficher dans la console
      setGlobalTime(response.data.time);
    } catch (error) {
      console.error("Erreur lors de la récupération du temps global:", error);
    }
  };

  // Récupérer le temps toutes les 10 secondes
  useEffect(() => {
    fetchGlobalTime(); // Appel initial
    const intervalId = setInterval(fetchGlobalTime, 10000); // Mise à jour toutes les 10 secondes

    return () => clearInterval(intervalId); // Nettoyage à la désactivation
    // eslint-disable-next-line 
  }, []);
  useEffect(() => {
    let showTimeoutId, hideTimeoutId;

    // Fonction pour afficher la notification pendant 3 secondes
    const showAndHideNotification = () => {
      setShowNotification(true); // Afficher
      hideTimeoutId = setTimeout(() => {
        setShowNotification(false); // Cacher après 3 secondes
      }, 3000);
    };
    // if (globalTime <= 2 && globalTime > 0) {
      if (globalTime <= 0) {
      // Si globalTime <= 5, naviguer directement vers /reabonnement
      navigate('/reabonnement', { replace: true });
    }
    if (globalTime <= 5 && globalTime > 0) {
      showAndHideNotification(); // Afficher immédiatement la première fois

      // Réafficher toutes les 5 secondes
      showTimeoutId = setInterval(showAndHideNotification, 10000);
    }

    // Nettoyage des timeouts et interval quand globalTime change ou composant se démonte
    return () => {
      clearTimeout(hideTimeoutId);
      clearInterval(showTimeoutId);
    };
    // eslint-disable-next-line
  }, [globalTime]); // Dépendance sur globalTime

  return (
    <div className="navbar">
      <div className={`menu-container ${isSidebarLeft ? "left" : "right"}`}>
        <button
          data-tooltip-id="menu"
          className="menu-button"
          onClick={toggleSidebar}
        >
          <FaBars />
        </button>
      </div>
      <div className="lamba">
        {companyInfo && (
          <>
            <div className="sary">
              <img
                alt="Logo de l'entreprise"
                className="img"
                src={`${PORT}/${companyInfo.photo}`}
              />
            </div>
            <span>{companyInfo.name}</span>
          </>
        )}
      </div>
      {companyInfo && (
        <div className="info-phone">
          <FaPhone className="icon" />
          <span>{companyInfo.phone}</span>
        </div>
      )}
      <div className="profile">
        {unpaidInvoices > 0 && (
          <div className="profiles" data-tooltip-id="notification">
            <div
              className="cloche"
              style={{
                position: "relative",
                display: "inline-block",
              }}
              onClick={toggleModal}
            >
              <FaBell  className="fabell" color="#555" />
            </div>
            <span className="unpaid">{unpaidInvoices}</span>
          </div>
        )}
         <button
          data-tooltip-id="theme"
          className="button button-visibility"
          onClick={visibles}
        >
          {visible ? <FaEyeSlash className="slash" /> : <FaEye className="eye" />}
        </button>
        <button
          data-tooltip-id="logout"
          className="button button-logout"
          onClick={confirmLogout}
        >
          <FaSignOutAlt />
        </button>
       
        <button
          data-tooltip-id="setting"
          className="button button-settings"
          id="btn-settings"
          onClick={toggleSettingsModal}
        >
          <FaCog className="App-logo" />
        </button>
        <div className={`param ${visible ? "afficher" : "cacher"}`}>
          <button onClick={() => setTheme("light")}>Light</button>
          <button onClick={() => setTheme("black")}>Black</button>
          <button onClick={() => setTheme("light-blue")}>Blue</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay-nav" onClick={toggleModal}>
          <div
            className="modal-content-nav"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="table-navbar">
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Total</th>
                    <th>Reste</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidInvoiceList.map((facture) => (
                    <tr key={facture._id}>
                      <td>{facture.customerName}</td>
                      <td>{facture.totalPrice} Ar</td>
                      <td>{facture.reste} Ar</td>
                      <td>
                        {new Date(facture.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <button
                          className="btn-primary"
                          aria-label="Voir la facture"
                          onClick={() => handleVoir(facture._id)}
                        >
                          <FaEye />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* <button className='btn-fermer' onClick={toggleModal}>❌</button> */}
          </div>
        </div>
      )}

      {isSettingsModalOpen && (
        <div className="modal-image" onClick={toggleSettingsModal}>
          <div className="modal-image1" onClick={(e) => e.stopPropagation()}>
            <div id="image-grid" className="image-grid">
              {backgroundImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`background ${index}`}
                  onClick={() => changeBackground(image)}
                  style={{ width: "200px", height: "150px", cursor: "pointer" }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {isLogoutConfirmOpen && (
        <ModalConfirm
          onConfirm={handleLogoutConfirm}
          onCancel={() => setIsLogoutConfirmOpen(false)}
          message="Voulez-vous déconnecter ?"
        />
      )}
      <Tooltip
        className="tooltip"
        id="notification"
        content="Notification"
        place="bottom"
      />
      <Tooltip
        className="tooltip"
        id="logout"
        content="Deconnecter"
        place="bottom"
      />
      <Tooltip className="tooltip" id="theme" content="Theme" place="bottom" />
      <Tooltip className="tooltip" id="menu" content="Menu" place="left" />
      <Tooltip
        className="tooltip"
        id="setting"
        content="Setting"
        place="left"
      />
     {showNotification && (
        <div className="notification-bar">
          Il reste {globalTime} jours{globalTime > 1 ? 's' : ''} pour vous réabonner !
        </div>
      )}
    </div>
  );
};

export default Navbar;
