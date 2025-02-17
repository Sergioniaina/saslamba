import React, { useEffect, useState } from "react";
import "../css/home.css";
import "../css/fixed_div.css";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
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
  FaHistory,
  FaPlus,
  FaPlusSquare,
  FaSignOutAlt,
  FaTasks,
  FaTools,
  FaUserFriends,
  FaUserTie,
  FaWarehouse,
} from "react-icons/fa";
import HistoriqueProducts from "../subscription/ProduitHistorique";
import PaymentList from "./PayementHistorique";
import CaisseTable from "./CaisseTable";
import FactureId from "../factures/FactureId";

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
            <Route path="/about" element={<ClientPages />} />
            <Route path="/historique" element={<Historique />} />
            <Route path="/produit" element={<Products />} />
            <Route path="/abonnement" element={<Abonnement />} />
            <Route path="/caisse" element={<Caisse />} />
            <Route path="/caissemouvement" element={<MouvementCaisseList />} />
            <Route path="/article" element={<ArticleManage />} />
            <Route path="/produitentrer" element={<ProductStockForm />} />
            <Route path="/historiqueStock" element={<HistoriqueProducts />} />
            <Route path="/paymentHistorique" element={<PaymentList />} />
            <Route path="/caisseTable" element={<CaisseTable />} />
            <Route path="/FactureId" element={<FactureId />} />
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
          <div className="fixed-div hidden"onClick={(e)=>(e.stopPropagation())}>
            <button className="btn-close" onClick={closeFixedDiv}>
              ❌
            </button>
            <div className="dropdown-menu">
              <DropdownItem
                title="Stock"
                icon={<FaWarehouse style={{ color: "#FF9800" }} />}
              >
                <NavLink to="/home/produitentrer" className="dropdown-subitem">
                  <FaArrowDown style={{ color: "#FF9800" }} /> ENTRER
                </NavLink>
                <NavLink to="/home/produit" className="dropdown-subitem">
                  <FaBoxOpen style={{ color: "#FF9800" }} /> PRODUITS
                </NavLink>
                <NavLink to="/home/inventaire" className="dropdown-subitem">
                  <FaBoxes style={{ color: "brown" }} /> INVENTAIRE
                </NavLink>
                <NavLink to="/home/historiqueStock" className="dropdown-subitem">
                  <FaBoxes style={{ color: "brown" }} /> HISTORIQUE
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
                <NavLink
                  to="/home/caisseTable"
                  className="dropdown-subitem"
                >
                  <FaExchangeAlt style={{ color: "#4CAF50" }} /> HISTORIQUE
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
                  CLIENT-ABONNEMENT
                </NavLink>
              </DropdownItem>

              <DropdownItem
                title="Parametre"
                icon={<FaCog style={{ color: "#607D8B" }} />}
              >
                <NavLink to="/home/test" className="dropdown-subitem">
                  <FaSignOutAlt style={{ color: "#607D8B" }} /> DECONNECTER
                </NavLink>
                <NavLink to="/home/contact" className="dropdown-subitem">
                  <FaUserTie style={{ color: "#607D8B" }} /> CLIENT-ABONNEMENT
                </NavLink>
              </DropdownItem>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
