import React, { useState, useEffect } from "react";
import axios from "axios";
import MachineModal from "./MachineModal";
import MachineDetails from "./MachineDetails";
import "../css/machines.css";
import { FaEdit, FaEye, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";
import { Tooltip } from "react-tooltip";
import "react-toastify/dist/ReactToastify.css";
import { toast, ToastContainer } from "react-toastify";

import { useNavigate } from "react-router-dom";

const FactureModal = ({ factures, onClose,setFacture }) => {
  const navigate = useNavigate();

  const handleViewFacture = (factureId) => {
    // Naviguer vers la page FactureList avec un paramètre de filtre
    navigate(`/home/demande?id=${factureId}`);
  };

  return (
    <div className="modal-machine-facture" onClick={onClose}>
      <div className="modal-content-machine-facture" onClick={(e)=>e.stopPropagation()}>
        <div className="titre-facture"><h2>{setFacture ? "Factures en attente":"Factures Associés"}</h2></div>
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

const MachineList = () => {
  const [showModal, setShowModal] = useState(false); // Affichage de la modale
  const [modalContent, setModalContent] = useState([]); // Contenu des factures
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [creatorName, setCreatorName] = useState(""); // Nom du créateur de la machine
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const [setFacture, setSetFacture]=useState(false);
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  useEffect(() => {
    fetchMachines();
    // eslint-disable-next-line
  }, [searchQuery]);

  const fetchMachines = async () => {
    try {
      const result = await axios.get(
        "http://localhost:5000/api/machines/search",
        { params: { modelNumber: searchQuery } }
      );
      setMachines(result.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des machines :", error);
    }
  };

  const fetchHistorique = async (machineId) => {
    try {
      // Récupération de l'historique pour trouver l'ID de l'utilisateur créateur
      const historiqueResponse = await axios.get(
        `http://localhost:5000/api/historique?entityId=${machineId}`
      );

      // Vérification que le tableau n'est pas vide avant d'accéder aux propriétés
      const historique =
        historiqueResponse.data.length > 0 ? historiqueResponse.data[0] : null;

      if (historique) {
        console.log("Historique entityId:", historique.entityId);
        console.log("Historique user:", historique.user);

        const userId = historique.user;
        if (userId) {
          // Récupération du nom de l'utilisateur créateur avec son ID
          const userResponse = await axios.get(
            `http://localhost:5000/api/auth/get/${userId}`
          );
          setCreatorName(userResponse.data.name);
          console.log("Nom de l'utilisateur:", userResponse.data.name);
        } else {
          setCreatorName("Inconnu");
        }
      } else {
        console.log("Aucun historique trouvé pour cette machine.");
        setCreatorName("Inconnu");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'historique :", error);
      setCreatorName("Erreur");
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSave = async (machine) => {
    const token = localStorage.getItem("token");
    try {
      const numeroExiste = machines.find(
        (m) => m.modelNumber === machine.modelNumber && m._id !== machine._id
      );

      if (numeroExiste) {
        setError(`Le numéro ${numeroExiste.modelNumber} existe déjà`);
        return;
      }

      const machineData = {
        type: machine.type,
        modelNumber: machine.modelNumber,
        powerConsumption: machine.powerConsumption,
        weightCapacity: machine.weightCapacity,
        etat: machine.etat,
        photo: machine.photo,
      };

      if (machine.type === "Sèche-linge") {
        machineData.priceRanges = machine.priceRanges;
      }

      if (machine._id) {
        await axios.put(
          `http://localhost:5000/api/machines/${machine._id}`,
          machineData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post("http://localhost:5000/api/machines", machineData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      fetchMachines();
      setModalVisible(false);
      setSelectedMachine(machine);
      setError("");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la machine :", error);
      setError("Erreur lors de l'enregistrement de la machine.");
    }
  };

  const handleAddButtonClick = () => {
    setSelectedMachine(null);
    setModalVisible(true);

    setError("");
  };

  const handleEditButtonClick = (machine) => {
    setSelectedMachine(machine);
    setModalVisible(true);
    setError("");
  };

  const handleMachineClick = (machine) => {
    setSelectedMachine(machine);
    fetchHistorique(machine._id);
    setIsDetailsVisible(true);
  };

  const handleCloseDetails = () => {
    setSelectedMachine(null);
    setIsDetailsVisible(false);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/machines/${id}`);
      fetchMachines();
      setSelectedMachine(null);
    } catch (error) {
      console.error("Erreur lors de la suppression de la machine :", error);
    }
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce Machine?");
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmVisible(true);
  };
  const confirmRelease = (id) => {
    setConfirmMessage("Voulez-vous liberer ce Machine?");
    setConfirmAction(() => () => handleRelease(id));
    setIsConfirmVisible(true);
  };
  const handleStart = async (machineId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/machines/${machineId}/indisponible`
      );

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
      const { data: factures } = await axios.get(
        "http://localhost:5000/api/factures"
      );

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
      const { data: factures } = await axios.get(
        "http://localhost:5000/api/factures"
      );

      // Filtrer les factures avec etat = "en attente" et associées à la machine
      return factures.filter(
        (facture) =>
         facture.machines.includes(machineId)
      );
    } catch (error) {
      console.error("Erreur lors de la récupération des factures :", error);
      return [];
    }
  };

  const handleRelease = async (machineId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/machines/${machineId}/liberer`
      );

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
    //     `http://localhost:5000/api/machines/${machineId}/liberer`
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
          <button onClick={handleAddButtonClick} className="btn-add">
            <FaPlus /> Ajouter Machine
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="table">
          <table>
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
                <tr
                  key={machine._id}
                  onClick={() => handleMachineClick(machine)}
                >
                  <td>
                    {machine.photo && (
                      <img
                        src={`http://localhost:5000/${machine.photo}`}
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
                  <td>
                  <button
                      data-tooltip-id="voir"
                      className="btn-voir"
                      onClick={(e) => {
                        e.stopPropagation();
                        voirFacture(machine._id);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      data-tooltip-id="modifier"
                      className="btn-edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditButtonClick(machine);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      data-tooltip-id="supprimer"
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(machine._id);
                      }}
                    >
                      <FaTrash />
                    </button>
                    <button
                      data-tooltip-id="detail"
                      className="btn-detail"
                      onClick={() => handleMachineClick(machine)}
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
                        Start
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <MachineDetails
        machine={selectedMachine}
        creatorName={creatorName} // Passer le nom du créateur
        onCloseDetails={handleCloseDetails}
        isVisible={isDetailsVisible}
      />
      <MachineModal
        show={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        machine={selectedMachine}
      />
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
      <Tooltip
        className="tooltip"
        id="supprimer"
        content="Supprimer"
        place="top"
      />
      <Tooltip className="tooltip" id="detail" content="detail" place="top" />
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

export default MachineList;
