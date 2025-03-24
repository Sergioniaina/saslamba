import React, { useEffect, useState } from "react";
import "../css/home.css";
import "../css/fixed_div.css";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import ClientPages from "../../connexion/pages/ClientPages";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MachineList from "../machine/MachineList";
import SubscriptionManager from "../subscription/SubscriptionList";
import Products from "../subscription/ProduitList";
import Historique from "./Historique";
import Abonnement from "../subscription/Abonnements";
import AbonnementForm from "../subscription/AbonnementClient";
import Caisse from "./Caisse";
import MouvementCaisseList from "./MouvementCaisse";
import Dashboards from "./Dashboards";
import FactureForm from "../factures/FacturesForm";
import ArticleManage from "../articles/ArticleManage";
import MachineConsumptionHistory from "./machineConsumption";
import ProductInventory from "./Inventaire";
import UserManagement from "./UserManage";
import ProductStockForm from "./Produit";
import {
  FaArrowDown,
  FaBoxOpen,
  FaBoxes,
  FaCashRegister,
  FaClipboardList,
  FaCog,
  FaExchangeAlt,
  FaEye,
  FaHistory,
  FaPlus,
  FaPlusSquare,
  FaSignOutAlt,
  FaTasks,
  FaTimes,
  FaTools,
  FaUserFriends,
  FaUserTie,
  FaWarehouse,
} from "react-icons/fa";
import HistoriqueProducts from "../subscription/ProduitHistorique";
import PaymentList from "./PayementHistorique";
import CaisseTable from "./CaisseTable";
import FactureId from "../factures/FactureId";
import PrivilegeManagement from "../Privilege/PrivilegeManagement ";
import Machines from "../machine/Machines";
import GestionCaisse from "./HistoriqueDepense";
import ProductHistory from "./ProductH";
import FactureMachine from "../factures/FactureMachine";
import axios from "axios";
import PaymentForm from "./reabonnement";

// import App from "./App";

const DropdownItem = ({ title, icon, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleSubMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown-item">
      <button
        className={`dropdown-item-button ${isOpen ? "active" : ""}`}
        onClick={toggleSubMenu}
      >
        {icon}
        {title}
        <span className={`chevron ${isOpen ? "open" : ""}`}>▼</span>
      </button>
      <div className={`dropdown-submenu ${isOpen ? "show" : ""}`}>
        {children}
      </div>
    </div>
  );
};

const Home = ({ onLogout }) => {
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const [isSidebarLeft, setSidebarLeft] = useState(true);
  const [hideParam, setHideParam] = useState(false);
  const [isFixedDivVisible, setFixedDivVisible] = useState(false);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const PORT = process.env.REACT_APP_BACKEND_URL;
  // eslint-disable-next-line
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line
  const [error, setError] = useState(null);
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line
  }, []);
  const navigate = useNavigate();
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token"); // Récupération du token
      const response = await axios.get(`${PORT}/api/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const products = response.data;

      // Filtrer les produits en alerte de stock
      const filteredProducts = products.filter(
        (product) => product.stock <= product.stockAlerte
      );

      setLowStockProducts(filteredProducts);
      setIsModalOpen(filteredProducts.length > 0); // Ouvrir le modal si alerte
    } catch (err) {
      setError(err.response ? err.response.data.error : "Erreur serveur");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fixedDiv = document.querySelector(".fixed-div");

    const fixedDivs = document.querySelector(".fixeddiv");
    if (fixedDiv && fixedDivs) {
      fixedDiv.classList.remove("visible");
      fixedDiv.classList.add("hidden");
      fixedDivs.classList.remove("visible");
      fixedDivs.classList.add("hidden");
    }
  }, []);

  const toggleSidebarVisibility = () => {
    setSidebarVisible(!isSidebarVisible);
  };

  const toggleSidebarPosition = (position) => {
    setSidebarLeft(position === "left");
  };

  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/signin" />;
  }

  const hideNavbarParam = () => {
    setHideParam(true);
  };

  const resetHideParam = () => {
    setHideParam(false);
  };

  const toggleFixedDivVisibility = () => {
    setFixedDivVisible(true);
    const fixedDiv = document.querySelector(".fixed-div");
    const fixedDivs = document.querySelector(".fixeddiv");
    if (fixedDiv && fixedDivs) {
      fixedDiv.classList.remove("hidden");
      fixedDiv.classList.add("visible");
      fixedDivs.classList.remove("hidden");
      fixedDivs.classList.add("visible");
    }
  };

  const closeFixedDiv = () => {
    setFixedDivVisible(true);
    const fixedDiv = document.querySelector(".fixed-div");
    const fixedDivs = document.querySelector(".fixeddiv");
    if (fixedDiv && fixedDivs) {
      fixedDiv.classList.remove("visible");
      fixedDiv.classList.add("hidden");
      fixedDivs.classList.remove("visible");
      fixedDivs.classList.add("hidden");
    }
  };

  return (
    <div
      className={`app ${isSidebarVisible ? "" : "sidebar-hidden"} ${
        isSidebarLeft ? "sidebar-left" : "sidebar-right"
      }`}
    >
      <Sidebar
        isLeft={isSidebarLeft}
        toggleSidebarVisibility={toggleSidebarVisibility}
        toggleSidebarPosition={toggleSidebarPosition}
        onLogout={onLogout}
        toggleFixedDiv={toggleFixedDivVisibility}
      />
      <div className="main-content">
        <Navbar
          toggleSidebar={toggleSidebarVisibility}
          isSidebarLeft={isSidebarLeft}
          onLogout={onLogout}
          hideParam={hideParam}
          resetHideParam={resetHideParam}
          onNavbarClick={hideNavbarParam}
        />
        <div className="content" onClick={hideNavbarParam}>
          <Routes>
            <Route path="/demande" element={<FactureForm />} />
            <Route path="/user" element={<UserManagement />} />
            <Route path="/dashboard" element={<Dashboards />} />
            <Route path="/abonement" element={<SubscriptionManager />} />
            <Route path="/abonnements" element={<AbonnementForm />} />
            <Route path="/machine" element={<MachineList />} />
            <Route path="/machines" element={<Machines />} />
            <Route path="/about" element={<ClientPages />} />
            <Route path="/historique" element={<Historique />} />
            <Route path="/produit" element={<Products />} />
            <Route path="/abonnement" element={<Abonnement />} />
            <Route path="/caisse" element={<Caisse />} />
            <Route path="/caissemouvement" element={<MouvementCaisseList />} />
            <Route path="/article" element={<ArticleManage />} />
            <Route path="/produitentrer" element={<ProductStockForm />} />
            <Route path="/alerte" element={<ProductStockForm />} />
            <Route path="/stock-alert" element={<ProductStockForm />} />
            <Route path="/historiqueStock" element={<HistoriqueProducts />} />
            <Route path="/paymentHistorique" element={<PaymentList />} />
            <Route path="/caisseTable" element={<CaisseTable />} />
            <Route path="/FactureId" element={<FactureId />} />
            <Route path="/privilege" element={<PrivilegeManagement />} />
            <Route path="/depense" element={<GestionCaisse />} />
            <Route path="/productH" element={<ProductHistory />} />
            <Route path="/machineCompte" element={<FactureMachine />} />
            <Route path="/reabonnement" element={<PaymentForm/>} />
            {/* <Route path="/app" element={<App />} /> */}
            {/* <Route path="/FactureId/:id" element={<FactureId />} /> */}
            <Route
              path="/machineConsumption"
              element={<MachineConsumptionHistory />}
            />
            <Route path="/inventaire" element={<ProductInventory />} />
          </Routes>
        </div>
        {isFixedDivVisible && (
          <div className="fixeddiv hidden" onClick={closeFixedDiv}>
            <div
              className="fixed-div hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="btn-close" onClick={closeFixedDiv}>
                x
              </button>
              <div className="dropdown-menu">
                <DropdownItem
                  title="Stock"
                  icon={<FaWarehouse style={{ color: "#FF9800" }} />}
                >
                  <NavLink
                    to="/home/produitentrer"
                    className="dropdown-subitem"
                  >
                    <FaArrowDown style={{ color: "#FF9800" }} /> ENTRER
                  </NavLink>
                  <NavLink to="/home/produit" className="dropdown-subitem">
                    <FaBoxOpen style={{ color: "#FF9800" }} /> PRODUITS
                  </NavLink>
                  <NavLink to="/home/inventaire" className="dropdown-subitem">
                    <FaBoxes style={{ color: "brown" }} /> INVENTAIRE
                  </NavLink>
                  <NavLink
                    to="/home/historiqueStock"
                    className="dropdown-subitem"
                  >
                    <FaHistory style={{ color: "brown" }} /> HISTORIQUES
                  </NavLink>
                  <NavLink to="/home/productH" className="dropdown-subitem">
                    <FaHistory style={{ color: "brown" }} /> SUIVIS
                  </NavLink>
                </DropdownItem>

                <DropdownItem
                  title="Caisse"
                  icon={<FaCashRegister style={{ color: "#4CAF50" }} />}
                >
                  <NavLink to="/home/caisse" className="dropdown-subitem">
                    <FaTasks style={{ color: "#4CAF50" }} /> GESTION
                  </NavLink>
                  <NavLink
                    to="/home/caissemouvement"
                    className="dropdown-subitem"
                  >
                    <FaExchangeAlt style={{ color: "#4CAF50" }} /> MOUVEMENT
                  </NavLink>
                  <NavLink to="/home/caisseTable" className="dropdown-subitem">
                    <FaHistory style={{ color: "#4CAF50" }} /> HISTORIQUES
                  </NavLink>
                  <NavLink to="/home/depense" className="dropdown-subitem">
                    <FaHistory style={{ color: "#4CAF50" }} /> DEPENSE
                  </NavLink>
                </DropdownItem>

                <DropdownItem
                  title="Machine"
                  icon={<FaTools style={{ color: "#2196F3" }} />}
                >
                  <NavLink to="/home/machine" className="dropdown-subitem">
                    <FaPlus style={{ color: "#2196F3" }} /> AJOUT
                  </NavLink>
                  <NavLink
                    to="/home/machineCompte"
                    className="dropdown-subitem"
                  >
                    <FaHistory style={{ color: "#2196F3" }} /> MACHINES
                  </NavLink>
                  <NavLink
                    to="/home/machineConsumption"
                    className="dropdown-subitem"
                  >
                    <FaHistory style={{ color: "#2196F3" }} /> HISTORIQUE
                  </NavLink>
                </DropdownItem>

                <DropdownItem
                  title="Abonnement"
                  icon={<FaClipboardList style={{ color: "#9C27B0" }} />}
                >
                  <NavLink to="/home/abonnement" className="dropdown-subitem">
                    <FaPlusSquare style={{ color: "#9C27B0" }} /> CREATION
                  </NavLink>
                  <NavLink to="/home/abonnements" className="dropdown-subitem">
                    <FaUserFriends style={{ color: "#9C27B0" }} />{" "}
                    <div className="marquee-container">
                      <span className="marquee-content">CLIENT-ABONNEMENT</span>
                    </div>
                  </NavLink>
                </DropdownItem>

                <DropdownItem
                  title="Parametre"
                  icon={<FaCog style={{ color: "#607D8B" }} />}
                >
                  <NavLink to="/home/test" className="dropdown-subitem">
                    <FaSignOutAlt style={{ color: "#607D8B" }} /> DECONNECTER
                  </NavLink>
                  <NavLink to="/home/reabonnement" className="dropdown-subitem">
                    <FaUserTie style={{ color: "#607D8B" }} />
                    <div className="marquee-container">
                      <span className="marquee-content">CLIENT-ABONNEMENT</span>
                    </div>
                  </NavLink>
                </DropdownItem>
              </div>
            </div>
          </div>
        )}
      </div>
      {isModalOpen && (
        <div className="modal-alerte" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content-alerte"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>⚠️ Alerte Stock Bas</h2>
            <p>
              Il y a <strong>{lowStockProducts.length}</strong> produits en
              stock critique.
            </p>
            <div className="buttons">
              <button className="fermer" onClick={() => setIsModalOpen(false)}>
                {" "}
                <FaTimes size={18} /> OK
              </button>
              <button
                className="details"
                onClick={() => {
                  navigate("/home/alerte");
                  setIsModalOpen(false);
                }}
              >
                <FaEye size={18} /> Voir Détails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
