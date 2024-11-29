import React, { useState, useEffect } from "react";
import "./privilege.css";
import axios from "axios";
import { FaSave } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";
import { useMemo } from "react";

const PrivilegeManagement = () => {
  const [roles, setRoles] = useState([]);
  const [privileges, setPrivileges] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQueries, setSearchQueries] = useState({
    products: '',
    invoices: '',
    machines: '',
    users: ''
  });

  const modules = useMemo(() => ["products", "invoices", "machines", "users","mouvement","historique"],[]);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const rolesRes = await axios.get(
          "http://localhost:5000/api/auth/roles"
        );
        const privilegesRes = await axios.get(
          "http://localhost:5000/api/privileges"
        );

        setRoles(rolesRes.data);
        setPrivileges(
          privilegesRes.data.reduce((acc, priv) => {
            const roleKey =
              priv.role + (priv.subRole ? `-${priv.subRole}` : "");
            acc[roleKey] = priv.permissions || {};

            modules.forEach((module) => {
              acc[roleKey][module] = acc[roleKey][module] || [];
            });

            return acc;
          }, {})
        );

        setLoading(false);
      } catch (err) {
        console.error("Erreur lors du chargement des données :", err);
      }
    };

    fetchData();
  }, [modules]);

  const handleCheckboxChange = (roleKey, module, action) => {
    setPrivileges((prev) => {
      const updated = { ...prev };

      if (!updated[roleKey]) {
        updated[roleKey] = {};
      }
      if (!updated[roleKey][module]) {
        updated[roleKey][module] = [];
      }

      const actions = updated[roleKey][module];
      if (actions.includes(action)) {
        updated[roleKey][module] = actions.filter((a) => a !== action);
      } else {
        updated[roleKey][module] = [...actions, action];
      }

      return updated;
    });
  };

  const handleSearchChange = (module, event) => {
    const { value } = event.target;
    setSearchQueries((prevQueries) => ({
      ...prevQueries,
      [module]: value.toLowerCase()
    }));
  };
  const confirmSave = async () => {
    setConfirmMessage("Voulez-vous Enregistrer ce Privilege?");
    setConfirmAction(() => async () => {
      await savePrivileges();
    });
    setIsConfirmVisible(true);
  };
  
  const savePrivileges = async () => {
    try {
      const updates = Object.entries(privileges).map(
        ([roleKey, permissions]) => {
          const [role, subRole] = roleKey.split("-");
          return { role, subRole: subRole || null, permissions };
        }
      );

      await axios.put("http://localhost:5000/api/privileges", { updates });
      alert("Privilèges sauvegardés !");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde :", err);
      alert("Erreur lors de la sauvegarde.");
    }
  };

  // Filtrer les rôles par la recherche
  const filterRolesBySearch = (module) => {
    const query = searchQueries[module];
    if (!query) return roles; // Si pas de recherche, retourner tous les rôles

    return roles.filter(role => 
      role.role.toLowerCase().includes(query) || 
      (role.subRole && role.subRole.toLowerCase().includes(query))
    );
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="privilege-managements">
      <div className="privilege-management">
      {modules.map((module) => (
        <div className="module-section" key={module}>
          <h3>Privilèges pour {module}</h3>
          {/* Champ de recherche */}
          <div className="search">
          <input
            type="text"
            placeholder={`Rechercher par rôle ou sous-rôle dans ${module}`}
            value={searchQueries[module]}
            onChange={(e) => handleSearchChange(module, e)}
            className="search-input"
          />
          <button onClick={confirmSave}><FaSave/> Sauvegarder</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Rôle</th>
                <th>Sub-Rôle</th>
                <th>List</th>
                <th>Add</th>
                <th>Edit</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {filterRolesBySearch(module).map((role) => {
                const roleKey =
                  role.role + (role.subRole ? `-${role.subRole}` : "");
                const permissions = privileges[roleKey] || {};

                return (
                  <tr key={roleKey}>
                    <td>{role.role}</td>
                    <td>{role.subRole || "-"}</td>
                    {["list", "add", "edit", "delete"].map((action) => (
                      <td key={action} className="privilege-cell">
                        {permissions[module]?.includes(action) ? (
                          <span className="icon-checked">✅</span>
                        ) : (
                          <span className="icon-unchecked">❌</span>
                        )}
                        <input
                          type="checkbox"
                          className="hidden-checkbox"
                          checked={permissions[module]?.includes(action) || false}
                          onChange={() =>
                            handleCheckboxChange(roleKey, module, action)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
    {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
    </div>
  );
};

export default PrivilegeManagement;
