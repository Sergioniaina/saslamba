import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  startOfHour,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { FaTrashAlt } from "react-icons/fa"; // Icon for deletion
import "./MachineConsumptionHistory.css"; // SCSS import
import ModalConfirm from "../modal/ModalConfirm";
import * as XLSX from "xlsx";
import { FaFileExcel } from "react-icons/fa";

const MachineConsumptionHistory = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [consumptionHistory, setConsumptionHistory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [totals, setTotals] = useState({});
  const [totalPerMachine, setTotalPerMachine] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [consumptionRes, machinesRes] = await Promise.all([
          axios.get(`${PORT}/api/machines/consumption`),
          axios.get(`${PORT}/api/machines`),
        ]);
        setConsumptionHistory(consumptionRes.data);
        setMachines(machinesRes.data);

        // Calculate totals
        setTotals(calculateTotals(consumptionRes.data));
        setTotalPerMachine(calculateTotalPerMachine(consumptionRes.data));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [PORT]);

  const calculateTotals = (history) => {
    const now = new Date();
    return history.reduce(
      (acc, entry) => {
        const startTime = new Date(entry.startTime);
        if (startTime >= startOfHour(now)) acc.hourly += entry.kilowattHours;
        if (startTime >= startOfDay(now)) acc.daily += entry.kilowattHours;
        if (startTime >= startOfWeek(now)) acc.weekly += entry.kilowattHours;
        if (startTime >= startOfMonth(now)) acc.monthly += entry.kilowattHours;
        if (startTime >= startOfYear(now)) acc.yearly += entry.kilowattHours;
        return acc;
      },
      { hourly: 0, daily: 0, weekly: 0, monthly: 0, yearly: 0 }
    );
  };

  const calculateTotalPerMachine = (history) => {
    const now = new Date();
    return history.reduce((acc, entry) => {
      const startTime = new Date(entry.startTime);
      if (!acc[entry.machineId]) {
        acc[entry.machineId] = {
          hourly: 0,
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0,
        };
      }
      if (startTime >= startOfHour(now))
        acc[entry.machineId].hourly += entry.kilowattHours;
      if (startTime >= startOfDay(now))
        acc[entry.machineId].daily += entry.kilowattHours;
      if (startTime >= startOfWeek(now))
        acc[entry.machineId].weekly += entry.kilowattHours;
      if (startTime >= startOfMonth(now))
        acc[entry.machineId].monthly += entry.kilowattHours;
      if (startTime >= startOfYear(now))
        acc[entry.machineId].yearly += entry.kilowattHours;
      return acc;
    }, {});
  };

  const deleteEntry = async (id) => {
    try {
      await axios.delete(
        `${PORT}/api/machines/consumption/${id}`
      );
      setConsumptionHistory((prev) => prev.filter((entry) => entry._id !== id));
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer ce Consommation?");
    setConfirmAction(() => () => deleteEntry(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  const filteredHistory = consumptionHistory.filter((entry) => {
    const machine = machines.find((m) => m._id === entry.machineId);
    return (
      machine &&
      machine.modelNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Calculate the totals for the filtered entries
  const filteredTotals = filteredHistory.reduce(
    (acc, entry) => {
      const { hourly, daily, weekly, monthly, yearly } =
        totalPerMachine[entry.machineId] || {};
      acc.hourly += hourly || 0;
      acc.daily += daily || 0;
      acc.weekly += weekly || 0;
      acc.monthly += monthly || 0;
      acc.yearly += yearly || 0;
      acc.totalKilowattHours += entry.kilowattHours || 0; // Ajouter le total de kWh
      return acc;
    },
    {
      hourly: 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      totalKilowattHours: 0,
    }
  );
  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".table-history").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table.querySelectorAll("th.action, td.action").forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Consumption" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "Consumption.xlsx");
  };
  const confirmExcel = (id) => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
  };
  return (
    <div className="machine-consumption-history">
      {/* Search Bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Rechercher par modèle de machine"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button onClick={confirmExcel} className="export-button">
          <FaFileExcel
            style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
          />
          Exporter en Excel
        </button>
      </div>

      {/* Totals Table */}
      <table className="totals-table">
        <thead>
          <tr>
            <th>Dernière heure</th>
            <th>Aujourd'hui</th>
            <th>Cette semaine</th>
            <th>Ce mois</th>
            <th>Cette année</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{totals.hourly?.toFixed(2)} kWh</td>
            <td>{totals.daily?.toFixed(2)} kWh</td>
            <td>{totals.weekly?.toFixed(2)} kWh</td>
            <td>{totals.monthly?.toFixed(2)} kWh</td>
            <td>{totals.yearly?.toFixed(2)} kWh</td>
          </tr>
        </tbody>
      </table>

      {/* Consumption History Table */}
      <div className="table-history">
        <table className="history-table">
          <thead>
            <tr>
              <th>Modèle</th>
              <th>Date de début</th>
              <th>Date de fin</th>
              <th>Consommation (kWh)</th>
              <th>Heure</th>
              <th>Aujourd'hui</th>
              <th>Semaine</th>
              <th>Mois</th>
              <th>Année</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((entry) => {
              const machine = machines.find((m) => m._id === entry.machineId);
              const totalsByMachine = totalPerMachine[entry.machineId] || {};
              return (
                <tr key={entry._id}>
                  <td>N° {machine?.modelNumber || "Inconnu"}</td>
                  <td>{new Date(entry.startTime).toLocaleString()}</td>
                  <td>
                    {entry.endTime
                      ? new Date(entry.endTime).toLocaleString()
                      : "En cours"}
                  </td>
                  <td>{entry.kilowattHours.toFixed(2)} kWh</td>
                  <td>{totalsByMachine.hourly?.toFixed(2)} kWh</td>
                  <td>{totalsByMachine.daily?.toFixed(2)} kWh</td>
                  <td>{totalsByMachine.weekly?.toFixed(2)} kWh</td>
                  <td>{totalsByMachine.monthly?.toFixed(2)} kWh</td>
                  <td>{totalsByMachine.yearly?.toFixed(2)} kWh</td>
                  <td>
                    {entry.endTime && ( // Show the delete button only if endTime exists
                      <button
                        onClick={() => confirmDelete(entry._id)}
                        className="btn"
                      >
                        <FaTrashAlt />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3">Totaux</td>
              <td className="td">
                {filteredTotals.totalKilowattHours.toFixed(2)} kWh
              </td>
              <td className="td">{filteredTotals.hourly.toFixed(2)} kWh</td>
              <td className="td">{filteredTotals.daily.toFixed(2)} kWh</td>
              <td className="td">{filteredTotals.weekly.toFixed(2)} kWh</td>
              <td className="td">{filteredTotals.monthly.toFixed(2)} kWh</td>
              <td className="td">{filteredTotals.yearly.toFixed(2)} kWh</td>
            </tr>
          </tfoot>
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

export default MachineConsumptionHistory;
