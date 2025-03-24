import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/reabonnement_externe.css";
import { faCreditCard, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function Reabonnement() {
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_telephone: "",
    amount: "50000",
  });
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Ajout pour indiquer le chargement
  const PORT = process.env.REACT_APP_BACKEND_URL;
  // eslint-disable-next-line
  const [companyInfoList, setCompanyInfoList] = useState([]);
  useEffect(() => {
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, []);
  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${PORT}/api/company-info/list`);
      const companies = response.data;
      setCompanyInfoList(companies);
      // Si la liste contient au moins une entreprise, pré-remplir formData
      if (companies.length > 0) {
        setFormData({
          ...formData,
          client_name: companies[0].name || "",
          client_email: companies[0].email || "",
          client_telephone: companies[0].phone || "",
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des informations :", error);
    }
  };
  //   useEffect(() => {
  //     fetchPayments();
  //     // const interval = setInterval(fetchPayments, 60000); // Rafraîchissement toutes les 10 secondes
  //     // return () => clearInterval(interval);
  //   }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Indique que la soumission est en cours
    try {
      const response = await axios.post(
        "http://localhost:5000/api/paiement",
        formData
      );
      const responseData = response.data;

      const newPayment = {
        id: responseData.paymentId,
        amount: responseData.amount,
        status: responseData.status,
        reference: responseData.reference,
      };

      // Rediriger immédiatement vers le lien de paiement
      //   window.location.href =
      //     "https://mpayment.orange-money.com/mg/mpayment/abstract/v1yxsjoynaknoufvwhjkkiid30n4c9swerlrrgqgu1ce4uuxikhgyhdlm4ovie6o";

      // Les lignes suivantes ne s'exécutent pas après redirection, mais conservées pour cohérence
      setModalData(newPayment);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la création du paiement:", err);
      setError(
        err.response?.data?.error || "Erreur lors de la création du paiement"
      );
      setModalData(null);
    } finally {
      setIsLoading(false); // Fin de la soumission
    }
  };
  const closeModal = () => {
    setModalData(null);
  };

  return (
    <div className="reabonnement-externe">
      <div className="font">
        <div className="font1">
          <div className="form-section">
            <button onClick={handleSubmit} type="submit" className="submit-btn">
              {isLoading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="spinner" />
                  En cours...
                </>
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faCreditCard}
                    style={{ marginRight: "8px" }}
                  />
                  Effectuer le reabonnement
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div className="error-section">
          <h3>Erreur</h3>
          <p>{error}</p>
        </div>
      )}

      {modalData && (
        <div className="modal-overlay-a">
          <div className="modal-content-a">
            <h3>Paiement Créé</h3>
            <p>
              <strong>ID:</strong> {modalData.id}
            </p>
            <p>
              <strong>Montant:</strong> {modalData.amount}
            </p>
            <p>
              <strong>Statut:</strong> {modalData.status}
            </p>
            <p>
              <strong>Référence:</strong> {modalData.reference}
            </p>
            <button onClick={closeModal} className="close-btn">
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reabonnement;
