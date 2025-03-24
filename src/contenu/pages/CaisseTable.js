import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/caisseTable.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faTrash } from "@fortawesome/free-solid-svg-icons";

function CaisseTable() {
  const [historiques, setHistoriques] = useState([]);
  const [caisses, setCaisses] = useState([]); // Stocker les informations des caisses séparément
  const [searchCaisseName, setSearchCaisseName] = useState("");
  const [searchType, setSearchType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const PORT = process.env.REACT_APP_BACKEND_URL;

  // Récupérer les données de la collection HistoriqueCaisse et des caisses
  useEffect(() => {
    fetchHistoriques();
    fetchCaisses();
    // eslint-disable-next-line
  }, []);

  const fetchHistoriques = async () => {
    try {
      const response = await axios.get(`${PORT}/api/historiques`);
      const sortedFactures = response.data.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setHistoriques(sortedFactures);
    } catch (error) {
      console.error("Erreur lors de la récupération des historiques", error);
    }
  };

  const fetchCaisses = async () => {
    try {
      const response = await axios.get(`${PORT}/api/caisses`);
      setCaisses(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des caisses", error);
    }
  };

  // Supprimer un historique
  const deleteHistorique = async (historiqueId) => {
    try {
      const response = await axios.delete(`${PORT}/api/historiques/${historiqueId}`);
      if (response.status === 204) {
        fetchHistoriques(); // Rafraîchir après suppression
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique", error);
    }
  };

  // Vérifier si une date est dans l'intervalle
  const isDateInRange = (historiqueDate, startDate, endDate) => {
    const historiqueDateStr = new Date(historiqueDate)
      .toISOString()
      .split("T")[0];
    const startDateStr = startDate
      ? new Date(startDate).toISOString().split("T")[0]
      : "";
    const endDateStr = endDate
      ? new Date(endDate).toISOString().split("T")[0]
      : "";

    return (
      (!startDate || historiqueDateStr >= startDateStr) &&
      (!endDate || historiqueDateStr <= endDateStr)
    );
  };

  // Obtenir les noms de caisses uniques depuis la collection des caisses
  const caisseNames = caisses.map((caisse) => caisse.nom);

  // Ajouter les noms de caisses aux historiques
  const enrichHistoriques = historiques.map((historique) => {
    const caisse = caisses.find((c) => c._id === historique.caisse.toString());
    return {
      ...historique,
      caisseName: caisse ? caisse.nom : "Caisse inconnue", // Nom de la caisse ou valeur par défaut
    };
  });

  // Filtrer les historiques selon les entrées de recherche
  const filteredHistoriques = enrichHistoriques.filter((historique) => {
    const caisseNameMatches = historique.caisseName
      .toLowerCase()
      .includes(searchCaisseName.toLowerCase());
    const typeMatches =
      searchType === "" ||
      historique.type.toLowerCase().includes(searchType.toLowerCase());
    const dateMatches = isDateInRange(historique.date, startDate, endDate);

    return caisseNameMatches && typeMatches && dateMatches;
  });

  const totalAmount = filteredHistoriques.reduce((total, historique) => {
    return total + (historique.montant || 0);
  }, 0);

  return (
    <div className="caisseTable">
      <div className="searchFilters">
        {/* Filtrer par nom de caisse */}
        <div className="c-input">
          <select
            value={searchCaisseName}
            onChange={(e) => setSearchCaisseName(e.target.value)}
          >
            <option value="">Sélectionner une caisse</option>
            {caisseNames.map((caisseName, index) => (
              <option key={index} value={caisseName}>
                {caisseName}
              </option>
            ))}
          </select>
          <label>Caisse</label>
        </div>

        {/* Filtrer par type */}
        <div className="c-input">
          <input
            placeholder=""
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          />
          <label>Type</label>
        </div>

        {/* Filtrer par date de début */}
        <div className="c-input">
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Date début</label>
        </div>

        {/* Filtrer par date de fin */}
        <div className="c-input">
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <label>Date fin</label>
        </div>
      </div>

      <div className="table">
        <table id="caisseTable">
          <thead>
            <tr>
              <th>Nom de la Caisse</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistoriques.map((historique) => (
              <tr key={historique._id}>
                <td>{historique.caisseName}</td>
                <td>{historique.type}</td>
                <td>{historique.montant || 0} Ar</td>
                <td>{new Date(historique.date).toLocaleString()}</td>
                <td>
                  <FontAwesomeIcon
                    onClick={() => deleteHistorique(historique._id)}
                    icon={faTrash}
                    className="icon"
                  />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Total</td>
              <td>{totalAmount} Ar</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default CaisseTable;
