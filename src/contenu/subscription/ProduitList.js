import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ProductModal from "./ProduitModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faBoxOpen,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import "../css/Products.css";
import { FaSave, FaTimes } from "react-icons/fa";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalStock, setModalStock] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const fetchProducts = async (term) => {
    try {
      const result = await axios.get(
        "http://localhost:5000/api/products/search",
        {
          params: { search: term },
        }
      );
      setProducts(result.data);
      setCurrentProduct(
        result.data.find((prod) => prod._id === currentProduct?._id) || null
      );
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const result = await axios.get("http://localhost:5000/api/products");
      setProducts(result.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleSaveProduct = async (formData) => {
    const token = localStorage.getItem("token"); // Récupération du token d'authentification

    try {
      if (currentProduct?._id) {
        // Mise à jour du produit
        await axios.put(
          `http://localhost:5000/api/products/${currentProduct._id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`, // Ajout de l'en-tête d'autorisation
            },
          }
        );
      } else {
        // Ajout d'un nouveau produit
        const result = await axios.post(
          "http://localhost:5000/api/products",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`, // Ajout de l'en-tête d'autorisation
            },
          }
        );
        setCurrentProduct(result.data);
      }

      // Récupérer à nouveau tous les produits après ajout ou mise à jour
      await fetchAllProducts();
      setIsModalOpen(false); // Ferme la modale après l'ajout ou la mise à jour
    } catch (error) {
      console.error("Error saving product:", error);
      // Vous pouvez afficher un message d'erreur à l'utilisateur ici
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      setCurrentProduct(currentProduct?._id === id ? null : currentProduct);
      await fetchAllProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleAddStock = (product) => {
    setSelectedProduct(product);
    setModalStock(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleModalSubmit = async () => {
    const stockToAdd = parseInt(quantity, 10);
    if (!isNaN(stockToAdd) && stockToAdd > 0) {
      try {
        await axios.put(
          `http://localhost:5000/api/products/${selectedProduct._id}`,
          {
            ...selectedProduct,
            stock: selectedProduct.stock + stockToAdd,
          }
        );
        await fetchAllProducts();
        setModalStock(false);
        setQuantity("");
      } catch (error) {
        console.error("Error adding stock:", error);
      }
    } else {
      alert("Quantité de stock non valide");
    }
  };

  const handleAddButtonClick = () => {
    setCurrentProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="products-container">
      <div className="search-container">
        <div className="input-search">
          <div className="input">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <FontAwesomeIcon icon={faSearch} className="icon" />
          </div>
          <button onClick={handleAddButtonClick} className="add-button">
            <FontAwesomeIcon icon={faPlus} /> Ajouter un Produit
          </button>
        </div>
      </div>

      <table className="products-table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Nom</th>
            <th>Prix</th>
            <th>Stock</th>
            <th>Description</th>
            <th className="action">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="6">Aucun produit disponible</td>
            </tr>
          ) : (
            products.map((product) => (
              <tr key={product._id}>
                <td>
                  {product.photo && (
                    <img
                      src={`http://localhost:5000/${product.photo}`}
                      alt={product.name}
                      className="product-image"
                    />
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.price} €</td>
                <td>{product.stock}</td>
                <td>{product.description}</td>
                <td className="action">
                  <FontAwesomeIcon
                    onClick={() =>
                      setCurrentProduct(product) || setIsModalOpen(true)
                    }
                    className="edit-button"
                    icon={faEdit}
                  />
                  <FontAwesomeIcon
                    onClick={() => handleDeleteProduct(product._id)}
                    className="delete-button icon"
                    icon={faTrash}
                  />

                  <FontAwesomeIcon
                    onClick={() => handleAddStock(product)}
                    className="stock-button icon"
                    icon={faBoxOpen}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {modalStock && (
        <div className="modal-overlay">
          <form className="modal-stock" onSubmit={handleModalSubmit}>
            <h2>Ajouter Stock</h2>
            <div className="modal-stock-input">
              <input
                type="number"
                value={quantity}
                required
                onChange={(e) => setQuantity(e.target.value)}
                placeholder=""
                min="1"
                ref={inputRef}
                className="quantity-input"
              />
              <label>Quantité</label>
            </div>
            <div className="modal-buttons">
              <button className="btn-sub" type="submit">
                <FaSave />
                Soumettre
              </button>
              <button
                className="btn-c"
                type="button"
                onClick={() => setModalStock(false)}
              >
                <FaTimes /> Fermer
              </button>
            </div>
          </form>
        </div>
      )}

      {isModalOpen && (
        <ProductModal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          product={currentProduct}
        />
      )}
    </div>
  );
};

export default Products;
