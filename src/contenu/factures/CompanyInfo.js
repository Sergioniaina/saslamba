import React, { useState, useEffect, useRef } from "react";
import "./companyInfo.css";
import { FaEdit, FaTrash, FaPlus, FaFile } from "react-icons/fa";
import axios from "axios";

const CompanyInfo = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [companyInfoList, setCompanyInfoList] = useState([]); // Stocke la liste des entreprises
  const [modalOpen, setModalOpen] = useState(false);
  const [preview, setPreview] = useState(null); // Pour la prévisualisation de la nouvelle photo
  const fileInputRef = useRef(null); // Référence pour l'input file
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    photo: null,
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCompanyInfo();
    // eslint-disable-next-line
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await axios.get(`${PORT}/api/company-info/list`);
      setCompanyInfoList(response.data); // On stocke la liste d'entreprises
    } catch (error) {
      console.error("Erreur lors du chargement des informations :", error);
    }
  };

  // Ouvrir la modale pour ajouter ou modifier
  const openModal = (edit = false, company = null) => {
    setIsEditing(edit);
    setModalOpen(true);
    if (edit && company) {
      setFormData({
        name: company.name || "",
        phone: company.phone || "",
        email: company.email || "",
        address: company.address || "",
        photo: null,
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        address: "",
        email: "",
        photo: null,
      });
    }
  };

  // Fermer la modale
  const closeModal = () => {
    setModalOpen(false);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      photo: null,
    });
  };

  // Gérer les changements des champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, photo: file });
      const imageUrl = URL.createObjectURL(file); // Générer une URL pour la prévisualisation
      setPreview(imageUrl);
    }
  };
  const handleIconClick = () => {
    fileInputRef.current.click(); // Déclencher le clic sur l'input file caché
  };

  // Ajouter ou modifier les informations
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("phone", formData.phone);
    data.append("email", formData.email);
    data.append("address", formData.address);
    if (formData.photo) data.append("photo", formData.photo);

    try {
      if (isEditing) {
        await axios.put(`${PORT}/api/company-info/update`, data);
      } else {
        await axios.post(`${PORT}/api/company-info/add`, data);
      }
      fetchCompanyInfo(); // Rafraîchir la liste après l'ajout ou la modification
      closeModal();
    } catch (error) {
      console.error("Erreur lors de la soumission :", error);
    }
  };

  // Supprimer les informations
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${PORT}/api/company-info/${id}`);
      fetchCompanyInfo(); // Rafraîchir la liste après suppression
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  };

  return (
    <div className="company-info" onClick={(e) => e.stopPropagation()}>
      <div className="table-company">
        <table>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Téléphone</th>
              <th>Email</th>
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
                <td>{company.email}</td>
                <td>{company.address}</td>
                <td>
                  <img
                    src={`${PORT}/${company.photo}`}
                    alt=" entreprise"
                    className="photo"
                  />
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openModal(true, company)}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => handleDelete(company._id)}
                  >
                    <FaTrash />
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
        <div className="modal-logo" onClick={() => openModal(false)}>
          <div className="content-logo" onClick={(e) => e.stopPropagation()}>
            <h2>
              {isEditing
                ? "Modifier les informations"
                : "Ajouter des informations"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder=""
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
                  placeholder=""
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
                  placeholder=""
                />
                <label>Adresse </label>
              </div>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder=""
                />
                <label>Email</label>
              </div>
              <div className="form-group">
                <input
                  type="file"
                  name="photo"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  hidden // Cacher l'input file
                />
                <button
                  type="button"
                  className="select-file"
                  onClick={handleIconClick}
                >
                  <FaFile /> Sélectionner une photo
                </button>
              </div>
              <div className="form-photo">
                <div className="form-group">
                  <input
                    value={
                      formData.photo
                        ? formData.photo.name // Nom de la nouvelle photo sélectionnée
                        : isEditing && !formData.photo
                        ? companyInfoList
                            .find((c) => c.name === formData.name)
                            ?.photo?.split("/")
                            .pop() || ""
                        : "" // Nom de la photo existante ou vide
                    }
                    placeholder=""
                    readOnly
                  />
                  <label>Photo</label>
                </div>

                {/* Prévisualisation de la photo */}
                {isEditing && !preview && (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={`${PORT}/${
                        companyInfoList.find((c) => c.name === formData.name)
                          ?.photo
                      }`}
                      alt="Logo actuel de l'entreprise" // Description spécifique
                      style={{
                        width: "80px",
                        minWidth: "80px",
                        height: "80px",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                )}
                {preview && (
                  <div style={{ textAlign: "center" }}>
                    <img
                      src={preview}
                      alt="Aperçu du nouveau logo" // Description spécifique
                      style={{
                        width: "80px",
                        height: "80px",
                        minWidth: "80px",
                        borderRadius: "50%",
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="submit">
                  {isEditing ? "Modifier" : "Ajouter"}
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
