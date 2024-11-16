import React from 'react'; // Assurez-vous d'importer le fichier CSS

const MachineDetails = ({ machine, creatorName, onCloseDetails, isVisible }) => {
  return (
    <>
      {isVisible && <div className="detail" onClick={onCloseDetails}></div>} {/* Overlay modal */}
      <div className={`machine-details ${isVisible ? 'slide-in' : 'slide-out'}`}>
        {machine ? (
          <>
            <div className="machine-details-header">
              <h2>Détails de la Machine</h2>
              <button className="close-button" onClick={onCloseDetails}>
                X
              </button>
            </div>
            <p><strong>Type :</strong> {machine.type}</p>
            <p><strong>Numéro de Modèle :</strong> {machine.modelNumber}</p>
            <p><strong>Consommation Électrique :</strong> {machine.powerConsumption} kW</p>
            <p><strong>Capacité de Poids :</strong> {machine.weightCapacity} kg</p>
            <p><strong>Créée par :</strong> {creatorName}</p>
          </>
        ) : (
          <p>Aucune machine sélectionnée.</p>
        )}
      </div>
    </>
  );
};

export default MachineDetails;
