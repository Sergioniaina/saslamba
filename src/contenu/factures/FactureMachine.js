import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEye } from "react-icons/fa";
import "../css/factureMachine.css";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import ModalConfirm from "../modal/ModalConfirm";

const FactureMachine = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [factures, setFactures] = useState([]);
  const [filteredFactures, setFilteredFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [searchModel, setSearchModel] = useState(""); // Recherche par modelNumber
  const [startDate, setStartDate] = useState(""); // Date de début
  const [endDate, setEndDate] = useState(""); // Date de fin
  const [machineType, setMachineType] = useState(""); // Type de machine sélectionné
  const [client, setClient] = useState("");
  const [availableMachineTypes, setAvailableMachineTypes] = useState([]); // Liste des types disponibles
  const [companyInfo, setCompanyInfo] = useState(null);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message

  useEffect(() => {
    fetchCompanyInfo(); // Load company info when the component mounts
    // eslint-disable-next-line
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(
        `${PORT}/api/company-info/list`
      );
      setCompanyInfo(response.data[0]); // Assuming the first entry is the company info
    } catch (error) {
      console.error("Error loading company information:", error);
    }
  };

  useEffect(() => {
    // Fonction pour récupérer les données des factures
    const fetchFactures = async () => {
      try {
        const response = await fetch(
          `${PORT}/api/factures/details`
        ); // Remplacez par l'URL de votre API
        if (!response.ok)
          throw new Error("Erreur lors du chargement des données");
        const data = await response.json();
        setFactures(data);
        setFilteredFactures(data); // Initialiser le tableau filtré avec toutes les données

        // Extraire les types de machine uniques pour les options du menu déroulant
        const types = [...new Set(data.map((facture) => facture.machineType))];
        setAvailableMachineTypes(types);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFactures();
  }, [PORT]);
  const fetchFactureDetails = async (id) => {
    try {
      const response = await axios.get(
        `${PORT}/api/factures/listPar/${id}`
      );
      setSelectedFacture(response.data);
      setShowModal(true);
    } catch (err) {
      console.error(
        "Erreur lors du chargement des détails de la facture:",
        err
      );
    }
  };

  // Fonction pour filtrer les factures en fonction des critères
  useEffect(() => {
    let result = factures;

    // Filtrer par plage de dates
    if (startDate || endDate) {
      result = result.filter((facture) => {
        const factureDate = new Date(facture.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start && end) return factureDate >= start && factureDate <= end;
        if (start) return factureDate >= start;
        if (end) return factureDate <= end;

        return true;
      });
    }

    // Filtrer par machineModelNumber
    if (searchModel) {
      result = result.filter((facture) =>
        facture.machineModelNumber
          .toLowerCase()
          .includes(searchModel.toLowerCase())
      );
    }
    if (client) {
      result = result.filter((facture) =>
        facture.client.toLowerCase().includes(client.toLowerCase())
      );
    }

    // Filtrer par machineType
    if (machineType) {
      result = result.filter((facture) => facture.machineType === machineType);
    }

    setFilteredFactures(result);
  }, [searchModel, startDate, endDate, machineType, factures, client]);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur : {error}</p>;

  // Calculer le total des machines
  const totalMachines = filteredFactures.reduce(
    (sum, facture) => sum + facture.nombreMachine,
    0
  );
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };
  const exportTableToExcel = () => {
    // Clone le tableau pour ne pas modifier l'original
    const table = document.querySelector(".facture_machine_table").cloneNode(true);

    // Supprimer les colonnes "Action" du tableau cloné
    table.querySelectorAll("th.action, td.action").forEach((el) => el.remove());

    // Convertir le tableau en fichier Excel
    const workbook = XLSX.utils.table_to_book(table, { sheet: "machine" });

    // Télécharger le fichier Excel
    XLSX.writeFile(workbook, "machine.xlsx");
  };
  const confirmExcel = () => {
    setConfirmMessage("Voulez-vous exporter en Excel?");
    setConfirmAction(() => () => exportTableToExcel());
    setIsConfirmVisible(true);
  };

  return (
    <div className="product-history facture-machine">
      <div style={{ marginBottom: "1rem" }} className="filters">
        {/* Filtrage par plage de dates */}
        <div className="filter-groupe">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <label>Date debut</label>
        </div>
        <div className="filter-groupe">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <label>Date Fin</label>
        </div>
        {"  "}
        {/* Recherche par machineModelNumber */}
        <div className="filter-groupe">
          <input
            type="text"
            placeholder=""
            value={searchModel}
            onChange={(e) => setSearchModel(e.target.value)}
            required
          />
          <label>Numero</label>
        </div>
        <div className="filter-groupe">
          <input
            type="text"
            placeholder=""
            value={client}
            onChange={(e) => setClient(e.target.value)}
            required
          />
          <label>Client nom</label>
        </div>
        {"  "}
        {/* Filtrage par machineType */}
        <div className="filter-groupe">
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value)}
          >
            <option value="">-- Tous --</option>
            {availableMachineTypes.map((type, index) => (
              <option key={index} value={type}>
                {type}
              </option>
            ))}
          </select>
          <label>Machine type</label>
        </div>
        <button onClick={confirmExcel} className="export-button">
          <FaFileExcel
            style={{ marginRight: "8px", color: "green", fontSize: "1.2em" }}
          />
          Exporter en Excel
        </button>
      </div>
      <div className="facture_machine">
        <table
          border="1"
          style={{ width: "100%", textAlign: "left" }}
          className="facture_machine_table"
        >
          <thead>
            <tr>
              <th>Machine Numero</th>
              <th>Facture Référence</th>
              <th>Numero Facture</th>
              <th>Date</th>
              <th>Machine Type</th>
              <th>client</th>
              <th>Nombre</th>
              <th className="action">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredFactures.map((facture, index) => (
              <tr key={index}>
                <td>N° {facture.machineModelNumber}</td>
                <td>{facture.reference}</td>
                <td>{facture.ticketNumber}</td>
                <td>{new Date(facture.date).toLocaleDateString()}</td>
                <td>{facture.machineType}</td>
                <td>{facture.client}</td>
                <td>{facture.nombreMachine}</td>
                <td className="action">
                  <button
                    className="btn-primary"
                    onClick={() => fetchFactureDetails(facture.factureId)} // Utilisation correcte de factureId
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td
                colSpan="6"
                style={{
                  fontWeight: "bold",
                  textAlign: "center",
                  fontSize: "large",
                }}
              >
                Total d'utilisations machine(s) :
              </td>
              <td
                className="total_chiffre"
                style={{ fontWeight: "bold", fontSize: "large" }}
              >
                {totalMachines}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {selectedFacture && (
        <div
          className={`modal-factureId ${showModal ? "show" : ""}`}
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-content-factureId"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Détails de la Facture</h2>
            </div>
            <div className="modal-body">
              <div className="information-factureId">
                {companyInfo && (
                  <div className="company-info-factureId">
                    <div className="company-photo-factureId">
                      {/* Affiche la photo de l'entreprise */}
                      <img
                        src={`${PORT}/${companyInfo.photo}`}
                        alt="Logo de l'entreprise"
                        style={{
                          borderRadius: "10px",
                          width: "50px",
                          height: "50px",
                          backgroundRepeat: "no-repeat",
                        }}
                      />
                    </div>
                    <div className="company-details-id">
                      <div className="info-id">
                        <p className="name-entrprise-id">
                          {" "}
                          <span style={{ margin: 0 }}>{companyInfo.name}</span>
                        </p>
                        <p>
                          <span style={{ margin: 0 }}>{companyInfo.phone}</span>
                        </p>
                        <p>
                          <span style={{ margin: 0 }}>
                            {companyInfo.address}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <h5>Référence : {selectedFacture.reference}</h5>
                  <p>
                    <strong>TICKET N° :</strong> {selectedFacture.ticketNumber}
                  </p>
                  <p>
                    <strong>Nom du client :</strong>{" "}
                    {selectedFacture.customerName}
                  </p>
                  <p>
                    <strong>Contact :</strong> {selectedFacture.contact}
                  </p>
                  <p>
                    <strong>Date :</strong>{" "}
                    {new Date(selectedFacture.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="service">
                <p>
                  <strong>Type de service :</strong>{" "}
                  {selectedFacture.serviceType}
                </p>
                <p>
                  <strong>État :</strong> {selectedFacture.etat}
                </p>
              </div>
              <div className="factureId-table">
                <table>
                  <thead>
                    <tr>
                      <th>QTÉ</th>
                      <th>DÉSI</th>
                      <th>PU</th>
                      <th className="action">MONTANT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFacture?.articleDetails?.map((detail) => {
                      const machine = selectedFacture?.machines?.find(
                        (m) => m._id === detail.machineId
                      );

                      const weight =
                        selectedFacture?.machineWeights?.find(
                          (mw) => mw.machineId === detail.machineId
                        )?.weight || 6;

                      const totalPrice = detail.prices.reduce(
                        (sum, price) => sum + price.value,
                        0
                      );

                      const description = `${
                        machine?.type || "Lavage"
                      } (${weight} kg) (${detail.type})`;

                      return (
                        <tr key={detail._id}>
                          <td>1</td>
                          <td>{description}</td>
                          <td>{totalPrice.toFixed(0)} Ar</td>
                          <td className="action">{totalPrice.toFixed(0)} Ar</td>
                        </tr>
                      );
                    })}
                    {selectedFacture?.machines?.map((machine) => {
                      if (machine.type !== "Sèche-linge") {
                        // Ignorer si ce n'est pas un sèche-linge
                        return null;
                      }
                      // Trouver le poids de la machine
                      const weight =
                        selectedFacture?.machineWeights?.find(
                          (mw) => mw.machineId === machine._id
                        )?.weight || 1;

                      // Calculer le prix basé sur le range
                      const priceRange = machine.priceRanges?.find(
                        (range) =>
                          weight >= range.minWeight && weight <= range.maxWeight
                      );
                      const price = priceRange?.price || 0;

                      return (
                        <tr key={machine._id}>
                          <td>1</td>
                          <td>
                            {"Séchage"} ({weight} kg)
                          </td>
                          <td>{price.toFixed(0)} Ar</td>
                          <td>{price.toFixed(0)} Ar</td>
                        </tr>
                      );
                    })}

                    {selectedFacture?.products?.map((product) => {
                      const quantity =
                        selectedFacture?.quantities?.find(
                          (q) => q.productId === product._id
                        )?.quantity || 1;

                      return (
                        <tr key={product._id}>
                          <td>{quantity}</td>
                          <td>{product.name}</td>
                          <td>{product.price} Ar</td>
                          <td className="action">
                            {(quantity * product.price).toFixed(0)} Ar
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td className="total" colSpan="3">
                        <strong>Total</strong>
                      </td>
                      <td className="action">
                        {Math.round(selectedFacture.totalPrice)} Ar
                      </td>
                    </tr>
                    {selectedFacture.reste > 0 && (
                      <tr>
                        <td className="total" colSpan="3">
                          <strong>Reste</strong>
                        </td>
                        <td className="action">
                          {Math.round(selectedFacture.reste)} Ar
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
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

export default FactureMachine;
