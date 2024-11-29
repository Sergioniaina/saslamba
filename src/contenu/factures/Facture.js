import React, { useEffect, useState } from 'react';
import '../css/factureSelected.css';
import axios from 'axios';

function Facture({ selectedFacture, onCancel }) {
  const [companyInfo, setCompanyInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCompanyInfo(); // Load company info when the component mounts
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/company-info/list");
      setCompanyInfo(response.data[0]); // Assuming the first entry is the company info
    } catch (error) {
      setError("Impossible de charger les informations de l'entreprise.");
      console.error("Error loading company information:", error);
    }
  };

  if (error) {
    return <div className="error">{error}</div>; // Affiche un message d'erreur si nécessaire
  }

  return (
    <div className="facture-selected">
      {selectedFacture && (
        <div className="modal-factureId" onClick={onCancel}>
          <div className="modal-content-factureId" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Détails de la Facture</h2>
            </div>
            <div className="modal-body">
              <div className="information-factureId">
                {companyInfo && (
                  <div className="company-info-factureId">
                    <div className="company-photo-factureId">
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
                          <span>{companyInfo.name}</span>
                        </p>
                        <p>{companyInfo.phone}</p>
                        <p>{companyInfo.address}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div>
                  <h5>Référence : {selectedFacture.reference}</h5>
                  <p><strong>TICKET N° :</strong> {selectedFacture.ticketNumber}</p>
                  <p><strong>Nom du client :</strong> {selectedFacture.customerName}</p>
                  <p><strong>Contact :</strong> {selectedFacture.contact}</p>
                  <p><strong>Date :</strong> {new Date(selectedFacture.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="service">
                <p><strong>Type de service :</strong> {selectedFacture.serviceType}</p>
                <p><strong>État :</strong> {selectedFacture.etat}</p>
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

                      const description = `${machine?.type || "Lavage"} (${weight} kg) (${detail.type})`;

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
                        return null;
                      }

                      const weight =
                        selectedFacture?.machineWeights?.find(
                          (mw) => mw.machineId === machine._id
                        )?.weight || 1;

                      const priceRange = machine.priceRanges?.find(
                        (range) =>
                          weight >= range.minWeight && weight <= range.maxWeight
                      );
                      const price = priceRange?.price || 0;

                      return (
                        <tr key={machine._id}>
                          <td>1</td>
                          <td>{"Séchage"} ({weight} kg)</td>
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
    </div>
  );
}

export default Facture;
