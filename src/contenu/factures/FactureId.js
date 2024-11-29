import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./module.css"; // Importer votre fichier Sass
import { FaEye } from "react-icons/fa";
import { useLocation } from "react-router-dom";

const FactureId = () => {
  const [factures, setFactures] = useState([]);
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const location = useLocation();
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    fetchCompanyInfo(); // Load company info when the component mounts
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/company-info/list"
      );
      setCompanyInfo(response.data[0]); // Assuming the first entry is the company info
    } catch (error) {
      console.error("Error loading company information:", error);
    }
  };

  // Ref pour la ligne mise en évidence
  // const highlightedRef = useRef(null);
  const factureRefs = useRef({});
  // Obtenir l'ID depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const highlightedId = searchParams.get("id");

  // Charger les factures depuis l'API
  useEffect(() => {
    const fetchFactures = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/factures");
        setFactures(response.data);
      } catch (err) {
        console.error("Erreur lors du chargement des factures:", err);
      }
    };
    fetchFactures();
  }, []);
  // Défilement automatique vers la ligne mise en évidence
  useEffect(() => {
    if (highlightedId && factureRefs.current[highlightedId]) {
      factureRefs.current[highlightedId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightedId, factures]);
  // Charger les détails d'une facture
  const fetchFactureDetails = async (id) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/factures/listPar/${id}`
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

  return (
    <div className="facture-container">
      <div className="table-voir">
        <table className="facture-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom du client</th>
              <th>Contact</th>
              <th>Total (Prix)</th>
              <th className="action">Actions</th>
            </tr>
          </thead>
          <tbody>
            {factures.map((facture) => (
              <tr
                key={facture._id}
                ref={(el) => (factureRefs.current[facture._id] = el)} // Associer une référence à chaque ligne
                className={facture._id === highlightedId ? "highlighted" : ""}
              >
                <td>{facture.reference}</td>
                <td>{facture.customerName}</td>
                <td>{facture.contact}</td>
                <td>{facture.totalPrice}</td>
                <td className="action">
                  <button
                    className="btn-primary"
                    onClick={() => fetchFactureDetails(facture._id)}
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal pour afficher les détails */}
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
                        src={`http://localhost:5000/${companyInfo.photo}`}
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
                          <span style={{ margin: 0 }}>{companyInfo.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <h5>Référence : {selectedFacture.reference}</h5>
                  <p><strong>TICKET  N° :</strong> {selectedFacture.ticketNumber}</p>
                  <p>
                    <strong>Nom du client :</strong>{" "}
                    {selectedFacture.customerName}
                  </p>
                  <p>
                    <strong>Contact :</strong> {selectedFacture.contact}
                  </p>
                  <p><strong>Date :</strong> {new Date(selectedFacture.createdAt).toLocaleDateString()}</p>
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
                    {/* Pour les articles liés à "Machine à laver" */}

                    {/* Pour les "Sèche-linge" */}
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

              {/* <h6>Historique :</h6>
              <ul>
                {selectedFacture.historique.map((entry, index) => (
                  <li key={index}>
                    {entry.action} - {new Date(entry.date).toLocaleString()}
                  </li>
                ))}
              </ul> */}
            </div>
            {/* <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Fermer
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default FactureId;
