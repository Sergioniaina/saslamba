import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faCamera, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import '../css/signUp.css';

const Signup = () => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Par défaut, le rôle est 'user'
  const [photo, setPhoto] = useState(null); // Pour stocker la photo
  const [error, setError] = useState(''); // Pour afficher les erreurs
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new FormData();
    formData.append('name', name);
    formData.append('password', password);
    formData.append('role', role);
  
    if (photo) {
      formData.append('photo', photo); 
    }
  
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(response.data.message);
      navigate('/signin');
    } catch (error) {
      setError('Error registering user');
      console.error(error);
    }
  };

  return (
    <div className='signup'>
      <div className="login-afara"></div>
      <div className="form-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
          <FontAwesomeIcon className='icon' icon={faUser} /> 
            
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=''
              required
            />
            <label>Name:</label>
          </div>
          <div className="form-group">
          <FontAwesomeIcon className='icon' icon={faLock} />
            <input
              type="password"
              value={password}
               placeholder=''
              onChange={(e) => setPassword(e.target.value)}
              required
            />
             <label> Password:</label>
          </div>
          <div className="form-group">
           
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <label>Role:</label>
          </div>
          <div className="form-group">
          <FontAwesomeIcon className='icon' icon={faCamera} /> 
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </div>
          <label>Photo (facultatif):</label>
          <button type="submit">
            <FontAwesomeIcon icon={faUserPlus} /> Sign Up
          </button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
};

export default Signup;
