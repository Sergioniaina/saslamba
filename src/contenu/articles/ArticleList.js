import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './articles.css';

const ArticleList = ({ articles, onEdit, onDelete }) => {
  return (
    <div className="article-list">
        <table>
          <thead>
            <tr>
              <th>Type</th>
              <th className='th'>Prix</th>
              <th className='action'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {articles.map((article) => (
              <tr key={article._id}>
                <td>{article.type}</td>
                <td className='th'>
                  <ul>
                    {article.prices.map((price, index) => (
                      <li key={index}>
                        <strong>{price.priceType}:</strong> {price.value}
                      </li>
                    ))}
                  </ul>
                </td>
                <td className='action'>
                  <button className='action-edit' onClick={() => onEdit(article)}>
                    <FontAwesomeIcon icon={faEdit} /> Modifier
                  </button>
                  <button className='action-delete' onClick={() => onDelete(article._id)}>
                    <FontAwesomeIcon icon={faTrash} /> Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
     
    </div>
  );
};

export default ArticleList;
