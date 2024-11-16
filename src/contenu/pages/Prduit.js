import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Products() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', stock: 0, photo: null });
  const [editProduct, setEditProduct] = useState({ id: null, name: '', price: '', description: '', stock: 0, date: '', photo: null });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchAllProducts = async () => {
    try {
      const result = await axios.get('http://localhost:5000/api/products');
      setProducts(result.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  useEffect(() => {
    if (searchTerm) {    
      fetchProducts(searchTerm);
    } else {
      fetchAllProducts();
    }
  }, [searchTerm]);

  const fetchProducts = async (searchTerm) => {
    try {
      const result = await axios.get('http://localhost:5000/api/products/search', { params: { search: searchTerm } });
      setProducts(result.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleAdd = async () => {
    try {
      const formData = new FormData();
      formData.append('name', newProduct.name);
      formData.append('price', newProduct.price);
      formData.append('description', newProduct.description);
      formData.append('stock', newProduct.stock);
      formData.append('photo', newProduct.photo); // Ajout de l'image
      formData.append('date', newProduct.date);

      await axios.post('http://localhost:5000/api/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewProduct({ name: '', price: '', description: '', stock: 0, photo: null });
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleEdit = async () => {
    if (!editProduct.id) {
      console.error('No product ID found for edit.');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', editProduct.name);
      formData.append('price', editProduct.price);
      formData.append('description', editProduct.description);
      formData.append('stock', editProduct.stock);
      formData.append('date', editProduct.date);
      if (editProduct.photo) {
        formData.append('photo', editProduct.photo); // Ajout de l'image si présente
      }

      await axios.put(`http://localhost:5000/api/products/${editProduct.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditProduct({ id: null, name: '', price: '', description: '', stock: 0, date: '', photo: null });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/products/${id}`);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleEditButtonClick = (product) => {
    setEditProduct({
      id: product._id,
      name: product.name,
      price: product.price,
      description: product.description,
      stock: product.stock,
      date: product.date,
      photo: null,
    });
  };

  const handleFileChange = (e) => {
    setNewProduct({ ...newProduct, photo: e.target.files[0] });
  };

  const handleEditFileChange = (e) => {
    setEditProduct({ ...editProduct, photo: e.target.files[0] });
  };

  return (
    <div className="products-container">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="form-container">
        <input
          type="text"
          value={newProduct.name}
          placeholder="Name"
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        />
        <input
          type="number"
          value={newProduct.price}
          placeholder="Price"
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
        />
        <input
          type="number"
          value={newProduct.stock}
          placeholder="Stock"
          onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value, 10) })}
        />
        <textarea
          value={newProduct.description}
          placeholder="Description"
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        />
        <input
          type='date'
          value={newProduct.date}
          onChange={(e) => setNewProduct({ ...newProduct, date: e.target.value })}
        />
        <input type="text" onChange={handleFileChange} />
        <button onClick={handleAdd}>Add Product</button>
      </div>

      {editProduct.id && (
        <div className="form-container">
          <input
            type="text"
            value={editProduct.name}
            placeholder="Name"
            onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
          />
          <input
            type="number"
            value={editProduct.price}
            placeholder="Price"
            onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
          />
          <input
            type="number"
            value={editProduct.stock}
            placeholder="Stock"
            onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value, 10) })}
          />
          <textarea
            value={editProduct.description}
            placeholder="Description"
            onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
          />
          <input type="file" onChange={handleEditFileChange} />
          <button onClick={handleEdit}>Update Product</button>
          <button onClick={() => setEditProduct({ id: null, name: '', price: '', description: '', stock: 0, date: '', photo: null })}>Cancel</button>
        </div>
      )}

      <ul className="products-list">
        {products.length > 0 ? (
          products.map(product => (
            <li key={product._id}>
              {product.name} - ${product.price} - {product.stock} in stock - {product.description} - {new Date(product.date).toLocaleDateString()}
              {product.photo && <img src={`http://localhost:5000/${product.photo}`} alt={product.name} style={{ width: '100px' }} />}
              <button onClick={() => handleEditButtonClick(product)}>Edit</button>
              <button onClick={() => handleDelete(product._id)}>Delete</button>
            </li>
          ))
        ) : (
          <h1>No products available</h1>
        )}
      </ul>
    </div>
  );
}

export default Products;
