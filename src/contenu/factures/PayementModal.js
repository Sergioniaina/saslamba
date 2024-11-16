import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './PaymentModal.css'; // Adjust the path to your CSS file

const PaymentModal = ({ isOpen, onClose, onConfirm, totalPrice }) => {
  const [paymentMethod, setPaymentMethod] = useState('espece');
  const [amountPaid, setAmountPaid] = useState('');

  const handleConfirm = () => {
    if (!amountPaid || isNaN(amountPaid) || amountPaid <= 0) {
      alert('Veuillez entrer un montant valide.');
      return;
    }
    onConfirm({ paymentMethod, amountPaid: parseFloat(amountPaid) });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Paiement</h2>
        <label>
          Méthode de paiement:
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="espece">Espèce</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="sns">SNS</option>
          </select>
        </label>
        <label>
          Montant payé:
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            placeholder={`Total à payer: ${totalPrice} €`}
          />
        </label>
        <div className="modal-actions">
          <button onClick={handleConfirm}>Confirmer le paiement</button>
          <button onClick={onClose}>Annuler</button>
        </div>
      </div>
    </div>
  );
};

PaymentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  totalPrice: PropTypes.number.isRequired,
};

export default PaymentModal;
