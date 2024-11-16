import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/UserManagement.css";
//import Modal from "../modal/Modal";
import { FaEdit, FaSearch, FaTrash } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFile,
  faKey,
  faLock,
  faSave,
  faTimes,
  faUser,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import ModalConfirm from "../modal/ModalConfirm";
import CompanyInfo from "../factures/CompanyInfo";

const UserManagement = () => {
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
  const [pendingAction, setPendingAction] = useState(null); // Action en attente de confirmation
  const [message, setMessage] = useState(""); // État pour stocker le message de la modal
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef(null);
  const [subRole, setSubRole] = useState(""); // Nouveau champ subRole
  const [formSubRole, setFormSubRole] = useState(null); // Nouveau champ pour le formulaire
  // const [fileName, setFileName] = useState("");

  // Fonction pour déclencher le clic de l'input fichier
  const handleIconClick = () => {
    fileInputRef.current.click();
  };
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserRole(user.role);
      setSubRole(user.subRole);
      setFormUserRole(user.role);
      setFormSubRole(user.subRole);

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
  }, []);
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
      const response = await axios.get("http://localhost:5000/api/auth/users", {
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
      const response = await axios.get(
        "http://localhost:5000/api/auth/users/me",
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      setCurrentUser(response.data.user);
    } catch (error) {
      setErrorMessage("Error fetching current user: " + error.message);
      console.error("Error fetching current user:", error);
    }
  };

  // Function to handle confirmation
  const confirmation = () => {
    if (pendingAction) {
      pendingAction(); // Exécuter l'action en attente si confirmée
    }
    setModalVisible(false);
    setPendingAction(null); // Réinitialiser l'action en attente
  };

  const onCancel = () => {
    setModalVisible(false);
    setPendingAction(null); // Annuler l'action en attente
  };

  const requestConfirmation = (action, messageText) => {
    setPendingAction(() => action); // Stocker l'action
    setMessage(messageText); // Stocker le message du modal
    setModalVisible(true); // Afficher le modal de confirmation
  };

  const handleDelete = async (userId) => {
    const deleteUser = async () => {
      try {
        await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        fetchUsers();
      } catch (error) {
        setErrorMessage("Error deleting user: " + error.message);
        console.error("Error deleting user:", error);
      }
    };

    // Demander confirmation avant de supprimer
    requestConfirmation(
      deleteUser,
      "Are you sure you want to delete this user?"
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    const submitForm = async () => {
      const formData = new FormData();
      formData.append("name", name);
      if (password) formData.append("password", password);
      if (photo) formData.append("photo", photo);
      if (userRole === "admin") formData.append("role", formUserRole);
      if (subRole) formData.append("subRole", formSubRole);

      try {
        if (editingUser) {
          await axios.put(
            `http://localhost:5000/api/auth/users/${editingUser._id}`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
        } else {
          await axios.post("http://localhost:5000/api/auth/users/ajout", formData, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
        }

        setIsModalOpen(false);
        fetchUsers();
      } catch (error) {
        setErrorMessage("Error submitting form: " + error.message);
        console.error("Error submitting form:", error);
      }
    };

    // Demander confirmation avant de soumettre le formulaire
    requestConfirmation(
      submitForm,
      "Are you sure you want to submit the form?"
    );
  };

  const openModalForEditing = (user) => {
    setEditingUser(user);
    setIsModalOpen(true);
    setName(user.name);
    setPhoto(null);
    setFormUserRole(user.role);
    setFormSubRole(user.subRole || "");
  };

  const openModalForCreating = () => {
    setEditingUser(null);
    setIsModalOpen(true);
    setName("");
    setPassword("");
    setConfirmPassword("");
    setPhoto(null);
    setFormUserRole("user");
    setFormSubRole(null);
  };
  // const handleFileChange = (e) => {
  //   const file = e.target.files[0];
  //   setPhoto(file);
  //   if (file) {
  //     document.querySelector(".input-group.file").classList.add("has-file");
  //   }
  //   setFileName(file ? file.name : "");
  // };

  return (
    <div className="user-management">
      {/* <h1>{userRole === "admin" ? "Listes des Utilisateurs" : "Mon Profile"}</h1> */}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {userRole === "admin" ? (
        <>
          <div className="search">
            <button onClick={openModalForCreating}>Creer User</button>
            <div className="input">
              <input
                type="text"
                placeholder="Rechercher par nom du client"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FaSearch className="icon" />
            </div>
            <button onClick={() => setLogo(true)}>Logo</button>
          </div>

          <table className="user-profile">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {handleSearch().map((user) => (
                <tr key={user._id}>
                  <td>
                    <img
                      src={`http://localhost:5000/${user.photo}`}
                      alt={user.name}
                      className="user-profile-photo"
                    />
                  </td>
                  <td>{user.name}</td>
                  <td>{user.role}</td>
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
        </>
      ) : (
        currentUser && (
          <table className="user-profile">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <img
                    src={`http://localhost:5000/${currentUser.photo}`}
                    alt="Profile"
                    className="user-profile-photo"
                  />
                </td>
                <td>{currentUser.name}</td>
                <td>{currentUser.role}</td>
                <td className="user-action">
                  <button
                  className="btn-edit-profile"
                   onClick={() => openModalForEditing(currentUser)}>
                   <FaEdit/>
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
            <h2>{editingUser ? "Edit User" : "Create New User"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <FontAwesomeIcon className="icon" icon={faUser} />
                <input
                  placeholder="Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <FontAwesomeIcon className="icon" icon={faLock} />
                <input
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <FontAwesomeIcon className="icon" icon={faKey} />
                <input
                  placeholder="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="input-group file">
                <FontAwesomeIcon
                  className="icon"
                  icon={faFile}
                  onClick={handleIconClick}
                />

                <input
                  ref={fileInputRef}
                  placeholder="Photo"
                  type="file"
                  onChange={(e) => {
                    setPhoto(e.target.files[0]);
                    if (e.target.files[0]) {
                      // Ajoutez la classe has-file lorsque le fichier est sélectionné
                      document
                        .querySelector(".input-group.file")
                        .classList.add("has-file");
                    }
                  }}
                />

                {/* Label flottant */}
                <label className={photo ? "has-file" : ""}>Photo</label>

                {/* Affichage du nom du fichier sélectionné */}
                <label className={photo ? "file-name" : ""}>
                  {photo ? photo.name : ""}
                </label>
              </div>

              {userRole === "admin" && (
                <div className="input-group">
                  <FontAwesomeIcon className="icon" icon={faUserShield} />
                  <select
                    value={formUserRole}
                    onChange={(e) => setFormUserRole(e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              )}
              {formUserRole === "admin" && (
                <div className="input-group">
                  <select
                    value={formSubRole || ""}
                    onChange={(e) => setFormSubRole(e.target.value)}
                  >
                    <option value="superAdmin">Super Admin</option>
                    <option value="simpleAdmin">Simple Admin</option>
                    <option value="caissiere">Caissiere</option>
                    <option value="magasinier">Magasinier</option>
                  </select>
                </div>
              )}

              <div className="btn-user">
                <button
                  className="save"
                  style={{ background: "green" }}
                  type="submit"
                >
                  <FontAwesomeIcon className="icon" icon={faSave} /> Save
                </button>
                <button
                  style={{ background: "red" }}
                  type="button"
                  className="cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  <FontAwesomeIcon className="icon" icon={faTimes} /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalVisible && (
        <ModalConfirm
          message={message} // Passer le message à la modal
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
