import React, { useState, useEffect } from "react";
import { FaEdit, FaSave, FaTimes } from "react-icons/fa";

const ProductModal = ({ show, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    price: "",
    description: "",
    stock: 1,
    photo: null,
  });

  const [fileDetails, setFileDetails] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        _id: product._id || "",
        name: product.name || "",
        price: product.price || "",
        description: product.description || "",
        stock: product.stock || 1,
        photo: product.photo || null,
      });
      setFileDetails(
        product.photo ? { name: product.photo.split("/").pop() } : null
      );
    } else {
      setFormData({
        _id: "",
        name: "",
        price: "",
        description: "",
        date: "",
        stock: 1,
        photo: null,
      });
      setFileDetails(null);
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
      setFileDetails({
        name: file.name,
        size: file.size,
        type: file.type,
      });
    }
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
    // Ajouter l'ID de l'utilisateur connecté
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

          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
          />

          {fileDetails && (
            <div className="file-preview">
              <p>
                <strong>File Name:</strong> {fileDetails.name}
              </p>
              <p>
                <strong>File Size:</strong>{" "}
                {Math.round(fileDetails.size / 1024)} KB
              </p>
              <p>
                <strong>File Type:</strong> {fileDetails.type}
              </p>
            </div>
          )}

          {formData.photo && !fileDetails && (
            <div className="image-preview">
              <img
                src={`http://localhost:5000/uploads/${formData.photo
                  .split("/")
                  .pop()}`}
                alt="Product"
              />
              <p>
                <strong>Current Photo</strong>
              </p>
            </div>
          )}
          <div className="proudit-btn">
          <button type="submit">
          {product ? <FaEdit/> : <FaSave/>}
            {product ? "Update" : "Add"}</button>
          <button type="button" onClick={onClose}>
            <FaTimes/>
            Cancel
          </button>
          </div>

        
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
