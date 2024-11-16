import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AbonnementForm.css";
import { FaEdit, FaTrash, FaInfoCircle, FaPlus, FaTimes, FaCheck } from "react-icons/fa";

function AbonnementForm() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [abonnements, setAbonnements] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [contact, setContact] = useState("");
  const [selectedAbonnement, setSelectedAbonnement] = useState(null);
  const [abonnementClients, setAbonnementClients] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentAbonnementClient, setCurrentAbonnementClient] = useState(null);
  const [detailedAbonnement, setDetailedAbonnement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/clients");
        setClients(response.data);
        setFilteredClients(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
      }
    };

    const fetchAbonnements = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/abonnements"
        );
        setAbonnements(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des abonnements:", error);
      }
    };

    fetchClients();
    fetchAbonnements();
  }, []);

  useEffect(() => {
    const results = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(search.toLowerCase()) ||
        client.contact.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredClients(results);
  }, [search, clients]);

  useEffect(() => {
    const fetchAbonnementClients = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/abonnementClient"
        );
        setAbonnementClients(response.data);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des abonnements clients:",
          error
        );
      }
    };

    fetchAbonnementClients();
  }, []);
  const filteredAbonnementClients = abonnementClients.filter(
    (abonnementClient) => {
      const client = clients.find(
        (client) => client._id === abonnementClient.idClient
      );
      return client?.name.toLowerCase().includes(clientSearch.toLowerCase());
    }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requestData = {
      name: selectedClient ? selectedClient.name : search,
      contact,
      idAbonnement: selectedAbonnement,
    };

    try {
      if (editMode) {
        await axios.put(
          `http://localhost:5000/api/abonnementClient/${currentAbonnementClient._id}`,
          {
            idClient:
              selectedClient?._id ||
              (
                await axios.post("http://localhost:5000/api/clients", {
                  name: search,
                  contact,
                })
              ).data._id,
            idAbonnement: selectedAbonnement,
          }
        );
        alert("Abonnement mis à jour avec succès");
      } else {
        await axios.post(
          "http://localhost:5000/api/abonnementClient/associer",
          requestData
        );
        alert("Abonnement ajouté avec succès");
      }

      const response = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      );
      setAbonnementClients(response.data);

      setSearch("");
      setContact("");
      setSelectedAbonnement(null);
      setSelectedClient(null);
      setEditMode(false);
      setCurrentAbonnementClient(null);
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout ou de la mise à jour de l'abonnement client:",
        error
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/abonnementClient/${id}`);
      alert("Abonnement supprimé avec succès");

      const response = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      );
      setAbonnementClients(response.data);
    } catch (error) {
      console.error(
        "Erreur lors de la suppression de l'abonnement client:",
        error
      );
    }
  };

  const handleEdit = (abonnementClient) => {
    setShowModal(true);
    setSelectedClient(
      clients.find((client) => client._id === abonnementClient.idClient)
    );
    setSelectedAbonnement(abonnementClient.idAbonnement);
    setCurrentAbonnementClient(abonnementClient);
    setEditMode(true);
  };

  const handleCancel = () => {
    setSearch("");
    setContact("");
    setSelectedAbonnement(null);
    setSelectedClient(null);
    setEditMode(false);
    setCurrentAbonnementClient(null);
    setShowModal(false);
  };

  const handleDetail = async (abonnementClient) => {
    try {
      const clientResponse = await axios.get(
        `http://localhost:5000/api/clients/${abonnementClient.idClient}`
      );
      const abonnementResponse = await axios.get(
        `http://localhost:5000/api/abonnements/${abonnementClient.idAbonnement}`
      );
      setDetailedAbonnement({
        client: clientResponse.data,
        abonnement: abonnementResponse.data,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
    }
  };

  return (
    <div className="abonnement-form">
      <div className="abonnement-add">
        <button className="add-btn" onClick={() => setShowModal(true)}>
          <FaPlus className="icon" /> Ajouter Abonnement
        </button>
        <input
          type="text"
          value={clientSearch}
          onChange={(e) => setClientSearch(e.target.value)}
          placeholder="Rechercher par nom de client"
          className="search-input"
        />
      </div>
      <div className="client">
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <FaTimes
                onClick={() => setShowModal(false)}
                className="close-modal"
              />

              <form onSubmit={handleSubmit}>
                <div className="client-client">
                  <div className="client1">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nom du client"
                      onFocus={() => setShowClientList(true)} // Afficher la liste au focus
                      onBlur={() =>
                        setTimeout(() => setShowClientList(false), 200)
                      } // Masquer la liste après un délai
                    />

                    {filteredClients.length === 0 && (
                      <input
                        type="text"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        placeholder="Entrez le contact"
                      />
                    )}
                    <button
                      type="submit"
                      className={`submit-btn ${
                        editMode ? "update-btn" : "add-btn"
                      }`}
                    >
                      {editMode ? <FaEdit /> : <FaPlus />}

                      {editMode ? "Mettre à jour" : "Ajouter"}
                    </button>

                    {editMode && (
                      <button className="cancel-btn" onClick={handleCancel}>
                        <FaTimes className="icon" /> Annuler
                      </button>
                    )}
                  </div>
                  {showClientList && filteredClients.length > 0 && (
                    <div
                      className={`client-list ${
                        filteredClients.length === 0 ? "no-border" : ""
                      }`}
                    >
                      {filteredClients.map((client) => (
                        <div
                          className="client"
                          key={client._id}
                          onClick={() => {
                            setSearch(client.name); // Remplir l'input avec le nom sélectionné
                            setShowClientList(false); // Masquer la liste après sélection
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          <span>{client.name}</span>
                          <span> {client.contact}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ab-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Prix</th>
                        <th>Caractéristiques</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abonnements.map((abonnement) => (
                        <tr
                          key={abonnement._id}
                          onClick={() => setSelectedAbonnement(abonnement._id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td
                            className={
                              selectedAbonnement === abonnement._id
                                ? "selected"
                                : ""
                            }
                          >
                            {abonnement.nom}
                          </td>
                          <td
                            className={
                              selectedAbonnement === abonnement._id
                                ? "selected"
                                : ""
                            }
                          >
                            {abonnement.prix} Ar
                          </td>
                          <td
                            className={
                              selectedAbonnement === abonnement._id
                                ? "selected"
                                : ""
                            }
                          >
                            {abonnement.features}
                          </td>
                          <td>
                            <button
                              className="select-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // Pour éviter de déclencher le onClick de la ligne
                                setSelectedAbonnement(abonnement._id);
                              }}
                            >
                              <FaCheck className="icon" /> Sélectionner
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <div className="abonnement-tables">
        <table className="abonnement-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>contact</th>
              <th>Abonnement</th>
              <th>Prix</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAbonnementClients.map((abonnementClient) => {
              const client = clients.find(
                (client) => client._id === abonnementClient.idClient
              );
              const abonnement = abonnements.find(
                (abonnement) => abonnement._id === abonnementClient.idAbonnement
              );

              return (
                <tr key={abonnementClient._id}>
                  <td>{client?.name}</td>
                  <td>{client?.contact}</td>
                  <td>{abonnement?.nom}</td>
                  <td>{abonnement?.prix}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(abonnementClient)}
                    >
                      <FaEdit className="icon" /> Modifier
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(abonnementClient._id)}
                    >
                      <FaTrash className="icon" /> Supprimer
                    </button>

                    <button
                      className="details-btn"
                      onClick={() => handleDetail(abonnementClient)}
                    >
                      <FaInfoCircle className="icon" /> Détails
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {detailedAbonnement && (
        <div className="details">
          <button
            className="close-btn"
            onClick={() => setDetailedAbonnement(null)}
          >
            <i className="fa fa-times-circle"></i>
          </button>
          <h3>Détails de l'Abonnement</h3>
          <p>
            <strong>Client:</strong> {detailedAbonnement.client.name}
          </p>
          <p>
            <strong>Contact:</strong> {detailedAbonnement.client.contact}
          </p>
          <p>
            <strong>Abonnement:</strong> {detailedAbonnement.abonnement.nom}
          </p>
          <p>
            <strong>Prix:</strong> {detailedAbonnement.abonnement.prix} Ar
          </p>
          <p>
            <strong>Features:</strong> {detailedAbonnement.abonnement.features}
          </p>
        </div>
      )}
    </div>
  );
}

export default AbonnementForm;
