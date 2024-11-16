import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const FactureForm = ({ facture, onBack }) => {
  const [machines, setMachines] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedMachines, setSelectedMachines] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchM, setSearchT] = useState('');
  
  const handleSearch = () => {
    let filteredProduits = products;

    if (searchTerm) {
      filteredProduits = filteredProduits.filter(produit =>
        produit.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filteredProduits;
  };
  const handleSearchM = () => {
    let filteredMachine = machines;

    if (searchM) {
      filteredMachine = filteredMachine.filter(machine =>
        machine.modelNumber.toLowerCase().includes(searchM.toLowerCase())
      );
    }


  return filteredMachine;
};

  const [formData, setFormData] = useState({
    customerName: '',
    contact: '',
    totalWeight: '',
    serviceType: 'Lavage',
  });
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false); // État pour la prévisualisation
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRes = await axios.get('http://localhost:5000/api/products');
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      }
    };

    const fetchClients = async () => {
      try {
        const clientsRes = await axios.get('http://localhost:5000/api/clients');
        setClients(clientsRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des clients:', error);
      }
    };

    fetchProducts();
    fetchClients();
  }, []);

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machinesRes = await axios.get('http://localhost:5000/api/machines/available');
        setMachines(machinesRes.data);
      } catch (error) {
        console.error('Erreur lors du chargement des machines:', error);
      }
    };

    fetchMachines();
  }, []);

  useEffect(() => {
    if (facture) {
      const selectedClient = clients.find(client => client.name === facture.customerName);
      setFormData({
        customerName: facture.customerName,
        totalWeight: facture.totalWeight,
        serviceType: facture.serviceType,
        contact: selectedClient ? selectedClient.contact : '', // Ajout du contact ici si disponible
      });
      setSelectedMachines(facture.machines);
      setSelectedProducts(facture.products);
      setProductQuantities(facture.productsQuantities || {});
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [facture,clients]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMachineClick = (machineId) => {
    setSelectedMachines(prev => 
      prev.includes(machineId) ? prev.filter(id => id !== machineId) : [...prev, machineId]
    );
  };

  const handleProductClick = (productId) => {
    setSelectedProducts(prev => {
      const newSelectedProducts = prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId];
      setError(''); // Effacer les erreurs précédentes lors du changement de sélection
      return newSelectedProducts;
    });
  };
  
  const handleQuantityChange = (productId, value) => {
    const parsedValue = parseInt(value, 10);
    setProductQuantities(prev => ({
      ...prev,
      [productId]: (!isNaN(parsedValue) && parsedValue > 0) ? parsedValue : 1
    }));
    setError(''); // Effacer les erreurs précédentes lors du changement de quantité
  };
  

  const handleClientSelect = (client) => {
    setFormData({
      customerName: client.name,
      contact: client.contact,
      totalWeight: formData.totalWeight,
      serviceType: formData.serviceType,
    });
  };

  const validateMachines = () => {
    const hasLavageMachine = selectedMachines.some(machineId => machines.find(m => m._id === machineId)?.type === 'Machine à laver');
    const hasSéchageMachine = selectedMachines.some(machineId => machines.find(m => m._id === machineId)?.type === 'Sèche-linge');
    const { serviceType } = formData;

    if (serviceType === 'Lavage' && !hasLavageMachine) {
      setError('Une machine de lavage est requise pour le service de Lavage.');
      return false;
    }

    if (serviceType === 'Lavage' && (hasLavageMachine && hasSéchageMachine)) {
      setError('seulement machine à lavage requis pour faire juste lavage.');
      return false;
    }
    if (serviceType === 'Séchage' && !hasSéchageMachine) {
      setError('Une machine de séchage est requise pour le service de Séchage.');
      return false;
    }

    if (serviceType === 'Séchage' && (hasSéchageMachine && hasLavageMachine)) {
      setError('Une machine de séchage est requise pour faire juste Séchage.');
      return false;
    }

    if (serviceType === 'Lavage + Séchage' && (!hasLavageMachine || !hasSéchageMachine)) {
      setError('Une machine de lavage et une machine de séchage sont requises pour le service Lavage + Séchage.');
      return false;
    }

    setError('');
    return true;
  };
  const validateMachineCapacity = () => {
    const totalWeight = parseFloat(formData.totalWeight);

    // Calcule la capacité totale des machines sélectionnées
    const totalMachineCapacity = selectedMachines.reduce((total, machineId) => {
      const machine = machines.find(m => m._id === machineId);
      return machine ? total + machine.weightCapacity : total;
    }, 0);
    console.log('machine',totalMachineCapacity);
    // Vérifie si le poids dépasse la capacité totale
    if (totalWeight > totalMachineCapacity) {
      setError(`Le poids total dépasse la capacité des machines sélectionnées. Capacité disponible: ${totalMachineCapacity} kg.`);
      return false;
    }

    setError('');
    return true;
  };

  const validateStock = async () => {
    try {
      // Filtrer les produits sélectionnés avec quantités > 0
      const productQuantitiesToCheck = Object.keys(productQuantities).reduce((acc, productId) => {
        if (selectedProducts.includes(productId) && productQuantities[productId] > 0) {
          acc[productId] = productQuantities[productId];
        }
        return acc;
      }, {});
  
      // Récupérer les informations de stock pour les produits sélectionnés
      const stocks = await Promise.all(
        Object.keys(productQuantitiesToCheck).map(productId =>
          axios.get(`http://localhost:5000/api/products/${productId}`)
        )
      );
  
      // Valider la disponibilité du stock
      for (const { data: product } of stocks) {
        if (!product || !product._id || typeof product.stock === 'undefined') {
          console.error('Produit non trouvé ou données incorrectes:', product);
          setError('Données de produit incorrectes.');
          return false;
        }
  
        const quantityRequested = productQuantitiesToCheck[product._id];
        if (product.stock < quantityRequested) {
          setError(`Le stock pour le produit ${product.name} est insuffisant.`);
          return false;
        }
      }
  
      setError('');
      return true;
    } catch (err) {
      console.error('Erreur lors de la vérification des stocks:', err);
      setError('Erreur lors de la vérification des stocks.');
      return false;
    }
  };
  

  const handleSubmit = async () => {
    if (!validateMachines()) return;
       if (!validateMachineCapacity()) return;
    if (!await validateStock()) return;

    // Vérifier si le client existe
    let selectedClient = clients.find(client => client.name === formData.customerName);

    // Si le client n'existe pas, le créer
    if (!selectedClient) {
      try {
        const newClient = await axios.post('http://localhost:5000/api/clients', { 
          name: formData.customerName, 
          contact: formData.contact 
        });
        selectedClient = newClient.data; // Mettre à jour le client sélectionné
      } catch (error) {
        setError('Erreur lors de la création du client');
        return;
      }
    }

    // Enregistrement de la facture
    const factureData = {
      customerName: selectedClient.name, // Nom du client enregistré ou sélectionné
      totalWeight: formData.totalWeight,
      serviceType: formData.serviceType,
      machines: selectedMachines,
      products: selectedProducts,
      quantities: productQuantities
    };

    try {
      if (!isEditMode) {
        await axios.post('http://localhost:5000/api/factures', factureData);
        alert('Facture créée avec succès');
      } else {
        if (!facture || !facture._id) {
          setError('La facture n\'est pas disponible pour la modification.');
          return;
        }
        await axios.put(`http://localhost:5000/api/factures/${facture._id}`, factureData);
        alert('Facture modifiée avec succès');
      }
      setPreview(false); // Masquer la prévisualisation après la soumission
    } catch (error) {
      setError(`Erreur lors de l'enregistrement de la facture: ${error.message}`);
    }
  };

  const renderPreview = () => {
    return (
      <div className="preview-content">
        <h2>Prévisualisation de la Facture</h2>
        <p>Nom du Client: {formData.customerName}</p>
        <p>Contact: {formData.contact}</p>
        <h3>Machines Sélectionnées:</h3>
        <ul>
          {selectedMachines.map(machineId => {
            const machine = machines.find(m => m._id === machineId);
            return machine ? (
              <li key={machineId}>{machine.name} ({machine.type})</li>
            ) : null;
          })}
        </ul>
        <h3>Produits Sélectionnés:</h3>
        <ul>
          {selectedProducts.map(productId => {
            const product = products.find(p => p._id === productId);
            return product ? (
              <li key={productId}>
                {product.name} - {product.price} € (Quantité: 
                <input
                  type="number"
                  value={productQuantities[productId] || 1}
                  readOnly
                />
                )
              </li>
            ) : null;
          })}
        </ul>
        <h3>Prix Total: {calculateTotalPrice()} €</h3>
      </div>
    );
  };

  const calculateTotalPrice = () => {
    return selectedProducts.reduce((total, productId) => {
      const product = products.find(p => p._id === productId);
      if (product) {
        total += product.price * (productQuantities[productId] || 1);
      }
      return total;
    }, 0);
  };
  const handleItemClick = (machineId) => {
    handleMachineClick(machineId);
  };
  return (
    <div className="facture-form">
      {error && <p className="error">{error}</p>}
      
      {/* Recherche et liste des clients */}
      <div>
        <input
          type="text"
          placeholder="Rechercher un client"
          value={formData.customerName}
          onChange={e => setFormData({ ...formData, customerName: e.target.value })}
        />
        <div>
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Contact</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {clients
                .filter(client => client.name.toLowerCase().includes(formData.customerName.toLowerCase()))
                .map(client => (
                  <tr key={client._id}>
                    <td>{client.name}</td>
                    <td>{client.contact}</td>
                    <td>
                      <button onClick={() => handleClientSelect(client)}>Sélectionner</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formulaire */}
      <label>
        Nom du Client:
        <input
          type="text"
          name="customerName"
          value={formData.customerName}
          onChange={handleChange}
        />
      </label>
      <label>
        Contact:
        <input
          type="text"
          name="contact"
          value={formData.contact}
          onChange={handleChange}
        />
      </label>
      <label>
        Poids Total:
        <input
          type="number"
          name="totalWeight"
          value={formData.totalWeight}
          onChange={handleChange}
        />
      </label>
      <label>
        Type de Service:
        <select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
        >
          <option value="Lavage">Lavage</option>
          <option value="Séchage">Séchage</option>
          <option value="Lavage + Séchage">Lavage + Séchage</option>
        </select>
      </label>

      <h3>Choisissez les Machines</h3>
      <input
          type="text"
          placeholder="modelNumber"
          value={searchM}
          onChange={(e) => setSearchT(e.target.value)}
        />
         <ul>
      {handleSearchM().map(machine => (
        <li
          key={machine._id}
          onClick={() => handleItemClick(machine._id)}
          style={{
            backgroundColor: selectedMachines.includes(machine._id) ? 'green' : 'transparent',
            padding: '5px',
            borderRadius: '4px',
            marginBottom: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <input
            type="checkbox"
            checked={selectedMachines.includes(machine._id)}
            onChange={() => handleMachineClick(machine._id)}
            style={{ marginRight: '10px' }} // Ajouter un espace entre la case et le texte
          />
          {machine.name} ({machine.type})
        </li>
      ))}
    </ul>

      <h3>Choisissez les Produits</h3>
      <input
          type="text"
          placeholder="nom produit"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      <ul>
        {handleSearch().map(product => (
          <li key={product._id}>
            <input
              type="checkbox"
              checked={selectedProducts.includes(product._id)}
              onChange={() => handleProductClick(product._id)}
            />
            {product.name} - {product.price} €
            {selectedProducts.includes(product._id) && (
              <input
                type="number"
                value={productQuantities[product._id] || 1}
                onChange={(e) => handleQuantityChange(product._id, e.target.value)}
              />
            )}
          </li>
        ))}
      </ul>

      {!preview ? (
        <div>
          <button type="button" onClick={() => setPreview(true)}>Prévisualiser</button>
          <button type="submit" onClick={handleSubmit}>Enregistrer</button>
          <button type="button" onClick={onBack}>Annuler</button>
        </div>
      ) : (
        <div className="preview">
          {renderPreview()}
          <button className="submit-button" onClick={handleSubmit}>
            {isEditMode ? 'Confirmer la Modification' : 'Confirmer l\'Ajout'}
          </button>
          <button className="preview-button" onClick={() => setPreview(false)}>Modifier</button>
          <button className="preview-button" onClick={() => setPreview(false)}>Annuler</button>
        </div>
      )}
    </div>
  );
};

export default FactureForm;
