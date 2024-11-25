import React, { useEffect, useState } from "react";
import { Bar} from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../css/dashboards.css"; // Importation de votre fichier CSS

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons"; // Icône de vente
// Enregistrement des composants nécessaires de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Dashboards() {
  const [caisses, setCaisses] = useState([]);
  const [selectedCaisse, setSelectedCaisse] = useState("");
  const [periodeCaisse, setPeriodeCaisse] = useState("semaine");
  const [periodeGlobal, setPeriodeGlobal] = useState("semaine");
  //const [periodeListe, setPeriodeListe] = useState("jour");
  const [caisseData, setCaisseData] = useState({ recette: 0, depense: 0 });
  const [globalData, setGlobalData] = useState({ recette: 0, depense: 0 });
  const [globalDatas, setGlobalDatas] = useState({
    jour: { recette: 0, depense: 0 },
    semaine: { recette: 0, depense: 0 },
    mois: { recette: 0, depense: 0 },
    annee: { recette: 0, depense: 0 },
  });

  // Charger les caisses
  useEffect(() => {
    async function fetchCaisses() {
      try {
        const response = await axios.get("http://localhost:5000/api/caisses");
        setCaisses(response.data);
        if (response.data.length > 0) {
          setSelectedCaisse(response.data[0]._id);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des caisses:", error);
      }
    }
    fetchCaisses();
  }, []);

  // Récupérer les données de la caisse sélectionnée
  useEffect(() => {
    if (!selectedCaisse) return;

    async function fetchData() {
      try {
        const caisseResponse = await axios.get(
          `http://localhost:5000/api/mouvements/stats/caisse/${selectedCaisse}/${periodeCaisse}`
        );
        setCaisseData(caisseResponse.data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données de la caisse:",
          error
        );
      }
    }
    fetchData();
  }, [selectedCaisse, periodeCaisse]);

  // Récupérer les données globales
  useEffect(() => {
    async function fetchGlobalData() {
      try {
        const globalResponse = await axios.get(
          `http://localhost:5000/api/mouvements/stats/global/${periodeGlobal}`
        );
        setGlobalData(globalResponse.data);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des données globales:",
          error
        );
      }
    }
    fetchGlobalData();
  }, [periodeGlobal]);

  useEffect(() => {
    async function fetchGlobalDatas() {
      try {
        // Periods to fetch data for
        const periods = ["jour", "semaine", "mois", "annee"];
        const dataByPeriod = {};

        // Fetch global stats for each period
        await Promise.all(
          periods.map(async (period) => {
            const response = await axios.get(
              `http://localhost:5000/api/mouvements/stats/global/${period}`
            );
            dataByPeriod[period] = response.data;
          })
        );

        // Fetch data from "avant-fermeture" for recette and depense
        const avantFermetureResponse = await axios.get(
          "http://localhost:5000/api/mouvements/toutes/mouvements/avant-fermeture"
        );

        const avantFermetureData = avantFermetureResponse.data;

        // Update the 'jour' period data by adding recette and depense from avant-fermeture
        const totalRecette = avantFermetureData.reduce(
          (total, mouvement) => total + (mouvement.recette || 0),
          0
        );
        const totalDepense = avantFermetureData.reduce(
          (total, mouvement) => total + (mouvement.depense || 0),
          0
        );

        // Set the "jour" data with the fetched totals
        dataByPeriod["jour"] = {
          recette: totalRecette,
          depense: totalDepense,
        };

        // Set the updated data into the state
        setGlobalDatas(dataByPeriod);
      } catch (error) {
        console.error("Error fetching global data:", error);
      }
    }

    fetchGlobalDatas();
  }, []);

  // Options du graphique
  const chartOptions = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
  };

  // Données pour le graphique de la caisse
  const caisseChartData = {
    labels: ["Recette", "Dépense"],
    datasets: [
      {
        label: "Montant",
        data: [caisseData.recette, caisseData.depense],
        backgroundColor: ["#4CAF50", "#F44336"],
      },
    ],
  };

  // Données pour le graphique global
  const globalChartData = {
    labels: ["Recette", "Dépense"],
    datasets: [
      {
        label: "Montant",
        data: [globalData.recette, globalData.depense],
        backgroundColor: ["#4CAF50", "#F44336"],
      },
    ],
  };

  return (
    <div className="dashboard-container">
      {/* Affichage des données des caisses */}
      {/* Display global data in the correct order */}
      <div className="caisses-section">
        {["jour", "semaine", "mois", "annee"].map((periode) => (
          <div key={periode} className="caisse-card">
            <div className="caisse-period">
              <strong>
                {periode.charAt(0).toUpperCase() + periode.slice(1)}
              </strong>
            </div>
            <div className={`caisse-vente ${periode}-icon`}>
              <FontAwesomeIcon icon={faShoppingCart} className="icon" />
              <div className="caisse-solde">
                <div className="solde">
                  <div className="span">
                    <span>Recette</span>
                    <span>:</span>
                  </div>
                  <span className="caisse-montant">
                    {globalDatas[periode]?.recette
                      ? globalDatas[periode].recette.toLocaleString()
                      : "0"}{" "}
                    Ar
                  </span>
                </div>
                <div className="solde">
                  <div className="span">
                    <span>Dépense</span>
                    <span>:</span>
                  </div>
                  <span className="caisse-montant">
                    {globalDatas[periode]?.depense
                      ? globalDatas[periode].depense.toLocaleString()
                      : "0"}{" "}
                    Ar
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="graphs-container">
        <div className="graph-card">
          <div className="select-section">
            <select
              id="caisseSelect"
              onChange={(e) => setSelectedCaisse(e.target.value)}
              value={selectedCaisse}
            >
              {caisses.map((caisse) => (
                <option key={caisse._id} value={caisse._id}>
                  {caisse.nom}
                </option>
              ))}
            </select>

            <select
              id="periodeCaisse"
              onChange={(e) => setPeriodeCaisse(e.target.value)}
              value={periodeCaisse}
            >
              <option value="jour">Jour</option>
              <option value="semaine">Semaine</option>
              <option value="mois">Mois</option>
              <option value="annee">Année</option>
            </select>
          </div>
          <h3>Graphique de la Caisse</h3>
          <Bar data={caisseChartData} options={chartOptions} />
        </div>
        <div className="graph-card">
          <div className="select-section">
            <select
              id="periodeGlobal"
              onChange={(e) => setPeriodeGlobal(e.target.value)}
              value={periodeGlobal}
            >
              <option value="jour">Jour</option>
              <option value="semaine">Semaine</option>
              <option value="mois">Mois</option>
              <option value="annee">Année</option>
            </select>
          </div>
          <h3>Graphique Global</h3>
          <Bar data={globalChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}

export default Dashboards;
