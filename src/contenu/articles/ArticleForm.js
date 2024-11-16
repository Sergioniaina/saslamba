import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { FaEdit, FaSave } from 'react-icons/fa';
import ModalConfirm from '../modal/ModalConfirm';
import './articles.css';

const ArticleForm = ({ onSubmit, article, onCancel }) => {
  const [formData, setFormData] = useState({
    type: article?.type || '',
    prices: article?.prices || [{ priceType: '', value: '' }],
  });
  const [isConfirmVisible, setIsConfirmVisible] = useState(false); // State for modal visibility

  useEffect(() => {
    if (article) {
      setFormData({
        type: article.type || '',
        prices: article.prices || [{ priceType: '', value: '' }],
      });
    }
  }, [article]);

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    if (name === 'type') {
      setFormData({ ...formData, type: value });
    } else {
      const updatedPrices = [...formData.prices];
      updatedPrices[index][name] = value;
      setFormData({ ...formData, prices: updatedPrices });
    }
  };

  const addPriceField = () => {
    setFormData({
      ...formData,
      prices: [...formData.prices, { priceType: '', value: '' }],
    });
  };

  const removePriceField = (index) => {
    const updatedPrices = formData.prices.filter((_, i) => i !== index);
    setFormData({ ...formData, prices: updatedPrices });
  };

  // Handle form submission with confirmation modal
  const handleSubmit = (e) => {
    e.preventDefault();
    setIsConfirmVisible(true); // Show confirmation modal
  };

  // Confirm action from the modal
  const confirmActionAndSubmit = () => {
    onSubmit(formData); // Submit the form data
    setIsConfirmVisible(false); // Hide modal after confirming
  };

  return (
    <div className="form-modal" onClick={onCancel}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
        <h2>{article ? 'Modifier Article' : 'Ajouter Article'}</h2>
        <input
          type="text"
          name="type"
          placeholder="Type d'article"
          value={formData.type}
          onChange={handleChange}
          required
          className="t"
        />
        {formData.prices.map((price, index) => (
          <div key={index} className="price-field">
            <input
              type="text"
              name="priceType"
              placeholder="Type de prix"
              value={price.priceType}
              onChange={(e) => handleChange(e, index)}
              required
            />
            <div className="price">
              <input
                type="number"
                name="value"
                placeholder="Valeur"
                value={price.value}
                onChange={(e) => handleChange(e, index)}
                required
              />
              {formData.prices.length > 1 && (
                <button className="minus" type="button" onClick={() => removePriceField(index)}>
                  <FontAwesomeIcon icon={faMinus} />
                </button>
              )}
            </div>
          </div>
        ))}
        <button className="ajout-prix" type="button" onClick={addPriceField}>
          <FontAwesomeIcon icon={faPlus} /> Ajouter un autre prix
        </button>

        <div className="modal-actions">
          <button className="ajout-m-a" type="submit">
            {article ? <FaEdit /> : <FaSave />}
            {article ? 'Modifier' : 'Ajouter'}
          </button>
          <button className="annuler" type="button" onClick={onCancel}>
            <FontAwesomeIcon icon={faTimes} /> Annuler
          </button>
        </div>
      </form>

      {isConfirmVisible && (
        <ModalConfirm
          onConfirm={confirmActionAndSubmit}
          onCancel={() => setIsConfirmVisible(false)}
          message={article ? 'Confirmez la modification de cet article?' : 'Confirmez l’ajout de cet article?'}
        />
      )}
    </div>
  );
};

export default ArticleForm;
