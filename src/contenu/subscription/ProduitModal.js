import React, { useState, useEffect } from 'react';

const ProductModal = ({ show, onClose, onSave, product }) => {
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    price: '',
    description: '',
    date: '',
    stock: 1,
    photo: null,
  });

  const [fileDetails, setFileDetails] = useState(null); 

  useEffect(() => {
    if (product) {
      setFormData({
        _id: product._id || '',
        name: product.name || '',
        price: product.price || '',
        description: product.description || '',
        date: product.date ? new Date(product.date).toISOString().split('T')[0] : '',
        stock: product.stock || 1,
        photo: product.photo || null,
      });
      setFileDetails(product.photo ? { name: product.photo.split('/').pop() } : null);
    } else {
      setFormData({
        _id: '',
        name: '',
        price: '',
        description: '',
        date: '',
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
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        photo: file
      }));
      setFileDetails({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const updatedFormData = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'photo' && formData[key]) {
        updatedFormData.append(key, formData[key]);
      } else {
        updatedFormData.append(key, formData[key]);
      }
    });
    // Ajouter l'ID de l'utilisateur connecté
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser && currentUser._id) {
      updatedFormData.append("userId", currentUser._id);
    }
  
    onSave(updatedFormData);
  };
  
  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="price"
            placeholder="Price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleChange}
            required
          />
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="stock"
            placeholder="Stock"
            value={formData.stock}
            onChange={handleChange}
            min="1"
            required
          />
          <input
            type="file"
            name="photo"
            accept="image/*"
            onChange={handleFileChange}
          />
          {fileDetails && (
            <div style={{background:'yellow',color:'black'}}>
              <p><strong>File Name:</strong> {fileDetails.name}</p>
              <p><strong>File Size:</strong> {Math.round(fileDetails.size / 1024)} KB</p>
              <p><strong>File Type:</strong> {fileDetails.type}</p>
            </div>
          )}
          {formData.photo && !fileDetails && (
            <div>
              <img
                src={`http://localhost:5000/uploads/${formData.photo.split('/').pop()}`}
                alt="Product"
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
              <p><strong>Current Photo</strong></p>
            </div>
          )}
          <button type="submit">{product ? 'Update' : 'Add'}</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
