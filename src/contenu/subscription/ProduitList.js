import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ProductModal from "./ProduitModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faBoxOpen,
} from "@fortawesome/free-solid-svg-icons";
import "../css/Products.css";
import { FaSave, FaTimes } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalStock, setModalStock] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const inputRef = useRef(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
   // eslint-disable-next-line
  const [user, setUser] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]); // For filtered products
  const [selectedType, setSelectedType] = useState("");
  const [uniqueTypes, setUniqueTypes] = useState([]);
  const [userPrivileges, setUserPrivileges] = useState(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);
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
          console.log("Réponse de l'API :", response.data);
          // Cherchez les privilèges pour le role et subRole de l'utilisateur
          const userRole = user.role;
          const userSubrole = user.subRole;
          
          // Trouvez les privilèges de l'utilisateur
          const privileges = response.data.find(
            (item) => item.role === userRole && item.subRole === userSubrole
          )?.permissions;
  
          if (privileges) {
            console.log("Privilèges de l'utilisateur :", privileges);
            setUserPrivileges(privileges);
          } else {
            console.log("Aucun privilège trouvé pour ce rôle et sous-rôle");
            setUserPrivileges([]);  // Si aucun privilège n'est trouvé
          }
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des privilèges :", error);
        });
    }
  }, []);
  
  
  
  

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUser(user);
  }, []);

  const fetchAllProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const result = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(result.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  useEffect(() => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = products.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(lowerSearchTerm);
      const matchesType =
        selectedType === "" ||
        product.description?.toLowerCase() === selectedType.toLowerCase();
      return matchesName && matchesType;
    });
    setFilteredProducts(filtered);
  }, [searchTerm, selectedType, products]);
  useEffect(() => {
    // Extract unique types whenever products change
    const types = [
      ...new Set(products.map((product) => product.description?.toLowerCase())),
    ];
    setUniqueTypes(types);
  }, [products]);

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
      setIsModalOpen(false);
      toast.success("Produit Ajouter avec succes");
      // Ferme la modale après l'ajout ou la mise à jour
    } catch (error) {
      console.error("Error saving product:", error);
      // Vous pouvez afficher un message d'erreur à l'utilisateur ici
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCurrentProduct(currentProduct?._id === id ? null : currentProduct);
      await fetchAllProducts();
      toast.success("Produit supprimer avec succes");
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce Produit?");
    setConfirmAction(() => () => handleDeleteProduct(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
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
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="type-select"
          >
            <option value="">Tous les types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <button onClick={handleAddButtonClick} className="add-button">
            <FontAwesomeIcon icon={faPlus} /> Ajouter un Produit
          </button>
        </div>
      </div>
      <div className="table-produit">
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
            {filteredProducts.map((product) => (
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
                <td>{product.price} Ar</td>
                <td>{product.stock}</td>
                <td>{product.description}</td>
                <td className="action">
                  <FontAwesomeIcon
                    onClick={() =>
                      setCurrentProduct(product) || setIsModalOpen(true)
                    }
                    className="edit-button"
                    data-tooltip-id="edit"
                    icon={faEdit}
                  />
                  {userPrivileges?.products?.includes("delete") &&
                     (
                      <FontAwesomeIcon
                        onClick={() => confirmDelete(product._id)}
                        className="delete-button icon"
                        data-tooltip-id="delete"
                        icon={faTrash}
                      />
                    )}

                  <FontAwesomeIcon
                    onClick={() => handleAddStock(product)}
                    className="stock-button icon"
                    data-tooltip-id="ajouter-stock"
                    icon={faBoxOpen}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
      <Tooltip className="tooltip" id="edit" content="Modifier" place="top" />
      <Tooltip
        className="tooltip"
        id="delete"
        content="Supprimer"
        place="top"
      />
      <Tooltip
        className="tooltip"
        id="ajouter-stock"
        content="Ajouter-stock"
        place="top"
      />
      <ToastContainer />
    </div>
  );
};

export default Products;
