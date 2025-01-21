import React, { useState, useEffect } from "react";
import axios from "axios";
import "./abonnements.css"; // Assurez-vous que ce chemin est correct
import ModalAbonnement from "./ModalAbonnement";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faSearch,
  faEdit,
  faTrash,
  faInfoCircle,
  faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";
import ModalConfirm from "../modal/ModalConfirm";

function Abonnement() {
  const [abonnements, setAbonnements] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [abonnementActuel, setAbonnementActuel] = useState(null);
  const [selectedAbonnement, setSelectedAbonnement] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  // Charger les abonnements
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/abonnements")
      .then((response) => {
        setAbonnements(response.data);

        // Calculer les dates par défaut pour startDate et endDate
        if (response.data.length > 0) {
          const dates = response.data.map(
            (abonnement) => new Date(abonnement.creeLe)
          );

          const oldestDate = new Date(Math.min(...dates));
          const newestDate = new Date(Math.max(...dates));

          // Ajuster les dates
          oldestDate.setDate(oldestDate.getDate() - 1); // Le plus ancien -1 jour
          newestDate.setDate(newestDate.getDate() + 1); // Le plus récent +1 jour

          // Mettre à jour les dates dans l'état
          setStartDate(oldestDate.toISOString().split("T")[0]); // Formater la date en 'YYYY-MM-DD'
          setEndDate(newestDate.toISOString().split("T")[0]);
        }
      })
      .catch((error) =>
        console.error("Erreur lors du chargement des abonnements:", error)
      );
  }, []);
 
  const fetchAbonnements = () => {
    axios
      .get("http://localhost:5000/api/abonnements")
      .then((response) => setAbonnements(response.data))
      .catch((error) =>
        console.error("Erreur lors du chargement des abonnements:", error)
      );
  };
  

  // Ouvrir le modal pour ajouter un nouvel abonnement
  const ouvrirModalAjout = () => {
    setAbonnementActuel(null);
    setModalOpen(true);
  };

  // Ouvrir le modal pour modifier un abonnement existant
  const ouvrirModalModif = (abonnement) => {
    setAbonnementActuel(abonnement);
    setModalOpen(true);
  };

  // Supprimer un abonnement
  const supprimerAbonnement = (id) => {
    axios
      .delete(`http://localhost:5000/api/abonnements/${id}`)
      .then(() => {
        alert("Abonnement supprimé avec succès.");
        fetchAbonnements(); // Recharger la liste après suppression
      })
      .catch((error) => console.error("Erreur lors de la suppression:", error));
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer cet Abonnement?");
    setConfirmAction(() => () => supprimerAbonnement(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  // Afficher ou cacher les détails
  const handleDetailsClick = (abonnement) => {
    setSelectedAbonnement(
      selectedAbonnement && selectedAbonnement._id === abonnement._id
        ? null
        : abonnement
    );
  };

  // Filtrer les listes
  const handleSearch = () => {
    let filterAbonnement = abonnements;

    if (searchTerm) {
      filterAbonnement = filterAbonnement.filter((abonnement) =>
        abonnement.nom.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (startDate && endDate) {
      filterAbonnement = filterAbonnement.filter((abonnement) => {
        const factureDate = new Date(abonnement.creeLe);
        return (
          factureDate >= new Date(startDate) && factureDate <= new Date(endDate)
        );
      });
    }

    return filterAbonnement;
  };

  return (
    <div className="abonnements">
      <div className="ab-search">
        <button onClick={ouvrirModalAjout} className="icon-button">
          <FontAwesomeIcon className="icon" icon={faPlus}  /> Ajouter
          un abonnement
        </button>
        <div className="input">
          <input
            type="text"
            placeholder="Rechercher par nom du client"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FontAwesomeIcon
            className="icon"
            icon={faSearch}
          
          />
        </div>
        <div className="date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
        </div>
        <div className="date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
        </div>
      </div>

      <div className="content-wrapper">
      <div className="table-abonnement">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Machines</th>
              <th>Poids</th>
              <th>Prix</th>
              <th>Sechage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {handleSearch().map((abonnement) => (
              <tr key={abonnement._id}>
                <td>{abonnement.nom}</td>
                <td>{abonnement.machines}</td>
                <td>{abonnement.poids} kg</td>
                <td>{abonnement.prix} Ar</td>
                <td>{abonnement.sechage}</td>
                <td>
                  <button onClick={() => handleDetailsClick(abonnement)}>
                    <FontAwesomeIcon
                      icon={faInfoCircle}
                      style={{ color: "blue" }}
                    />
                    {selectedAbonnement &&
                    selectedAbonnement._id === abonnement._id
                      ? "Cacher"
                      : "Détails"}
                  </button>
                  <button onClick={() => ouvrirModalModif(abonnement)}>
                    <FontAwesomeIcon
                      icon={faEdit}
                      style={{ color: "orange" }}
                    />
                    Modifier
                  </button>
                  <button onClick={() => confirmDelete(abonnement._id)}>
                    <FontAwesomeIcon icon={faTrash} style={{ color: "red" }} />
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {selectedAbonnement && (
        <div className={`details-list ${selectedAbonnement ? "show" : ""}`} onClick={() => setSelectedAbonnement(null)}>
         
            <div className="detail-a" onClick={(e)=>e.stopPropagation()} >
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Machine</th>
                    <th>Poids</th>
                    <th>Prix</th>
                    <th>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedAbonnement.nom}</td>
                    <td>{selectedAbonnement.machines}</td>
                    <td>{selectedAbonnement.poids}</td>
                    <td>{selectedAbonnement.prix}</td>
                    <td>{selectedAbonnement.features.join(", ")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
         
        </div>
         )}
      </div>

      {modalOpen && (
        <ModalAbonnement 
          setModalOpen={setModalOpen}
          abonnementActuel={abonnementActuel}
          setAbonnements={setAbonnements}
          abonnements={abonnements}
          fetchAbonnement={fetchAbonnements}
        />
      )}
       {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
    </div>
  );
}

export default Abonnement;
