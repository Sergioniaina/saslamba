import React, { useState, useEffect } from "react";
import axios from "axios";

const SubscriptionModal = ({ show, onClose, onSave, subscription }) => {
  const [formData, setFormData] = useState({
    type: "",
    machines: "",
    weight: "",
    price: "",
    features: [],
    clientId: "",
    clientName: "",
    clientContact: "",
  });

  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [newClient, setNewClient] = useState(false);
  const PORT = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get(`${PORT}/api/clients`);
        setClients(response.data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();
  }, [PORT]);

  useEffect(() => {
    if (subscription) {
      setFormData({ ...subscription });
    } else {
      setFormData({
        type: "",
        machines: "",
        weight: "",
        price: "",
        features: [],
        clientId: "",
        clientName: "",
        clientContact: "",
      });
    }
  }, [subscription]);

  // Filtrer les clients en fonction du nom saisi
  useEffect(() => {
    const clientName = formData.clientName || ""; // Assurer que clientName est une chaîne vide si undefined
    if (clientName.trim()) {
      const results = clients.filter((client) =>
        client.name.toLowerCase().includes(clientName.toLowerCase())
      );
      setFilteredClients(results);
      setNewClient(results.length === 0); // Si aucun client trouvé, c'est un nouveau client
    } else {
      setFilteredClients([]);
      setNewClient(false);
    }
  }, [formData.clientName, clients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData({ ...formData, features: updatedFeatures });
  };

  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier si le client est nouveau
    if (newClient) {
      if (!formData.clientName || !formData.clientContact) {
        alert("Veuillez remplir les champs du nom et du contact du client.");
        return;
      }

      try {
        // Créer un nouveau client avant de sauvegarder l'abonnement
        const newClientResponse = await axios.post(
          `${PORT}/api/clients`,
          {
            name: formData.clientName,
            contact: formData.clientContact,
          }
        );

        const newClientId = newClientResponse.data._id;
        const updatedFormData = { ...formData, clientId: newClientId };
        onSave(updatedFormData); // Sauvegarder l'abonnement avec le nouvel ID client
      } catch (error) {
        console.error("Error creating client:", error);
      }
    } else {
      onSave(formData); // Si le client existe, on sauvegarde directement l'abonnement
    }
  };

  const handleSelectClient = (client) => {
    setFormData((prev) => ({
      ...prev,
      clientId: client._id,
      clientName: client.name,
      clientContact: client.contact,
    }));
    setNewClient(false); // Si on sélectionne un client, ce n'est pas un nouveau client
  };

  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>
          {subscription ? "Modifier un Abonnement" : "Ajouter un Abonnement"}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="type"
            placeholder="Type"
            value={formData.type}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="machines"
            placeholder="Nombre de Machines"
            value={formData.machines}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="weight"
            placeholder="Poids Total (kg)"
            value={formData.weight}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Prix (AR)"
            value={formData.price}
            onChange={handleChange}
            required
          />

          {/* Champ pour rechercher ou sélectionner un client */}
          <input
            type="text"
            name="clientName"
            placeholder="Nom du client"
            value={formData.clientName}
            onChange={handleChange}
            required
          />

          {filteredClients.length > 0 && (
            <ul className="client-list" style={{ color: "black" }}>
              {filteredClients.map((client) => (
                <li
                  key={client._id}
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <span
                    onClick={() => handleSelectClient(client)}
                    style={{ cursor: "pointer" }}
                  >
                    {client.name} ({client.contact})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectClient(client)}
                    style={{ marginLeft: "10px" }}
                  >
                    Sélectionner
                  </button>
                </li>
              ))}
            </ul>
          )}
          {newClient && (
            <>
              <p>Aucun client trouvé. Veuillez ajouter un nouveau client :</p>
              <input
                type="text"
                name="clientContact"
                placeholder="Contact du client"
                value={formData.clientContact}
                onChange={handleChange}
                required
              />
            </>
          )}

          <p>Fonctionnalités :</p>
          {formData.features.map((feature, index) => (
            <input
              key={index}
              type="text"
              value={feature}
              onChange={(e) => handleFeatureChange(index, e.target.value)}
            />
          ))}
          <button type="button" onClick={handleAddFeature}>
            Ajouter une fonctionnalité
          </button>

          <button type="submit">{subscription ? "Modifier" : "Ajouter"}</button>
          <button type="button" onClick={onClose}>
            Annuler
          </button>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionModal;
