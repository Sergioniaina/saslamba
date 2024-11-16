import React, { useState } from 'react';
import FactureList from './FacturesList';
import FactureForm from './FacturesForm';
import FactureDetails from './FacturesDetails';

const FactureManage = () => {
  const [view, setView] = useState('list'); // 'list', 'details', 'edit'
  const [selectedFacture, setSelectedFacture] = useState(null);

  const handleViewChange = (newView, facture = null) => {
    setView(newView);
    setSelectedFacture(facture);
  };

  const handleViewDetails = (facture) => {
    handleViewChange('details', facture);
  };

  return (
    <div className="factures">
      <h1>Gestion des Factures</h1>
      {view === 'list' && (
        <FactureList onViewDetails={handleViewDetails} onEdit={(facture) => handleViewChange('edit', facture)} />
      )}
      {view === 'details' && selectedFacture && (
        <FactureDetails factureId={selectedFacture._id} onBack={() => handleViewChange('list')} />
      )}
      {view === 'edit' && selectedFacture && (
        <FactureForm facture={selectedFacture} onBack={() => handleViewChange('list')} />
      )}
      {view === 'create' && (
        <FactureForm onBack={() => handleViewChange('list')} />
      )}
      <button onClick={() => handleViewChange('create')}>Créer une Facture</button>
    </div>
  );
};

export default FactureManage;
