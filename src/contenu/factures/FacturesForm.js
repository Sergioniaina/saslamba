import React, { useState, useEffect, useRef, useCallback } from "react";
import printJS from "print-js";
import axios from "axios";
import "./App.css";
import "../css/factureForm.css";
import "../css/billetage.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCashRegister,
  faEdit,
  faTimes,
  faClock,
} from "@fortawesome/free-solid-svg-icons";
import FactureList from "./FacturesList";
import {
  FaBoxOpen,
  FaFileInvoice,
  FaGift,
  FaHourglassHalf,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes,
  FaTools,
} from "react-icons/fa";
import ModalInfo from "../modal/ModalInfo";
import ModalConfirm from "../modal/ModalConfirm";
//import { trusted } from "mongoose";
// import { jsPDF } from "jspdf";
// import html2canvas from "html2canvas";

const FactureForm = () => {
  const [billet, setBillet] = useState(false);
  const [userRole, setUserRole] = useState("user");
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user")); // Fetch user from local storage
    if (user) {
      setUserRole(user.role); // Set the role to the user's role
    } else {
      alert("No user found in local storage");
    }
  }, []);
  const [isChoix, setIsChoix] = useState(false);
  const [article, setArticle] = useState([]);
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [machineWeights, setMachineWeights] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [searchM, setSearchT] = useState("");
  const [currentView, setCurrentView] = useState("machines");
  const [current, setCurrent] = useState("client");
  const inputRefs = useRef({});
  const inputRefss = useRef({});
  const [showClientList, setShowClientList] = useState(false);
  const [facture, setFacture] = useState("");
  const [modalInfo, setModalInfo] = useState(false);
  const [message, setMessage] = useState("");
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction(); // Execute the action
    setIsConfirmVisible(false); // Close the modal
  };
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    fetchCompanyInfo(); // Load company info when the component mounts
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/company-info/list"
      );
      setCompanyInfo(response.data[0]); // Assuming the first entry is the company info
    } catch (error) {
      console.error("Error loading company information:", error);
    }
  };

  //const [modalFacture, setmodalFacture]=useState(false);
  //   totalPrice += totalWeight * 2; // Exemple de calcul
  //totalPrice += Object.values(machineWeights).reduce((sum, weight) => sum + weight * 2, 0); // Exemple de calcul
  // const [billetTrue, setBilletTrue] = useState(false);
  const [formData, setFormData] = useState({
    customerName: "",
    contact: "",
    etat: "encaisser",
    articles: [], // Ajout de la gestion des articles
    articleDetails: [],
    totalWeight: "",
    totalPrice: "",
    reste: "",
    serviceType: "Lavage",
  });
  const [manualInput, setManualInput] = useState(0);
  const [billBreakdown, setBillBreakdown] = useState({
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
  });
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState("Espèce");
  const [newPaymentType, setNewPaymentType] = useState("");
  const [caisses, setCaisses] = useState([]);
  const [selectedCaisse, setSelectedCaisse] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    // Condition d'exécution du setBillet

    // S'assurer que 'setBillet' n'est appelé que sous certaines conditions
    if (billet) {
      setBillet(true);
    } else {
      setBillet(false);
    }
  }, []); // Si vous avez une dépendance spécifique qui change

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

  useEffect(() => {
    fetchPaymentTypes();
    fetchCaisses();
  }, []);

  const [latestFacture, setLatestFacture] = useState(null);
  useEffect(() => {
    const fetchLatestFacture = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/factures/last-ticket"
        );
        setLatestFacture(response.data);
        console.log("ticket:", response.data.ticketNumber);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération du dernier ticket",
          error
        );
      }
    };

    fetchLatestFacture();
  }, []);
  const remainingAmount = formData.totalPrice - manualInput;
  const changeToGive =
    manualInput - formData.totalPrice > 0
      ? manualInput - formData.totalPrice
      : 0;

  const handleBillClick = (billValue) => {
    setBillBreakdown((prevBreakdown) => ({
      ...prevBreakdown,
      [billValue]: prevBreakdown[billValue] + 1,
    }));
    setManualInput((prevCash) => prevCash + parseInt(billValue));
  };

  const handleManualInputChange = (e) => {
    const value = parseInt(e.target.value, 10) || 0;
    setManualInput(value);
  };

  const handlePaymentTypeChange = (e) => {
    const value = e.target.value;
    setSelectedPaymentType(value);
    if (value !== "autre") {
      setNewPaymentType("");
    }
  };
  // eslint-disable-next-line
  const [preview, setPreview] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSearch = () => {
    let filteredProduits = products;
    if (searchTerm) {
      filteredProduits = filteredProduits.filter((produit) =>
        produit.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filteredProduits;
  };

  const handleSearchM = () => {
    let filteredMachine = machines;
    if (searchM) {
      filteredMachine = filteredMachine.filter((machine) =>
        machine.modelNumber.toLowerCase().includes(searchM.toLowerCase())
      );
    }
    return filteredMachine;
  };

  const fetchAllProducts = async () => {
    try {
      const productsRes = await axios.get("http://localhost:5000/api/products");
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits:", error);
    }
  };
  const [abonnementClients, setAbonnementClients] = useState([]); // Déclarez un état pour les abonnements

  // Fonction pour charger les abonnements clients
  const fetchAbonnementClients = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/abonnementClient"
      ); // Mettez à jour l'URL selon votre API
      setAbonnementClients(response.data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des abonnements clients:",
        error
      );
    }
  };

  // Appelez cette fonction dans useEffect pour charger les abonnements au démarrage
  useEffect(() => {
    fetchAbonnementClients();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRes = await axios.get(
          "http://localhost:5000/api/products"
        );
        setProducts(productsRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des produits:", error);
      }
    };

    // useEffect(() => {
    //   // Update totalWeight whenever machineWeights changes
    //   const totalWeight = Object.values(machineWeights).reduce((sum, weight) => sum + parseFloat(weight), 0);
    //   setFormData((prev) => ({ ...prev, totalWeight: totalWeight.toFixed(2) }));
    // }, [machineWeights]);

    const fetchClients = async () => {
      try {
        // Récupérer tous les clients
        const clientsRes = await axios.get("http://localhost:5000/api/clients");
        const allClients = clientsRes.data;

        if (isChoix) {
          // Récupérer les abonnements clients pour filtrer
          const abonnementClientsRes = await axios.get(
            "http://localhost:5000/api/abonnementClient"
          );
          const abonnementClients = abonnementClientsRes.data;

          // Filtrer les clients pour ne garder que ceux qui ont un abonnement
          const filteredClients = allClients.filter((client) =>
            abonnementClients.some(
              (abonnement) => abonnement.idClient.toString() === client._id
            )
          );

          setClients(filteredClients);
        } else {
          // Si isChoix est faux, définir tous les clients
          setClients(allClients);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
      }
    };

    fetchProducts();
    fetchClients();
  }, [isChoix]);
  useEffect(() => {
    // Fetch price types from the server using Axios
    const fetchPriceTypes = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/articles"); // Adjust the URL if needed
        setArticle(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPriceTypes();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machinesRes = await axios.get(
          "http://localhost:5000/api/machines/available"
        );
        setMachines(machinesRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des machines:", error);
      }
    };

    fetchMachines();
  }, []);
  const fetchMachines = async () => {
    try {
      const machinesRes = await axios.get(
        "http://localhost:5000/api/machines/available"
      );
      setMachines(machinesRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des machines:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "totalWeight") {
      // Si l'utilisateur modifie directement le poids total
      setFormData((prev) => ({ ...prev, totalWeight: parseFloat(value) }));

      // Ne pas ajuster machineWeights automatiquement ici.
    } else if (name.startsWith("machineWeight_")) {
      // Extraction de l'ID de la machine du nom de l'input
      const machineId = name.split("machineWeight_")[1];

      // Mise à jour du poids de la machine spécifique
      setMachineWeights((prev) => {
        const updatedWeights = { ...prev, [machineId]: parseFloat(value) };

        // Calcul du nouveau poids total basé sur les poids des machines
        const newTotalWeight = Object.values(updatedWeights).reduce(
          (acc, weight) => acc + weight,
          0
        );
        setFormData((prevFormData) => ({
          ...prevFormData,
          totalWeight: newTotalWeight.toFixed(2),
        }));

        return updatedWeights;
      });
    }
  };

  const handleMachineClick = (machineId) => {
    setSelectedMachines((prev) => {
      const isAlreadySelected = prev.includes(machineId);
      const newSelectedMachines = isAlreadySelected
        ? prev.filter((id) => id !== machineId) // Deselect machine
        : [...prev, machineId]; // Select machine

      // Update machine weights if needed
      setMachineWeights((prevWeights) => {
        const updatedWeights = { ...prevWeights };

        if (isAlreadySelected) {
          // Remove weight if deselected
          delete updatedWeights[machineId];
        } else {
          // Initialize weight if selected
          const machine = machines.find((m) => m._id === machineId);
          if (machine) {
            if (machine.type === "Machine à laver") {
              updatedWeights[machineId] = "6"; // Default weight for "machine a laver"
            } else {
              updatedWeights[machineId] = "1"; // Default weight for other types
            }
          }
        }

        // Check if any "Machine à laver" is selected
        const hasWashingMachineSelected = newSelectedMachines.some((id) => {
          const machine = machines.find((m) => m._id === id);
          return machine && machine.type === "Machine à laver";
        });

        // Recalculate totalWeight: either for "Machine à laver" or all machines
        const totalWeight = newSelectedMachines.reduce((acc, id) => {
          const machine = machines.find((m) => m._id === id);
          // If a "Machine à laver" is selected, only include those in totalWeight calculation
          if (
            machine &&
            (hasWashingMachineSelected
              ? machine.type === "Machine à laver"
              : true)
          ) {
            acc += parseFloat(updatedWeights[id] || 1); // Use default value of 1 if weight is not set
          }
          return acc;
        }, 0);

        // Update totalWeight in formData
        setFormData((prevFormData) => ({
          ...prevFormData,
          totalWeight: totalWeight.toFixed(2),
        }));

        return updatedWeights;
      });

      // Focus on the input for the newly selected machine
      setTimeout(() => {
        if (inputRefs.current[machineId]) {
          inputRefs.current[machineId].focus();
        }
      }, 0);

      return newSelectedMachines;
    });
  };

  const handleWeightChange = (machineId, value, weightCapacity) => {
    let numericValue = parseFloat(value);

    // Assurez-vous que la valeur est au moins 1, et pas plus que la capacité de la machine
    numericValue = isNaN(numericValue) ? 1 : numericValue; // Si la valeur est NaN, utiliser 1
    const clampedValue = Math.max(1, Math.min(numericValue, weightCapacity));

    setMachineWeights((prev) => {
      const updatedWeights = {
        ...prev,
        [machineId]: clampedValue.toString(), // Stocker comme chaîne pour la gestion de l'input
      };

      // Vérifier si au moins une "Machine à laver" est sélectionnée
      const hasWashingMachineSelected = selectedMachines.some((machineId) => {
        const machine = machines.find((m) => m._id === machineId);
        return machine && machine.type === "Machine à laver";
      });

      // Si une machine à laver est sélectionnée, calculer totalWeight uniquement pour celles-ci
      const totalWeight = selectedMachines.reduce((acc, machineId) => {
        const machine = machines.find((m) => m._id === machineId);
        if (
          machine &&
          (hasWashingMachineSelected
            ? machine.type === "Machine à laver"
            : true)
        ) {
          acc += parseFloat(updatedWeights[machineId] || 1); // Utiliser 1 si la valeur est vide
        }
        return acc;
      }, 0);

      // Mettre à jour totalWeight dans formData
      setFormData((prev) => ({ ...prev, totalWeight: totalWeight.toFixed(2) }));

      return updatedWeights;
    });
  };

  // Handle product selection/deselection
  const handleProductClick = (productId) => {
    setSelectedProducts((prev) => {
      const isSelected = prev.includes(productId);
      const newSelectedProducts = isSelected
        ? prev.filter((id) => id !== productId) // Retirer si désélectionné
        : [...prev, productId]; // Ajouter si sélectionné

      // Si le produit est sélectionné normalement, initialiser la quantité à 1
      if (!isSelected) {
        const product = products.find((p) => p._id === productId); // Trouver le produit correspondant
        if (product) {
          setQuantities((prevQuantities) => ({
            ...prevQuantities,
            [productId]: product.stock >= 1 ? quantities[productId] || 1 : 0,
          }));
        }

        // Focaliser l'input de quantité après sélection
        setTimeout(() => {
          if (inputRefs.current[productId]) {
            inputRefs.current[productId].focus();
          }
        }, 0);
      } else {
        // Si le produit est désélectionné, ne pas retirer l'offert
        setQuantities((prevQuantities) => ({
          ...prevQuantities,
          [productId]: 0,
        }));
      }
      setOfferedQuantities((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });

      setError("");
      return newSelectedProducts;
    });
  };

  // Handle quantity change
  const handleQuantityChange = (productId, value, stock) => {
    const parsedValue = parseInt(value, 10);

    // Clamp the value between 0 and the product's stock
    const clampedValue = Math.max(0, Math.min(parsedValue, stock));

    setQuantities((prev) => ({
      ...prev,
      [productId]: !isNaN(clampedValue) && clampedValue >= 0 ? clampedValue : 0,
    }));

    setError(""); // Clear any existing errors
  };

  const handleClientSelect = (client) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      customerName: client.name,
      contact: client.contact,
      // Conservez les autres valeurs existantes
    }));
  };
  // validation des machines selectionnés
  const validateMachines = () => {
    const hasLavageMachine = selectedMachines.some(
      (machineId) =>
        machines.find((m) => m._id === machineId)?.type === "Machine à laver"
    );
    const hasSéchageMachine = selectedMachines.some(
      (machineId) =>
        machines.find((m) => m._id === machineId)?.type === "Sèche-linge"
    );
    const { serviceType } = formData;

    if (serviceType === "Lavage" && !hasLavageMachine) {
      setMessage("une machine lavage requis pour lavage");
      setModalInfo(true);
      return false;
    }

    if (serviceType === "Lavage" && hasLavageMachine && hasSéchageMachine) {
      setMessage("seulement une machine lavage requis pour service de lavage");
      setModalInfo(true);
      return false;
    }

    if (serviceType === "Séchage" && !hasSéchageMachine) {
      setMessage(
        "Une machine de séchage est requise pour le service de Séchage."
      );
      setModalInfo(true);
      return false;
    }

    if (serviceType === "Séchage" && hasSéchageMachine && hasLavageMachine) {
      setMessage(
        "Une machine de séchage est requise pour faire juste Séchage."
      );
      return false;
    }

    if (
      serviceType === "Lavage + Séchage" &&
      (!hasLavageMachine || !hasSéchageMachine)
    ) {
      setMessage(
        "Une machine de lavage et une machine de séchage sont requises pour le service Lavage + Séchage."
      );
      return false;
    }

    setError("");
    return true;
  };
  //pour la validation de capacité des machine selectionnés
  const validateMachineCapacity = () => {
    const totalWeight = parseFloat(formData.totalWeight);

    // Calculer le poids total des machines de type "Sèche-linge"
    const totalDryerWeight = Object.entries(machineWeights).reduce(
      (total, [machineId, weight]) => {
        const machine = machines.find((m) => m._id === machineId);
        if (machine && machine.type === "Sèche-linge") {
          return total + parseFloat(weight);
        }
        return total;
      },
      0
    );

    // Vérifier si le totalWeight est inférieur au poids total des machines de séchage
    if (totalWeight < totalDryerWeight) {
      setMessage(
        `Le poids total (${totalWeight} kg) est inférieur au poids total des machines de séchage (${totalDryerWeight} kg).`
      );
      return false;
    }

    // Vérifier la capacité de chaque machine
    for (const [machineId, weight] of Object.entries(machineWeights)) {
      const machine = machines.find((m) => m._id === machineId);
      if (machine && weight > machine.weightCapacity) {
        setError(
          `Le poids attribué à la machine ${machine.modelNumber} dépasse sa capacité. Capacité: ${machine.weightCapacity} kg.`
        );
        return false;
      }
    }

    setError("");
    return true;
  };
  //pour le validation de stock
  const validateStock = async () => {
    try {
      const productQuantitiesToCheck = Object.keys(quantities).reduce(
        (acc, productId) => {
          if (selectedProducts.includes(productId)) {
            // Additionne la quantité normale et la quantité offerte
            const totalQuantity =
              (quantities[productId] || 0) +
              (offeredQuantities[productId] || 0);

            // Vérifie si la quantité totale est supérieure à 0
            if (totalQuantity > 0) {
              acc[productId] = totalQuantity;
            }
          }
          return acc;
        },
        {}
      );

      const stocks = await Promise.all(
        Object.keys(productQuantitiesToCheck).map((productId) =>
          axios.get(`http://localhost:5000/api/products/${productId}`)
        )
      );

      for (const { data: product } of stocks) {
        if (!product || !product._id || typeof product.stock === "undefined") {
          console.error("Produit non trouvé ou données incorrectes:", product);
          setError("Données de produit incorrectes.");
          return false;
        }

        const quantityRequested = productQuantitiesToCheck[product._id];
        if (product.stock < quantityRequested) {
          setError(`Le stock pour le produit ${product.name} est insuffisant.`);
          return false;
        }
      }

      setError("");
      return true;
    } catch (err) {
      console.error("Erreur lors de la vérification des stocks:", err);
      setError("Erreur lors de la vérification des stocks.");
      return false;
    }
  };

  // const handlePreview = () => {
  //   setPreview(true);
  // };

  const printContentAsPDF = () => {
    printJS({
      printable: "printable-area", // ID de l'élément à imprimer
      type: "html", // Type de contenu à imprimer
      documentTitle: "Facture", // Titre du document
      targetStyles: ["*"], // Imprime tous les styles associés à l'élément
    });
  };

  const selectedArticleDetails = formData.articleDetails;

  const handleSubmit = async (isPending) => {
    setPreview(false);
    if (!validateMachines()) return;
    if (!validateMachineCapacity()) return;
    if (!(await validateStock())) return;
    if (!formData.totalPrice || formData.totalPrice === undefined) {
      setMessage("Le prix total est manquant.");
      setModalInfo(true);
      //setError("Le prix total est manquant.");
      return;
    }
    // Code pour soumettre le formulaire ici
    console.log("Formulaire soumis avec succès!");
    // const currentUser = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem("token"); // Token d'authentification

    // Vérifier si le client existe
    let selectedClient = clients.find(
      (client) =>
        client.name === formData.customerName &&
        client.contact === formData.contact
    );

    // Si le client n'existe pas, le créer
    if (!selectedClient) {
      try {
        const newClient = await axios.post(
          "http://localhost:5000/api/clients",
          {
            name: formData.customerName,
            contact: formData.contact,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        selectedClient = newClient.data; // Mettre à jour le client sélectionné
      } catch (error) {
        setMessage("Erreur lors de la création du client");
        setModalInfo(true);
        return;
      }
    }

    if (isChoix) {
      try {
        const abonnementClient = await axios.get(
          `http://localhost:5000/api/abonnementClient/client/${selectedClient._id}`
        );
        console.log(abonnementClient.data);
        if (!abonnementClient.data || !abonnementClient.data.length) {
          //setMessage("Le client n'est pas inscrit à un abonnement.");
          setMessage("Le client n'est pas inscrit à un abonnement.");
          setModalInfo(true);
          return;
        }

        // Si le client a un abonnement, déduire le poids de l'abonnement
        const currentAbonnement = abonnementClient.data[0]; // Assumer le premier abonnement récupéré
        const remainingWeight =
          currentAbonnement.abonnementDetails.weight - formData.totalWeight;

        if (remainingWeight < 0) {
          // alert("Le poids dépasse le quota d'abonnement.");
          setMessage("Le poids dépasse le quota d'abonnement.");
          return;
        }

        // Mise à jour des détails de l'abonnement
        await axios.put(
          `http://localhost:5000/api/abonnementClient/abonnement/${currentAbonnement._id}`,
          {
            abonnementDetails: {
              weight: remainingWeight,
              features: currentAbonnement.abonnementDetails.features,
            },
          }
        );
      } catch (error) {
        setMessage("Le client n'est pas inscrit à un abonnement.");
        setModalInfo(true);
        return;
      }
    }
    // Enregistrement de la facture
    // if (remainingAmount > 0){
    //   setFormData((prevFormData) => ({
    //     ...prevFormData,
    //     reste: remainingAmount,
    //   }));
    // }
    // else{
    //   setFormData((prevFormData) => ({
    //     ...prevFormData,
    //     reste: 0,
    //   }));
    // }
    const selectedArticles = formData.articles;
    const factureData = {
      customerName: selectedClient.name,
      contact: formData.contact,
      totalWeight: formData.totalWeight,
      totalPrice: formData.totalPrice,
      reste: remainingAmount > 0 ? remainingAmount : 0,
      serviceType: formData.serviceType,
      machines: selectedMachines,
      machineWeights: machineWeights,
      // userId: currentUser ? currentUser._id : null,
      products: selectedProducts, // Fusionne les quantités normales et offertes
      quantities: Object.keys(quantities).reduce((acc, productId) => {
        // Si on a une quantité normale, on l'ajoute
        acc[productId] = quantities[productId] || 0;
        return acc;
      }, {}),
    };

    // Ajouter les quantités offertes si elles existent
    Object.keys(offeredQuantities).forEach((productId) => {
      if (factureData.quantities[productId] !== undefined) {
        // Si la quantité normale existe, on l'additionne
        factureData.quantities[productId] += offeredQuantities[productId] || 0;
      } else {
        // Sinon, on initialise la quantité avec l'offerte
        factureData.quantities[productId] = offeredQuantities[productId] || 0;
      }
    });

    // Articles et détails des articles
    factureData.articles = selectedArticles; // Ajouter les articles
    factureData.articleDetails = selectedArticleDetails; // Ajouter les détails des articles
    factureData.etat = isPending ? "en attente" : "encaisser";

    console.log("Données de la facture envoyées :", factureData);

    let response;
    try {
      if (isEditMode) {
        if (!facture || !facture._id) {
          setMessage("La facture n'est pas disponible pour la modification.");
          setModalInfo(true);
          return;
        }
        response = await axios.put(
          `http://localhost:5000/api/factures/${facture._id}`,
          factureData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // alert("Facture modifiée avec succès");
        toast.success("Facture modifier avec succes");
      } else {
        response = await axios.post(
          "http://localhost:5000/api/factures",
          factureData,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        // alert("Facture créée avec succès");
      }

      console.log("Données de la facture envoyées :", response.data._id);
      //generatePDF(factureData);
      // printDirectToXprinter(factureData);
      const printableArea = document.getElementById("printable-area");
      if (printableArea) {
        console.log("L'élément à imprimer est prêt.");
        printContentAsPDF(); // Appel à l'impression
      } else {
        console.error("L'élément à imprimer n'a pas été trouvé.");
      }
      const caisse = caisses.find((caisse) => caisse._id === selectedCaisse);
      const paymentTypeToSubmit =
        selectedPaymentType === "autre"
          ? newPaymentType
          : selectedPaymentType || "Espèce";
      console.log("payementType :", newPaymentType);
      const totalPrice = Number(formData.totalPrice);
      const inputAmount = Number(manualInput);

      const montant = totalPrice <= inputAmount ? totalPrice : inputAmount;

      await axios.post(
        "http://localhost:5000/api/payement",
        {
          type: paymentTypeToSubmit,
          facture: response.data._id,
          montant: montant,
          caisse: selectedCaisse, // Uncomment if needed to associate payment with invoice
        },
        {
          headers: {
            Authorization: `Bearer ${token}`, // Utiliser le token pour autorisation
            "Content-Type": "application/json", // Optionnel, définit le type de contenu
          },
        }
      );

      if (totalPrice <= inputAmount) {
        await axios.put(
          `http://localhost:5000/api/factures/${response.data._id}/etat`,
          { estPaye: true }
        );
      } else {
        await axios.put(
          `http://localhost:5000/api/factures/${response.data._id}/etat`,
          { estPaye: false }
        );
      }

      const currentSolde = Number(caisse.solde);

      if (caisse) {
        if (!caisse.ouvert) {
          setError(
            "La caisse est fermée. Vous devez d'abord ouvrir cette caisse."
          );
          return;
        }

        let soldeToAdd;

        if (isEditMode && facture) {
          // Mode édition : calculer la différence entre manualInput et le prix total de la facture existante
          const difference =
            inputAmount - Number(facture.totalPrice - facture.reste);

          // Si la différence est positive, c'est le solde à ajouter ; sinon, ajouter 0
          soldeToAdd = difference;
        } else {
          // Mode normal : comparer totalPrice et manualInput
          soldeToAdd = totalPrice <= inputAmount ? totalPrice : inputAmount;
        }

        // Mise à jour du solde de la caisse
        await axios.put(
          `http://localhost:5000/api/caisses/${selectedCaisse}/add-solde`,
          {
            solde: soldeToAdd, // Utiliser le montant calculé comme solde à ajouter
          }
        );

        console.log(
          `Solde ajouté avec succès : ${currentSolde} + ${soldeToAdd}`
        );
      }

      setPreview(false);
      handleCancel(); // Masquer la prévisualisation après la soumission
      toast.success("La facture crée avec succès !");
    } catch (error) {
      setError(
        `Erreur lors de l'enregistrement de la facture: ${error.message}`
      );
    }
  };

  const billetConfirm = async () => {
    setConfirmMessage("Voulez-vous enregistrer cette facture?"); // Message de confirmation
    // Cette fonction doit être synchronisée pour l'action de soumission
    const confirmSubmit = async () => {
      try {
        // Appel de la soumission (vérifiez bien que false signifie l'enregistrement ou la modification selon le contexte)
        await handleSubmit(false);
        // Fermer le modal seulement si la soumission est réussie
        setBillet(false);
        fetchAllProducts();
        fetchMachines();
        //  setIsConfirmVisible(true); // Afficher le modal de confirmation
      } catch (error) {
        // Si une erreur survient, on affiche un message d'erreur
        console.error("Erreur lors de la soumission :", error);
        setError(
          "Échec lors de la confirmation du billet. Veuillez réessayer."
        );
      }
    };

    // On définit l'action de confirmation (une fois l'utilisateur a confirmé)
    setConfirmAction(() => confirmSubmit); // Fonction de soumission à exécuter après confirmation
    // Le modal de confirmation est ensuite visible
    setIsConfirmVisible(true);
  };

  const billetConfirmEnattente = async () => {
    try {
      // Appel de la soumission (vérifiez bien que false signifie l'enregistrement ou la modification selon le contexte)
      await handleSubmit(true);

      // Fermer le modal seulement si la soumission est réussie
      setBillet(false);
    } catch (error) {
      // Afficher un message d'erreur en cas de problème lors de la soumission
      console.error("Erreur lors de la soumission :", error);
      setError("Échec lors de la confirmation du billet. Veuillez réessayer.");
    }
  };
  const handleConfirmClick = () => {
    // Vérifier l'état de la facture
    if (formData.etat === "en attente") {
      // Appeler la fonction appropriée pour "en attente"
      billetConfirmEnattente();
    } else {
      // Appeler la fonction pour les autres états
      billetConfirm();
    }
  };

  const handleDetails = (facture) => {
    if (!facture || typeof facture !== "object") {
      setError("Facture non disponible ou mal formatée pour l'édition.");
      return;
    }

    // Initialisation des options de sélection
    const machineOptions = facture.machines.reduce((acc, machineId) => {
      const articleOptions = article.flatMap((article) =>
        article.prices
          .filter(
            (price) =>
              (isWeekend && price.priceType === "weekend") ||
              (!isWeekend && price.priceType === "normale")
          )
          .map((price) => ({
            label: `${article.type} - ${price.priceType}: $${price.value}`,
            value: `${article._id}-${article.type}-${price.priceType}-${price.value}`,
          }))
      );

      // Associer les options d'article à la machine
      acc[machineId] = articleOptions;
      return acc;
    }, {});

    setFacture(facture);
    // Mettre à jour le formulaire et la sélection
    setFormData({
      customerName: facture.customerName || "",
      contact: facture.contact || "",
      totalWeight: facture.totalWeight || 0,
      totalPrice: facture.totalPrice || 0,
      reste: facture.reste || 0,
      serviceType: facture.serviceType || "",
      articles: facture.articles || [],
      articleDetails: facture.articleDetails || [],
    });

    // Trouver l'option correspondante à l'édition
    const selectedOptions = {};

    // Pour chaque machine, trouvez l'option correspondante à l'édition
    facture.machines.forEach((machineId) => {
      const machineArticleDetails = facture.articleDetails.filter(
        (detail) => detail.machineId === machineId
      );

      const selectedOption =
        machineArticleDetails.length > 0
          ? machineOptions[machineId].find((option) =>
              machineArticleDetails.some(
                (detail) =>
                  `${detail.articleId}-${detail.type}-${detail.prices[0]?.priceType}-${detail.prices[0]?.value}` ===
                  option.value
              )
            )?.value || ""
          : "";

      selectedOptions[machineId] = selectedOption; // Associer l'option sélectionnée à la machine
    });

    setSelectedOptions(selectedOptions);
    setSelectedMachines(facture.machines || []);
    setSelectedProducts(facture.products || []);

    const machineWeightsObj = facture.machineWeights.reduce((acc, item) => {
      if (item.machineId) {
        acc[item.machineId] = item.weight || 0;
      }
      return acc;
    }, {});
    setMachineWeights(machineWeightsObj);

    const productQuantitiesObj = facture.quantities.reduce((acc, item) => {
      if (item.productId) {
        acc[item.productId] = item.quantity || 0;
      }
      return acc;
    }, {});
    setQuantities(productQuantitiesObj);
    facturesPrint();
  };
  const handleEdit = (facture) => {
    if (!facture || typeof facture !== "object") {
      setError("Facture non disponible ou mal formatée pour l'édition.");
      return;
    }

    // Initialisation des options de sélection
    const machineOptions = facture.machines.reduce((acc, machineId) => {
      const articleOptions = article.flatMap((article) =>
        article.prices
          .filter(
            (price) =>
              (isWeekend && price.priceType === "weekend") ||
              (!isWeekend && price.priceType === "normale")
          )
          .map((price) => ({
            label: `${article.type} - ${price.priceType}: $${price.value}`,
            value: `${article._id}-${article.type}-${price.priceType}-${price.value}`,
          }))
      );

      // Associer les options d'article à la machine
      acc[machineId] = articleOptions;
      return acc;
    }, {});

    setFacture(facture);
    // Mettre à jour le formulaire et la sélection
    setFormData({
      customerName: facture.customerName || "",
      contact: facture.contact || "",
      totalWeight: facture.totalWeight || 0,
      totalPrice: facture.totalPrice || 0,
      reste: facture.reste || 0,
      serviceType: facture.serviceType || "",
      articles: facture.articles || [],
      articleDetails: facture.articleDetails || [],
    });

    // Trouver l'option correspondante à l'édition
    const selectedOptions = {};

    // Pour chaque machine, trouvez l'option correspondante à l'édition
    facture.machines.forEach((machineId) => {
      const machineArticleDetails = facture.articleDetails.filter(
        (detail) => detail.machineId === machineId
      );

      const selectedOption =
        machineArticleDetails.length > 0
          ? machineOptions[machineId].find((option) =>
              machineArticleDetails.some(
                (detail) =>
                  `${detail.articleId}-${detail.type}-${detail.prices[0]?.priceType}-${detail.prices[0]?.value}` ===
                  option.value
              )
            )?.value || ""
          : "";

      selectedOptions[machineId] = selectedOption; // Associer l'option sélectionnée à la machine
    });

    setSelectedOptions(selectedOptions);
    setSelectedMachines(facture.machines || []);
    setSelectedProducts(facture.products || []);

    const machineWeightsObj = facture.machineWeights.reduce((acc, item) => {
      if (item.machineId) {
        acc[item.machineId] = item.weight || 0;
      }
      return acc;
    }, {});
    setMachineWeights(machineWeightsObj);

    const productQuantitiesObj = facture.quantities.reduce((acc, item) => {
      if (item.productId) {
        acc[item.productId] = item.quantity || 0;
      }
      return acc;
    }, {});
    setQuantities(productQuantitiesObj);
    setIsEditMode(true);
  };

  const handleCancel = () => {
    // Réinitialiser le formulaire ou rediriger l'utilisateur
    setFormData({
      customerName: "",
      contact: "",
      totalPrice: "",
      totalWeight: "",
      serviceType: "Lavage",
    });
    setSelectedMachines([]);
    setSelectedProducts([]);
    setOfferedQuantities({});
    setQuantities({});
    setMachineWeights({});
    setIsEditMode(false);
  };

  const [offeredQuantities, setOfferedQuantities] = useState({}); // To track quantities for "offert"

  const handleOffertQuantityChange = (productId, value) => {
    setOfferedQuantities((prev) => ({
      ...prev,
      [productId]: Number(value),
    }));
  };
  const handleOffertClick = (productId) => {
    setOfferedQuantities((prev) => ({
      ...prev,
      [productId]: offeredQuantities[productId] || 1,
      // Initialiser la quantité offerte à 1
    }));
    setTimeout(() => {
      if (inputRefss.current[productId]) {
        inputRefss.current[productId].focus();
      }
    }, 0);

    // Ajouter le produit offert dans la liste des produits sélectionnés s'il n'est pas déjà présent
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => [...prev, productId]);
    }
  };
  const handleRemoveOfferedProduct = (productId) => {
    setOfferedQuantities((prev) => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });

    // Si le produit normal n'est pas sélectionné, le retirer de la liste des produits
    if (!quantities[productId]) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };

  const [selectedOptions, setSelectedOptions] = useState({});

  const calculateTotalPrice = useCallback(() => {
    let total = selectedProducts.reduce((acc, productId) => {
      const product = products.find((p) => p._id === productId);

      // Ajoute le prix du produit normal s'il est sélectionné
      if (product && quantities[productId] > 0) {
        const productPrice = product.price * (quantities[productId] || 0);
        acc += productPrice;
      }

      return acc;
    }, 0);

    // Boucle à travers chaque machine sélectionnée
    selectedMachines.forEach((machineId) => {
      const machine = machines.find((m) => m._id === machineId);
      if (machine) {
        // Vérifier si la machine est une machine à laver ou un sèche-linge
        const isWashingMachine = machine.type === "Machine à laver";

        let priceValue = 0; // Valeur par défaut du prix

        // Obtenir le prix basé sur le type de machine
        if (isWashingMachine) {
          const selectedOption = selectedOptions[machineId]; // Obtenir l'option sélectionnée pour la machine à laver
          priceValue = getPriceFromOption(selectedOption);
        } else {
          // Calcul pour les sèche-linge
          const weight = machineWeights[machineId] || 1;
          const priceRange = machine.priceRanges?.find(
            (range) => weight >= range.minWeight && weight <= range.maxWeight
          );

          if (priceRange) {
            priceValue = priceRange.price; // Utiliser le prix qui correspond à la plage de poids
          }
        }

        // Appliquer la logique isChoix
        if (isChoix) {
          priceValue = 0; // Si 'choix' est activé, le prix est 0 pour toute machine
        }

        // Ajouter le prix de la machine au total
        total += priceValue;
      }
    });

    return total.toFixed(2); // Retourner le total avec 2 décimales
  }, [
    isChoix,
    selectedProducts,
    quantities,
    selectedMachines,
    machineWeights,
    products,
    machines,
    selectedOptions,
  ]);

  useEffect(() => {
    const totalPrice = calculateTotalPrice();
    setFormData((prev) => ({ ...prev, totalPrice }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculateTotalPrice]);

  const getPriceFromOption = (option) => {
    // console.log("getPriceFromOption called with:", option); // Log pour voir ce qui est passé
    // Vérifiez si l'option est valide et si c'est une chaîne
    if (!option || typeof option !== "string") {
      // console.error("L'option est invalide ou n'est pas une chaîne :", option);
      return 0; // Ou une valeur par défaut, selon ce qui est approprié
    }

    const parts = option.split("-");
    const priceValue = parts[parts.length - 1];
    return parseFloat(priceValue);
  };

  //   const getOptionsForMachineType = (machineType) => {
  //   if (machineType === "Machine à laver") {
  //     return washerOptions; // Remplacez par vos options pour les machines à laver
  //   } else if (machineType === "Sèche-linge") {
  //     return dryerOptions; // Remplacez par vos options pour les sèche-linge
  //   }
  //   return [];
  // };

  // const handleRemoveMachine = (machineId) => {
  //   // Supprimer la machine de la liste des machines sélectionnées
  //   const updatedMachines = selectedMachines.filter((id) => id !== machineId);
  //   setSelectedMachines(updatedMachines);
  // };
  const handleRemoveMachine = (machineId) => {
    // Remove the machine from the selected machines
    const updatedMachines = selectedMachines.filter((id) => id !== machineId);
    setSelectedMachines(updatedMachines);

    // Remove the machine's weight
    const updatedMachineWeights = { ...machineWeights };
    delete updatedMachineWeights[machineId];
    setMachineWeights(updatedMachineWeights);

    // Check if any "Machine à laver" is selected
    const hasWashingMachineSelected = updatedMachines.some((id) => {
      const machine = machines.find((m) => m._id === id);
      return machine && machine.type === "Machine à laver";
    });

    // Recalculate totalWeight: either for "Machine à laver" or all machines
    const totalWeight = updatedMachines.reduce((acc, id) => {
      const machine = machines.find((m) => m._id === id);
      // If a "Machine à laver" is selected, only include those in totalWeight calculation
      if (
        machine &&
        (hasWashingMachineSelected ? machine.type === "Machine à laver" : true)
      ) {
        acc += parseFloat(updatedMachineWeights[id] || 1); // Use 1 as the default if weight is not set
      }
      return acc;
    }, 0);

    // Update totalWeight in formData
    setFormData((prevFormData) => ({
      ...prevFormData,
      totalWeight: totalWeight.toFixed(2),
    }));
  };

  const handleRemoveProduct = (productId) => {
    setQuantities((prev) => {
      const updated = { ...prev };
      delete updated[productId]; // Supprimer la quantité normale
      return updated;
    });

    // Si le produit offert n'existe pas, retirer complètement de la liste
    if (!offeredQuantities[productId]) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId));
    }
  };
  const handleChanges = (e) => {
    setFormData({ ...formData, totalPrice: e.target.value });
  };

  const onChanges = (e) => {
    const { name, value } = e.target;

    // Mettre à jour à la fois le nom du client et le contact dans formData
    setFormData((prev) => ({
      ...prev,
      [name]: value, // Utilise le nom de l'input pour mettre à jour le champ correspondant
    }));
  };

  const currentDay = new Date().getDay();
  const isWeekend = currentDay === 0 || currentDay === 6;

  const filteredOptions = article.flatMap((article) =>
    article.prices
      .filter(
        (price) =>
          (isWeekend && price.priceType === "weekend") ||
          (!isWeekend && price.priceType === "normale")
      )
      .map((price) => ({
        label: `${article.type} - ${price.priceType}- ${price.value}`,
        value: `${article._id}-${article.type}-${price.priceType}-${price.value}`, // S'assurer que c'est une chaîne
      }))
  );

  // Vérification du contenu des filteredOptions
  // console.log("Filtered Options:", filteredOptions);

  // Set the default selected option when the component mounts
  useEffect(() => {
    if (filteredOptions.length > 0) {
      // Pour chaque machine sélectionnée, définissez l'option par défaut
      selectedMachines.forEach((machineId) => {
        if (!selectedOptions[machineId]) {
          const defaultOptionValue = filteredOptions[0].value; // Première option disponible
          setSelectedOptions((prev) => ({
            ...prev,
            [machineId]: defaultOptionValue, // Assurez-vous que c'est une chaîne
          }));

          // Décomposer la valeur et mettre à jour formData avec les valeurs par défaut
          const [articleId, articleType, priceType, value] =
            defaultOptionValue.split("-");

          setFormData((prevData) => ({
            ...prevData,
            articles: [...prevData.articles, { articleId, machineId }],
            articleDetails: [
              ...prevData.articleDetails,
              {
                articleId: articleId,
                machineId: machineId,
                type: articleType,
                prices: [{ priceType, value: parseFloat(value) }],
              },
            ],
          }));
        }
      });
    }
  }, [filteredOptions, selectedOptions, selectedMachines]); // Exécutez ce useEffect si les options filtrées ou les machines sélectionnées changent

  // Fonction de changement d'option
  const handleOptionChange = (machineId, event) => {
    const selectedOptionValue = event.target.value;

    // Vérifiez que la valeur sélectionnée est une chaîne
    if (typeof selectedOptionValue === "string") {
      const [articleId, articleType, priceType, value] =
        selectedOptionValue.split("-");

      // Mettre à jour l'option sélectionnée pour cette machine
      setSelectedOptions((prev) => ({
        ...prev,
        [machineId]: selectedOptionValue, // Mettez à jour seulement pour la machine en cours
      }));

      // Mettre à jour formData avec les articles sélectionnés et les détails associés à cette machine
      setFormData((prevData) => {
        const updatedArticles = prevData.articles.filter(
          (article) => article.machineId !== machineId // Enlever l'article précédent pour cette machine
        );

        const updatedArticleDetails = prevData.articleDetails.filter(
          (detail) => detail.machineId !== machineId // Enlever les détails précédents pour cette machine
        );

        return {
          ...prevData,
          articles: [
            ...updatedArticles,
            { articleId, machineId }, // Ajouter le nouvel article avec machineId
          ],
          articleDetails: [
            ...updatedArticleDetails,
            {
              articleId: articleId,
              machineId: machineId,
              type: articleType,
              prices: [{ priceType, value: parseFloat(value) }],
            },
          ],
        };
      });
    } else {
      console.error(
        "La valeur sélectionnée n'est pas une chaîne :",
        selectedOptionValue
      );
    }
  };

  /*Modal Information */
  const onOk = () => {
    setModalInfo(false);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");

  // Fonction pour ouvrir le modal
  const inputRef = useRef(null);
  const handleAddStock = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus(); // Met le curseur dans l'input
      }
    }, 0);
  };

  // Fonction pour fermer le modal
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setQuantity(""); // Réinitialiser la quantité
  };
  const facturesPrint = () => {
    const printableArea = document.getElementById("printable-area");
    if (printableArea) {
      console.log("L'élément à imprimer est prêt.");
      printContentAsPDF();
      setBillet(false);
      // Appel à l'impression
    } else {
      console.error("L'élément à imprimer n'a pas été trouvé.");
    }
  };
  const handleModalSubmit = async (e) => {
    const token = localStorage.getItem("token");
    e.preventDefault();
    const stockToAdd = parseInt(quantity, 10);
    if (!isNaN(stockToAdd) && stockToAdd > 0) {
      try {
        const updatedProduct = {
          ...selectedProduct,
          stock: selectedProduct.stock + stockToAdd,
        };
        await axios.put(
          `http://localhost:5000/api/products/${selectedProduct._id}`,
          updatedProduct,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`, // Ajout de l'en-tête d'autorisation
            },
          }
        );
        await fetchAllProducts();
        alert("Stock added successfully");
        handleModalClose(); // Fermer le modal après succès
      } catch (error) {
        console.error("Error adding stock:", error);
        alert("Error adding stock");
      }
    } else {
      alert("Invalid stock quantity");
    }
  };

  return (
    <div className="facture-form1">
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <form
            className="modal-stock"
            onSubmit={handleModalSubmit}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Ajouter stock</h2>
            <div className="modal-stock-input">
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder=""
                min="1"
                ref={inputRef}
              />
              <label>Quantité</label>
            </div>

            <div className="modal-buttons">
              <button className="btn-sub" type="submit">
                <FaSave className="icon" />
                Submit
              </button>
              <button
                className="btn-c"
                type="button"
                onClick={handleModalClose}
              >
                <FaTimes className="icon" />
                Close
              </button>
            </div>
          </form>
        </div>
      )}
      <form
        className="facture-form"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();

          const form = e.target;

          if (form.checkValidity()) {
            if (
              formData.etat === "encaisser" ||
              formData.etat === "en attente"
            ) {
              setBillet(true);
            }
          } else {
            form.reportValidity();
          }
        }}
      >
        <div className="facture-gauche">
          {error && <p className="error">{error}</p>}
          <div className="navigation-buttons">
            <div className="div-bt-gauche">
              <button
                type="button"
                className={currentView === "machines" ? "active" : ""}
                onClick={() => {
                  setCurrentView("machines");
                  setCurrent("client");
                }}
              >
                <FaTools className="icon" style={{ color: "#4CAF50" }} />
                <span>Machines</span>
              </button>
              <button
                type="button"
                className={currentView === "produits" ? "active" : ""}
                onClick={() => {
                  setCurrentView("produits");
                  setCurrent("client");
                }}
              >
                <FaBoxOpen className="icon" style={{ color: "#FF9800" }} />{" "}
                <span>Produits</span>
              </button>
              <button
                type="button"
                className={currentView === "en-attente" ? "active" : ""}
                onClick={() => {
                  setCurrentView("en-attente");
                  setCurrent("factures");
                }}
              >
                <FaHourglassHalf
                  className="icon"
                  style={{ color: "#2196F3" }}
                />
                <span>En Attente</span>
              </button>
              <button
                type="button"
                className={currentView === "factures" ? "active" : ""}
                onClick={() => {
                  setCurrentView("factures");
                  setCurrent("factures");
                }}
              >
                <FaFileInvoice className="icon" style={{ color: "#9C27B0" }} />
                <span>Factures</span>
              </button>

              {currentView === "machines" && (
                <div className="recherche">
                  <input
                    className="input"
                    type="text"
                    placeholder="numero"
                    value={searchM}
                    onChange={(e) => setSearchT(e.target.value)}
                  />
                  <FaSearch className="icon" />
                </div>
              )}

              {currentView === "produits" && (
                <div className="recherche">
                  <input
                    className="input"
                    type="text"
                    placeholder="Chercher Produits"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <FaSearch className="icon" />
                </div>
              )}
            </div>
            {/* <div className="div-bt-droite"></div> */}
          </div>
          {current === "client" && (
            <div className="client">
              <div className="client-input">
                <div className="client-choix">
                  <input
                    className="custom-checkbox"
                    type="checkbox"
                    id="cheqChoix"
                    checked={isChoix}
                    onChange={(e) => {
                      const checked = e.target.checked;

                      // Mettre à jour `isChoix`
                      setIsChoix(checked);

                      if (!checked) {
                        // Si la case est décochée, réinitialisez les quantités
                        setOfferedQuantities((prev) =>
                          Object.keys(prev).reduce((acc, key) => {
                            acc[key] = 0; // Remet tout à zéro
                            return acc;
                          }, {})
                        );
                      }
                    }}
                  />

                  <span htmlFor="cheqChoix">Abonnement</span>
                </div>

                <div className="nom-input">
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="client nom"
                    value={formData.customerName}
                    onFocus={() => setShowClientList(true)} // Afficher la liste au focus
                    onBlur={() =>
                      setTimeout(() => setShowClientList(false), 200)
                    }
                    onChange={onChanges}
                  />
                  {showClientList && (
                    <div
                      className={`client-list ${
                        clients.filter((client) =>
                          client.name
                            .toLowerCase()
                            .includes(formData.customerName.toLowerCase())
                        ).length === 0
                          ? "no-border"
                          : ""
                      }`}
                    >
                      {clients
                        .filter((client) => {
                          const matchesName = client.name
                            .toLowerCase()
                            .includes(formData.customerName.toLowerCase());

                          // Filtrer également en fonction de isChoix
                          const matchesAbonnement =
                            !isChoix ||
                            abonnementClients.some(
                              (abonnement) =>
                                abonnement.idClient.toString() === client._id
                            );

                          return matchesName && matchesAbonnement; // Retourne true si le client correspond au nom et à la condition d'abonnement
                        })
                        .map((client) => (
                          <div
                            key={client._id}
                            className="client-item"
                            onClick={() => handleClientSelect(client)}
                          >
                            <div className="client-span">
                              <span>{client.name}</span>
                              <span>{client.contact}</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                <input
                  required
                  type="text"
                  name="contact"
                  placeholder="client contact"
                  value={formData.contact}
                  onChange={onChanges}
                />
              </div>

              <div>
                <input
                  style={{ visibility: "hidden", position: "absolute" }}
                  type="text"
                  placeholder="Rechercher un client"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          {/* Formulaire */}
          <div className="view-ticket">
            {currentView === "factures" && current === "factures" && (
              <div onClick={(e) => e.stopPropagation()}>
                <FactureList
                  className="factures"
                  onEdit={handleEdit}
                  onViewDetails={handleDetails}
                />
              </div>
            )}

            {currentView === "en-attente" && current === "factures" && (
              <div onClick={(e) => e.stopPropagation()}>
                <FactureList
                  className="factures"
                  onEdit={handleEdit}
                  onViewDetails={handleDetails}
                  etatFilter="en attente" // Filtrer les factures "en attente"
                />
              </div>
            )}

            {/* listes des machine */}
            {currentView === "machines" && (
              <div className="machines">
                <div className="machine-input">
                  {/* <select onChange={handleOptionChange} value={selectedOption}>
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Aucune option disponible</option>
                  )}
                </select> */}

                  <input
                    placeholder="poids total"
                    type="number"
                    name="totalWeight"
                    value={formData.totalWeight}
                    onChange={handleChange}
                    readOnly
                  />
                  <button
                    className="facturePrint-btn"
                    type="button"
                    onClick={facturesPrint}
                  >
                    <FaSave className="icon" />
                    facture
                  </button>
                  <select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={onChanges}
                  >
                    <option value="Lavage">Lavage</option>
                    <option value="Séchage">Séchage</option>
                    <option value="Lavage + Séchage">Lavage + Séchage</option>
                  </select>
                </div>
                <div className="machine-ul">
                  {handleSearchM().map((machine) => (
                    <div
                      key={machine._id}
                      className={`machine-list ${
                        selectedMachines.includes(machine._id) ? "selected" : ""
                      }`}
                      onClick={() => handleMachineClick(machine._id)}
                    >
                      {machine.photo && (
                        <img
                          src={`http://localhost:5000/${machine.photo}`}
                          alt={machine.name}
                          style={{
                            width: "150px",
                            height: "150px",
                            borderRadius: "50%",
                            maxWidth: "150PX",
                          }}
                        />
                      )}
                      <label className="label-machine">
                        {machine.name} ({machine.type}) - {machine.modelNumber}{" "}
                        - {machine.weightCapacity} kg
                      </label>
                      {selectedMachines.includes(machine._id) && (
                        <>
                          <input
                            type="number"
                            placeholder="Poids attribué"
                            ref={(el) => (inputRefs.current[machine._id] = el)}
                            value={machineWeights[machine._id] || 1}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleWeightChange(
                                machine._id,
                                e.target.value,
                                machine.weightCapacity
                              )
                            }
                            min="1"
                            max={machine.weightCapacity}
                          />
                          {/* Sélection d'article pour chaque machine */}
                          {machine.type === "Machine à laver" && ( // <-- Vérifiez le type de machine
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                handleOptionChange(machine._id, e)
                              }
                              value={selectedOptions[machine._id] || ""}
                            >
                              {filteredOptions.length > 0 ? (
                                filteredOptions.map((option, index) => (
                                  <option key={index} value={option.value}>
                                    {option.label}
                                  </option>
                                ))
                              ) : (
                                <option value="">
                                  Aucune option disponible
                                </option>
                              )}
                            </select>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* list des produits*/}
            {currentView === "produits" && (
              <div className="produit">
                <div className="produit-ul">
                  {handleSearch().map((product) => (
                    <div
                      style={{ cursor: "pointer", position: "relative" }}
                      key={product._id}
                      className={`produit-list ${
                        selectedProducts.includes(product._id) ? "selected" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleProductClick(product._id);
                      }} // Gestion de la sélection normale du produit
                    >
                      {isChoix && (
                        <FaGift
                          className="offert-button"
                          onClick={(e) => {
                            e.stopPropagation();

                            // Vérifier si l'action doit être ignorée
                            if (
                              product.stock === (quantities[product._id] || 0)
                            ) {
                              return; // Ignorer toute autre logique
                            }

                            // Exécuter l'action normale
                            handleOffertClick(product._id);
                          }}
                          style={{
                            opacity:
                              product.stock === (quantities[product._id] || 0)
                                ? 0.5
                                : 1, // Indiquer visuellement l'état
                            cursor:
                              product.stock === (quantities[product._id] || 0)
                                ? "not-allowed"
                                : "pointer", // Gestion du curseur
                          }}
                        />
                      )}

                      {/* L'input de quantité offerte est toujours visible si une quantité offerte est définie */}
                      {offeredQuantities[product._id] > 0 && isChoix && (
                        <input
                          className="input-offert"
                          type="number"
                          placeholder="Quantité Offerte"
                          value={
                            product.stock === (quantities[product._id] || 0)
                              ? 0 // Si tout le stock est offert, quantité principale = 0
                              : offeredQuantities[product._id] || 0
                          }
                          ref={(el) => (inputRefss.current[product._id] = el)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            let value = parseInt(e.target.value, 10);
                            const maxAllowed =
                              product.stock - (quantities[product._id] || 0);

                            // Corrige la valeur si elle dépasse le max ou est invalide
                            if (isNaN(value) || value < 0) value = 0;
                            if (value > maxAllowed) value = maxAllowed;

                            handleOffertQuantityChange(
                              product._id,
                              value,
                              product.stock
                            );
                          }}
                          min="0"
                          max={product.stock - (quantities[product._id] || 0)}
                        />
                      )}

                      {product.photo && (
                        <img
                          src={`http://localhost:5000/${product.photo}`}
                          alt={product.name}
                          style={{
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            maxWidth: "140PX",
                          }}
                        />
                      )}
                      <label
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                        }}
                      >
                        <div>
                          {product.name} - stock(s) : {product.stock}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-evenly",
                            letterSpacing: "3px",
                          }}
                        >
                          <span>Prix :</span>
                          <span style={{ color: "rgb(27, 168, 117)" }}>
                            {product.price} Ar
                          </span>
                          {userRole === "admin" && (
                            <span
                              className="machine-but"
                              style={{
                                position: "absolute",
                                top: "10px",
                                right: "10px",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddStock(product);
                              }}
                            >
                              <FaPlus />
                            </span>
                          )}
                        </div>
                      </label>

                      {/* Si le produit normal est sélectionné, afficher l'input de quantité normale */}
                      {selectedProducts.includes(product._id) && (
                        <input
                          style={{
                            background: "transparent",
                            border: "2px solid gray",
                            color: "white",
                            borderRadius: "5px",
                            outline: "none",
                            textAlign: "center",
                          }}
                          type="number"
                          placeholder="Quantité"
                          ref={(el) => (inputRefs.current[product._id] = el)}
                          value={
                            product.stock ===
                            (offeredQuantities[product._id] || 0)
                              ? 0 // Si tout le stock est offert, quantité principale = 0
                              : quantities[product._id] || 0
                          }
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            let value = parseInt(e.target.value, 10);
                            const maxAllowed =
                              product.stock -
                              (offeredQuantities[product._id] || 0);

                            // Vérification des limites
                            if (isNaN(value) || value < 0) value = 0; // Si la valeur est invalide, on la remet à 0
                            if (value > maxAllowed) value = maxAllowed; // Limiter la valeur au maximum

                            handleQuantityChange(
                              product._id,
                              value,
                              product.stock
                            ); // Appel avec la valeur corrigée
                          }}
                          min="0"
                          max={
                            product.stock -
                            (offeredQuantities[product._id] || 0)
                          }
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/*facture*/}
        {/* <button onClick={handlePreview}>Prévisualiser</button> */}
        <div className="tick">
          <div className="ticket">
            <div className="prev-relative">
              {latestFacture ? (
                <div>
                  <h2>
                    Ticket N° {latestFacture.ticketNumber + 1 || 1} /{" "}
                    {new Date(Date.now()).toISOString().split("T")[0]}
                  </h2>{" "}
                </div>
              ) : (
                <p>Aucune facture trouvée</p> // Message si aucune facture n'est trouvée
              )}

              <div className="d">
                <table>
                  <thead className="thead">
                    <tr>
                      <th>QTÉ</th>
                      <th>DÉSIGNATION</th>
                      <th>MONTANT</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMachines.map((machineId) => {
                      const machine = machines.find((m) => m._id === machineId);

                      if (!machine) return null; // Vérifie que la machine existe

                      // Détermine si la machine est une machine à laver
                      const isWashingMachine =
                        machine.type === "Machine à laver";

                      // Calcule le prix en fonction du type de machine
                      let price = 0;

                      if (isWashingMachine) {
                        // Get the price for washing machines
                        // Si la machine est une machine à laver, obtenir le prix correspondant
                        const selectedOption = selectedOptions[machineId]; // Get the selected option for the specific machine
                        price = getPriceFromOption(selectedOption); // Calculer le prix à partir de l'option sélectionnée
                      } else {
                        // Calculer le prix pour d'autres types de machines (e.g., Sèche-linge)
                        const weight = machineWeights[machineId] || 1;

                        // Vérifie si la machine a des plages de prix définies
                        const priceRange = machine.priceRanges?.find(
                          (range) =>
                            weight >= range.minWeight &&
                            weight <= range.maxWeight
                        );

                        if (priceRange) {
                          price = priceRange.price; // Utiliser le prix correspondant à la plage de poids
                        } else {
                          // Si aucune plage ne correspond, appliquer un prix par défaut ou 0
                          price = 0;
                        }
                      }

                      // Appliquer la logique `isChoix` pour les deux types de machines
                      if (isChoix) {
                        price = 0; // Si 'choix' est activé, le prix est 0 pour tout type de machine
                      }

                      return (
                        <tr key={machineId}>
                          <td>1</td>
                          <td>
                            {machine?.name} ({machine?.type})
                          </td>
                          <td>{price.toFixed(2)}</td>
                          <td>
                            <button
                              onClick={() => handleRemoveMachine(machineId)}
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {selectedProducts.map((productId) => {
                      const product = products.find((p) => p._id === productId);

                      return (
                        <React.Fragment key={productId}>
                          {/* Produit normal */}
                          {quantities[productId] > 0 && (
                            <tr>
                              <td>{quantities[productId]}</td>
                              <td>{product?.name}</td>
                              <td>
                                {(quantities[productId] || 0) * product.price}{" "}
                                Ar
                              </td>
                              <td>
                                <button
                                  onClick={() => handleRemoveProduct(productId)}
                                >
                                  ❌
                                </button>
                              </td>
                            </tr>
                          )}

                          {/* Produit offert */}
                          {offeredQuantities[productId] > 0 && isChoix && (
                            <tr className="offert">
                              <td>{offeredQuantities[productId]}</td>
                              <td>{product?.name} (Offert)</td>
                              <td>0 Ar</td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleRemoveOfferedProduct(productId)
                                  }
                                >
                                  ❌
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="ambany">
                <div className="btn-facture" style={{ display: "flex" }}>
                  <button
                    type="submit"
                    className="btn-facture-green"
                    onClick={() => {
                      // Met à jour formData.etat à "encaisser" ou effectue une modification
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        etat: "encaisser", // Définir l'état sur "encaisser"
                      }));

                      // setBillet(true); // Ouvrir le modal
                    }}
                  >
                    {isEditMode ? (
                      facture.etat === "en attente" ? (
                        <>
                          <FontAwesomeIcon
                            className="icon"
                            icon={faCashRegister}
                            style={{ color: "orange", marginRight: "8px" }}
                          />
                          Encaisser
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon
                            className="icon"
                            icon={faEdit}
                            style={{ color: "orange", marginRight: "8px" }}
                          />
                          Modifier
                        </>
                      )
                    ) : (
                      <>
                        <FontAwesomeIcon
                          icon={faCashRegister}
                          style={{ color: "orange", marginRight: "8px" }}
                        />
                        Encaisser
                      </>
                    )}
                  </button>

                  {isEditMode && (
                    <button
                      type="button"
                      className="btn-facture-cancel"
                      onClick={handleCancel}
                    >
                      {" "}
                      <FontAwesomeIcon
                        icon={faTimes}
                        style={{ color: "orange", marginRight: "8px" }}
                      />
                      Annuler
                    </button>
                  )}

                  <button
                    type="submit"
                    className="btn-facture-red"
                    onClick={() => {
                      // Met à jour formData.etat à "en attente"
                      setFormData((prevFormData) => ({
                        ...prevFormData,
                        etat: "en attente", // Définir l'état sur "en attente"
                      }));

                      // setBillet(true); // Ouvrir le modal
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faClock}
                      style={{ color: "orange", marginRight: "8px" }}
                    />
                    En attente
                  </button>
                </div>
                <span className="traces"></span>
                <span style={{ marginBottom: "10px", marginTop: "10px" }}>
                  Prix Total:
                  <span
                    style={{ color: "rgb(13, 127, 61)", fontWeight: "600" }}
                  >
                    {" "}
                    {calculateTotalPrice()} Ar
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {modalInfo && <ModalInfo message={message} onOk={onOk} />}
        {billet && (
          <div className="billetage" onClick={() => setBillet(false)}>
            <div
              className="billetage-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="close">
                <button onClick={() => setBillet(false)}>❌</button>
              </div>
              <div className="input-class">
                <div className="input-container">
                  <input
                    required
                    type="number"
                    value={formData.totalPrice}
                    onChange={handleChanges}
                    className="input-totalPrice"
                  />
                  <label>Total à payer </label>
                </div>

                <div className="input-container">
                  <select
                    className="input-totalPrice"
                    value={selectedCaisse || ""}
                    onChange={(e) => setSelectedCaisse(e.target.value)}
                  >
                    <option value="">selectionner caisse</option>
                    {caisses.map((caisse) => (
                      <option key={caisse._id} value={caisse._id}>
                        {caisse.nom}(solde : {caisse.solde})
                      </option>
                    ))}
                  </select>
                  <label>Caisse </label>
                </div>

                <div className="input-container autre">
                  <select
                    className="input-totalPrice"
                    value={selectedPaymentType || ""}
                    onChange={handlePaymentTypeChange}
                  >
                    <option value="">type de paiement</option>
                    {paymentTypes.map((type) => (
                      <option key={type._id} value={type.type}>
                        {type.type}
                      </option>
                    ))}
                    <option value="autre">Autre</option>
                  </select>
                  <label>Type</label>
                  {selectedPaymentType === "autre" && (
                    <input
                      className="autres"
                      type="text"
                      placeholder="autre"
                      onChange={(e) => setNewPaymentType(e.target.value)}
                      value={newPaymentType}
                    />
                  )}
                </div>
              </div>
              <div className="billets">
                {selectedCaisse && (
                  <div className="billets-container">
                    <div className="bill-buttons-container">
                      {Object.keys(billBreakdown).map((billValue) => (
                        <button
                          key={billValue}
                          className="bill-button"
                          onClick={() => handleBillClick(billValue)}
                        >
                          {billValue} Ar
                        </button>
                      ))}
                    </div>

                    <div className="summary-container">
                      <div className="input-container">
                        <input
                          type="number"
                          value={manualInput}
                          onChange={handleManualInputChange}
                          className="input-totalPrice"
                          required
                          placeholder="Entrez le montant"
                        />
                        <label>Total recue </label>
                      </div>
                      <div className="reste">
                        <span> reste :</span>
                        {remainingAmount > 0 ? remainingAmount : 0} Ar
                      </div>
                      <div className="reste">
                        <span> A rendre :</span> {changeToGive} Ar
                      </div>
                      <div className="billetage-confirm">
                        <button onClick={handleConfirmClick}>
                          <FaSave className="icon" />
                          Confirmer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}
              </div>
            </div>
          </div>
        )}
      </form>
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
                    width: "100px",
                    height: "50px",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              </div>
              <div className="company-details">
                <div className="info">
                  <span className="name-entrprise">
                    {" "}
                    <p style={{ margin: 0 }}>{companyInfo.name}</p>
                  </span>
                  <span>
                    <p style={{ margin: 0 }}>{companyInfo.phone}</p>
                  </span>
                  <span>
                    <p style={{ margin: 0 }}>{companyInfo.address}</p>
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
              <span className="facture-num">
                FACTURE N° {latestFacture.ticketNumber + 1 || 1}{" "}
                {/* {new Date(Date.now()).toISOString().split("T")[0]} */}
              </span>
            ) : (
              <p>Aucune facture trouvée</p> // Message si aucune facture n'est trouvée
            )}
            <p>Date : {new Date(Date.now()).toISOString().split("T")[0]}</p>
            <span>Doit à : {formData.customerName}</span>
            <p>Tèl : {formData.contact}</p>
          </div>
        </div>

        {/* <p style={{ fontSize: "16px", margin: 0, padding: "5px 0" }}>
            Poids Total: {formData.totalWeight} kg
          </p>
          <p style={{ fontSize: "16px", margin: 0, padding: "5px 0" }}>
            Prix Total: {formData.totalPrice} Ar
          </p> */}

        <div className="dd">
          <table>
            <thead>
              <tr>
                <th>QTÉ</th>
                <th>DÉSI</th>
                <th>PU</th>
                <th>MONTANT</th>
              </tr>
            </thead>
            <tbody>
              {selectedMachines.map((machineId) => {
                const machine = machines.find((m) => m._id === machineId);

                if (!machine) return null; // Vérifie que la machine existe

                // Détermine si la machine est une machine à laver
                const isWashingMachine = machine.type === "Machine à laver";

                // Calcule le prix en fonction du type de machine
                let price = 0;

                if (isWashingMachine) {
                  // Get the price for washing machines
                  // Si la machine est une machine à laver, obtenir le prix correspondant
                  const selectedOption = selectedOptions[machineId]; // Get the selected option for the specific machine
                  price = getPriceFromOption(selectedOption); // Calculer le prix à partir de l'option sélectionnée
                } else {
                  // Calculer le prix pour d'autres types de machines (e.g., Sèche-linge)
                  const weight = machineWeights[machineId] || 1;

                  // Vérifie si la machine a des plages de prix définies
                  const priceRange = machine.priceRanges?.find(
                    (range) =>
                      weight >= range.minWeight && weight <= range.maxWeight
                  );

                  if (priceRange) {
                    price = priceRange.price; // Utiliser le prix correspondant à la plage de poids
                  } else {
                    // Si aucune plage ne correspond, appliquer un prix par défaut ou 0
                    price = 0;
                  }
                }

                // Appliquer la logique `isChoix` pour les deux types de machines
                if (isChoix) {
                  price = 0; // Si 'choix' est activé, le prix est 0 pour tout type de machine
                }

                return (
                  <tr key={machineId}>
                    <td>1</td>
                    <td>
                      {(() => {
                        const weight = machineWeights[machineId]
                          ? `(${machineWeights[machineId]} kg)`
                          : ""; // Poids toujours affiché

                        // Articles uniquement pour Machine à laver
                        const articleTypes =
                          machine?.type === "Machine à laver"
                            ? selectedArticleDetails
                                ?.filter(
                                  (detail) => detail.machineId === machineId
                                )
                                .map((detail) => detail.type)
                                .join(", ")
                            : "";

                        const articleTypesDisplay = articleTypes
                          ? `(${articleTypes})`
                          : "";

                        // Construire la sortie selon le type
                        if (machine?.type === "Machine à laver") {
                          return `Lavage ${weight} ${articleTypesDisplay}`;
                        } else if (machine?.type === "Sèche-linge") {
                          return `Séchage ${weight}`;
                        } else {
                          return `${weight}`; // Poids affiché pour d'autres types de machines
                        }
                      })()}
                    </td>

                    <td>{price.toFixed(0)}</td>
                    <td>{price.toFixed(0)}</td>
                  </tr>
                );
              })}

              {(selectedProducts || []).map((productId) => {
                const product = (products || []).find(
                  (p) => p._id === productId
                );
                if (!product) return null;

                return (
                  <React.Fragment key={productId}>
                    {quantities[productId] > 0 && (
                      <tr>
                        <td>{quantities[productId]}</td>
                        <td>{product.name}</td>
                        <td>{product.price}</td>
                        <td>{(quantities[productId] || 0) * product.price}</td>
                      </tr>
                    )}
                    {offeredQuantities[productId] > 0 && (
                      <tr className="offert">
                        <td>{offeredQuantities[productId]}</td>
                        <td>{product.name} (Offert)</td>
                        <td>0 </td>
                        <td>0</td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                {remainingAmount > 0 && (
                  <td className="total" colSpan="6">
                    <strong>
                      <span>Reste </span>
                      <span className="reste">
                        <span>
                          {" "}
                          {remainingAmount > 0 ? remainingAmount : 0}
                        </span>
                        <span>Ar</span>
                      </span>
                    </strong>
                  </td>
                )}
              </tr>
              <tr>
                <td className="total" colSpan="6">
                  <strong>
                    <span>Total </span>
                    <span className="reste">
                      <span>{Math.round(formData.totalPrice)}</span>
                      <span>Ar</span>
                    </span>
                  </strong>
                </td>
              </tr>
            </tfoot>
          </table>

          {/* <p>Total : {formData.totalPrice}</p>
          <p style={{ fontSize: "16px", margin: "10px 0", fontWeight: "bold" }}>
            Reste à payer : {remainingAmount > 0 ? remainingAmount : 0} Ar
          </p> */}
        </div>
      </div>
      <ToastContainer />
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
    </div>
  );
};

export default FactureForm;
