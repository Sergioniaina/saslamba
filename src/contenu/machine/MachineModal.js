import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaFile, FaPlus, FaTimes } from "react-icons/fa";
import "../css/modalemachine.css";

const MachineModal = ({ show, onClose, onSave, machine }) => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    type: "",
    modelNumber: "",
    powerConsumption: "",
    weightCapacity: "",
    etat: "Disponible",
    photo: null,
    priceRanges: [{ minWeight: "", maxWeight: "", price: "" }],
  });
  // const [fileDetails, setFileDetails] = useState(null);

  // Initialisation de formData avec les données de machine lors de l'édition
  useEffect(() => {
    if (machine) {
      setFormData({ ...machine });
      // Initialize priceRanges if they exist
      if (!machine.priceRanges) {
        setFormData((prev) => ({
          ...prev,
          priceRanges: [{ minWeight: "", maxWeight: "", price: "" }],
        }));
      }
    } else {
      setFormData({
        type: "",
        modelNumber: "",
        powerConsumption: "",
        weightCapacity: "",
        etat: "Disponible",
        photo: null,
        priceRanges: [{ minWeight: "", maxWeight: "", price: "" }],
      });
    }
  }, [machine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriceRangeChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPriceRanges = [...formData.priceRanges];
    updatedPriceRanges[index] = {
      ...updatedPriceRanges[index],
      [name]: value,
    };
    setFormData((prev) => ({
      ...prev,
      priceRanges: updatedPriceRanges,
    }));
  };

  const handleAddPriceRange = () => {
    setFormData((prev) => ({
      ...prev,
      priceRanges: [
        ...prev.priceRanges,
        { minWeight: "", maxWeight: "", price: "" },
      ],
    }));
  };

  const handleRemovePriceRange = (index) => {
    const updatedPriceRanges = formData.priceRanges.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      priceRanges: updatedPriceRanges.length
        ? updatedPriceRanges
        : [{ minWeight: "", maxWeight: "", price: "" }],
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file, // Nouvelle photo sélectionnée (objet File)
      }));
      // setFileDetails({
      //   name: file.name,
      //   size: file.size,
      //   type: file.type,
      // });
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser && currentUser._id) {
      formData.userId = currentUser._id;
    }
    onSave(formData);
  };

  if (!show) return null;

  // Fonction pour extraire le nom du fichier à partir de machine.photo ou formData.photo
  const getPhotoName = () => {
    if (formData.photo instanceof File) {
      return formData.photo.name; // Nouvelle photo sélectionnée
    }
    if (machine && formData.photo && typeof formData.photo === "string") {
      return formData.photo.split("/").pop(); // Photo existante (chaîne)
    }
    return ""; // Rien à afficher
  };

  return (
    <div className="modal-machine" onClick={onClose}>
      <div className="modal-content-m" onClick={(e) => e.stopPropagation()}>
        <h2>{machine ? "Modifier Machine" : "Ajouter Machine"}</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form1">
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner type</option>
              <option value="Machine à laver">Machine à laver</option>
              <option value="Sèche-linge">Sèche-linge</option>
            </select>
            <input
              type="text"
              placeholder="Numéro de modèle"
              name="modelNumber"
              value={formData.modelNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form2">
            <input
              placeholder="Consommation (kW)"
              type="number"
              name="powerConsumption"
              value={formData.powerConsumption}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="weightCapacity"
              placeholder="Capacité de poids (kg)"
              value={formData.weightCapacity}
              onChange={handleChange}
              required
            />
          </div>

          {/* Section des plages de prix */}
          {formData.type === "Sèche-linge" && (
            <div className="linge">
              <h3 className="range">Détails</h3>
              {formData.priceRanges.map((range, index) => (
                <div key={index} className="price-range">
                  <input
                    type="number"
                    name="minWeight"
                    placeholder="Poids min (kg)"
                    value={range.minWeight}
                    onChange={(e) => handlePriceRangeChange(index, e)}
                    required
                  />
                  <input
                    type="number"
                    name="maxWeight"
                    placeholder="Poids max (kg)"
                    value={range.maxWeight}
                    onChange={(e) => handlePriceRangeChange(index, e)}
                    required
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Prix (€)"
                    value={range.price}
                    onChange={(e) => handlePriceRangeChange(index, e)}
                    required
                  />
                  {formData.priceRanges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePriceRange(index)}
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddPriceRange}
                className="add-price"
              >
                <FaPlus /> Ajouter une plage de prix
              </button>
            </div>
          )}
          <div className="form2">
            <input
              type="file"
              name="photo"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              hidden
            />
            <button
              type="button"
              className="select-file"
              onClick={handleIconClick}
            >
              <FaFile /> Sélectionner une photo
            </button>
          </div>
          <div className="form2">
            <input
              className="file"
              value={getPhotoName()} // Utilisation de la fonction pour le nom
              placeholder="photo"
              required
              readOnly
            />
            {preview && (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={preview}
                  alt="Sélectionnée"
                  style={{
                    maxWidth: "100px",
                    height: "80px",
                    borderRadius: "10px",
                  }}
                />
              </div>
            )}
            {!preview && machine && formData.photo && typeof formData.photo === "string" && (
              <div>
                <img
                  src={`${PORT}/${formData.photo.split("/").pop()}`}
                  alt="Machine"
                  style={{
                    width: "100px",
                    height: "80px",
                    borderRadius: "10px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
          </div>
          <div className="form2">
            <button className="btn-ad" type="submit">
              {machine ? <FaEdit /> : <FaPlus />}
              {machine ? "Modifier" : "Ajouter"}
            </button>
            <button className="btn-c" type="button" onClick={onClose}>
              <FaTimes /> Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MachineModal;