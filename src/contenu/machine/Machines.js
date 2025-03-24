import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/machines.css";
import { FaEye, FaSearch } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";
import { Tooltip } from "react-tooltip";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

import { useNavigate } from "react-router-dom";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const FactureModal = ({ factures, onClose, setFacture }) => {
  const navigate = useNavigate();
  const handleViewFacture = (factureId) => {
    // Naviguer vers la page FactureList avec un paramètre de filtre
    navigate(`/home/demande?id=${factureId}`);
  };

  return (
    <div className="modal-machine-facture" onClick={onClose}>
      <div
        className="modal-content-machine-facture"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="titre-facture">
          <h2>{setFacture ? "Factures en attente" : "Factures Associés"}</h2>
        </div>
        <div className="table-form-view">
          <table className="factures-table">
            <thead>
              <tr>
                <th>Nom du client</th>
                <th>Référence</th>
                <th>Numéro de ticket</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => (
                <tr key={facture._id}>
                  <td>{facture.customerName}</td>
                  <td>{facture.reference}</td>
                  <td>{facture.ticketNumber}</td>
                  <td>
                    <button
                      onClick={() => handleViewFacture(facture._id)}
                      className="btn-view"
                    >
                      Voir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* <button onClick={onClose}>Fermer</button> */}
      </div>
    </div>
  );
};

const Machines = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [showModal, setShowModal] = useState(false); // Affichage de la modale
  const [modalContent, setModalContent] = useState([]); // Contenu des factures
  const [machines, setMachines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const [setFacture, setSetFacture] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null); // Stocke l'ID du menu ouvert
  // Fonction pour basculer l'affichage du menu
  const toggleMenu = (e, id) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    setOpenMenuId(openMenuId === id ? null : id); // Ferme si déjà ouvert, sinon ouvre
  };

  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  useEffect(
    () => {
      fetchMachines();
    },
    // eslint-disable-next-line
    [searchQuery],
    PORT
  );

  const fetchMachines = async () => {
    try {
      const result = await axios.get(`${PORT}/api/machines/search`, {
        params: { modelNumber: searchQuery },
      });
      setMachines(result.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des machines :", error);
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const confirmRelease = (id) => {
    setConfirmMessage("Voulez-vous liberer ce Machine?");
    setConfirmAction(() => () => handleRelease(id));
    setIsConfirmVisible(true);
  };
  const handleStart = async (machineId) => {
    try {
      await axios.patch(`${PORT}/api/machines/${machineId}/indisponible`);

      toast.success("Machine demarré et mise à l'état Indisponible");
      fetchMachines(); // Recharger la liste des machines
    } catch (error) {
      console.error("Erreur lors de la mise à l'état Indisponible :", error);
      toast.error("Erreur lors de la mise à l'état Indisponible");
    }
  };

  const confirmStart = (id) => {
    const machine = machines.find((machine) => machine._id === id);
    setConfirmMessage(
      `Voulez-vous vraiment Demarrer la machine numéro ${machine.modelNumber} ?`
    );
    setConfirmAction(() => () => handleStart(id));
    setIsConfirmVisible(true); // Afficher le modal de confirmation
  };
  const fetchAndFilterFactures = async (machineId) => {
    try {
      // Récupérer toutes les factures depuis l'API
      const { data: factures } = await axios.get(`${PORT}/api/factures`);

      // Filtrer les factures avec etat = "en attente" et associées à la machine
      return factures.filter(
        (facture) =>
          facture.etat === "en attente" && facture.machines.includes(machineId)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
      return [];
    }
  };
  const fetchAndFilterFacturess = async (machineId) => {
    try {
      // Récupérer toutes les factures depuis l'API
      const { data: factures } = await axios.get(`${PORT}/api/factures`);

      // Filtrer les factures avec etat = "en attente" et associées à la machine
      return factures.filter((facture) => facture.machines.includes(machineId));
    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
      return [];
    }
  };

  const handleRelease = async (machineId) => {
    try {
      await axios.patch(`${PORT}/api/machines/${machineId}/liberer`);

      const factures = await fetchAndFilterFactures(machineId);
      toast.success("Machine libérée");

      if (factures.length > 0) {
        setModalContent(factures);
        setShowModal(true);
      }
      fetchMachines();
      setSetFacture(true);
    } catch (error) {
      console.error("Erreur lors de la libération de la machine :", error);
      toast.error("Erreur lors de la libération de la machine");
    }
  };

  const voirFacture = async (machineId) => {
    // try {
    //   await axios.patch(
    //     `${PORT}/api/machines/${machineId}/liberer`
    //   );

    const factures = await fetchAndFilterFacturess(machineId);
    // toast.success("Machine libérée");

    if (factures.length > 0) {
      setModalContent(factures);
      setShowModal(true);
      setSetFacture(false);
    }
    // fetchMachines();
    // } catch (error) {
    //   console.error("Erreur lors de la list de la facture :", error);
    // //  toast.error("Erreur lors de la libération de la machine");
    // }
  };

  return (
    <div className="machine-management">
      <div className="machine-list">
        <div className="search">
          <div className="input">
            <input
              type="text"
              placeholder="Rechercher par numéro de modèle"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <FaSearch
              style={{ position: "absolute", right: "10px", color: "gray" }}
            />
          </div>
        </div>
        <div className="table-voir">
          <table className="tables-m">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Numéro</th>
                <th>Kilowatt</th>
                <th>Poids (kg)</th>
                <th>Type</th>
                <th>État</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine._id}>
                  <td>
                    {machine.photo && (
                      <img
                        src={`${PORT}/${machine.photo}`}
                        alt={machine.name}
                        style={{
                          width: "30px",
                          height: "30px",
                          marginRight: "10px",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </td>
                  <td>{machine.modelNumber}</td>
                  <td>{machine.powerConsumption}</td>
                  <td>{machine.weightCapacity}</td>
                  <td>{machine.type}</td>
                  <td>{machine.etat}</td>
                  <td>{new Date(machine.dateAdded).toLocaleString()}</td>
                  <td className="action">
                    <button
                      className="dropdown-btn"
                      onClick={(e) => toggleMenu(e, machine._id)}
                    >
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    <div className={`menu-action ${openMenuId === machine._id ? "show" : ""}`}>
                    <button
                      data-tooltip-id="voir"
                      className="btn-voir"
                      onClick={(e) => {
                        e.stopPropagation();
                        voirFacture(machine._id);
                      }}
                    >
                      <FaEye />
                    </button>
                    {machine.etat === "Indisponible" && (
                      <button
                        data-tooltip-id="liberer"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmRelease(machine._id);
                        }}
                      >
                        Libérer
                      </button>
                    )}
                    {machine.etat === "Disponible" && (
                      <button
                        data-tooltip-id="start"
                        className="btn-start"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmStart(machine._id); // Ouvrir le modal de confirmation
                        }}
                      >
                        Demarrer
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
      <Tooltip
        className="tooltip"
        id="modifier"
        content="Modifier"
        place="top"
      />
      <Tooltip className="tooltip" id="start" content="Demarrer" place="top" />
      <Tooltip className="tooltip" id="voir" content="facture" place="top" />
      <Tooltip className="tooltip" id="liberer" content="Liberer" place="top" />
      <ToastContainer />
      {showModal && (
        <FactureModal
          factures={modalContent}
          onClose={() => setShowModal(false)}
          setFacture={setFacture}
        />
      )}
    </div>
  );
};

export default Machines;
