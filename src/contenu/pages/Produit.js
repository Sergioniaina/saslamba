import React, { useState, useEffect } from "react";
import axios from "axios";
import "./produitstock.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faPlus,
  faTimes,
  faCheck,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import ModalConfirm from "../modal/ModalConfirm";

const ProductStockForm = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); // État pour le champ de recherche
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  const confirmSave = async () => {
    if (selectedProducts.length === 0) {
      // Si aucun produit n'est sélectionné, affiche une notification d'erreur
      toast.error(
        "Aucun produit sélectionné ! Veuillez sélectionner au moins un produit."
      );
      return;
    }

    setConfirmMessage("Voulez-vous enregistrer ces quantités ?");
    setConfirmAction(() => async () => {
      await handleSubmit();
    });
    setIsConfirmVisible(true);
  };

  // Charger tous les produits depuis le backend
  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/api/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProducts(response.data);
      } catch (error) {
        console.error("Error fetching products", error);
      }
    };
    fetchProducts();
  }, []);
  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products", error);
    }
  };
  // Gérer la sélection des produits
  const handleSelectProduct = (product) => {
    if (!selectedProducts.includes(product)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  // Gérer l'annulation de la sélection d'un produit
  const handleDeselectProduct = (product) => {
    setSelectedProducts(selectedProducts.filter((p) => p._id !== product._id));
    setQuantities((prevQuantities) => {
      const updatedQuantities = { ...prevQuantities };
      delete updatedQuantities[product._id]; // Retirer la quantité associée
      return updatedQuantities;
    });
  };

  // Gérer le changement de quantité pour chaque produit
  const handleQuantityChange = (productId, value) => {
    setQuantities({
      ...quantities,
      [productId]: value,
    });
  };

  // Soumettre les quantités sélectionnées
  const handleSubmit = async () => {
    const stockUpdates = selectedProducts.map((product) => ({
      id: product._id,
      quantity: quantities[product._id] || 0, // Si aucune quantité n'est entrée, par défaut 0
    }));

    // Récupérer le token JWT du localStorage
    const token = localStorage.getItem("token");

    try {
      // Ajouter l'en-tête Authorization avec le token JWT
      await axios.post(
        "http://localhost:5000/api/products/update-stock",
        { stockUpdates }, // Le corps de la requête
        {
          headers: {
            "Content-Type": "application/json", // Spécifier le type de contenu
            Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
          },
        }
      );
      // alert("Quantités mises à jour avec succès !");
      toast.success("entrer en stock soumis avec succès");
      setSelectedProducts([]);
      setQuantities({});
      fetchProducts();
    } catch (error) {
      console.error("Erreur lors de la mise à jour des quantités", error);
    }
  };

  // Filtrer les produits selon le terme de recherche
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="product-stock-form">
      {/* Champ de recherche */}
      <div className="input-stock">
        <div className="input">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />

          <FontAwesomeIcon icon={faSearch} className="icon" />
        </div>
        {selectedProducts.length > 0 && (
          <button onClick={confirmSave} className="submit-button">
            <FontAwesomeIcon className="icon" icon={faCheck} /> Valider les
            quantités
          </button>
        )}
      </div>
      <div className="table-stock">
        <table className="product-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Etat</th>
              <th className="action">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.stock}</td>
                <td>
                  {selectedProducts.includes(product) ? (
                    <input
                      type="number"
                      value={quantities[product._id] || ""}
                      onChange={(e) =>
                        handleQuantityChange(product._id, e.target.value)
                      }
                      className="quantity-input"
                    />
                  ) : (
                    "Non sélectionné"
                  )}
                </td>
                <td className="action">
                  {selectedProducts.includes(product) ? (
                    <button
                      onClick={() => handleDeselectProduct(product)}
                      className="cancel-button"
                    >
                      <FontAwesomeIcon icon={faTimes} /> Annuler
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectProduct(product)}
                      className="select-button"
                    >
                      <FontAwesomeIcon className="icon" icon={faPlus} />{" "}
                      Sélectionner
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ToastContainer />
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
      {/* Bouton Valider qui apparaît uniquement si des produits sont sélectionnés */}
    </div>
  );
};

export default ProductStockForm;
