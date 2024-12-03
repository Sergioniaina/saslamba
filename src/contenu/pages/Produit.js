import React, { useState, useEffect } from "react";
import axios from "axios";
import "./produitstock.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTimes,
  faCheck,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

const ProductStockForm = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState(""); // État pour le champ de recherche

  // Charger tous les produits depuis le backend
  useEffect(() => {
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get("http://localhost:5000/api/products",{
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
      const response = await axios.get("http://localhost:5000/api/products",{
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
      await axios.post("http://localhost:5000/api/products/update-stock", 
        { stockUpdates }, // Le corps de la requête
        {
          headers: {
            "Content-Type": "application/json", // Spécifier le type de contenu
            Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
          }
        }
      );
      alert("Quantités mises à jour avec succès !");
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
          <button onClick={handleSubmit} className="submit-button">
            <FontAwesomeIcon className="icon" icon={faCheck} /> Valider les quantités
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
                    <FontAwesomeIcon className="icon" icon={faPlus} /> Sélectionner
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {/* Bouton Valider qui apparaît uniquement si des produits sont sélectionnés */}
    </div>
  );
};

export default ProductStockForm;
