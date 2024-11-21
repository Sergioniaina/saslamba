import React, { useState, useEffect } from 'react';
import './companyInfo.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import axios from 'axios';

const CompanyInfo = () => {
  const [companyInfoList, setCompanyInfoList] = useState([]); // Stocke la liste des entreprises
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    photo: null,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/company-info/list');
      setCompanyInfoList(response.data); // On stocke la liste d'entreprises
    } catch (error) {
      console.error('Erreur lors du chargement des informations :', error);
    }
  };

  // Ouvrir la modale pour ajouter ou modifier
  const openModal = (edit = false, company = null) => {
    setIsEditing(edit);
    setModalOpen(true);
    if (edit && company) {
      setFormData({
        name: company.name || '',
        phone: company.phone || '',
        address: company.address || '',
        photo: null,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        photo: null,
      });
    }
  };

  // Fermer la modale
  const closeModal = () => {
    setModalOpen(false);
    setFormData({
      name: '',
      phone: '',
      address: '',
      photo: null,
    });
  };

  // Gérer les changements des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name } = e.target;
    setFormData({ ...formData, [name]: e.target.files[0] });
  };

  // Ajouter ou modifier les informations
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('name', formData.name);
    data.append('phone', formData.phone);
    data.append('address', formData.address);
    if (formData.photo) data.append('photo', formData.photo);

    try {
      if (isEditing) {
        await axios.put('http://localhost:5000/api/company-info/update', data);
      } else {
        await axios.post('http://localhost:5000/api/company-info/add', data);
      }
      fetchCompanyInfo(); // Rafraîchir la liste après l'ajout ou la modification
      closeModal();
    } catch (error) {
      console.error('Erreur lors de la soumission :', error);
    }
  };

  // Supprimer les informations
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/company-info/delete/${id}`);
      fetchCompanyInfo(); // Rafraîchir la liste après suppression
    } catch (error) {
      console.error('Erreur lors de la suppression :', error);
    }
  };

  return (
    <div className="company-info" onClick={(e)=>e.stopPropagation()}>
        <div className="table">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Téléphone</th>
                <th>Adresse</th>
                <th>Photo</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companyInfoList.map((company) => (
                <tr key={company._id}>
                  <td>{company.name}</td>
                  <td>{company.phone}</td>
                  <td>{company.address}</td>
                  <td>
                    <img
                      src={`http://localhost:5000/${company.photo}`} 
                      alt="Photo entreprise"
                      className="photo"
                    />
                  </td>
                  <td>
                    <button onClick={() => openModal(true, company)}>
                      <FaEdit /> Modifier
                    </button>
                    <button onClick={() => handleDelete(company._id)}>
                      <FaTrash /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      <button className="add" onClick={() => openModal(false)}>
        <FaPlus /> Ajouter
      </button>

      {modalOpen && (
        <div className="modal-logo">
          <div className="content-logo">
            <h2>{isEditing ? 'Modifier les informations' : 'Ajouter des informations'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder=''
                />
                <label>Nom </label>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder=''
                />
                 <label>Téléphone </label>
              </div>
              <div className="form-group">  
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder=''
                />
                <label>Adresse </label>
              </div>
              <div className="form-group">
               
                <input type="file" name="photo" onChange={handleFileChange} />
                <label>Photo </label>
              </div>
              <div className="form-actions">
                <button type="submit">
                  {isEditing ? 'Modifier' : 'Ajouter'}
                </button>
                <button type="button" onClick={closeModal}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInfo;
