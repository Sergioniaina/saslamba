import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FactureDetails = ({ factureId, onBack }) => {
  const [facture, setFacture] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFacture = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/factures/${factureId}`);
        setFacture(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération de la facture:', error);
        setError('Erreur lors de la récupération de la facture.');
      }
    };

    if (factureId) {
      fetchFacture();
    }
  }, [factureId]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!facture) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container">
      <h1>Détails de la Facture</h1>
      <p><strong>ID:</strong> {facture._id}</p>
      <p><strong>Nom du Client:</strong> {facture.customerName}</p>
      <p><strong>Poids Total:</strong> {facture.totalWeight} kg</p>
      <p><strong>Montant Total:</strong> {facture.totalPrice} €</p>
      <p><strong>Type de Service:</strong> {facture.serviceType}</p>
      <p><strong>État:</strong> {facture.estPaye ? 'Payée' : 'Non Payée'}</p>

      <h2>Machines</h2>
      {facture.machines.length > 0 ? (
        <ul>
          {facture.machines.map(machine => (
            <li key={machine._id}>
              {machine.modelNumber} ({machine.type})
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune machine trouvée</p>
      )}

      <h2>Produits</h2>
      {facture.products.length > 0 ? (
        <ul>
          {facture.products.map(product => (
            <li key={product._id}>
              {product.name} - {product.price} €
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucun produit trouvé</p>
      )}

      <button onClick={onBack}>Retour</button>
    </div>
  );
};

export default FactureDetails;
