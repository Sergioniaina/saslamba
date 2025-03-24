import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/UserManagement.css";
import {
  FaEdit,
  FaFile,
  FaPlusCircle,
  FaPlusSquare,
  FaSearch,
  FaTrash,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import ModalConfirm from "../modal/ModalConfirm";
import CompanyInfo from "../factures/CompanyInfo";

const UserManagement = () => {
  const PORT = process.env.REACT_APP_BACKEND_URL;
  const [logo, setLogo] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [photo, setPhoto] = useState(null);
  const [userRole, setUserRole] = useState("user");
  const [formUserRole, setFormUserRole] = useState("user");
  const [errorMessage, setErrorMessage] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  // eslint-disable-next-line
  const [subRole, setSubRole] = useState(""); // Nouveau champ subRole
  const [formSubRole, setFormSubRole] = useState(null); // Nouveau champ pour le formulaire

  // Fonction pour déclencher le clic de l'input fichier
  const handleIconClick = () => {
    fileInputRef.current.click();
  }
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const imageUrl = URL.createObjectURL(file); // Generate preview URL
      setPreview(imageUrl);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role);
      setSubRole(user.subRole);
      setFormUserRole(user.role);
      setFormSubRole(user.subRole);
      console.log("userRole :", user.role);
      if (user.role === "admin") {
        fetchUsers();
      } else if (user.role === "user") {
        fetchCurrentUser();
      } else {
        setErrorMessage("User ID is undefined or invalid");
      }
    } else {
      setErrorMessage("No user found in local storage");
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (
      formUserRole === "admin" &&
      !["superAdmin", "simpleAdmin"].includes(formSubRole)
    ) {
      setFormSubRole("superAdmin"); // Par défaut pour admin
    }
    if (
      formUserRole === "user" &&
      !["caissiere", "magasinier"].includes(formSubRole)
    ) {
      setFormSubRole("caissiere"); // Par défaut pour user
    }
    // eslint-disable-next-line
  }, [formUserRole]);

  const handleSearch = () => {
    let filterUser = users;

    if (searchTerm) {
      filterUser = filterUser.filter((user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filterUser;
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${PORT}/api/auth/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(response.data.users);
    } catch (error) {
      setErrorMessage("Error fetching users: " + error.message);
      console.error("Error fetching users:", error);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${PORT}/api/auth/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setCurrentUser(response.data.user);
    } catch (error) {
      setErrorMessage("Error fetching current user: " + error.message);
      console.error("Error fetching current user:", error);
    }
  };

  const confirmation = () => {
    if (pendingAction) {
      pendingAction();
    }
    setModalVisible(false);
    setPendingAction(null);
  };

  const onCancel = () => {
    setModalVisible(false);
    setPendingAction(null);
  };

  const requestConfirmation = (action, messageText) => {
    setPendingAction(() => action);
    setMessage(messageText);
    setModalVisible(true);
  };

  const handleDelete = async (userId) => {
    const deleteUser = async () => {
      try {
        await axios.delete(`${PORT}/api/auth/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchUsers();
      } catch (error) {
        setErrorMessage("Error deleting user: " + error.message);
        console.error("Error deleting user:", error);
      }
    };

    requestConfirmation(deleteUser, "Voulez-vous supprimer cet utilisateur?");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    if (password) formData.append("password", password);
    if (photo) formData.append("photo", photo);
    formData.append("role", formUserRole);
    formData.append("subRole", formSubRole || "");

    try {
      if (editingUser) {
        await axios.put(`${PORT}/api/auth/users/${editingUser._id}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      } else {
        await axios.post(`${PORT}/api/auth/users/ajout`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      }

      setIsModalOpen(false);
      if (userRole === "user") {
        fetchCurrentUser();
      } else {
        fetchUsers();
      }
    } catch (error) {
      setErrorMessage("Error submitting form: " + error.message);
      console.error("Error submitting form:", error);
    }
  };

  const openModalForEditing = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
    setName(user.name);
    // setPassword(user.password)
    // setConfirmPassword(user.password)
    setPhoto(null);
    setFormUserRole(user.role);
    setFormSubRole(user.subRole || "");
    setPreview(null);
  };

  const openModalForCreating = () => {
    setEditingUser(null);
    setIsModalOpen(true);
    setName("");
    setPassword("");
    setConfirmPassword("");
    setPhoto(null);
    setFormUserRole("user");
    setFormSubRole("caissiere");
    setPreview(null);
  };

  return (
    <div className="user-management">
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {userRole === "admin" ? (
        <>
          <div className="search">
            <button onClick={openModalForCreating}>
              <FaPlusSquare className="icons" /> Créer User
            </button>
            <div className="input">
              <input
                type="text"
                placeholder="Rechercher par nom"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="icon" />
            </div>
            <button onClick={() => setLogo(true)}>
              <FaPlusCircle className="icons" /> Logo
            </button>
          </div>
          <div className="user-profiles">
            <table className="user-profile">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>subRole</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {handleSearch().map((user) => (
                  <tr key={user._id}>
                    <td>
                      <img
                        src={`${PORT}/${user.photo}`}
                        alt={user.name}
                        className="user-profile-photo"
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.role}</td>
                    <td>{user.subRole}</td>
                    <td>
                      <button
                        className="btn-edit"
                        onClick={() => openModalForEditing(user)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(user._id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        currentUser && (
          <table className="user-profile">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>subRole</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <img
                    src={`${PORT}/${currentUser.photo}`}
                    alt={currentUser.name}
                    className="user-profile-photo"
                  />
                </td>
                <td>{currentUser.name}</td>
                <td>{currentUser.role}</td>
                <td>{currentUser.subRole}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => openModalForEditing(currentUser)}
                  >
                    <FaEdit />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        )
      )}

      {isModalOpen && (
        <div className="modal-user">
          <div
            className="modal-users"
            onClick={() => setIsModalOpen(false)}
          ></div>
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)} // Ajout du gestionnaire onChange
                  required
                  placeholder=""
                />
                <label htmlFor="name">Nom</label>
              </div>
              {!editingUser && (
                <>
                  <div className="form-group">
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)} // Ajout du gestionnaire onChange
                      placeholder=""
                      required
                    />
                    <label>Mot de passe</label>
                  </div>

                  <div className="form-group">
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)} // Ajout du gestionnaire onChange
                      required
                    />
                    <label htmlFor="confirmPassword">
                      Confirmer le mot de passe
                    </label>
                  </div>
                </>
              )}
              <div className="form-group">
                <select
                  value={formUserRole}
                  onChange={(e) => setFormUserRole(e.target.value)} // Ajout du gestionnaire onChange
                >
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
                <label>Role</label>
              </div>

              <div className="form-group">
                <select
                  value={formSubRole || "caissiere"} // Default value set for subRole
                  onChange={(e) => setFormSubRole(e.target.value)} // Ajout du gestionnaire onChange
                >
                  <option value="caissiere">Caissière</option>
                  <option value="magasinier">Magasinier</option>
                  {formUserRole === "admin" && (
                    <>
                      <option value="superAdmin">Super Admin</option>
                      <option value="simpleAdmin">Simple Admin</option>
                    </>
                  )}
                </select>
                <label htmlFor="subRole">Sous-rôle</label>
              </div>

              <div className="form-group">
                  <input
                    type="file"
                    id="photo"
                    ref={fileInputRef}
                    onChange={handleFileChange} // Updated to use handleFileChange
                    hidden
                  />
                  <button
                    className="select-file"
                    type="button"
                    onClick={handleIconClick}
                  >
                    <FaFile className="faFile" />
                    Sélectionner un fichier
                  </button>
              </div>
              <div className="form-photo">
              <div className="form-group">
                <input
                  value={
                    photo
                      ? photo.name // Display the name of the newly selected photo
                      : editingUser && !photo
                      ? editingUser.photo.split("/").pop() // Display the filename from the database when editing and no new photo is selected
                      : "" // Default to empty string if neither applies
                  }
                  placeholder=""
                  required
                />
                <label >Photo</label>
              </div>

              {/* Display existing photo when editing and no new photo is selected */}
              {editingUser && !preview && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={`${PORT}/${editingUser.photo}`}
                    alt="Current User"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}

              {/* Display preview of newly selected photo */}
              {preview && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={preview}
                    alt="Selected"
                    style={{
                      width: "80px",
                      minWidth : "80px",
                      height: "80px",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              )}
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-save">
                  {editingUser ? <FaEdit /> : <FontAwesomeIcon icon={faSave} />}
                  {editingUser ? "Modifier" : "Enregistrer"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  <FontAwesomeIcon icon={faTimes} /> Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalVisible && (
        <ModalConfirm
          message={message}
          onConfirm={confirmation}
          onCancel={onCancel}
        />
      )}
      {logo && (
        <div className="logo-user" onClick={() => setLogo(false)}>
          <CompanyInfo />
        </div>
      )}
    </div>
  );
};

export default UserManagement;