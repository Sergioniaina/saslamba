import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/historiqueDepense.css";
import ModalConfirm from "../modal/ModalConfirm";
import { FaTrashAlt } from "react-icons/fa";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const GestionCaisse = () => {
  const [caisses, setCaisses] = useState([]);
  const [selectedCaisse, setSelectedCaisse] = useState("");
  const [solde, setSolde] = useState(0);
  const [motifs, setMotifs] = useState([]);
  const [selectedMotif, setSelectedMotif] = useState("");
  const [nouveauMotif, setNouveauMotif] = useState("");
  const [typeAction, setTypeAction] = useState("Ajout");
  const [historiqueCaisse, setHistoriqueCaisse] = useState([]);

  // Champs de recherche
  const [searchMotif, setSearchMotif] = useState("");
  const [filterType, setFilterType] = useState("");
  const [startDate, setStartDate] = useState(""); // Date de début
  const [endDate, setEndDate] = useState(""); // Date de fin
  
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const caisseResponse = await axios.get(
          "http://localhost:5000/api/caisses"
        );
        setCaisses(caisseResponse.data);

        const motifsResponse = await axios.get(
          "http://localhost:5000/api/historiques"
        );
        const distinctMotifs = [
          ...new Set(motifsResponse.data.map((item) => item.motif)),
        ];
        setMotifs(distinctMotifs);

        const historiqueResponse = await axios.get(
          "http://localhost:5000/api/historiques"
        );
        setHistoriqueCaisse(historiqueResponse.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données :", error);
      }
    };

    fetchData();
  }, []);
  const deleteEntry = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/historiques/${id}`);
      toast.success("Entrée supprimée avec succès.");
      // Mettre à jour l'état pour retirer l'entrée supprimée
      setHistoriqueCaisse((prevHistorique) =>
        prevHistorique.filter((entry) => entry._id !== id)
      );
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCaisse || (!selectedMotif && !nouveauMotif) || solde <= 0) {
      alert("Veuillez remplir tous les champs correctement.");
      return;
    }

    try {
      let motifFinal = selectedMotif;

      if (selectedMotif === "Autre" && nouveauMotif) {
        setMotifs((prevMotifs) => [...prevMotifs, nouveauMotif]);
        motifFinal = nouveauMotif;
      }

      const url =
        typeAction === "Ajout"
          ? `http://localhost:5000/api/caisses/${selectedCaisse}/add-solde`
          : `http://localhost:5000/api/caisses/${selectedCaisse}/remove-solde`;

      const response = await axios.put(url, {
        solde,
        motif: motifFinal,
      });

      alert(`${typeAction} effectué avec succès.`);
      const newHistorique = {
        caisse: selectedCaisse,
        montant: solde,
        motif: motifFinal,
        type: typeAction,
        date: new Date().toLocaleString(),
      };
      setHistoriqueCaisse((prevHistorique) => [
        ...prevHistorique,
        newHistorique,
      ]);
    } catch (error) {
      console.error(
        `Erreur lors du ${typeAction.toLowerCase()} du solde :`,
        error
      );
      alert("Une erreur est survenue. Veuillez réessayer.");
    }
  };

  // Filtrer l'historique selon la recherche
  const filteredHistorique = historiqueCaisse
  .filter((entry) => {
    const matchesMotif = entry.motif
      .toLowerCase()
      .includes(searchMotif.toLowerCase());
    const matchesType = filterType ? entry.type === filterType : true;

    const entryDate = new Date(entry.date);
    const isWithinDateRange =
      (!startDate || new Date(startDate) <= entryDate) &&
      (!endDate || new Date(endDate) >= entryDate);

    return matchesMotif && matchesType && isWithinDateRange;
  })
  .sort((a, b) => new Date(b.date) - new Date(a.date)); // 
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer cet facture?");
    setConfirmAction(() => () => deleteEntry(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  return (
    <div className="gestion-caisse">
      <form onSubmit={handleSubmit} className="form">
        {/* Sélection de la caisse */}
        <div className="form-group">
          <select
            id="caisse"
            value={selectedCaisse}
            onChange={(e) => setSelectedCaisse(e.target.value)}
            required
          >
            <option value="">-- Choisissez une caisse --</option>
            {caisses.map((caisse) => (
              <option key={caisse._id} value={caisse._id}>
                {caisse.nom} (Solde: {caisse.solde} Ar)
              </option>
            ))}
          </select>
          <label>Caisse</label>
        </div>

        {/* Sélection du motif */}
        <div className="form-group">
          <select
            id="motif"
            value={selectedMotif}
            onChange={(e) => setSelectedMotif(e.target.value)}
            required
          >
            <option value="">-- Choisissez un motif --</option>
            {motifs.map((motif, index) => (
              <option key={index} value={motif}>
                {motif}
              </option>
            ))}
            <option value="Autre">Autre</option>
          </select>
        </div>

        {selectedMotif === "Autre" && (
          <div className="form-group">
            <input
              type="text"
              id="nouveauMotif"
              value={nouveauMotif}
              onChange={(e) => setNouveauMotif(e.target.value)}
              required
            />
            <label htmlFor="nouveauMotif">Nouveau motif :</label>
          </div>
        )}

        {/* Montant du solde */}
        <div className="form-group">
          <input
            type="number"
            id="solde"
            value={solde}
            onChange={(e) => setSolde(Number(e.target.value))}
            required
          />
          <label htmlFor="solde">Montant :</label>
        </div>

        {/* Type d'action */}
        <div className="form-group">
          <select
            value={typeAction}
            onChange={(e) => setTypeAction(e.target.value)}
          >
            <option value="Ajout">Ajout</option>
            <option value="Retrait">Retrait</option>
          </select>
          <label>Action :</label>
        </div>

       
          <button type="submit">Valider</button>
      
      </form>

      {/* Recherche dans l'historique */}
      <div className="form">
        <div className="form-group">
          <input
            type="text"
            placeholder=""
            value={searchMotif}
            onChange={(e) => setSearchMotif(e.target.value)}
            required
          />
          <label>Rechercher par motif</label>
        </div>
        <div className="form-group">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">-- Filtrer par type --</option>
            <option value="Ajout">Recette</option>
            <option value="Retrait">Dépense</option>
          </select>
          <label>Type</label>
        </div>
        <div className="form-group">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Date debut</label>
        </div>
        <div className="form-group">
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <label>Date Fin</label>
        </div>
      </div>

      {/* Tableau des historiques filtrés */}
      <div className="historique-caisse">
        <table>
          <thead>
            <tr>
              <th>Montant</th>
              <th>Motif</th>
              <th>Type</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistorique.map((entry, index) => (
              <tr key={index}>
                <td>{entry.montant} Ar</td>
                <td>{entry.motif}</td>
                <td>{entry.type === "Ajout" ? "Recette" : "Dépense"}</td>
                <td>{entry.date}</td>
                <td>
                  <button style={{color:"red"}} onClick={() => confirmDelete(entry._id)}><FaTrashAlt/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default GestionCaisse;
