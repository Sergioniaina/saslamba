import React, { useState, useEffect, useRef } from "react";
import { FaEdit, FaFile, FaSave, FaTimes } from "react-icons/fa";

const ProductModal = ({ show, onClose, onSave, product }) => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    price: "",
    description: "",
    stock: 1,
    stockAlerte: 5,
    photo: null,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        _id: product._id || "",
        name: product.name || "",
        price: product.price || "",
        description: product.description || "",
        stock: product.stock || 1,
        stockAlerte: product.stockAlerte || 5,
        photo: product.photo || null,
      });
      setPreview(null); // Réinitialiser la prévisualisation lors du chargement d'un produit existant
    } else {
      setFormData({
        _id: "",
        name: "",
        price: "",
        description: "",
        stock: 1,
        stockAlerte: 5,
        photo: null,
      });
      setPreview(null);
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedFormData = new FormData();
    Object.keys(formData).forEach((key) => {
      if (key === "photo" && formData[key]) {
        updatedFormData.append(key, formData[key]);
      } else {
        updatedFormData.append(key, formData[key]);
      }
    });
    const currentUser = JSON.parse(localStorage.getItem("user"));
    if (currentUser && currentUser._id) {
      updatedFormData.append("userId", currentUser._id);
    }
    onSave(updatedFormData);
  };

  if (!show) return null;

  return (
    <div className="modal-p" onClick={onClose}>
      <div className="modal-content-p" onClick={(e) => e.stopPropagation()}>
        <h2>{product ? "Modifier Produit" : "Ajouter Produit"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="name"
              placeholder=" "
              value={formData.name}
              onChange={handleChange}
              required
            />
            <label>Name</label>
          </div>

          <div className="form-group">
            <input
              type="number"
              name="price"
              placeholder=" "
              value={formData.price}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            <label>Price</label>
          </div>

          <div className="form-group">
            <textarea
              name="description"
              placeholder=" "
              value={formData.description}
              onChange={handleChange}
              required
            />
            <label>Type</label>
          </div>

          <div className="form-group">
            <input
              type="number"
              name="stock"
              placeholder=" "
              value={formData.stock}
              onChange={handleChange}
              min="1"
              required
            />
            <label>Stock</label>
          </div>
          <div className="form-group">
            <input
              type="number"
              name="stockAlerte"
              placeholder=" "
              value={formData.stockAlerte}
              onChange={handleChange}
              min="1"
              required
            />
            <label>Stock Alerte</label>
          </div>

          <div className="form-group">
            <input
              type="file"
              name="photo"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              hidden
            />
            <button type="button" className="select-file" onClick={handleIconClick}>
              <FaFile /> Sélectionner une photo
            </button>
          </div>

          <div className="form-photo">
            <div className="form-group">
              <input
                className="file"
                value={
                  formData.photo instanceof File
                    ? formData.photo.name
                    : formData.photo && typeof formData.photo === "string"
                    ? formData.photo.split("/").pop()
                    : product && !formData.photo
                    ? product.photo.split("/").pop()
                    : ""
                }
                placeholder=""
                readOnly
                required
              />
              <label>Photo</label>
            </div>
            {/* Affichage de la photo */}
            {preview ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={preview}
                  alt="Aperçu de la nouvelle"
                  style={{
                    maxWidth: "100px",
                    height: "80px",
                    minWidth: "100px",
                    borderRadius: "10px",
                  }}
                />
              </div>
            ) : formData.photo && typeof formData.photo === "string" ? (
              <div style={{ marginTop: "10px" }}>
                <img
                  src={`${PORT}/${formData.photo}`}
                  alt="actuelle du produit"
                  style={{
                    maxWidth: "100px",
                    height: "80px",
                    minWidth: "100px",
                    borderRadius: "10px",
                  }}
                />
              </div>
            ) : null}
          </div>
          <div className="proudit-btn">
            <button type="submit">
              {product ? <FaEdit /> : <FaSave />}
              {product ? "Update" : "Add"}
            </button>
            <button type="button" onClick={onClose}>
              <FaTimes />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;