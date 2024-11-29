import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
  FaMinus,
  FaUndo,
  FaLock,
  FaUnlock,
  FaEye,
  FaSave,
} from "react-icons/fa";
import "./Caisse.css";

const Caisse = () => {
  const [caisses, setCaisses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [caisseToEdit, setCaisseToEdit] = useState(null);
  const [formData, setFormData] = useState({ nom: "", type: "", solde: "" });
  const [editingSolde, setEditingSolde] = useState(null);
  const [newSolde, setNewSolde] = useState("");
  const [error, setError] = useState("");
  const [showClosedCaisses, setShowClosedCaisses] = useState(false); // Nouvel état pour afficher/masquer les caisses fermées

  useEffect(() => {
    fetchCaisses();
  }, []);

  const fetchCaisses = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/caisses");
      setCaisses(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des caisses", error);
    }
  };

  const handleAddCaisse = () => {
    setCaisseToEdit(null);
    setFormData({ nom: "", type: "", solde: "" });
    setShowModal(true);
  };

  const handleEditCaisse = (caisse) => {
    setCaisseToEdit(caisse);
    setFormData({ nom: caisse.nom, type: caisse.type, solde: caisse.solde });
    setShowModal(true);
  };

  const handleDeleteCaisse = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/caisses/${id}`);
      fetchCaisses();
    } catch (error) {
      console.error("Erreur lors de la suppression de la caisse", error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (caisseToEdit) {
        await axios.put(
          `http://localhost:5000/api/caisses/${caisseToEdit._id}`,
          formData
        );
      } else {
        await axios.post("http://localhost:5000/api/caisses", formData);
      }
      fetchCaisses();
      setShowModal(false);
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire", error);
    }
  };

  const handleAddSolde = async (caisse) => {
    const amount = parseFloat(newSolde);
    if (isNaN(amount) || amount <= 0) {
      setError("Veuillez entrer un montant valide.");
      return;
    }
    if (!caisse.ouvert) {
      // Vérifier si la caisse est fermée
      setError("La caisse est fermée. Vous devez d'abord ouvrir cette caisse.");
      return;
    }

    try {
      const updatedCaisse = { solde: amount, motif:"Ajout test Motif" };
      await axios.put(
        `http://localhost:5000/api/caisses/${caisse._id}/add-solde`,
        updatedCaisse
      );
      fetchCaisses();
      setNewSolde("");
      setEditingSolde(null);
      console.log("l ajout de :",amount)
      setError("");
    } catch (error) {
      console.error("Erreur lors de l'ajout de solde", error);
    }
  };

  const handleRemoveSolde = async (caisse) => {
    const amount = parseFloat(newSolde);
    if (isNaN(amount) || amount <= 0) {
      setError("Veuillez entrer un montant valide.");
      return;
    }

    if (amount > caisse.solde) {
      setError("Le montant à retirer est supérieur au solde actuel.");
      return;
    }
    if (!caisse.ouvert) {
      // Vérifier si la caisse est fermée
      setError("La caisse est fermée. Vous devez d'abord ouvrir cette caisse.");
      return;
    }

    try {
      const updatedCaisse = { solde: amount, motif: "retrait test" };
      await axios.put(
        `http://localhost:5000/api/caisses/${caisse._id}/remove-solde`,
        updatedCaisse
      );
      fetchCaisses();
      setNewSolde("");
      setEditingSolde(null);
      setError("");
    } catch (error) {
      console.error("Erreur lors du retrait de solde", error);
    }
  };

  const handleCloseCaisse = async (caisse) => {
    try {
      await axios.post(`http://localhost:5000/api/caisses/${caisse._id}/closes`);
      fetchCaisses();
    } catch (error) {
      console.error("Erreur lors de la fermeture de la caisse", error);
    }
  };

  const handleOpenCaisse = async (caisse) => {
    try {
      await axios.post(`http://localhost:5000/api/caisses/${caisse._id}/open`);
      fetchCaisses();
    } catch (error) {
      console.error("Erreur lors de l'ouverture de la caisse", error);
    }
  };

  const toggleShowClosedCaisses = () => {
    setShowClosedCaisses(!showClosedCaisses);
  };

  return (
    <div className="caisse-crud">
      <button className="btn-add" onClick={handleAddCaisse}>
        <FaPlus /> Ajouter une Caisse
      </button>
      <button className="btn-show-closed" onClick={toggleShowClosedCaisses}>
        <FaEye />{" "}
        {showClosedCaisses
          ? "Masquer les caisses fermées"
          : "Afficher les caisses fermées"}
      </button>
      {error && <div className="alert alert-error">{error}</div>}
      <table className="table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Solde</th>
            <th>Date d'ouverture</th>
            <th>Date de fermeture</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {caisses
            .filter((caisse) => showClosedCaisses || !caisse.dateFermeture) // Filtrer pour masquer/afficher les caisses fermées
            .map((caisse) => (
              <tr key={caisse._id}>
                <td>{caisse.nom}</td>
                <td>{caisse.type}</td>
                <td>
                  {editingSolde === caisse._id ? (
                    <div className="caisse-td">
                      <input
                        type="number"
                        value={newSolde}
                        onChange={(e) => setNewSolde(e.target.value)}
                        placeholder="Montant"
                      />
                      <button
                        className="btn-submit"
                        onClick={() => handleAddSolde(caisse)}
                      >
                        <FaCheck /> Valider
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingSolde(null)}
                      >
                        <FaUndo /> Annuler
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => handleRemoveSolde(caisse)}
                      >
                        <FaMinus /> Retirer
                      </button>
                    </div>
                  ) : (
                    <div className="solde">
                      {caisse.solde} Ar
                      <button
                        className="btn-edit-solde"
                        onClick={() => setEditingSolde(caisse._id)}
                      >
                        <FaPlus /> Modifier
                      </button>
                    </div>
                  )}
                </td>
                <td>{new Date(caisse.dateOuverture).toLocaleDateString()}</td>
                <td>
                  {caisse.dateFermeture
                    ? new Date(caisse.dateFermeture).toLocaleDateString()
                    : "Ouverte"}
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => handleEditCaisse(caisse)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteCaisse(caisse._id)}
                  >
                    <FaTrash />
                  </button>
                  {caisse.dateFermeture === null ? (
                    <button
                      className="btn-close"
                      onClick={() => handleCloseCaisse(caisse)}
                    >
                      <FaLock /> Fermer
                    </button>
                  ) : (
                    <button
                      className="btn-open"
                      onClick={() => handleOpenCaisse(caisse)}
                    >
                      <FaUnlock /> Ouvrir
                    </button>
                  )}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-caisse" onClick={() => setShowModal(false)}>
          <div className="modal-content-caisse" onClick={(e)=>e.stopPropagation()}>
            <span className="close" onClick={() => setShowModal(false)}>
              <FaTimes />
            </span>
            <h2>{caisseToEdit ? "Modifier Caisse" : "Ajouter Caisse"}</h2>
            <div className="input-wrapper">
              <input
                type="text"
                id="nom"
                placeholder=""
                value={formData.nom}
                onChange={(e) =>
                  setFormData({ ...formData, nom: e.target.value })
                }
                required
              />
              <label>Nom caisse</label>
            </div>
            <div className="input-wrapper">
              <input
                type="text"
                id="type"
                placeholder=""
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                required
              />
              <label>type caisse</label>
            </div>
            <div className="input-wrapper">
              <input
                type="number"
                id="solde"
                placeholder=""
                value={formData.solde}
                onChange={(e) =>
                  setFormData({ ...formData, solde: e.target.value })
                }
                required
              />
              <label>Caisse solde</label>
            </div>
            <div className="modal-button">
            <button className="btn-submit" onClick={handleSubmit}>
               
             {caisseToEdit ? <FaEdit/> :  <FaSave/>}
              {caisseToEdit ? "Modifier" : "Ajouter"}
            </button>
            <button className="btn-cancel" onClick={() => setShowModal(false)}>
              <FaTimes/>
              Annuler
            </button>
            </div>
           
          </div>
        </div>
      )}
    </div>
  );
};

export default Caisse;
