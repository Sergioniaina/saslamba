import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/reabonnement.css";
import { faCreditCard, faSearch, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function PaymentForm() {
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_telephone: "",
    amount: "50000",
  });
  const [paymentId, setPaymentId] = useState("");
  // eslint-disable-next-line
  const [paymentData, setPaymentData] = useState(null);
  const [paymentsList, setPaymentsList] = useState([]);
  const [error, setError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Ajout pour indiquer le chargement
  const [isLoadings, setIsLoadings] = useState(false);
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
  useEffect(() => {
    fetchPayments();
    // const interval = setInterval(fetchPayments, 60000); // Rafraîchissement toutes les 10 secondes
    // return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleIdChange = (e) => {
    setPaymentId(e.target.value);
  };

  const fetchPayments = async () => {
    try {
      setIsLoading(true); // Indique que les données sont en cours de chargement
      const response = await axios.get(`${PORT}/api/paiement`);
      setPaymentsList(response.data.payments || []);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des paiements:", err);
      setError(
        err.response?.data?.error ||
          "Erreur lors de la récupération de la liste des paiements"
      );
      setPaymentsList([]);
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Indique que la soumission est en cours
    try {
      const response = await axios.post(
        `${PORT}/api/paiement`,
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
      window.location.href =
        "https://mpayment.orange-money.com/mg/mpayment/abstract/v1yxsjoynaknoufvwhjkkiid30n4c9swerlrrgqgu1ce4uuxikhgyhdlm4ovie6o";

      // Les lignes suivantes ne s'exécutent pas après redirection, mais conservées pour cohérence
      setModalData(newPayment);
      setPaymentId(newPayment.id);
      setError(null);
      await fetchPayments();
      await handleGetPayment(newPayment.id);
    } catch (err) {
      console.error("Erreur lors de la création du paiement:", err);
      setError(
        err.response?.data?.error || "Erreur lors de la création du paiement"
      );
      setPaymentData(null);
      setModalData(null);
    } finally {
      setIsLoading(false); // Fin de la soumission
    }
  };

  const handleGetPayment = async (id = paymentId) => {
    try {
      setIsLoadings(true);
      const response = await axios.get(
        `${PORT}/api/paiement/${id}`
      );
      setPaymentData(response.data);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération du paiement:", err);
      setError(
        err.response?.data?.error ||
          "Erreur lors de la récupération du paiement"
      );
      setPaymentData(null);
    } finally {
      setIsLoadings(false);
    }
  };

  const closeModal = () => {
    setModalData(null);
  };

  // Vérifie si le dernier paiement n'a pas le statut 'success'
  const isLastPaymentPending =
    paymentsList.length > 0 && paymentsList[0].status !== "success";

  return (
    <div className="container-reabonnement">
      <div className="form-section">
        <h3>Faire un Paiement</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="client_name"
              value={formData.client_name}
              onChange={handleChange}
              required
              disabled={isLoading} // Désactive pendant le chargement
              placeholder=""
              readOnly
            />
            <label>Nom du client</label>
          </div>
          <div className="form-group">
            <input
              type="email"
              name="client_email"
              value={formData.client_email}
              onChange={handleChange}
              required
              readOnly
              disabled={isLoading}
              placeholder=""
            />
            <label>Email</label>
          </div>
          <div className="form-group">
            <input
              type="text"
              name="client_telephone"
              value={formData.client_telephone}
              onChange={handleChange}
              required
              readOnly
              disabled={isLoading}
              placeholder=""
            />
            <label>Téléphone</label>
          </div>
          <div className="form-group">
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              min="1"
              required
              disabled={isLoading}
              placeholder=""
              readOnly
            />
            <label>Montant</label>
          </div>
          <button
            type="submit"
            className="submit-btn"
            disabled={isLastPaymentPending || isLoading} // Désactive si dernier paiement non 'success' ou en chargement
          >
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
                Effectuer le paiement
              </>
            )}
          </button>
        </form>
      </div>

      <div className="search-section">
        <h3>Récupérer un Paiement par ID</h3>
        <div className="form-group">
          <input
            type="text"
            value={paymentId}
            onChange={handleIdChange}
            placeholder="Entrez l'ID du paiement"
            disabled={isLoading}
          />
          <button
            onClick={() => handleGetPayment()}
            className="search-btn"
            disabled={isLoading}
          >
           {isLoadings ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="spinner" />
                En cours...
              </>
            ) : (
              <>
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{ marginRight: "8px" }}
                />
                Effectuer le paiement
              </>
            )}
          </button>
        </div>
      </div>

      {/* {paymentData && (
        <div className="result-section">
          <h3>Résultat</h3>
          <div className="ab-t">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Nom du client</th>
                  <th>Email</th>
                  <th>Référence</th>
                  <th>Montant</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{paymentData.client_name || "N/A"}</td>
                  <td>{paymentData.client_email || "N/A"}</td>
                  <td>{paymentData.reference || "N/A"}</td>
                  <td>{paymentData.amount || "N/A"}</td>
                  <td
                    style={{
                      color:
                        paymentData.status === "success"
                          ? "#4CAF50"
                          : "#f44336",
                      fontWeight: "bold",
                    }}
                  >
                    {paymentData.status || "N/A"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      <div className="payments-list-section">
        <h3>Liste des Paiements {isLoading && "(Mise à jour en cours...)"}</h3>
        {paymentsList.length === 0 ? (
          <p>Aucun paiement disponible</p>
        ) : (
          <div className="ab-t">
            <table className="payment-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nom du client</th>
                  <th>Référence</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {paymentsList.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td>{payment.paymentId}</td>
                    <td>{payment.client_name || "N/A"}</td>
                    <td>{payment.reference || "N/A"}</td>
                    <td>{payment.amount || "N/A"}</td>
                    <td
                      style={{
                        color:
                          payment.status === "success" ? "#4CAF50" : "#f44336",
                        fontWeight: "bold",
                      }}
                    >
                      {payment.status || "N/A"}
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

export default PaymentForm;
