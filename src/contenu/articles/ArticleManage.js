import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ArticleForm from './ArticleForm';
import ArticleList from './ArticleList';

import './articles.css';
import { FaPlus, FaSearch } from 'react-icons/fa';
import ModalConfirm from '../modal/ModalConfirm';

const ArticleManage = () => {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // Search query state
  const [isFormVisible, setIsFormVisible] = useState(false); // Toggle for form modal
  const [isConfirmVisible, setIsConfirmVisible] = useState(false); // Toggle for confirm modal
  const [editingArticle, setEditingArticle] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // Stores the action to confirm
  const [confirmMessage, setConfirmMessage] = useState(''); // Stores the confirmation message
  const PORT = process.env.REACT_APP_BACKEND_URL;
  // Fetch articles on component mount
  useEffect(() => {
    const fetchArticles = async () => {
      console.log("Backend URL est:", PORT);
      const response = await axios.get(`${PORT}/api/articles`);
      setArticles(response.data);
    };
    fetchArticles();
  }, [PORT]);

  // Update search query
  const handleSearch = (e) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  // Handle form submission (add or edit article)
  const handleSubmit = async (formData) => {
    if (editingArticle) {
      await axios.put(`${PORT}/api/articles/${editingArticle._id}`, formData);
    } else {
      await axios.post(`${PORT}/api/articles`, formData);
    }
    const response = await axios.get(`${PORT}/api/articles`);
    setArticles(response.data);
    setEditingArticle(null);
    setIsFormVisible(false);
  };

  // Handle edit request (open form in edit mode)
  const handleEdit = (article) => {
    setEditingArticle(article);
    setIsFormVisible(true);
  };

  // Open delete confirmation modal
  const confirmDelete = (id) => {
    setConfirmMessage('vous êtes sur de supprimer cet article?');
    setConfirmAction(() => () => handleDelete(id));
    setIsConfirmVisible(true);
  };

  // Delete article if confirmed
  const handleDelete = async (id) => {
    await axios.delete(`${PORT}api/articles/${id}`);
    setArticles(articles.filter((article) => article._id !== id));
    setIsConfirmVisible(false);
  };

  // Open form to add a new article
  const openForm = () => {
    setEditingArticle(null);
    setIsFormVisible(true);
  };

  // Close the form modal
  const closeForm = () => {
    setIsFormVisible(false);
  };

  // Confirm and execute action (delete, add, or edit)
  const confirmActionAndClose = () => {
    if (confirmAction) confirmAction();
    setIsConfirmVisible(false);
  };

  // Filter articles based on search query
  const filteredArticles = articles.filter((article) =>
    article.type.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="article-manage">
      <div className="search-and-add">
        <div className='input'>
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={handleSearch}
          />
          <FaSearch className="icon" />
        </div>
        <button className="button-add" onClick={openForm}>
          <FaPlus />
          {editingArticle ? 'Modifier Article' : 'Ajouter un Article'}
        </button>
      </div>

      {isFormVisible && (
        <div className="form-modal">
          <ArticleForm onSubmit={handleSubmit} article={editingArticle} onCancel={closeForm} />
        </div>
      )}

      <ArticleList 
        articles={filteredArticles} 
        onEdit={handleEdit} 
        onDelete={confirmDelete} 
      />

      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndClose}
          onCancel={() => setIsConfirmVisible(false)}
          message={confirmMessage}
        />
      )}
    </div>
  );
};

export default ArticleManage;
