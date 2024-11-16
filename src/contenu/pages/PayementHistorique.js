import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTrash, FaInfoCircle, FaCalendar } from "react-icons/fa";
import "./PaymentList.css";
import ModalConfirm from "../modal/ModalConfirm";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState({});
  const [error, setError] = useState(null);

  // États de filtre
  const [typeFilter, setTypeFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [startDate, setStartDate] = useState(""); // Nouvelle date de début
  const [endDate, setEndDate] = useState(""); // Nouvelle date de fin
  
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(""); // Stores the confirmation message
  const confirmDelete = (id) => {
    setConfirmMessage("Voulez-vous supprimer cet historique?");
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmVisible(true);
  };
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };


  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/payement");
      const paymentData = response.data;
      setPayments(paymentData);

      // Extraire les IDs utilisateur uniques de tous les paiements
      const userIds = Array.from(
        new Set(
          paymentData.flatMap((payment) =>
            payment.historique.map((item) => item.user)
          )
        )
      );
      fetchUsers(userIds);
    } catch (err) {
      setError("Erreur lors de la récupération des paiements");
    }
  };

  const fetchUsers = async (userIds) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/get`, {
        params: { ids: userIds },
      });
      const usersData = response.data;
      const usersMap = usersData.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersMap);
    } catch (err) {
      setError("Erreur lors de la récupération des utilisateurs");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/payement/${id}`);
      setPayments(payments.filter((payment) => payment._id !== id));
    } catch (error) {
      setError("Erreur lors de la suppression du paiement");
    }
  };

  // Fonction pour filtrer les paiements en fonction des critères
  const filteredPayments = payments.filter((payment) => {
    const matchType = typeFilter ? payment.type.includes(typeFilter) : true;
    const matchUser = userFilter
      ? payment.historique.some((item) =>
          users[item.user]?.includes(userFilter)
        )
      : true;

    // Filtrer par plage de dates
    const matchDate =
      startDate && endDate
        ? payment.historique.some((item) => {
            const itemDate = new Date(item.date).toISOString().slice(0, 10);
            return itemDate >= startDate && itemDate <= endDate;
          })
        : true;

    return matchType && matchUser && matchDate;
  });
  // const calculateTotals = (data) => {
  //   return data.reduce(
  //     (totals, item) => ({
  //       montant: totals.montant + (item.montant || 0)
  //     }),
  //     { montant: 0 }
  //   );
  // };

  // const totals = calculateTotals(filteredPayments);

  return (
    <div className="payment-list">
      {error && <div className="error-message">{error}</div>}

      {/* Filtres */}
      <div className="filters">
        <div className="p-input">
          <input
            type="text"
            placeholder=""
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            required
          />
          <label>type</label>
        </div>
        <div className="p-input">
          <input
            type="text"
            placeholder=""
            value={userFilter}
            required
            onChange={(e) => setUserFilter(e.target.value)}
          />
          <label>Nom user</label>
        </div>
        <div className="p-input">
        <FaCalendar className="icon"/>
          <input
            className="date"
            type="date"
            placeholder=""
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          
          <label>Date debut</label>
        </div>
        <div className="p-input">
        <FaCalendar className="icon"/>
          <input
            className="date"
            type="date"
            placeholder=""
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
         
          <label>Date fin</label>
        </div>
      </div>

      {/* Tableau des paiements */}
      <div className="pay-table">
      <table className="table-payment">
        <thead>
          <tr>
            <th>Type</th>
            <th>Historique</th>
            <th>Montant</th>
            <th>Utilisateur</th>
            <th className="action">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredPayments.map((payment) => (
            <tr key={payment._id}>
              <td>{payment.type}</td>
              <td>
                {payment.historique.map((item, index) => (
                  <div key={index} className="facture">
                    <FaInfoCircle className="icon"/> {item.action}
                  </div>
                ))}
              </td>
              <td>
                {payment.historique.map((item, index) => (
                  <div key={index}>{item.montant} Ar</div>
                ))}
              </td>
              <td>
                {payment.historique.map((item, index) => (
                  <div key={index}>
                    {users[item.user] || "Utilisateur inconnu"}
                  </div>
                ))}
              </td>
              <td className="action">
                <button
                  className="btn-d"
                  onClick={() => confirmDelete(payment._id)}
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        {/* <tfoot>
            <tr>
              <td className="total" colSpan={2}>
                Total
              </td>
              <td className="total-recette">{totals.montant} Ar</td>
            </tr>
          </tfoot> */}
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

export default PaymentList;
