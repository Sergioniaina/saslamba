import React, { useEffect, useState } from "react";
import axios from "axios";
import "./historique.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faEye,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FaSearch } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";

const Historique = () => {
  const [historique, setHistorique] = useState([]);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [select, setSelect] = useState(false);
  const [users, setUsers] = useState({});

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer cet historique?");
    setConfirmAction(() => () => deleteEvent(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  useEffect(() => {
    loadHistorique();
  }, []);

  useEffect(() => {
    if (historique.length > 0) {
      const dates = historique.map((item) => new Date(item.date));
      const earliestDate = new Date(Math.min(...dates));
      const latestDate = new Date(Math.max(...dates));

      // Ajouter ou soustraire un jour pour startDate et endDate
      earliestDate.setDate(earliestDate.getDate() - 1);
      latestDate.setDate(latestDate.getDate() + 1);

      setStartDate(earliestDate.toISOString().split("T")[0]);
      setEndDate(latestDate.toISOString().split("T")[0]);
    }
  }, [historique]);

  const loadHistorique = () => {
    axios
      .get("http://localhost:5000/api/historique")
      .then((response) => {
        setHistorique(response.data);
      })
      .catch((error) => {
        setError("Erreur lors du chargement de l'historique");
        console.error(error);
      });
  };
  useEffect(() => {
    if (historique.length > 0) {
      const userIds = [...new Set(historique.map((item) => item.user))]; // IDs uniques des utilisateurs
      if (userIds.length > 0) {
        axios
          .get("http://localhost:5000/api/auth/get", {
            params: { ids: userIds },
          })
          .then((response) => {
            const usersMap = response.data.reduce((acc, user) => {
              acc[user._id] = user.name; // Map ID -> Nom
              return acc;
            }, {});
            setUsers(usersMap);
          })
          .catch((error) => {
            console.error(
              "Erreur lors de la récupération des utilisateurs :",
              error
            );
          });
      }
    }
  }, [historique]);

  const handleSearch = () => {
    let filterHistorique = historique;

    if (searchTerm) {
      filterHistorique = filterHistorique.filter(
        (historique) =>
          historique.entityType
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          historique.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (startDate && endDate) {
      filterHistorique = filterHistorique.filter((historique) => {
        const factureDate = new Date(historique.date);
        return (
          factureDate >= new Date(startDate) && factureDate <= new Date(endDate)
        );
      });
    }

    return filterHistorique;
  };

  const deleteEvent = (id) => {
    axios
      .delete(`http://localhost:5000/api/historique/${id}`)
      .then(() => {
        setHistorique(historique.filter((event) => event._id !== id));
      })
      .catch((error) => {
        setError("Erreur lors de la suppression de l'événement");
        console.error(error);
      });
  };

  const showDetails = (event) => {
    setSelect(true);
    setSelectedEvent(event);
  };

  const closeDetails = () => {
    setSelect(false);
    //setSelectedEvent(null);
  };

  return (
    <div className="historique">
      <div className="search-container">
        <div className="input">
          <input
            type="text"
            placeholder="Rechercher par nom d'entité"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="icon" />
        </div>
        <div className="date-filter">
          <div className="date">
            <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date">
            <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>
      {error && <p>{error}</p>}
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }} className="table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Action</th>
                <th>Type d'entité</th>
                {/* <th>ID d'entité</th> */}
                <th className="action">Actions</th>
              </tr>
            </thead>
            <tbody>
              {handleSearch().map((event) => (
                <tr key={event._id}>
                  <td>{new Date(event.date).toLocaleString()}</td>
                  <td>{event.action}</td>
                  <td>{event.entityType}</td>
                  {/* <td>{event.entityId}</td> */}
                  <td className="th">
                    <button
                      className="btn-h-d"
                      onClick={() => showDetails(event)}
                    >
                      <FontAwesomeIcon className="icon" icon={faEye} />
                    </button>
                    {event.entityType !== "Product" && (
                      <button
                        className="btn-h-s"
                        onClick={() => confirmDelete(event._id)}
                      >
                        <FontAwesomeIcon className="icon" icon={faTrash} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className={`details ${select ? "visible" : ""}`}
          onClick={closeDetails}
        >
          {selectedEvent && (
            <table onClick={(e) => e.stopPropagation()}>
              <thead>
                <tr>
                  <th>Détails de l'événement</th>
                  <th>Valeur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Date</td>
                  <td>{new Date(selectedEvent.date).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Action</td>
                  <td>{selectedEvent.action}</td>
                </tr>
                <tr>
                  <td>Type d'entité</td>
                  <td>{selectedEvent.entityType}</td>
                </tr>
               
                <tr>
                  <td>Nom de l'utilisateur</td>
                  <td>{users[selectedEvent.user] || "Utilisateur inconnu"}</td>
                </tr>
                <tr>
                  <td>Details</td>
                  <td>{selectedEvent.details}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
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

export default Historique;
