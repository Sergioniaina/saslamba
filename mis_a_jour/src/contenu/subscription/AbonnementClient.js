import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AbonnementForm.css";
import {
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaPlus,
  FaTimes,
  FaCheck,
  FaSave,
} from "react-icons/fa";

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
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [caisses, setCaisses] = useState([]);
  const [selectedCaisse, setSelectedCaisse] = useState("");
  const [selectedPaymentType, setSelectedPaymentType] = useState("Espèce");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [newPaymentType, setNewPaymentType] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [idAbonnement, setIdAbonnement] = useState("");
  const fetchPaymentTypes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/payement");

      // Ajouter "Espèce" comme option par défaut s'il n'est pas déjà dans la liste
      const uniquePaymentTypes = Array.from(
        new Set(["Espèce", ...response.data.map((type) => type.type)])
      ).map((type) => ({
        type,
        _id: response.data.find((t) => t.type === type)?._id || null, // Gérer l'ID de "Espèce"
      }));

      setPaymentTypes(uniquePaymentTypes);
    } catch (error) {
      console.error("Erreur lors du chargement des types de paiement:", error);
    }
  };
  useEffect(() => {
    fetchPaymentTypes();
  }, []);
  // const handlePay = (facture) => {
  //   setSelectedAbonnement(facture);
  //   setShowPaymentModal(true);
  // };
  //Payment de la facture////
  const abonnememtTest = abonnements.find((abonnememt) => abonnememt._id === selectedAbonnement);
  const handlePaymentSubmit = async () => {
    const caisse = caisses.find((caisse) => caisse._id === selectedCaisse);
    const abonnememt = abonnements.find((abonnememt) => abonnememt._id === selectedAbonnement);
    const token = localStorage.getItem("token");
    try {
      const amountToPay = paymentAmount
        ? parseFloat(paymentAmount)
        : selectedAbonnement?.prix;
      console.log("le Prix de abonnement", abonnememt.prix);
      if (amountToPay > abonnememt.prix) {
        alert(
          "Le montant payé ne peut pas être supérieur au montant restant."
        );
        return;
      }

      const paymentTypeToSubmit =
        selectedPaymentType === "autre"
          ? newPaymentType
          : selectedPaymentType || "Espèce";
      console.log("payementType :", newPaymentType);
      console.log("voici l id de  :", idAbonnement);
      console.log("payementType submit :", paymentTypeToSubmit);
      console.log("caisseSelectionner  :", selectedCaisse);
      await axios.post(
        "http://localhost:5000/api/payement/abonnement",
        {
          type: paymentTypeToSubmit,
          abonnementClient: idAbonnement,
          montant: paymentAmount,
          caisse: selectedCaisse,
          // Uncomment if needed to associate payment with invoice
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Utiliser le token pour autorisation
            "Content-Type": "application/json", // Optionnel, définit le type de contenu
          },
        }
      );

      // Mettre à jour le solde de la caisse

      if (caisse) {
        if (!caisse.ouvert) {
          alert(
            "La caisse est fermée. Vous devez d'abord ouvrir cette caisse."
          );
          return;
        }
        await axios.put(
          `http://localhost:5000/api/caisses/${selectedCaisse}/add-solde`,
          {
            solde: amountToPay,
          }
        );
      }

      setShowPaymentModal(false);
      setSelectedCaisse("");
      alert("payment effectué avec succès")
      //setPaymentMode("");
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement:", error);
      alert("Une erreur est survenue lors de l'enregistrement du paiement.");
    }
  };

  const handlePaymentTypeChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentType(value);
    if (value !== "autre") {
      setNewPaymentType("");
    }
  };
  useEffect(() => {
    const fetchCaisses = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/caisses");
        setCaisses(response.data);
        if (response.data.length > 0) {
          setSelectedCaisse(response.data[0]._id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des caisses:", error);
      }
    };

    fetchCaisses();
  }, []);

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
    console.log("selectedAbonnement",selectedAbonnement)
    const abonnememt = abonnements.find((abonnememt) => abonnememt._id === selectedAbonnement);
    console.log("le prix de l abonnement ", abonnememt.prix)
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
        const response = await axios.post(
          "http://localhost:5000/api/abonnementClient/associer",
          requestData
        );
        console.log("abonnememt list", response.data);
        setIdAbonnement(response.data._id);
        console.log("id de l abonnememt", response.data._id);
        alert("Abonnement ajouté avec succès");
        setShowPaymentModal(true);
      }

      const response = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      );
      setAbonnementClients(response.data);

      setSearch("");
      setContact("");
      //setSelectedAbonnement(null);
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
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="client-client">
                  <div className="client1">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Nom du client"
                      onFocus={() => setShowClientList(true)} // Afficher la liste au focus
                      required
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
                        required
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
        <div className="details" onClick={() => setDetailedAbonnement(null)}>
          <div
            className="details-table-abonnement"
            onClick={(e) => e.stopPropagation()}
          >
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Type</th>
                  <th>Prix</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{detailedAbonnement.client.name}</td>
                  <td>{detailedAbonnement.client.contact}</td>
                  <td> {detailedAbonnement.abonnement.nom}</td>
                  <td> {detailedAbonnement.abonnement.prix} Ar</td>
                  <td>{detailedAbonnement.abonnement.features}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showPaymentModal && (
        <div className="modal-abonnement-client">
          <div className="modals-abonnement-client">
            <h2>Enregistrer le Paiement</h2>

            {/* Choix de la caisse */}
            <div className="input-group">
              <select
                value={selectedCaisse}
                onChange={(e) => setSelectedCaisse(e.target.value)}
                required
              >
                {caisses.map((caisse) => (
                  <option key={caisse._id} value={caisse._id}>
                    {caisse.nom}
                  </option>
                ))}
                <option value="">Sélectionner une caisse</option>
              </select>
              <label>Choisir une caisse :</label>
            </div>

            {/* Type de paiement */}
            <div className="input-group">
              <select
                value={selectedPaymentType || ""}
                onChange={handlePaymentTypeChange}
                required
              >
                <option value="">Sélectionnez un type de paiement</option>
                {paymentTypes.map((type) => (
                  <option key={type._id} value={type.type}>
                    {type.type}
                  </option>
                ))}
                <option value="autre">Autre</option>
              </select>
              <label>Type de paiement :</label>
            </div>

            {/* Nouveau type de paiement */}
            {selectedPaymentType === "autre" && (
              <div className="input-group">
                <input
                  type="text"
                  placeholder=" "
                  onChange={(e) => setNewPaymentType(e.target.value)}
                  value={newPaymentType}
                  required
                />
                <label>Nouveau type de paiement :</label>
              </div>
            )}

            {/* Montant à payer */}
            <div className="input-group">
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => {
                  // Convertir la valeur saisie en nombre
                  const newValue = Number(e.target.value);

                  // Si la valeur est un nombre valide et inférieure ou égale au montant restant
                  if (
                    !isNaN(newValue) &&
                    newValue <= abonnememtTest.prix
                  ) {
                    setPaymentAmount(newValue);
                  } else if (newValue > abonnememtTest.prix) {
                    // Si la valeur dépasse le maximum, on définit la valeur de l'input à max
                    setPaymentAmount(abonnememtTest.prix);
                  }
                }}
                min={0}
                max={abonnememtTest.prix} // Définir le maximum de l'input
                placeholder=""
                required
              />
              <label>{`Montant restant : ${abonnememtTest.prix} Ar`}</label>
            </div>

            {/* Actions du modal */}
            <div className="modal-actions">
              <button
                className="save"
                type="button"
                onClick={handlePaymentSubmit}
              >
                {" "}
                <FaSave />
                <span>enregistrer</span>
              </button>
              <button
                className="cancel"
                onClick={() => setShowPaymentModal(false)}
              >
                <FaTimes />
                <span>annuler</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AbonnementForm;
