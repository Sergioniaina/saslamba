import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/produitH.css"; // Importation des styles SCSS

const ProductHistory = () => {
  const [productHistory, setProductHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState("global"); // Modes: "global" ou "tous"
  const [totals, setTotals] = useState({ stockRemaining: 0, stockChange: 0 });
  const [timeFilter, setTimeFilter] = useState("all"); // Options: jour/semaine/mois/année
  const [selectedType, setSelectedType] = useState(""); // Filtrage par type

  useEffect(() => {
    const fetchProductHistory = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/product-history"
        );
        setProductHistory(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données : ", error);
      }
    };
    fetchProductHistory();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, startDate, endDate, selectedType);
  };

  const handleDateFilter = (type, value) => {
    if (type === "start") setStartDate(value);
    if (type === "end") setEndDate(value);
    applyFilters(
      searchTerm,
      type === "start" ? value : startDate,
      type === "end" ? value : endDate,
      selectedType
    );
  };

  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
    const now = new Date();
    let start, end;

    switch (value) {
      case "day":
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(start);
        end.setDate(start.getDate() + 1);
        break;
      case "week":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay()); // Début de la semaine
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1); // Début du mois
        end = new Date(start.getFullYear(), start.getMonth() + 1, 1); // Début du mois suivant
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1); // Début de l'année
        end = new Date(now.getFullYear() + 1, 0, 1); // Début de l'année suivante
        break;
      default:
        start = "";
        end = "";
    }

    setStartDate(start ? start.toISOString().split("T")[0] : "");
    setEndDate(end ? end.toISOString().split("T")[0] : "");
    applyFilters(
      searchTerm,
      start ? start.toISOString() : "",
      end ? end.toISOString() : "",
      selectedType
    );
  };

  const handleTypeFilter = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    applyFilters(searchTerm, startDate, endDate, type);
  };

  const applyFilters = (searchTerm, start, end, type) => {
    let filtered = [...productHistory];
    if (viewMode === "tous") {
      filtered = aggregateProductHistory(filtered);
    }
    filtered = filtered.filter((item) => {
      const matchesName = item.product.name.toLowerCase().includes(searchTerm);
      const matchesStartDate = start
        ? new Date(item.date) >= new Date(start)
        : true;
      const matchesEndDate = end ? new Date(item.date) <= new Date(end) : true;
      const matchesType = type ? item.type === type : true; // Filtrage par type
      return matchesName && matchesStartDate && matchesEndDate && matchesType;
    });
    setFilteredData(filtered);
    if (viewMode === "tous") calculateTotals(filtered);
  };

  const aggregateProductHistory = (history) => {
    const aggregated = {};
    history.forEach((item) => {
      if (!aggregated[item.product._id]) {
        aggregated[item.product._id] = {
          ...item,
          stockChange: item.stockChange,
          remainingStock: item.remainingStock,
        };
      } else {
        aggregated[item.product._id].stockChange += item.stockChange;
        aggregated[item.product._id].remainingStock = item.remainingStock;
      }
    });
    return Object.values(aggregated);
  };

  const calculateTotals = (filtered) => {
    const totalStockChange = filtered.reduce(
      (sum, item) => sum + item.stockChange,
      0
    );
    const totalStockRemaining = filtered.reduce(
      (sum, item) => sum + item.remainingStock,
      0
    );
    setTotals({
      stockChange: totalStockChange,
      stockRemaining: totalStockRemaining,
    });
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    if (mode === "tous") {
      const aggregatedData = aggregateProductHistory(productHistory);
      setFilteredData(aggregatedData);
      calculateTotals(aggregatedData);
    } else {
      setFilteredData(productHistory);
    }
  };

  return (
    <div className="product-history">
      {/* <h1>Historique des Produits</h1> */}

      <div className="view-buttons">
        <button
          onClick={() => handleViewChange("global")}
          className={viewMode === "global" ? "active" : ""}
        >
          Historique Global
        </button>
        <button
          onClick={() => handleViewChange("tous")}
          className={viewMode === "tous" ? "active" : ""}
        >
          Historique Tous Produits
        </button>
      </div>

      <div className="filters">
        <div className="filter-groupe">
          <input
            type="text"
            placeholder="Rechercher par nom de produit"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>

        <div className="filter-groupe">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateFilter("start", e.target.value)}
            placeholder=""
          />
          <label>Date début:</label>
        </div>
        <div className="filter-groupe">
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateFilter("end", e.target.value)}
          />
          <label>Date fin:</label>
        </div>
        <div className="filter-groupe">
          <select
            value={timeFilter}
            onChange={(e) => handleTimeFilterChange(e.target.value)}
          >
            <option value="all">Tous</option>
            <option value="day">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
          <label>Filtrer par période:</label>
        </div>
        <div className="filter-groupe">
          <select value={selectedType} onChange={handleTypeFilter}>
            <option value="">Tous</option>
            <option value="addition">Ajout</option>
            <option value="deduction">Déduction</option>
          </select>
          <label>Type:</label>
        </div>
      </div>
      <div className="table-h">
        <table>
          <thead>
            <tr>
              <th>Nom du Produit</th>
              <th>Modification de Stock</th>
              <th>Stock Restant</th>
              <th>Type</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item._id}>
                  <td>{item.product.name}</td>
                  <td
                    style={{
                      color: item.stockChange < 0 ? "red" : "white",
                    }}
                  >
                    {item.stockChange}
                  </td>
                  <td>{item.remainingStock}</td>
                  <td>{item.type === "addition" ? "Ajout" : "Déduction"}</td>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  Aucun historique trouvé.
                </td>
              </tr>
            )}
          </tbody>
          {viewMode === "tous" && (
            <tfoot>
              <tr>
                <td colSpan="2">
                  <strong>Total Stock Restant:</strong>
                </td>
                <td  colSpan="3" className="totals">{totals.stockRemaining}</td>
              </tr>
              <tr>
                <td colSpan="2">
                  <strong>Total Modifications de Stock:</strong>
                </td>
                <td  colSpan="3" className="totals">{totals.stockChange}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default ProductHistory;
