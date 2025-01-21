import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  faPlus,
  faTrash,
  faSave,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function ModalAbonnement({
  setModalOpen,
  abonnementActuel,
  setAbonnements,
  abonnements,
  fetchAbonnement,
}) {
  const [formData, setFormData] = useState({
    nom: abonnementActuel ? abonnementActuel.nom : "",
    machines: abonnementActuel ? abonnementActuel.machines : "",
    poids: abonnementActuel ? abonnementActuel.poids : "",
    prix: abonnementActuel ? abonnementActuel.prix : "",
    sechage: abonnementActuel ? abonnementActuel.sechage : "",
    features: abonnementActuel ? abonnementActuel.features : [],
  });

  // Gérer les changements dans les inputs
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Gérer les changements dans les fonctionnalités
  const handleFeatureChange = (index, value) => {
    const updatedFeatures = [...formData.features];
    updatedFeatures[index] = value;
    setFormData({ ...formData, features: updatedFeatures });
  };

  // Ajouter une nouvelle fonctionnalité
  const handleAddFeature = () => {
    setFormData({ ...formData, features: [...formData.features, ""] });
  };

  // Supprimer une fonctionnalité
  const handleRemoveFeature = (index) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: updatedFeatures });
  };

  // Soumettre le formulaire pour ajouter ou modifier un abonnement
  const handleSubmit = () => {
    if (abonnementActuel) {
      axios
        .put(
          `http://localhost:5000/api/abonnements/${abonnementActuel._id}`,
          formData
        )
        .then((response) => {
          const updatedAbonnements = abonnements.map((abonnement) =>
            abonnement._id === abonnementActuel._id ? response.data : abonnement
          );
          setAbonnements(updatedAbonnements);
          setModalOpen(false);
          fetchAbonnement();
        })
        .catch((error) =>
          console.error("Erreur lors de la modification:", error)
        );
      setModalOpen(false);
    } else {
      axios
        .post("http://localhost:5000/api/abonnements", formData)
        .then((response) => {
          setAbonnements([...abonnements, response.data]);
          setModalOpen(false);
          fetchAbonnement();
        })
        .catch((error) => console.error("Erreur lors de la création:", error));
      setModalOpen(false);
    }
  };

  useEffect(() => {
    if (abonnementActuel) {
      setFormData({
        nom: abonnementActuel.nom,
        machines: abonnementActuel.machines,
        poids: abonnementActuel.poids,
        prix: abonnementActuel.prix,
        sechage: abonnementActuel.sechage,
        features: abonnementActuel.features,
      });
    }
  }, [abonnementActuel]);

  return (
    <div className="modal">
      <div className="modal-content">
        <div className="entete">
          <h2>
            {abonnementActuel
              ? "Modifier l'abonnement"
              : "Ajouter un abonnement"}
          </h2>
        </div>

        <input
          type="text"
          name="nom"
          placeholder="nom"
          value={formData.nom}
          onChange={handleChange}
        />
        <input
          type="number"
          name="machines"
          placeholder="nombre machine"
          value={formData.machines}
          onChange={handleChange}
        />
        <input
          type="number"
          name="poids"
          placeholder="poids"
          value={formData.poids}
          onChange={handleChange}
        />
        <input
          type="number"
          name="prix"
          placeholder="prix"
          value={formData.prix}
          onChange={handleChange}
        />
         <input
          type="number"
          name="sechage"
          placeholder="sechage"
          value={formData.sechage}
          onChange={handleChange}
        />
        {formData.features.map((feature, index) => (
          <div key={index} className="feature-input">
            <input
              type="text"
              value={feature}
              placeholder="fonctionnalités"
              onChange={(e) => handleFeatureChange(index, e.target.value)}
            />
            <button
              type="button"
              onClick={() => handleRemoveFeature(index)}
              className="icon-button delete"
            >
              <FontAwesomeIcon className="icon" icon={faTrash}/>{" "}
              Supprimer
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddFeature}
          className="icon-button fonctionnalite"
        >
          <FontAwesomeIcon className="icon" icon={faPlus}  />
          fonctionnalité
        </button>

        <button onClick={handleSubmit} className="icon-button save">
          <FontAwesomeIcon className="icon" icon={faSave}  />{" "}
          {abonnementActuel ? "Modifier" : "Ajouter"}
        </button>

        <button onClick={() => setModalOpen(false)} className="icon-button annuler">
          <FontAwesomeIcon className="icon" icon={faTimes}  /> Annuler
        </button>
      </div>
    </div>
  );
}

export default ModalAbonnement;
