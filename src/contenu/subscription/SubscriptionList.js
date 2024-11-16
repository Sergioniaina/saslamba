import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubscriptionModal from './SubscriptionModal';

const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // État pour le terme de recherche

  // Fetch subscriptions from the server
  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/subscriptions');
      setSubscriptions(response.data);
      if (selectedSubscription) {
        const updatedSubscription = response.data.find(sub => sub._id === selectedSubscription._id);
        setSelectedSubscription(updatedSubscription || null);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line
  }, []);

  const handleSaveSubscription = async (subscription) => {
    try {
      if (subscription._id) {
        await axios.put(`http://localhost:5000/api/subscriptions/${subscription._id}`, subscription);
      } else {
        await axios.post('http://localhost:5000/api/subscriptions', subscription);
      }
      await fetchSubscriptions();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  };

  const handleDeleteSubscription = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/subscriptions/${id}`);
      await fetchSubscriptions();
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Error deleting subscription:', error);
    }
  };

  const handleEditSubscription = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleAddSubscription = () => {
    setSelectedSubscription(null);
    setIsModalOpen(true);
  };

  const handleSelectSubscription = (subscription) => {
    setSelectedSubscription(subscription);
  };

  // Filtrer les abonnements par type
  const filteredSubscriptions = subscriptions.filter(subscription =>
    subscription.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="subscription-manager">
      <h1>Gestion des Abonnements</h1>
      
      {/* Champ de recherche */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Rechercher par type d'abonnement"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Mettre à jour le terme de recherche
        />
      </div>

      <div className="subscription-list">
        <h2>Liste des Abonnements</h2>
        <ul>
          {filteredSubscriptions.length === 0 && <p>Aucun abonnement disponible</p>}
          {filteredSubscriptions.map((subscription) => (
            <li
              key={subscription._id}
              onClick={() => handleSelectSubscription(subscription)}
              style={{
                cursor: 'pointer',
                backgroundColor: selectedSubscription?._id === subscription._id ? 'green' : 'black',
                color:'white'
              }}
            >
              {subscription.type} - {subscription.price} AR
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Empêcher la sélection d'abonnement lors du clic sur Modifier
                  handleEditSubscription(subscription);
                }}
              >
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Empêcher la sélection d'abonnement lors du clic sur Supprimer
                  handleDeleteSubscription(subscription._id);
                }}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
        <button onClick={handleAddSubscription}>Ajouter un Abonnement</button>
      </div>

      <div className="subscription-details">
        {selectedSubscription ? (
          <>
            <h2>Détails de l'Abonnement</h2>
            <button onClick={() => setSelectedSubscription(null)}>x</button>
            <p>Type : {selectedSubscription.type}</p>
            <p>Nombre de Machines : {selectedSubscription.machines}</p>
            <p>Poids Total : {selectedSubscription.weight} kg</p>
            <p>Prix : {selectedSubscription.price} AR</p>
            <p>Fonctionnalités :</p>
            <ul>
              {selectedSubscription.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
          </>
        ) : (
          <p>Sélectionner un abonnement pour voir les détails</p>
        )}
      </div>

      {isModalOpen && (
        <SubscriptionModal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSubscription}
          subscription={selectedSubscription}
        />
      )}
    </div>
  );
};

export default SubscriptionManager;
