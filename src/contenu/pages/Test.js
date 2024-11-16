import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FactureSearch = () => {
  const [factures, setFactures] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // État pour le terme de recherche

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/factures');
        setFactures(response.data);
      } catch (error) {
        setError('Une erreur est survenue lors de la recherche.');
        console.error('Erreur lors de la recherche:', error);
      }
    };
    handleSearch();
  }, []);

  // Filtrer les factures en fonction du terme de recherche
  const filteredFactures = factures.filter(facture =>
    facture.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        placeholder="Rechercher par nom de client"
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="search-input"
      />

      {error && <div className="alert alert-error">{error}</div>}

      <ul>
        {filteredFactures.length > 0 ? (
          filteredFactures.map(facture => (
            <li key={facture._id}>
              {facture.customerName} - {facture.totalPrice} €
            </li>
          ))
        ) : (
          <li>Aucune facture trouvée pour ce client</li>
        )}
      </ul>
    </div>
  );
};

export default FactureSearch;
