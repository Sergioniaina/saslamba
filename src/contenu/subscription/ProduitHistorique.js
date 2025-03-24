import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCalendar, FaSearch, FaTrash } from "react-icons/fa";
import "./historique.css";
import ModalConfirm from "../modal/ModalConfirm";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";

const HistoriqueProducts = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [historiqueData, setHistoriqueData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [productNameFilter, setProductNameFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const [userPrivileges, setUserPrivileges] = useState(null);
  // eslint-disable-next-line
  const [user, setUser] = useState("");
  useEffect(() => {
    const fetchHistorique = async () => {
      try {
        const response = await axios.get(
          `${PORT}/api/historique`,
          {}
        );
        const filteredData = response.data.filter(
          (entry) =>
            entry.entityType === "Product" && entry.action === "Entrer en stock"
        );
        setHistoriqueData(filteredData);

        const productIds = [
          ...new Set(filteredData.map((entry) => entry.entityId)),
        ];
        const userIds = [...new Set(filteredData.map((entry) => entry.user))];
        const token = localStorage.getItem("token");

        const [productResponse, userResponse] = await Promise.all([
          axios.get(`${PORT}/api/products`, {
            params: { ids: productIds },
            headers: {
              Authorization: `Bearer ${token}`, // Ajout de l'en-tête d'autorisation
            },
          }),
          axios.get(`${PORT}/api/auth/get`, {
            params: { ids: userIds },
          }),
        ]);

        setProducts(productResponse.data);
        setUsers(userResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique", error);
      }
    };

    fetchHistorique();
  }, [PORT]);
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
    const filterHistorique = () => {
      setFilteredData(
        historiqueData.filter((entry) => {
          const product = products.find((p) => p._id === entry.entityId);
          const user = users.find((u) => u._id === entry.user);

          const matchesProductName =
            productNameFilter === "" ||
            (product &&
              product.name
                .toLowerCase()
                .includes(productNameFilter.toLowerCase()));
          const matchesUserName =
            userNameFilter === "" ||
            (user &&
              user.name.toLowerCase().includes(userNameFilter.toLowerCase()));
          const matchesDateRange =
            (!startDate || new Date(entry.date) >= new Date(startDate)) &&
            (!endDate || new Date(entry.date) <= new Date(endDate));

          return matchesProductName && matchesUserName && matchesDateRange;
        })
      );
    };

    filterHistorique();
  }, [
    productNameFilter,
    userNameFilter,
    startDate,
    endDate,
    historiqueData,
    products,
    users,
  ]);

  const deleteHistorique = async (id) => {
    try {
      await axios.delete(`${PORT}/api/historique/${id}`);
      setHistoriqueData(historiqueData.filter((entry) => entry._id !== id));
      toast.success("historique supprimer avec succes");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique", error);
    }
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce Historique?");
    setConfirmAction(() => () => deleteHistorique(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".entrer-excel").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table.querySelectorAll("th.action, td.action").forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Entrer" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "entrer.xlsx");
  };
  const confirmExcel = () => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
  };
  return (
    <div className="historique-container">
      <div className="filter-container">
        <div className="input">
          <input
            type="text"
            value={productNameFilter}
            onChange={(e) => setProductNameFilter(e.target.value)}
            required
            placeholder=" "
          />
          <label>Nom du produit</label>
          <FaSearch className="icon" />
        </div>
        <div className="input">
          <input
            type="text"
            value={userNameFilter}
            onChange={(e) => setUserNameFilter(e.target.value)}
            required
            placeholder=" "
          />
          <label>Nom d'Utilisateur</label>
          <FaSearch className="icon" />
        </div>
        <div className="date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            placeholder=" "
          />
          <label>Date debut</label>
          <FaCalendar className="icon" />
        </div>
        <div className="date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
            placeholder=" "
          />
          <label>Date fin</label>
          <FaCalendar className="icon" />
        </div>
        <button onClick={confirmExcel} className="export-button">
          <FaFileExcel
            style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
          />
          Exporter en Excel
        </button>
      </div>
      <div className="table">
        <table className="entrer-excel">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Date</th>
              <th>Stock Avant</th>
              <th>Stock Entré</th>
              <th>Stock Après</th>
              <th>Utilisateur</th>
              {userPrivileges?.produits?.includes("delete") && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry, index) => {
              const product = products.find((p) => p._id === entry.entityId);
              const user = users.find((u) => u._id === entry.user);

              return (
                <tr key={index}>
                  <td>{product ? product.name : "Produit non trouvé"}</td>
                  <td>{new Date(entry.date).toLocaleString()}</td>
                  <td>
                    {entry.details.includes("Stock avant")
                      ? entry.details.match(/Stock avant : (\d+)/)?.[1] || ""
                      : ""}
                  </td>
                  <td>
                    {entry.details.includes("Stock entré")
                      ? entry.details.match(/Stock entré : (\d+)/)?.[1] || ""
                      : ""}
                  </td>
                  <td>
                    {entry.details.includes("Stock après")
                      ? entry.details.match(/Stock après : (\d+)/)?.[1] || ""
                      : ""}
                  </td>

                  <td>{user ? user.name : "Utilisateur non trouvé"}</td>
                  {userPrivileges?.produits?.includes("delete") && (
                    <td>
                      <FaTrash
                        onClick={() => confirmDelete(entry._id)}
                        className="icon"
                      />
                    </td>
                  )}
                </tr>
              );
            })}
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

export default HistoriqueProducts;
