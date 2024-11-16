import React, { useState } from "react";
import "./Dropdown.css"; // Assurez-vous de lier votre fichier CSS personnalisé
import { NavLink } from "react-router-dom";
import ss from "../../images/ss.png";
const DropdownItem = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSubMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="dropdown-item">
      <button className={` dropdown-item-button ${isOpen ? "active": ""}`}  onClick={toggleSubMenu}>
        {title}
        <span className={`chevron ${isOpen ? "open" : ""}`}>▼</span>
      </button>
      <div className={`dropdown-submenu ${isOpen ? "show" : ""}`}>
        {children}
      </div>
    </div>
  );
};

const Dropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLeft, setIsLeft] = useState(true);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const togglePosition = () => {
    setIsLeft(!isLeft);
  };

  return (
    <div className={`dropdown-wrapper ${isLeft ? "left" : "right"}`}>
      <div className="dropdown">
        <button className="toggle-position" onClick={togglePosition}>
          {isLeft ? "Droite" : "Gauche"}
        </button>
        <div className="profil">
          <img className="img" src={ss} />
        </div>
        <button className="dropdown-toggle" onClick={toggleDropdown}>
            Sélectionnez une option
          </button>
        <div className="dr">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            Sélectionnez une option
          </button>
          <div className={`dropdown-menu ${isOpen ? "show" : ""}`}>
            <DropdownItem title="Liste 1">
              <NavLink to="/home/historique" className="dropdown-subitem">
                Historique
              </NavLink>
              <NavLink to="/home/signup" className="dropdown-subitem">
                ClientPage
              </NavLink>
            </DropdownItem>
            <DropdownItem title="Liste 2">
              <NavLink to="/home/ClientPage" className="dropdown-subitem">
                Profil
              </NavLink>
              <NavLink to="/home/settings" className="dropdown-subitem">
                Paramètres
              </NavLink>
            </DropdownItem>
            <DropdownItem title="Liste 3">
              <NavLink to="/home/test" className="dropdown-subitem">
                À propos
              </NavLink>
              <NavLink to="/home/contact" className="dropdown-subitem">
                Contact
              </NavLink>
            </DropdownItem>
            <div className="dropdown-divider"></div>
            <div className="dropdown-footer">
              {/* Ajouter des éléments ici si nécessaire */}
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
