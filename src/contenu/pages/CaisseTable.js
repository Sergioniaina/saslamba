import React, { useState, useEffect } from "react";
import axios from "axios"; // Import d'Axios
import "../css/caisseTable.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarAlt, faTrash } from "@fortawesome/free-solid-svg-icons";

function CaisseTable() {
  const [caisses, setCaisses] = useState([]);
  const [searchCaisseName, setSearchCaisseName] = useState(""); // Search by caisse name
  const [searchType, setSearchType] = useState(""); // Search by type
  const [startDate, setStartDate] = useState(""); // Start date for search
  const [endDate, setEndDate] = useState(""); // End date for search

  const apiBaseURL = "http://localhost:5000/api/caisses"; // Replace with your API URL

  // Fetch caisses
  useEffect(() => {
    fetchCaisses();
  }, []);

  // Fetch caisses from API
  const fetchCaisses = async () => {
    try {
      const response = await axios.get(apiBaseURL);
      setCaisses(response.data);
    } catch (error) {
      console.error("Error fetching caisses", error);
    }
  };

  // Function to delete a historical entry
  const deleteHistorique = async (caisseId, historiqueId) => {
    try {
      const response = await axios.delete(
        `${apiBaseURL}/${caisseId}/historique/${historiqueId}`
      );
      if (response.status === 200) {
        fetchCaisses(); // Reload caisses after deletion
      } else {
        alert("Error deleting entry.");
      }
    } catch (error) {
      console.error("Error deleting historique", error);
    }
  };

  // Function to compare dates as case-insensitive
  const isDateInRange = (historiqueDate, startDate, endDate) => {
    const historiqueDateStr = new Date(historiqueDate)
      .toISOString()
      .split("T")[0]
      .toLowerCase();
    const startDateStr = startDate
      ? new Date(startDate).toISOString().split("T")[0].toLowerCase()
      : "";
    const endDateStr = endDate
      ? new Date(endDate).toISOString().split("T")[0].toLowerCase()
      : "";

    return (
      (!startDate || historiqueDateStr >= startDateStr) &&
      (!endDate || historiqueDateStr <= endDateStr)
    );
  };

  // Get all unique caisse names and historique types for dropdowns
  const caisseNames = [...new Set(caisses.map((caisse) => caisse.nom))];
  const historiqueTypes = [
    ...new Set(
      caisses.flatMap((caisse) =>
        caisse.historique.map((mouvement) => mouvement.type)
      )
    ),
  ];

  // Filter caisses based on search inputs (caisse name, type, and date range)
  const filteredCaisses = caisses.filter((caisse) => {
    // Filter by caisse name (case-insensitive)
    const caisseNameMatches = caisse.nom
      .toLowerCase()
      .includes(searchCaisseName.toLowerCase());

    // Filter by historical type (if selected)
    const filteredHistorique = caisse.historique.filter((mouvement) => {
      const typeMatches =
        searchType === "" ||
        mouvement.type.toLowerCase().includes(searchType.toLowerCase());
      const dateMatches =
        isDateInRange(mouvement.date, startDate, endDate) ||
        !startDate ||
        !endDate;

      return typeMatches && dateMatches;
    });

    // Only show caisse if name matches search and if there are any matching historique entries
    return caisseNameMatches && filteredHistorique.length > 0;
  });

  const totalAmount = filteredCaisses.reduce((total, caisse) => {
    return (
      total +
      caisse.historique.reduce((sum, mouvement) => {
        return sum + (mouvement.montant || 0);
      }, 0)
    );
  }, 0);

  return (
    <div className="caisseTable">
      <div className="searchFilters">
        {/* Filter by Caisse Name */}
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

        <div className="c-input">
          <input
            required
            placeholder=""
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          ></input>
          <label>Type</label>
        </div>
        {/* Filter by Historique Type */}

        <div className="c-input">
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
          <input
            placeholder=""
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Date Fin</label>
        </div>
        {/* Filter by Date */}

        <div className="c-input">
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
          <input
            placeholder=""
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
              <th className="action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCaisses.map((caisse) =>
              caisse.historique.map((mouvement) => (
                <tr key={mouvement._id}>
                  <td>{caisse.nom}</td>
                  <td>{mouvement.type}</td>
                  <td>{mouvement.montant || 0} Ar</td>
                  <td>{new Date(mouvement.date).toLocaleString()}</td>
                  <td className="action">
                    <FontAwesomeIcon
                      onClick={() =>
                        deleteHistorique(caisse._id, mouvement._id)
                      }
                      icon={faTrash}
                      className="icon"
                    />{" "}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2">Total</td>
              <td className="totalamount">{totalAmount} Ar</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default CaisseTable;
