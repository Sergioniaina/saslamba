import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ProductModal from "./ProduitModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import {
  faEdit,
  faTrash,
  faPlus,
  faSearch,
  faBoxOpen,
  faEllipsisV,
} from "@fortawesome/free-solid-svg-icons";
import "../css/Products.css";
import { FaSave, FaTimes } from "react-icons/fa";
import ModalConfirm from "../modal/ModalConfirm";

const Products = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
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
  const [openMenuId, setOpenMenuId] = useState(null); // Stocke l'ID du menu ouvert
  // Fonction pour basculer l'affichage du menu
  const toggleMenu = (e, id) => {
    e.stopPropagation(); // Empêche la propagation de l'événement
    setOpenMenuId(openMenuId === id ? null : id); // Ferme si déjà ouvert, sinon ouvre
  };

  useEffect(() => {
    fetchAllProducts();
    // eslint-disable-next-line
  }, []);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUser(user);
    if (user) {
      // Récupérer les privilèges de l'utilisateur via l'API
      axios
        .get(`${PORT}/api/privileges`, {
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
  }, [PORT]);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setUser(user);
  }, []);

  const fetchAllProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const result = await axios.get(`${PORT}/api/products`, {
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
          `${PORT}/api/products/${currentProduct._id}`,
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
        const result = await axios.post(`${PORT}/api/products`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`, // Ajout de l'en-tête d'autorisation
          },
        });
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
      await axios.delete(`${PORT}/api/products/${id}`, {
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

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const stockToAdd = parseInt(quantity, 10);
    const token = localStorage.getItem("token");
    if (!isNaN(stockToAdd) && stockToAdd > 0) {
      try {
        await axios.put(
          `${PORT}/api/products/${selectedProduct._id}`,
          {
            ...selectedProduct,
            stock: selectedProduct.stock + stockToAdd,
            source: "Entrer en stock",
          },
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`, // Ajout de l'en-tête d'autorisation
            },
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
  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".products-table").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table
      .querySelectorAll("th.actions, td.actions", "th.image, td.image")
      .forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Stock" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "stock.xlsx");
  };
  const confirmExcel = () => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
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
          {userPrivileges?.produits?.includes("add") && (
            <button onClick={handleAddButtonClick} className="add-button">
              <FontAwesomeIcon icon={faPlus} /> Ajouter un Produit
            </button>
          )}
          <button onClick={confirmExcel} className="export-button">
            <FaFileExcel
              style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
            />
            Exporter en Excel
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
              <th>StockAlerte</th>
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
                      src={`${PORT}/${product.photo}`}
                      alt={product.name}
                      className="product-image"
                    />
                  )}
                </td>
                <td>{product.name}</td>
                <td>{product.price} Ar</td>
                <td
                  style={{
                    backgroundColor:
                      product.stock <= product.stockAlerte
                        ? "red"
                        : "transparent",
                    color:
                      product.stock <= product.stockAlerte ? "white" : "white",
                  }}
                >
                  {product.stock}
                </td>
                <td>{product.stockAlerte}</td>
                <td>{product.description}</td>
                <td className="action">
                  <button
                    className="dropdown-btn"
                    type="button"
                    onClick={(e) => toggleMenu(e, product._id)}
                  >
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </button>
                  <div className={`menu-action ${openMenuId === product._id ? "show" : ""}`}>
                  {userPrivileges?.produits?.includes("edit") && (
                    <button  onClick={() =>
                      setCurrentProduct(product) || setIsModalOpen(true)
                    }>
                      <FontAwesomeIcon
                      className="edit-button icon"
                      data-tooltip-id="edit"
                      icon={faEdit}
                    />
                    </button>
                  )}
                  {userPrivileges?.produits?.includes("delete") && (
                    <button>
                      <FontAwesomeIcon
                      onClick={() => confirmDelete(product._id)}
                      className="delete-button icon"
                      data-tooltip-id="delete"
                      icon={faTrash}
                    />
                    </button>
                  )}
                  <button>
                  <FontAwesomeIcon
                    onClick={() => handleAddStock(product)}
                    className="stock-button icon"
                    data-tooltip-id="ajouter-stock"
                    icon={faBoxOpen}
                  />
                  </button>
                  </div>
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
