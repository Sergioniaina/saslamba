import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser,faUserPlus, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import '../css/signUp.css';
import ModalInfo from '../../contenu/modal/ModalInfo';

const Signup = () => {
  const [modalInfo, setModalInfo] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Par défaut, le rôle est 'user'
  const [photo, setPhoto] = useState(null); // Pour stocker la photo
  const [message, setMessage] = useState("");
  // const [error, setError] = useState(''); // Pour afficher les erreurs
  const navigate = useNavigate();
  const [canShowSignup, setCanShowSignup] = useState(true);

  useEffect(() => {
    const checkAdminCount = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/admin-count');
        const { adminCount } = response.data;
        if (adminCount >= 1) {
          setCanShowSignup(false);
        }
      } catch (error) {
        console.error('Error fetching admin count', error);
      }
    };
    checkAdminCount();
  }, []);

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
      await axios.post('http://localhost:5000/api/auth/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/signin');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setMessage('Cet utilisateur existe déjà.');
        setModalInfo(true)
      } else {
        setMessage('Erreur lors de l\'inscription.');
        setModalInfo(true)
      }
    }
  };
  
  const signin =()=>{
    navigate('/signin');
  }
  const onOk = () => {
    setModalInfo(false);
  };
  return (
    <div className='signup'>
      <div className="login-afara"></div>
      <div className="form-container">
        <h2>INSCRIPTION</h2>
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
            <input
              type="password"
              value={password}
               placeholder=''
              onChange={(e) => setPassword(e.target.value)}
              required
            />
             <label> Password:</label>
          </div>
         {
          canShowSignup &&(
            <div className="form-group">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="user">User</option>
            
                 <option value="admin">Admin</option>
            </select>
            <label>Role:</label>
          </div>
          )
         } 
          <div className="form-group">
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => setPhoto(e.target.files[0])}
            />
          </div>
          <label>Photo (facultatif):</label>
          <button type="submit">
            <FontAwesomeIcon icon={faUserPlus} /> S'inscrire
          </button>
          <button type="button" onClick={signin}>
            <FontAwesomeIcon icon={faSignInAlt} /> se connecter
          </button>
        </form>
        {/* {error && <div className="error">{error}</div>} */}
        {modalInfo && <ModalInfo message={message} onOk={onOk} />}
      </div>
    </div>
  );
};

export default Signup;
