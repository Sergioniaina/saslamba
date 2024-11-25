import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCalendar, FaSearch, FaTrash } from "react-icons/fa";
import "./historique.css";

const HistoriqueProducts = () => {
  const [historiqueData, setHistoriqueData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [productNameFilter, setProductNameFilter] = useState("");
  const [userNameFilter, setUserNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchHistorique = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/historique"
        );
        const filteredData = response.data.filter(
          (entry) => entry.entityType === "Product" && entry.action ==="Entrer en stock"
        );
        setHistoriqueData(filteredData);

        const productIds = [
          ...new Set(filteredData.map((entry) => entry.entityId)),
        ];
        const userIds = [...new Set(filteredData.map((entry) => entry.user))];

        const [productResponse, userResponse] = await Promise.all([
          axios.get("http://localhost:5000/api/products", {
            params: { ids: productIds },
          }),
          axios.get("http://localhost:5000/api/auth/get", {
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
  }, []);

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
      await axios.delete(`http://localhost:5000/api/historique/${id}`);
      setHistoriqueData(historiqueData.filter((entry) => entry._id !== id));
      alert("Événement historique supprimé avec succès");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'historique", error);
    }
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
          <FaSearch className="icon"/>
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
          <FaSearch className="icon"/>
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
          <FaCalendar className="icon"/>
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
          <FaCalendar className="icon"/>
        </div>
      </div>
      <div className="table">
        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th>Date</th>
              <th>Stock Avant</th>
              <th>Stock Entré</th>
              <th>Stock Après</th>
              <th>Utilisateur</th>
              <th>Actions</th>
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
                  <td>
                    <FaTrash
                      onClick={() => deleteHistorique(entry._id)}
                      className="icon"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoriqueProducts;
