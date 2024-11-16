import React, { useState } from 'react';
// import '../css/machine.css'; // Fichier CSS pour le style

const Machine = () => {
  // State pour la liste des machines et la machine sélectionnée
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineForm, setMachineForm] = useState({ id: '', name: '', status: '', history: [] });

  // Ajouter une machine
  const addMachine = () => {
    setMachines([...machines, { ...machineForm, id: machines.length + 1 }]);
    setMachineForm({ id: '', name: '', status: '', history: [] });
  };

  // Modifier une machine
  const updateMachine = () => {
    setMachines(
      machines.map((machine) =>
        machine.id === selectedMachine.id ? machineForm : machine
      )
    );
    setSelectedMachine(null);
    setMachineForm({ id: '', name: '', status: '', history: [] });
  };

  // Supprimer une machine
  const deleteMachine = (id) => {
    setMachines(machines.filter((machine) => machine.id !== id));
    setSelectedMachine(null);
  };

  // Sélectionner une machine
  const selectMachine = (machine) => {
    setSelectedMachine(machine);
    setMachineForm(machine);
  };

  return (
    <div className="machine">
      <div className="machine-list">
        <h2>Liste des Machines</h2>
        <ul>
          {machines.map((machine) => (
            <li key={machine.id} onClick={() => selectMachine(machine)}>
              {machine.name}
              <button onClick={() => deleteMachine(machine.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
        <div className="form-container">
          <h3>{selectedMachine ? 'Modifier' : 'Ajouter'} une Machine</h3>
          <input
            type="text"
            placeholder="Nom"
            value={machineForm.name}
            onChange={(e) => setMachineForm({ ...machineForm, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Statut"
            value={machineForm.status}
            onChange={(e) => setMachineForm({ ...machineForm, status: e.target.value })}
          />
          {selectedMachine ? (
            <button onClick={updateMachine}>Modifier</button>
          ) : (
            <button onClick={addMachine}>Ajouter</button>
          )}
        </div>
      </div>

      {selectedMachine && (
        <div className="machine-details">
          <h2>Détails de la Machine</h2>
          <p>Nom: {selectedMachine.name}</p>
          <p>Statut: {selectedMachine.status}</p>
          <h3>Historique</h3>
          <ul>
            {selectedMachine.history.length > 0 ? (
              selectedMachine.history.map((entry, index) => (
                <li key={index}>{entry}</li>
              ))
            ) : (
              <li>Aucun historique disponible</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Machine;
