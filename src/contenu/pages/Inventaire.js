import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTimes,
  faCheck,
  faTrash,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import "./ProductInventory.css";
import ModalConfirm from "../modal/ModalConfirm";
import * as XLSX from "xlsx";
import { FaFileExcel } from "react-icons/fa";
const PORT = process.env.REACT_APP_BACKEND_URL;

const API_URL = `${PORT}/api/products`;
const HISTORIQUE_URL = `${PORT}/api/historique`;
const USER_URL = `${PORT}/api/auth/get`; // Nouvel endpoint pour récupérer les utilisateurs

const ProductInventory = () => {
  const [products, setProducts] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [users, setUsers] = useState({});
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTerms, setSearchTerms] = useState("");
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const [userPrivileges, setUserPrivileges] = useState(null);
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  useEffect(() => {
    fetchProducts();
    fetchHistorique();
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setProducts(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des produits", error);
    }
  };
  const fetchHistorique = async () => {
    try {
      const response = await axios.get(HISTORIQUE_URL);
      const inventaireHistorique = response.data.filter(
        (h) => h.action.toLowerCase() === "inventaire"
      );
      setHistorique(inventaireHistorique);

      // Extract unique user IDs from the historique data
      const userIds = [
        ...new Set(inventaireHistorique.map((h) => h.user).filter(Boolean)),
      ];
      if (userIds.length > 0) fetchUsers(userIds); // Pass unique IDs to fetchUsers
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique", error);
    }
  };

  const fetchUsers = async (userIds) => {
    try {
      const response = await axios.get(USER_URL, {
        params: { ids: userIds },
      });
      const usersById = response.data.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersById);
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs", error);
    }
  };

  const handleDeleteHistorique = async (id) => {
    try {
      await axios.delete(`${HISTORIQUE_URL}/${id}`);
      setHistorique((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique", error);
    }
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce Inventaire?");
    setConfirmAction(() => () => handleDeleteHistorique(id));
    setIsConfirmVisible(true);
  };
  const handleProductSelect = (product) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p._id === product._id)
        ? prev.filter((p) => p._id !== product._id)
        : [...prev, { ...product, quantityReal: product.stock, ecart: 0 }]
    );
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleQuantityChange = (id, quantity) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p._id === id) {
          const quantityReal = parseInt(quantity, 10) || 0;
          const ecart = quantityReal - p.stock;
          return { ...p, quantityReal, ecart, stockAfter: p.stock + ecart };
        }
        return p;
      })
    );
  };
  const confirmSave = async () => {
    setConfirmMessage("Voulez-vous Enregistrer cet Inventaire?");
    setConfirmAction(() => async () => {
      await handleSave();
    });
    setIsConfirmVisible(true);
  };
  const handleSave = async () => {
    const token = localStorage.getItem("token");

    const updates = selectedProducts.map((product) => {
      const { _id, stock, quantityReal, ecart } = product;
      return { _id, stock: stock + ecart, ecart, quantityReal };
    });

    try {
      await Promise.all(
        updates.map((update) =>
          axios.put(
            `${API_URL}/${update._id}`,
            { stock: update.stock, source: "Inventaire" },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      const historiquePromises = selectedProducts.map((product) => {
        const { _id, name, quantityReal, stock } = product;
        const ecart = quantityReal - stock;
        const userId = localStorage.getItem("userId"); // Récupérer l'ID de l'utilisateur

        return axios.post(
          HISTORIQUE_URL,
          {
            action: "Inventaire",
            entityType: "Product ",
            entityId: _id,
            userId: userId, // Enregistrer l'ID utilisateur
            date: new Date(),
            details: `Inventaire mis à jour : ${name} - Quantité réelle : ${quantityReal}, Écart : ${ecart}, quantité en stock : ${stock}`,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      });

      await Promise.all(historiquePromises);

      setSelectedProducts([]);
      setShowModal(false);
      fetchHistorique();
      fetchProducts();
      console.log(
        "Mise à jour de l'inventaire et enregistrement de l'historique réussis."
      );
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'inventaire", error);
      alert(
        "Une erreur est survenue lors de la sauvegarde. Veuillez réessayer."
      );
    }
  };

  const handleCancelSelection = (id) => {
    setSelectedProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistorique = historique.filter((item) => {
    const produit = products.find((prod) => prod._id === item.entityId);
    return produit
      ? produit.name.toLowerCase().includes(searchTerms.toLowerCase())
      : false;
  });
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {
      // Récupérer les privilèges de l'utilisateur via l'API
      axios
        .get(`${PORT}/api/privileges`, {
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
            //console.log("Privilèges de l'utilisateur :", privileges);
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
  }, []);
  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".inventory-table").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table.querySelectorAll("th.action, td.action").forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Inventaire" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "inventaire.xlsx");
  };
  const confirmExcel = (id) => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
  };

  return (
    <div className="inventaire">
      <div className="search">
        <button
          className="new-inventory-button"
          onClick={() => setShowModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} /> Nouveau Inventaire
        </button>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
          />
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
        </div>
        <button onClick={confirmExcel} className="export-button">
          <FaFileExcel
            style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
          />
          Exporter en Excel
        </button>
      </div>
      <div className="iventaire-t">
      <table className="inventory-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Produit</th>
            <th>Quantité Réelle</th>
            <th>Écart</th>
            <th>Quantité en Stock</th>
            <th>Stock après Inventaire</th>
            <th>Utilisateur</th>
            {userPrivileges?.produits?.includes("delete") && (
              <th className="action">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredHistorique.map((item) => {
            const produit = products.find((prod) => prod._id === item.entityId);
            //const user = users.find((prod) => prod._id === item.user);
            const user = users[item.user];
            const detailsParsed = item.details.match(
              /Quantité réelle : (\d+), Écart : (-?\d+), quantité en stock : (\d+)/
            );
            const quantityReal = detailsParsed ? detailsParsed[1] : "N/A";
            const ecart = detailsParsed ? detailsParsed[2] : "N/A";
            const stock = detailsParsed
              ? detailsParsed[3]
              : produit?.stock || "N/A";
            const stockAfterInventory = parseInt(stock) + parseInt(ecart);
            return (
              <tr key={item._id}>
                <td>{new Date(item.date).toLocaleString()}</td>
                <td>{produit ? produit.name : "Nom non trouvé"}</td>
                <td>{quantityReal}</td>
                <td>{ecart}</td>
                <td>{stock}</td>
                <td>{stockAfterInventory}</td>
                <td>{user}</td>
                {userPrivileges?.produits?.includes("delete") && (
                  <td className="action">
                    <button
                      onClick={() => confirmDelete(item._id)}
                      className="delete-button"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>

      {showModal && (
        <div className="modal-inventaire" onClick={() => setShowModal(false)}>
          <div
            className="modal-content-inventaire"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="close" onClick={() => setShowModal(false)}>
              <FontAwesomeIcon className="close" icon={faTimes} />
            </span>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
            </div>
            <div className="inventaire-table">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th className="reel">Quantité Réelle</th>
                    <th>Écart</th>
                    <th className="action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product._id}
                      className={
                        selectedProducts.some((p) => p._id === product._id)
                          ? "selected"
                          : ""
                      }
                    >
                      <td>{product.name}</td>
                      <td>{product.price} Ar</td>
                      <td>{product.stock}</td>
                      {selectedProducts.some((p) => p._id === product._id) ? (
                        <>
                          <td>
                            <input
                              ref={inputRef}
                              type="number"
                              value={
                                selectedProducts.find(
                                  (p) => p._id === product._id
                                )?.quantityReal || ""
                              }
                              onChange={(e) =>
                                handleQuantityChange(
                                  product._id,
                                  e.target.value
                                )
                              }
                              className="quantity-input"
                            />
                          </td>
                          <td>
                            {selectedProducts.find((p) => p._id === product._id)
                              ?.ecart || 0}
                          </td>
                          <td>
                            <button
                              onClick={() => handleCancelSelection(product._id)}
                              className="cancel-button"
                            >
                              <FontAwesomeIcon icon={faTimes} /> Annuler
                            </button>
                          </td>
                        </>
                      ) : (
                        <td colSpan={3}>
                          <button
                            onClick={() => handleProductSelect(product)}
                            className="select-button"
                          >
                            <FontAwesomeIcon icon={faCheck} /> Sélectionner
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedProducts.length > 0 && (
              <button onClick={confirmSave} className="save-button">
                <FontAwesomeIcon icon={faCheck} /> Valider l'Inventaire
              </button>
            )}
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
    </div>
  );
};

export default ProductInventory;
