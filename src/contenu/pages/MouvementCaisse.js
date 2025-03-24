import React, { useState, useEffect } from "react";
import axios from "axios";
import "./mouvementCaisse.css";
import {
  FaCalendarDay,
  FaFileExcel,
  FaMoneyBillWave,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt } from "@fortawesome/free-solid-svg-icons";
import * as XLSX from "xlsx";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
} from "date-fns";
import ModalConfirm from "../modal/ModalConfirm";

const MouvementCaisseList = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [mouvements, setMouvements] = useState([]);
  const [filteredMouvements, setFilteredMouvements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDateOuverture, setSearchDateOuverture] = useState("");
  const [searchDateFermeture, setSearchDateFermeture] = useState("");
  const [error, setError] = useState("");
  const [currentView, setCurrentView] = useState("caisse");
  const [mouvementsJour, setMouvementsJour] = useState([]);
  const [period, setPeriod] = useState("annee");
  const [userRole, setUserRole] = useState("user");
  
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // Fetch user from local storage
    if (user) {
      setUserRole(user.role); // Set the role to the user's role
    } else {
      alert("No user found in local storage");
    }
  }, []);

  useEffect(() => {
    const fetchMouvements = async () => {
      try {
        const response = await axios.get(
          `${PORT}/api/mouvements`
        );
        setMouvements(response.data);
        setFilteredMouvements(response.data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des mouvements de caisse:",
          error
        );
        setError(
          "Une erreur est survenue lors de la récupération des mouvements de caisse."
        );
      }
    };
    fetchMouvements();
  }, [PORT]);

  useEffect(() => {
    const applyFilters = () => {
      const today = new Date();
      const filtered = mouvements.filter((mouvement) => {
        const dateOuverture = new Date(mouvement.dateOuverture);
        const isInPeriod = {
          jour: dateOuverture.toDateString() === today.toDateString(),
          semaine: isWithinInterval(dateOuverture, {
            start: startOfWeek(today),
            end: endOfWeek(today),
          }),
          mois: isWithinInterval(dateOuverture, {
            start: startOfMonth(today),
            end: endOfMonth(today),
          }),
          annee: isWithinInterval(dateOuverture, {
            start: startOfYear(today),
            end: endOfYear(today),
          }),
        }[period];

        const matchesSearchQuery = mouvement.idCaisse?.nom
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
        const matchesDateRange =
          (!searchDateOuverture ||
            dateOuverture >= new Date(searchDateOuverture)) &&
          (!searchDateFermeture ||
            dateOuverture <= new Date(searchDateFermeture));

        return isInPeriod && matchesSearchQuery && matchesDateRange;
      });
      setFilteredMouvements(filtered);
    };
    applyFilters();
  }, [
    period,
    searchQuery,
    searchDateOuverture,
    searchDateFermeture,
    mouvements,
  ]);

  const fetchMouvementsJour = async () => {
    try {
      const response = await axios.get(
        `${PORT}/api/mouvements/toutes/mouvements/avant-fermeture`
      );
      setMouvementsJour(response.data);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des mouvements avant fermeture:",
        error
      );
      setError(
        "Une erreur est survenue lors de la récupération des mouvements avant fermeture."
      );
    }
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce mouvement?");
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmVisible(true);
  };
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${PORT}/api/mouvements/${id}`);
      setMouvements(mouvements.filter((mouvement) => mouvement._id !== id));
      setFilteredMouvements(
        filteredMouvements.filter((mouvement) => mouvement._id !== id)
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression du mouvement de caisse:",
        error
      );
      setError(
        "Une erreur est survenue lors de la suppression du mouvement de caisse."
      );
    }
  };

  const calculateTotals = (data) => {
    return data.reduce(
      (totals, mouvement) => ({
        recette: totals.recette + (mouvement.recette || 0),
        depense: totals.depense + (mouvement.depense || 0),
      }),
      { recette: 0, depense: 0 }
    );
  };

  const totals =
    currentView === "caisse"
      ? calculateTotals(filteredMouvements)
      : calculateTotals(mouvementsJour);

  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".mouvements-table").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table.querySelectorAll("th.action, td.action").forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Mouvements" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "mouvements.xlsx");
  };
  const confirmExcel = () => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  return (
    <div className="mcaisse">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="view-buttons">
        <button
          onClick={() => setCurrentView("caisse")}
          className={`view-btn ${currentView === "caisse" ? "active" : ""}`}
        >
          <FaMoneyBillWave className="icon" /> Mouvement Caisse
        </button>
        <button
          onClick={() => {
            setCurrentView("jour");
            fetchMouvementsJour();
          }}
          className={`view-btn ${currentView === "jour" ? "active" : ""}`}
        >
          <FaCalendarDay className="icon" /> Mouvement Jour
        </button>
      </div>

      {currentView === "caisse" && (
        <div className="m-input">
          <div className="input">
            <input
              type="text"
              value={searchQuery}
              placeholder="Rechercher par nom du caisse"
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <FaSearch className="icon" />
          </div>
          <div className="date">
            <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
            <input
              type="date"
              placeholder="Date d'ouverture"
              value={searchDateOuverture}
              onChange={(e) => setSearchDateOuverture(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="date">
            <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
            <input
              type="date"
              placeholder="Date de fermeture"
              value={searchDateFermeture}
              onChange={(e) => setSearchDateFermeture(e.target.value)}
              className="search-input"
            />
          </div>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="period-select"
          >
            <option value="jour">Jour</option>
            <option value="semaine">Semaine</option>
            <option value="mois">Mois</option>
            <option value="annee">Année</option>
          </select>
          <button onClick={confirmExcel} className="export-button">
          <FaFileExcel
            style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
          />
          Exporter en Excel
        </button>
        </div>
      )}
      <div className="mouv-table">
        <table className="mouvements-table">
          <thead>
            <tr>
              <th>Caisse</th>
              <th>Date d'Ouverture</th>
              {currentView === "caisse" && <th>Date de Fermeture</th>}
              <th>Recette</th>
              <th>Dépense</th>
              {currentView === "caisse" && userRole === "admin" && (
                <th className="action">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {currentView === "caisse"
              ? filteredMouvements.map((mouvement) => (
                  <tr key={mouvement._id}>
                    <td>{mouvement.idCaisse?.nom}</td>
                    <td>
                      {new Date(mouvement.dateOuverture).toLocaleDateString()}
                    </td>
                    <td>
                      {mouvement.dateFermeture
                        ? new Date(mouvement.dateFermeture).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{mouvement.recette} Ar</td>
                    <td>{mouvement.depense} Ar</td>
                    {userRole === "admin" && (
                      <td className="action td">
                        <FaTrash
                          className="icon-delete"
                          onClick={() => confirmDelete(mouvement._id)}
                        />
                      </td>
                    )}
                  </tr>
                ))
              : mouvementsJour.map((mouvement) => (
                  <tr key={mouvement.idCaisse}>
                    <td>{mouvement.nomCaisse}</td>
                    <td>
                      {new Date(mouvement.dateOuverture).toLocaleDateString()}
                    </td>
                    <td>{mouvement.recette} Ar</td>
                    <td>{mouvement.depense} Ar</td>
                  </tr>
                ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="total" colSpan={currentView === "caisse" ? 3 : 2}>
                Total
              </td>
              <td className="total-recette">{totals.recette} Ar</td>
              <td className="total-depense">{totals.depense} Ar</td>
            </tr>
          </tfoot>
        </table>
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

export default MouvementCaisseList;
