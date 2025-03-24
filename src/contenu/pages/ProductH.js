import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/produitH.css"; // Importation des styles SCSS
import ModalConfirm from "../modal/ModalConfirm";
import { FaTrashAlt } from "react-icons/fa";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
const ProductHistory = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [productHistory, setProductHistory] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [viewMode, setViewMode] = useState("global"); // Modes: "global" ou "tous"
  const [totals, setTotals] = useState({ stockRemaining: 0, stockChange: 0 });
  const [timeFilter, setTimeFilter] = useState("all"); // Options: jour/semaine/mois/année
  const [selectedType, setSelectedType] = useState(""); // Filtrage par type
  const [selectedSource, setSelectedSource] = useState(""); // Pour stocker la source sélectionnée
  const [sources, setSources] = useState([]);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [confirmMessage, setConfirmMessage] = useState(""); 

  useEffect(() => {
    const fetchProductHistory = async () => {
      try {
        const response = await axios.get(`${PORT}/api/product-history`);
        setProductHistory(response.data);
        setFilteredData(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données : ", error);
      }
    };
    fetchProductHistory();
  }, [PORT]);
  const fetchProductHistory = async () => {
    try {
      const response = await axios.get(`${PORT}/api/product-history`);
      setProductHistory(response.data);
      setFilteredData(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données : ", error);
    }
  };
  useEffect(() => {
    const uniqueSources = [...new Set(productHistory.map((item) => item.source))];
    setSources(uniqueSources); 
  }, [productHistory]);

  // Fonction de recherche par nom de produit
  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    applyFilters(term, startDate, endDate, selectedType, selectedSource);  // Utilisez 'term' ici au lieu de 'searchTerm'
  };
  

  // Filtrage par date
  const handleDateFilter = (type, value) => {
    if (type === "start") setStartDate(value);
    if (type === "end") setEndDate(value);
    applyFilters(searchTerm, startDate, endDate, selectedType, selectedSource);
  };

  // Filtrage par période (jour, semaine, mois, année)
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
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case "year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        start = "";
        end = "";
    }

    setStartDate(start ? start.toISOString().split("T")[0] : "");
    setEndDate(end ? end.toISOString().split("T")[0] : "");
    applyFilters(searchTerm, start ? start.toISOString() : "", end ? end.toISOString() : "", selectedType, selectedSource);
  };

  // Filtrage par type
  const handleTypeFilter = (e) => {
    const type = e.target.value;
    setSelectedType(type);
    applyFilters(searchTerm, startDate, endDate, type, selectedSource);
  };

  // Filtrage par source
  const handleSourceFilter = (e) => {
    const source = e.target.value;
    setSelectedSource(source);
    applyFilters(searchTerm, startDate, endDate, selectedType, source);
  };

  // Applique tous les filtres combinés
  const applyFilters = (searchTerm, start, end, type, source) => {
    let filtered = [...productHistory];
  
    // Filtrage par nom de produit
    filtered = filtered.filter((item) => {
      // Recherche partielle pour la barre de recherche
      const matchesName = item.product.name.toLowerCase().includes(searchTerm.toLowerCase());
      // Recherche exacte dans le cas du select
      //const matchesExactName = item.product.name === searchTerms;  
  
      const matchesStartDate = start ? new Date(item.date) >= new Date(start) : true;
      const matchesEndDate = end ? new Date(item.date) <= new Date(end) : true;
      const matchesType = type ? item.type === type : true;
      const matchesSource = source ? item.source === source : true;
  
      // Modifiez la condition pour que l'un ou l'autre soit suffisant : 
      // soit on fait une recherche partielle (matchesName) soit une recherche exacte (matchesExactName)
      return (
        matchesName &&
        matchesStartDate &&
        matchesEndDate &&
        matchesType &&
        matchesSource
      );
    });
  
    // Appliquer les autres agrégations si nécessaire
    if (viewMode === "tous") {
      filtered = aggregateProductHistory(filtered);
    }
  
    setFilteredData(filtered);
    if (viewMode === "tous") {
      calculateTotals(filtered);
    }
  };
  

  // Agrégat des données par produit
  const aggregateProductHistory = (history) => {
    const aggregated = {};

    history.forEach((item) => {
      if (!aggregated[item.product._id]) {
        aggregated[item.product._id] = {
          ...item,
          stockChange: item.stockChange,
          remainingStock: item.remainingStock,
          lastUpdated: item.date,
          sources: {
            [item.source]: {
              stockChange: item.stockChange,
              remainingStock: item.remainingStock,
            },
          },
        };
      } else {
        const product = aggregated[item.product._id];
        product.stockChange += item.stockChange;
        if (new Date(item.date) > new Date(product.lastUpdated)) {
          product.remainingStock = item.remainingStock;
          product.lastUpdated = item.date;
        }

        if (!product.sources[item.source]) {
          product.sources[item.source] = {
            stockChange: item.stockChange,
            remainingStock: item.remainingStock,
          };
        } else {
          product.sources[item.source].stockChange += item.stockChange;
          product.sources[item.source].remainingStock += item.remainingStock;
        }
      }
    });

    return Object.values(aggregated);
  };

  // Calcul des totaux pour les stocks
  const calculateTotals = (filtered) => {
    const totalStockChange = filtered.reduce(
      (sum, item) => sum + (Number(item.stockChange) || 0),
      0
    );
    const totalStockRemaining = filtered.reduce(
      (sum, item) => sum + (Number(item.remainingStock) || 0),
      0
    );
    setTotals({
      stockChange: totalStockChange,
      stockRemaining: totalStockRemaining,
    });
  };

  // Modification de la vue (global ou détaillée)
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

  const handleHardDelete = async (id) => {
    try {
      await axios.delete(`${PORT}/api/product-history/${id}`);
      fetchProductHistory();
    } catch (error) {
      console.error("Erreur lors du hard delete : ", error);
    }
  };

  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce Historique?");
    setConfirmAction(() => () => handleHardDelete(id));
    setIsConfirmVisible(true);
  };

  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".suivis").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table.querySelectorAll("th.action, td.action").forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Suivis" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "suivis.xlsx");
  };
  const confirmExcel = () => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
  };
  return (
    <div className="product-history">
      <div className="view-buttons">
        <div className="filters">
          <div className="filter-groupes">
            <select value={selectedSource} onChange={handleSourceFilter}>
              <option value="">Toutes les sources</option>
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </select>
            <label>Filtrer par source:</label>
          </div>
        </div>
        <button
          onClick={() => handleViewChange("global")}
          className={viewMode === "global" ? "active" : ""}
        >
          Historique Par produits
        </button>
        <button
          onClick={() => handleViewChange("tous")}
          className={viewMode === "tous" ? "active" : ""}
        >
          Historique Global
        </button>
        <button onClick={confirmExcel} className="export-button">
          <FaFileExcel
            style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
          />
          Exporter en Excel
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
            <option value="deduction">Déduction</option>
            <option value="addition">Ajout</option>
          </select>
          <label>Type:</label>
        </div>
        {/* <div className="filter-groupe">
          <select value={searchTerms} onChange={handleSearchs}>
            <option value="">Toutes les produits</option>
            {produit.map((source, index) => (
              <option key={index} value={source}>
                {source}
              </option>
            ))}
          </select>
          <label>Produit(s):</label>
        </div> */}
      </div>
      <div className="table-h">
        <table className="suivis">
          <thead>
            <tr>
              <th>Nom du Produit</th>
              <th>Modification de Stock</th>
              <th>Stock Restant</th>
              {viewMode === "global" && (
                <>
                  <th>Type</th>
                  <th>Source</th>
                  <th>Date</th>
                </>
              )}
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <tr key={item._id}>
                  <td>{item.product.name}</td>
                  <td
                    style={{
                      color:
                        item.stockChange < 0
                          ? "rgb(223, 102, 50)"
                          : "rgb(0, 255, 179)",
                    }}
                  >
                    {item.stockChange}
                  </td>
                  <td>{item.remainingStock}</td>
                  {viewMode === "global" && (
                    <>
                      <td>
                        {item.type === "addition" ? "Ajout" : "Déduction"}
                      </td>
                      <td>{item.source}</td>
                      <td>{new Date(item.date).toLocaleString()}</td>
                    </>
                  )}

                  <td>
                    <button
                      onClick={() => confirmDelete(item._id)}
                      style={{
                        backgroundColor: "red",
                        color: "white",
                        border: "none",
                      }}
                    >
                      <FaTrashAlt />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  Aucun historique trouvé.
                </td>
              </tr>
            )}
          </tbody>
          {viewMode === "tous" && (
            <tfoot>
              <tr>
                <td
                  style={{ textAlign: "left", letterSpacing: "1px" }}
                  colSpan="2"
                >
                  <strong>Total Stock Restant:</strong>
                </td>
                <td className="totals">{totals.stockRemaining}</td>
                <td colSpan="4"></td>
              </tr>
              <tr>
                <td
                  style={{ textAlign: "left", letterSpacing: "1px" }}
                  colSpan="1"
                >
                  <strong>Total Mouvements de Stock:</strong>
                </td>
                <td className="totals">
                  {totals.stockChange}{" "}
                  {totals.stockChange < 0 ? (
                    <>( {Math.abs(totals.stockChange)} stock utilisé )</>
                  ) : (
                    <>({totals.stockChange} stock additionnel)</>
                  )}
                </td>
                <td colSpan={5}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
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

export default ProductHistory;
