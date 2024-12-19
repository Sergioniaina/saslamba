import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AbonnementForm.css";
import printJS from "print-js";
import {
  FaEdit,
  FaTrash,
  FaInfoCircle,
  FaPlus,
  FaTimes,
  FaCheck,
  FaSave,
  FaRedoAlt,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ModalConfirm from "../modal/ModalConfirm";
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
  const [lavageReste, setLavageReste] = useState("");
  const [sechageReste, setSechageReste] = useState("");
  const [weight, setWeight] = useState("");
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const [prixPay, setPrixPay] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    totalPrice: "",
    reste: "",
    nom: "",
    prix: "",
  });

  useEffect(() => {
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, []);
  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${PORT}/api/company-info/list`);
      setCompanyInfo(response.data[0]); // Assuming the first entry is the company info
    } catch (error) {
      console.error("Error loading company information:", error);
    }
  };

  const [latestFacture, setLatestFacture] = useState(null);
  const fetchLatestFacture = async () => {
    try {
      const response = await axios.get(
        `${PORT}/api/factureAbonnement/last-ticket`
      );
      setLatestFacture(response.data);
      console.log("ticket:", response.data.numeroFacture);
    } catch (error) {
      console.error("Erreur lors de la récupération du dernier ticket", error);
    }
  };
  useEffect(() => {
    fetchLatestFacture();
    //   clickButton();
    // eslint-disable-next-line
  }, []);
  const printContentAsPDF = () => {
    printJS({
      printable: "printable-area", // ID de l'élément à imprimer
      type: "html", // Type de contenu à imprimer
      documentTitle: "Facture", // Titre du document
      targetStyles: ["*"], // Imprime tous les styles associés à l'élément
    });
  };
  const facturesPrint = () => {
    const printableArea = document.getElementById("printable-area");
    if (printableArea) {
      console.log("L'élément à imprimer est prêt.");
      printContentAsPDF();
    } else {
      console.error("L'élément à imprimer n'a pas été trouvé.");
    }
  };
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

  const handlePaymentSubmit = async () => {
    const caisse = caisses.find((caisse) => caisse._id === selectedCaisse);
    const abonnement = abonnements.find(
      (abonnement) => abonnement._id === selectedAbonnement
    );

    const token = localStorage.getItem("token");
    const amountToPay = paymentAmount
      ? parseFloat(paymentAmount)
      : abonnement?.prix || 0;

    console.log("Payload à envoyer :", {
      type:
        selectedPaymentType === "autre"
          ? newPaymentType
          : selectedPaymentType || "Espèce",
      abonnementClient: idAbonnement,
      montant: amountToPay,
      caisse: selectedCaisse,
    });

    if (!idAbonnement || !selectedCaisse || amountToPay <= 0) {
      alert("Certains champs obligatoires sont manquants ou invalides.");
      return;
    }

    try {
      if (amountToPay > abonnement.prix) {
        alert("Le montant payé ne peut pas être supérieur au montant restant.");
        return;
      }

      if (caisse && !caisse.ouvert) {
        alert("La caisse est fermée. Vous devez d'abord ouvrir cette caisse.");
        return;
      }

      const paymentTypeToSubmit =
        selectedPaymentType === "autre"
          ? newPaymentType
          : selectedPaymentType || "Espèce";

      // Envoi du paiement
      await axios.post(
        "http://localhost:5000/api/payement/abonnement",
        {
          type: paymentTypeToSubmit,
          abonnementClient: idAbonnement,
          montant: amountToPay,
          caisse: selectedCaisse,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Mise à jour de la caisse
      if (caisse) {
        await axios.put(
          `http://localhost:5000/api/caisses/${selectedCaisse}/add-solde`,
          { solde: amountToPay }
        );
      }

      try {
        // Récupérer le client localement via .find
        const abonnementClient = abonnementClients.find(
          (abonnementClient) => abonnementClient._id === idAbonnement
        );

        if (!abonnementClient || !abonnementClient.idClient) {
          alert("Impossible de récupérer les informations du client.");
          return;
        }

        // Création de la facture
        const response = await axios.post(
          "http://localhost:5000/api/factureAbonnement",
          {
            idClient: abonnementClient.idClient, // Récupéré via .find
            idAbonnementClient: abonnementClient._id,
            montant: abonnement.prix, // Montant total
            montantDonnee: amountToPay, // Montant payé
          }
          // {
          //   headers: {
          //     Authorization: `Bearer ${token}`,
          //     "Content-Type": "application/json",
          //   },
          // }
        );

        console.log("Facture enregistrée :", response.data);
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de la facture :", error);
        alert("Une erreur est survenue lors de la création de la facture.");
        return; // Arrêter ici si la facture échoue
      }

      alert("Paiement effectué avec succès");
      setShowPaymentModal(false);
      setSelectedCaisse("");
      const printableArea = document.getElementById("printable-area");
      if (printableArea) {
        console.log("L'élément à imprimer est prêt.");
        printContentAsPDF(); // Appel à l'impression
      } else {
        console.error("L'élément à imprimer n'a pas été trouvé.");
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du paiement :", error);

      // Affichez une erreur plus descriptive si possible
      if (error.response?.data?.message) {
        alert(`Erreur : ${error.response.data.message}`);
      } else {
        alert("Une erreur est survenue lors de l'enregistrement du paiement.");
      }
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
        const sortedAbonnement = response.data.sort(
          (a, b) => new Date(b.dateAbonnement) - new Date(a.dateAbonnement)
        );
        setAbonnementClients(sortedAbonnement);
      } catch (error) {
        console.error(
          "Erreur lors du chargement des abonnements clients:",
          error
        );
      }
    };

    fetchAbonnementClients();
  }, []);
  const fetchAbonnementClients = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      );
      const sortedAbonnement = response.data.sort(
        (a, b) => new Date(b.dateAbonnement) - new Date(a.dateAbonnement)
      );
      setAbonnementClients(sortedAbonnement);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des abonnements clients:",
        error
      );
    }
  };

  const filteredAbonnementClients = abonnementClients.filter(
    (abonnementClient) => {
      const client = clients.find(
        (client) => client._id === abonnementClient.idClient
      );
      return client?.name.toLowerCase().includes(clientSearch.toLowerCase());
    }
  );
  const confirmHandleSubmitAjour = (e) => {
    e.preventDefault();
    // Définir le message en fonction du mode
    const message = editMode
      ? "Voulez-vous modifier l'abonnement ?"
      : "Voulez-vous sauvegarder l'abonnement ?";

    setConfirmMessage(message);

    // Définir l'action asynchrone à exécuter après confirmation
    setConfirmAction(() => async () => {
      await handleSubmit(); // Appel de la soumission
    });

    setIsConfirmVisible(true); // Affiche la boîte de confirmation
  };
  const handleSubmit = async () => {
    try {
      const requestData = {
        name: selectedClient ? selectedClient.name : search,
        contact,
        idAbonnement: selectedAbonnement,
      };

      const abonnement = abonnements.find(
        (abonnement) => abonnement._id === selectedAbonnement
      );

      setPrixPay(abonnement?.prix || 0); // Protéger contre undefined
      console.log("Prix de l'abonnement :", abonnement?.prix);
      console.log("Prix de l'abonnement :", prixPay);

      let abonnementId;

      if (editMode) {
        // Mode édition
        let clientId = selectedClient?._id;

        // Créer un nouveau client si nécessaire
        if (!clientId) {
          const response = await axios.post(
            "http://localhost:5000/api/clients",
            {
              name: search,
              contact,
            }
          );
          clientId = response.data._id;
        }

        // Mise à jour de l'abonnement client
        const updateResponse = await axios.put(
          `http://localhost:5000/api/abonnementClient/${currentAbonnementClient._id}`,
          {
            idClient: clientId,
            idAbonnement: selectedAbonnement,
            weight,
            lavageReste,
            sechageReste,
          }
        );

        abonnementId = currentAbonnementClient._id; // Utiliser l'ID actuel
        console.log("Abonnement mis à jour :", updateResponse.data);
        toast.success("Abonnement mis à jour !");
      } else {
        // Création d'un nouvel abonnement client
        const response = await axios.post(
          "http://localhost:5000/api/abonnementClient/associer",
          requestData
        );
        abonnementId = response.data._id;
        console.log("Nouvel abonnement ajouté :", abonnementId);
        toast.success("Abonnement ajouté !");
      }

      // Mettre à jour les abonnements clients
      const abonnementsResponse = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      );
      setAbonnementClients(abonnementsResponse.data);

      // Assurez-vous que l'ID d'abonnement est défini avant le paiement
      if (abonnementId) {
        setIdAbonnement(abonnementId);
        console.log("ID d'abonnement pour paiement :", abonnementId);
        setPaymentAmount(abonnement.prix);
        setShowPaymentModal(true); // Ouvrir le modal de paiement
      } else {
        console.error("Aucun ID d'abonnement défini !");
        toast.error("Une erreur est survenue : ID d'abonnement manquant.");
      }

      // Réinitialiser les champs
      setSearch("");
      setContact("");
      setSelectedClient(null);
      setEditMode(false);
      setCurrentAbonnementClient(null);
      setShowModal(false);
      setFormData((prevFormData) => ({
        ...prevFormData,
        customerName: selectedClient ? selectedClient.name : search,
        contact: contact,
        nom : abonnement.nom,
        prix : abonnement.prix,
        // Conservez les autres valeurs existantes
      }));
    } catch (error) {
      console.error("Erreur lors de la gestion de l'abonnement :", error);
      toast.error("Une erreur est survenue.");
    }
  };

  const confirmHandleSubmit = (id) => {
    setConfirmMessage("Voulez-vous sauvegarder le reabonnement ?");
    setConfirmAction(() => async () => {
      await handleReabonnement(id); // Exécute l'action asynchrone
    });
    setIsConfirmVisible(true); // Affiche la boîte de confirmation
  };

  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  const handleReabonnement = async (abonnementClient) => {
    try {
      // Validation initiale des données
      if (!abonnementClient || !abonnementClient._id) {
        throw new Error("Données de l'abonnement client invalides.");
      }

      console.log("Données de abonnementClient :", abonnementClient);

      // Récupération des informations liées
      const client = clients.find((c) => c._id === abonnementClient.idClient);
      const abonnement = abonnements.find(
        (a) => a._id === abonnementClient.idAbonnement
      );

      if (!client) {
        throw new Error("Client introuvable.");
      }

      if (!abonnement) {
        throw new Error("Abonnement introuvable.");
      }

      console.log("Abonnement trouvé :", abonnement);
      console.log("Client trouvé :", client);

      // Définir le prix et l'ID d'abonnement pour le paiement

      // Calcul des nouvelles valeurs
      const updatedSechageReste = abonnement.sechage || 0;
      const updatedLavageReste = abonnement.machines || 0;
      const updatedPoids = abonnement.poids || 0;

      // Mise à jour de l'abonnement client via API
      await axios.put(
        `http://localhost:5000/api/abonnementClient/reabonnement/${abonnementClient._id}`,
        {
          idClient: abonnementClient.idClient,
          idAbonnement: abonnementClient.idAbonnement,
          sechageReste: updatedSechageReste,
          lavageReste: updatedLavageReste,
          weight: updatedPoids,
        }
      );

      console.log("Réabonnement mis à jour avec succès !");

      // Recharger la liste des abonnements clients
      fetchAbonnementClients();

      setPaymentAmount(abonnement.prix);
      // Ouvrir la modal de paiement
      handlePay(abonnementClient);

      toast.success("Réabonnement mis à jour avec succès !");
      setFormData((prevFormData) => ({
        ...prevFormData,
        customerName: client.name,
        contact: client.contact,
        nom : abonnement.nom,
        prix : abonnement.prix,
        // Conservez les autres valeurs existantes
      }));
    } catch (error) {
      console.error("Erreur lors du réabonnement :", error);
      toast.error(
        "Une erreur s'est produite lors de la mise à jour du réabonnement."
      );
    }
  };

  useEffect(() => {
    console.log("PrixPay mis à jour à :", prixPay);
  }, [prixPay]); // Cette fonction sera appelée à chaque mise à jour de `prixPay`

  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer cet Abonnement client?");
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/abonnementClient/${id}`);
      // alert("Abonnement supprimé avec succès");

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
    const client = clients.find(
      (client) => client._id === abonnementClient.idClient
    );
    const abonnement = abonnements.find(
      (a) => a._id === abonnementClient.idAbonnement
    );
    setShowModal(true);
    setSelectedClient(
      clients.find((client) => client._id === abonnementClient.idClient)
    );
    setSearch(client.name);
    setContact(client.contact);
    setSelectedAbonnement(abonnementClient.idAbonnement);
    setCurrentAbonnementClient(abonnementClient);
    setEditMode(true);
    setSechageReste(abonnementClient.abonnementDetails?.sechage.reste || null);
    setLavageReste(abonnementClient.abonnementDetails?.lavage.reste || null);
    setWeight(abonnementClient.abonnementDetails?.weight || null);
    setPrixPay(abonnement.prix);
    setFormData((prevFormData) => ({
      ...prevFormData,
      customerName: client.name,
      contact: client.contact,
      nom : abonnement.nom,
      prix : abonnement.prix,
      // Conservez les autres valeurs existantes
    }));
  };
  const handlePay = (abonnementClient) => {
    const abonnement = abonnements.find(
      (a) => a._id === abonnementClient.idAbonnement
    );
    setSelectedAbonnement(abonnementClient.idAbonnement);
    // setCurrentAbonnementClient(abonnementClient);
    setIdAbonnement(abonnementClient._id);
    setPrixPay(abonnement.prix);
    setShowPaymentModal(true);
  };
  const handleSelectAbonnement = (abonnement) => {
    // const client = clients.find((client) => client._id === abonnement.idClient);
    // setSelectedClient(client || null); // Configure le client
    // setSearch(client?.name || ""); // Remplit le champ recherche
    // setContact(client?.contact || ""); // Remplit le champ contact
    setSelectedAbonnement(abonnement._id); // Configure l'abonnement sélectionné
    // setEditMode(false); // Pas en mode édition
    setSechageReste(abonnement.sechage || "");
    setLavageReste(abonnement.machines || "");
    setWeight(abonnement.poids || "");
    setFormData((prevFormData) => ({
      ...prevFormData,
      nom: abonnement.nom,
      prix: abonnement.prix,
      // Conservez les autres valeurs existantes
    }));
  };

  const handleCancel = () => {
    setSearch("");
    setContact("");
    setSelectedAbonnement(null);
    setSelectedClient(null);
    setEditMode(false);
    setCurrentAbonnementClient(null);
    setShowModal(false);
    setSechageReste("");
    setLavageReste("");
  };

  const handleDetail = async (abonnementClient) => {
    try {
      // Récupérer les données du client
      const clientResponse = await axios.get(
        `http://localhost:5000/api/clients/${abonnementClient.idClient}`
      );

      // Récupérer les données de l'abonnement
      const abonnementResponse = await axios.get(
        `http://localhost:5000/api/abonnements/${abonnementClient.idAbonnement}`
      );

      // Récupérer les détails de l'abonnementClient, incluant sechage et lavage
      const abonnementClientDetails = await axios.get(
        `http://localhost:5000/api/abonnementClient/${abonnementClient._id}`
      );

      // Mettre à jour l'état avec toutes les informations combinées
      setDetailedAbonnement({
        client: clientResponse.data,
        abonnement: abonnementResponse.data,
        abonnementDetails: abonnementClientDetails.data.abonnementDetails,
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
        <button onClick={facturesPrint}>Print-test</button>
      </div>
      <div className="client">
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={confirmHandleSubmitAjour}>
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
                    <input
                      type="number"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="Poids"
                      // Afficher la liste au focus
                    />
                    <input
                      type="number"
                      value={lavageReste}
                      onChange={(e) => setLavageReste(e.target.value)}
                      placeholder="LavageReste"
                      // Afficher la liste au focus
                    />
                    <input
                      type="number"
                      value={sechageReste}
                      onChange={(e) => setSechageReste(e.target.value)}
                      placeholder="SechageReste"
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
                      <button
                        type="button"
                        className="cancel-btn"
                        onClick={handleCancel}
                      >
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
                            setFormData((prevFormData) => ({
                              ...prevFormData,
                              customerName: client.name,
                              contact: client.contact,
                              // Conservez les autres valeurs existantes
                            }));
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
                          onClick={() => handleSelectAbonnement(abonnement)}
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
                              type="button"
                              className="select-btn"
                              onClick={(e) => {
                                e.stopPropagation(); // Pour éviter de déclencher le onClick de la ligne
                                handleSelectAbonnement(abonnement);
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
                    {/* <button
                      className="edit-btn"
                      onClick={() => handlePay(abonnementClient)}
                    >
                      <FaEdit className="icon" /> pay
                    </button> */}
                    <button
                      className="delete-btn"
                      onClick={() => confirmDelete(abonnementClient._id)}
                    >
                      <FaTrash className="icon" /> Supprimer
                    </button>

                    <button
                      className="details-btn"
                      onClick={() => handleDetail(abonnementClient)}
                    >
                      <FaInfoCircle className="icon" /> Détails
                    </button>
                    <button
                      className="reabonnement-btn"
                      onClick={() => confirmHandleSubmit(abonnementClient)}
                    >
                      <FaRedoAlt className="icon" /> Réabonnement
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
                  <th>Détails</th>
                  <th>Séchage Restant</th>
                  <th>Lavage Restant</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{detailedAbonnement.client.name}</td>
                  <td>{detailedAbonnement.client.contact}</td>
                  <td>{detailedAbonnement.abonnement.nom}</td>
                  <td>{detailedAbonnement.abonnement.prix} Ar</td>
                  <td>{detailedAbonnement.abonnement.features.join(", ")}</td>
                  <td>{detailedAbonnement.abonnementDetails.sechage.reste}</td>
                  <td>{detailedAbonnement.abonnementDetails.lavage.reste}</td>
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
                  if (!isNaN(newValue) && newValue <= prixPay) {
                    setPaymentAmount(newValue);
                  } else if (newValue > prixPay) {
                    // Si la valeur dépasse le maximum, on définit la valeur de l'input à max
                    setPaymentAmount(prixPay);
                  }
                }}
                min={0}
                max={prixPay} // Définir le maximum de l'input
                placeholder=""
                required
              />
              <label>{`Montant restant : ${prixPay} Ar`}</label>
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
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
      <ToastContainer />
      <div className="facturePrint" id="printable-area">
        <div className="information">
          {companyInfo && (
            <div className="company-info-facture">
              <div className="company-photo-facture">
                {/* Affiche la photo de l'entreprise */}
                <img
                  src={`http://localhost:5000/${companyInfo.photo}`}
                  alt="Logo de l'entreprise"
                  style={{
                    borderRadius: "10px",
                    width: "50px",
                    height: "50px",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              </div>
              <div className="company-details">
                <div className="info">
                  <span style={{ margin: 0 }}>{companyInfo.name}</span>

                  <span>
                    <p style={{ margin: 0 }}>{companyInfo.phone}</p>
                  </span>
                  <span>
                    <span style={{ margin: 0 }}>{companyInfo.address}</span>
                  </span>
                </div>
              </div>
            </div>
          )}
          <div
            className="client-info"
            style={{ display: "flex", flexDirection: "column" }}
          >
            {latestFacture ? (
              <h2>Ticket N° {latestFacture.numeroFacture + 1 || 1}</h2>
            ) : (
              <p>Aucune facture trouvée</p> // Message si aucune facture n'est trouvée
            )}
            <p>Date : {new Date(Date.now()).toISOString().split("T")[0]}</p>
            <span>Doit à : {formData.customerName}</span>

            <p>Tèl : {formData.contact}</p>

            {/* {formData.etat ==="en attente" && formData.etat ==="annulée" (
              <p>etat : {formData.etat}</p>
            )} */}
          </div>
        </div>
        <p>Type de Service : abonnement</p>
        <div className="dd">
          <table>
            <thead>
              <tr>
                <th>Qté</th>
                <th>Designation</th>
                <th>Pu</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{formData.nom}</td>
                <td>{formData.prix} Ar</td>
                <td>{formData.prix} Ar</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AbonnementForm;
