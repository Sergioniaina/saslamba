import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./App.css";
import "../css/facturelist.css";
import { Tooltip } from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import {
  faEye,
  faEdit,
  faTrash,
  faMoneyBillWave,
  faClock,
  faCalendarAlt,
  faBan,
} from "@fortawesome/free-solid-svg-icons";
import { FaSave, FaSearch, FaTimes } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";
import Facture from "./Facture";
const FactureList = ({ onEdit, etatFilter,setCurrentView,setCurrent }) => {
  const [factures, setFactures] = useState([]);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("tous");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [selectedFactures, setSelectedFactures] = useState(null);
  const [caisses, setCaisses] = useState([]);
  const [selectedCaisse, setSelectedCaisse] = useState("");
  const location = useLocation();
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  // const [paymentMode, setPaymentMode] = useState("");
  const [showFacture, setShowFacture] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState("Espèce");
  const [newPaymentType, setNewPaymentType] = useState("");
  const [userPrivileges, setUserPrivileges] = useState(null);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line
  const [user, setUser] = useState("");
  const factureRefs = useRef({});
  // Obtenir l'ID depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const highlightedId = searchParams.get("id");

  useEffect(() => {
    // Vous devrez remplacer ce fetch par une logique qui récupère les factures avec les machines associées
    const fetchFactures = async () => {
      const res = await fetch('http://localhost:5000/api/factures'); // Remplacer par l'URL de votre API pour récupérer les factures
      const facturesData = await res.json();
    
      const updatedFactures = await Promise.all(facturesData.map(async (facture) => {
        if (facture.etat === "en attente") {
          // Récupérer les machines associées à la facture en attente
          const machinesRes = await fetch(`http://localhost:5000/api/machines/factures-machines?factureId=${facture._id}`);
          const machinesData = await machinesRes.json();
    
          // Vérifier si toutes les machines associées sont disponibles
          const allAvailable = machinesData.every((machine) => machine.etat === "Disponible");
    
          return {
            ...facture,
            allMachinesAvailable: allAvailable, // Déterminer si la facture doit clignoter
          };
        }
        return facture; // Si la facture n'est pas "en attente", retournez la facture telle quelle
      }));
    
      const sortedFactures = updatedFactures.sort(
        (a, b) => new Date(b.dateFacture) - new Date(a.dateFacture) // Trier par date décroissante
      );

      setFactures(sortedFactures); 
    };
  
      fetchFactures();
  }, []);
  
  const PORT = "http://localhost:5000/api";
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
    // Lire les paramètres de l'URL
    const params = new URLSearchParams(location.search);
    const view = params.get("view");

    if (view) {
      setCurrentView(view);
      setCurrent("factures") // Appelle la fonction passée depuis FactureForm
    }
  }, [location, setCurrentView,setCurrent]);
  useEffect(() => {
    fetchPaymentTypes();
  }, []);
  useEffect(() => {
    if (highlightedId && factureRefs.current[highlightedId]) {
      factureRefs.current[highlightedId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedId, factures]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUser(user);
    if (user) {
      // Récupérer les privilèges de l'utilisateur via l'API
      axios
        .get("http://localhost:5000/api/privileges", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((response) => {
         // console.log("Réponse de l'API :", response.data);
          // Cherchez les privilèges pour le role et subRole de l'utilisateur
          const userRole = user.role;
          const userSubrole = user.subRole;

          // Trouvez les privilèges de l'utilisateur
          const privileges = response.data.find(
            (item) => item.role === userRole && item.subRole === userSubrole
          )?.permissions;

          if (privileges) {
           // console.log("Privilèges de l'utilisateur :", privileges);
            setUserPrivileges(privileges);
          } else {
           // console.log("Aucun privilège trouvé pour ce rôle et sous-rôle");
            setUserPrivileges([]); // Si aucun privilège n'est trouvé
          }
        })
        .catch((error) => {
          console.error(
            "Erreur lors de la récupération des privilèges :",
            error
          );
        });
    }
  }, []);
  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const response = await axios.get(`${PORT}/factures`);
  
        // Trier les factures par ordre décroissant selon la date ou un autre critère
        const sortedFactures = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
  
        setFactures(sortedFactures);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des factures:", error);
        setError("Une erreur est survenue lors du chargement des factures.");
      }
    };
  
    fetchFactures();
  }, []);
  
  const fetchFactureDetails = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/factures/listPar/${id}`
      );
      setSelectedFactures(response.data);
     // console.log("Le facture:", response.data); // Affiche correctement les détails de la facture
      setShowFacture(true);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des détails de la facture:",
        err
      );
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
        setError("Une erreur est survenue lors du chargement des caisses.");
      }
    };

    fetchCaisses();
  }, []);

  useEffect(() => {
    if (factures.length > 0) {
      const dates = factures.map((item) => new Date(item.createdAt));
      const earliestDate = new Date(Math.min(...dates));
      const latestDate = new Date(Math.max(...dates));

      earliestDate.setDate(earliestDate.getDate() - 1);
      latestDate.setDate(latestDate.getDate() + 1);

      setStartDate(earliestDate.toISOString().split("T")[0]);
      setEndDate(latestDate.toISOString().split("T")[0]);
    }
  }, [factures]);

  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer cet facture?");
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmVisible(true);
  };
  const confirmAnnuler = (id) => {
    setConfirmMessage("Voulez-vous Annulée cette facture?");
    setConfirmAction(() => () => handleCancel(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  const handleDelete = async (id) => {
    try {
      // Supprimer la facture en utilisant axios
      await axios.delete(`http://localhost:5000/api/factures/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      // Mise à jour de l'état des factures
      setFactures(factures.filter((facture) => facture._id !== id));

      // Notification de succès
      toast.success("La facture a été supprimée avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression de la facture:", error);

      // Notification d'erreur
      toast.error(
        "Une erreur est survenue lors de la suppression de la facture."
      );
    }
  };

  const handleCancel = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(
        `http://localhost:5000/api/factures/cancel/${id}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Mettre à jour l'état des factures en mémoire
      setFactures(
        factures.map((facture) =>
          facture._id === id ? { ...facture, etat: "annulée" } : facture
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'annulation de la facture:", error);
      setError("Une erreur est survenue lors de l'annulation de la facture.");
    }
  };

  const handlePay = (facture) => {
    setSelectedFacture(facture);
    setShowPaymentModal(true);
  };
  const handlePaymentTypeChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentType(value);
    if (value !== "autre") {
      setNewPaymentType("");
    }
  };

  const handlePaymentSubmit = async () => {
    const caisse = caisses.find((caisse) => caisse._id === selectedCaisse);
    const token = localStorage.getItem("token");
    try {
      const amountToPay = paymentAmount
        ? parseFloat(paymentAmount)
        : selectedFacture.reste;

      if (amountToPay > selectedFacture.reste) {
        setError(
          "Le montant payé ne peut pas être supérieur au montant restant."
        );
        return;
      }

      const paymentTypeToSubmit =
        selectedPaymentType === "autre"
          ? newPaymentType
          : selectedPaymentType || "Espèce";
      console.log("payementType :", newPaymentType);

      await axios.post(
        "http://localhost:5000/api/payement",
        {
          type: paymentTypeToSubmit,
          facture: selectedFacture._id,
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

      // Calculer le nouveau montant restant
      const newReste = selectedFacture.reste - amountToPay;

      // Mettre à jour uniquement le champ `reste` de la facture
      await axios.patch(
        `http://localhost:5000/api/factures/${selectedFacture._id}/reste`, // Utiliser la nouvelle route PATCH
        { reste: newReste } // Envoyer uniquement le champ `reste`
      );

      if (newReste === 0) {
        await axios.put(
          `http://localhost:5000/api/factures/${selectedFacture._id}/etat`,
          { estPaye: true }
        );
      }

      // Mettre à jour le solde de la caisse

      if (caisse) {
        if (!caisse.ouvert) {
          setError(
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
      setSelectedFacture(null);
      setSelectedCaisse("");
      //setPaymentMode("");
      setFactures(
        factures.map((facture) =>
          facture._id === selectedFacture._id
            ? { ...facture, reste: newReste, estPaye: newReste === 0 } // Mettez à jour l'état de la facture en mémoire
            : facture
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement:", error);
      setError("Une erreur est survenue lors de l'enregistrement du paiement.");
    }
  };

  const handleSearch = () => {
    let filteredFactures = factures;

  // Filtrage par nom de client
  if (searchTerm) {
    filteredFactures = filteredFactures.filter((facture) =>
      facture.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Filtrage par état de la facture
  if (etatFilter && Array.isArray(etatFilter)) {
    filteredFactures = filteredFactures.filter((facture) =>
      etatFilter.some((filter) =>
        facture.etat && facture.etat.toLowerCase() === filter.toLowerCase()
      )
    );
  } else if (etatFilter) {
    // Si etatFilter n'est pas un tableau (c'est une seule valeur)
    filteredFactures = filteredFactures.filter(
      (facture) =>
        facture.etat && facture.etat.toLowerCase() === etatFilter.toLowerCase()
    );
  }

    // Filtrage par état de paiement
    if (paymentFilter !== "tous") {
      if (paymentFilter === "payee") {
        filteredFactures = filteredFactures.filter(
          (facture) => facture.estPaye === true && facture.etat !== "annulée"
        );
      } else if (paymentFilter === "nonpayee") {
        filteredFactures = filteredFactures.filter(
          (facture) => facture.estPaye === false && facture.etat !== "annulée"
        );
      } else if (paymentFilter === "annulee") {
        filteredFactures = filteredFactures.filter(
          (facture) => facture.etat === "annulée"
        );
      }
    }

    // Filtrage par plage de dates
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      filteredFactures = filteredFactures.filter((facture) => {
        const factureDate = new Date(facture.createdAt);
        return factureDate >= start && factureDate <= end;
      });
    }

    filteredFactures = filteredFactures.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  
    return filteredFactures;
  };
  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="facturelist">
      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-container">
        <div className="input">
          <input
            type="text"
            placeholder="Rechercher par nom du client"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="icon" />
        </div>

        <div className="date-filter">
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="date-filter">
          <FontAwesomeIcon className="icon" icon={faCalendarAlt} />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div className="payment-filter">
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="tous">Tous</option>
            <option value="payee">Payée</option>
            <option value="nonpayee">Non Payée</option>
            <option value="annulee">Annulée</option> {/* Nouvelle option */}
          </select>
        </div>
      </div>
      <div className="facture-t">
        <table className="facture-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Total</th>
              <th>Reste</th>
              <th>Date</th>
              <th>État</th>
              <th className="action act">Actions</th>
            </tr>
          </thead>
          <tbody>
            {handleSearch().map((facture) => (
              <tr
                key={facture._id}
                ref={(el) => (factureRefs.current[facture._id] = el)} // Associer une référence à chaque ligne
                className={`${facture._id === highlightedId ? "highlighted" : ""} ${facture.allMachinesAvailable ? "clignote" : ""}`}
              >
                <td>{facture.customerName}</td>
                <td>{facture.totalPrice} Ar</td>
                <td>{facture.reste}</td>
                <td>{new Date(facture.createdAt).toLocaleDateString()}</td>
                {facture.etat !== "annulée" ? (
                  <td>{facture.estPaye ? "Payée" : "Non Payée"}</td>
                ) : (
                  <td>Annulée</td>
                )}

                {/* <td>
                <ul>
                  {facture.historique.map((entry, index) => (
                    <li key={index}>
                      {entry.action} -{" "}
                      {new Date(entry.date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </td> */}
                <td className="action">
                  <button
                    type="button"
                    onClick={() => fetchFactureDetails(facture._id)}
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  {facture.etat !== "annulée" && (
                    <>
                      {/* <button
                        data-tooltip-id="menu-eye"
                        type="button"
                        onClick={() => onViewDetails(facture)}
                        style={{ color: "#007bff" }}
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button> */}

                      <button
                        data-tooltip-id={`${
                          facture.etat === "en attente"
                            ? "encaisser"
                            : "modifier"
                        }`}
                        type="button"
                        onClick={() => onEdit(facture)}
                        style={{ color: "#28a745" }}
                      >
                        <FontAwesomeIcon
                          icon={
                            facture.etat === "en attente" ? faClock : faEdit
                          }
                        />
                      </button>

                      {facture.reste > 0 && (
                        <button
                          data-tooltip-id="payer"
                          type="button"
                          onClick={() => handlePay(facture)}
                          style={{ color: "orange" }}
                          // style={{
                          //   color: "#ff5733",
                          //   opacity: facture.reste === 0  ? 0 : 1, // Opacité à 0 si annulée
                          //   pointerEvents: facture.reste === 0 ? "none" : "auto" // Désactive les clics
                          // }}
                          // disabled={facture.reste === 0} // Si annulée, le bouton est désactivé
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                        </button>
                      )}
                    </>
                  )}
                  {userPrivileges?.invoices?.includes("delete") && (
                    <button
                      data-tooltip-id="delete"
                      type="button"
                      onClick={() => confirmDelete(facture._id)}
                      style={{ color: "#dc3545" }}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                  {facture.etat !== "annulée" && (
                    <button
                      data-tooltip-id="annuler"
                      type="button"
                      onClick={() => confirmAnnuler(facture._id)}
                      style={{ color: "#ff5733" }}
                      disabled={facture.etat === "annulée"}
                    >
                      <FontAwesomeIcon icon={faBan} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="total" colSpan="6">
                <strong>
                  <div className="div">
                    <span>total :</span>
                    <span className="reste">
                      {handleSearch()
                        .reduce((acc, facture) => acc + facture.totalPrice, 0)
                        .toLocaleString()}{" "}
                      Ar
                    </span>
                  </div>
                  <div className="div">
                    <span>Reste :</span>
                    <span className="reste">
                      {handleSearch()
                        .reduce((acc, facture) => acc + facture.reste, 0)
                        .toLocaleString()}{" "}
                      Ar
                    </span>
                  </div>
                </strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {/* Modal de paiement */}
      {showPaymentModal && (
        <div className="modalf">
          <div className="modals">
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
                  if (!isNaN(newValue) && newValue <= selectedFacture?.reste) {
                    setPaymentAmount(newValue);
                  } else if (newValue > selectedFacture?.reste) {
                    // Si la valeur dépasse le maximum, on définit la valeur de l'input à max
                    setPaymentAmount(selectedFacture?.reste);
                  }
                }}
                min={0}
                max={selectedFacture?.reste} // Définir le maximum de l'input
                placeholder=""
                required
              />
              <label>{`Montant restant : ${selectedFacture?.reste} Ar`}</label>
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
      {showFacture && (
        <Facture
          selectedFacture={selectedFactures}
          onCancel={() => setShowFacture(false)} // Passer une fonction pour fermer la modale
        />
      )}
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
      <Tooltip className="tooltip" id="menu-eye" content="Voir" place="top" />
      <Tooltip
        className="tooltip"
        id="encaisser"
        content="encaisser"
        place="top"
      />
      <Tooltip
        className="tooltip"
        id="modifier"
        content="modifier"
        place="top"
      />
      <Tooltip className="tooltip" id="payer" content="Payer" place="top" />
      <Tooltip
        className="tooltip"
        id="delete"
        content="Supprimer"
        place="top"
      />
      <Tooltip className="tooltip" id="annuler" content="Annulée" place="top" />
      <ToastContainer />
    </div>
  );
};

export default FactureList;
