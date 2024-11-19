import React, { useState, useEffect } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";

const MachineModal = ({ show, onClose, onSave, machine }) => {
  const [formData, setFormData] = useState({
    type: "",
    modelNumber: "",
    powerConsumption: "",
    weightCapacity: "",
    etat: "Disponible",
    photo: null,
    priceRanges: [{ minWeight: "", maxWeight: "", price: "" }], // Initialize priceRanges
  });
  const [fileDetails, setFileDetails] = useState(null);

  useEffect(() => {
    if (machine) {
      setFormData({ ...machine });
      // Initialize priceRanges if they exist
      if (!machine.priceRanges) {
        setFormData((prev) => ({
          ...prev,
          priceRanges: [{ minWeight: "", maxWeight: "", price: "" }],
        }));
      }
    } else {
      setFormData({
        type: "",
        modelNumber: "",
        powerConsumption: "",
        weightCapacity: "",
        etat: "Disponible",
        photo: null,
        priceRanges: [{ minWeight: "", maxWeight: "", price: "" }],
      });
    }
  }, [machine]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePriceRangeChange = (index, e) => {
    const { name, value } = e.target;
    const updatedPriceRanges = [...formData.priceRanges];
    updatedPriceRanges[index][name] = value;
    setFormData((prev) => ({
      ...prev,
      priceRanges: updatedPriceRanges,
    }));
  };

  const handleAddPriceRange = () => {
    setFormData((prev) => ({
      ...prev,
      priceRanges: [...prev.priceRanges, { minWeight: "", maxWeight: "", price: "" }],
    }));
  };

  const handleRemovePriceRange = (index) => {
    const updatedPriceRanges = formData.priceRanges.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      priceRanges: updatedPriceRanges,
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
      const currentUser = JSON.parse(localStorage.getItem('user'));
    if (currentUser && currentUser._id) {
      formData.append("userId", currentUser._id);
    }
    onSave(formData);
  };

  if (!show) return null;

  return (
    <div className="modal-machine">
      <div className="modal-content-m">
        <h2>{machine ? "Modifier Machine" : "Ajouter Machine"}</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form1">
            <select name="type" value={formData.type} onChange={handleChange} required>
              <option value="">Select Type</option>
              <option value="Machine à laver">Machine à laver</option>
              <option value="Sèche-linge">Sèche-linge</option>
            </select>
            <input
              type="text"
              placeholder="Model Number"
              name="modelNumber"
              value={formData.modelNumber}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form2">
            <input
              placeholder="Power Consumption (kW)"
              type="number"
              name="powerConsumption"
              value={formData.powerConsumption}
              onChange={handleChange}
              required
            />
            <input
              type="number"
              name="weightCapacity"
              placeholder="Weight Capacity (kg)"
              value={formData.weightCapacity}
              onChange={handleChange}
              required
            />
          </div>

          {/* Price Ranges Section */}
          {formData.type === "Sèche-linge" && (
            <div>
              <h3 className="range">Details</h3>
              {formData.priceRanges.map((range, index) => (
                <div key={index} className="price-range">
                  <input
                    type="number"
                    name="minWeight"
                    placeholder="Min Weight (kg)"
                    value={range.minWeight}
                    onChange={(e) => handlePriceRangeChange(index, e)}
                    required
                  />
                  <input
                    type="number"
                    name="maxWeight"
                    placeholder="Max Weight (kg)"
                    value={range.maxWeight}
                    onChange={(e) => handlePriceRangeChange(index, e)}
                    required
                  />
                  <input
                    type="number"
                    name="price"
                    placeholder="Price (€)"
                    value={range.price}
                    onChange={(e) => handlePriceRangeChange(index, e)}
                    required
                  />
                  <button type="button" onClick={() => handleRemovePriceRange(index)}>Remove</button>
                </div>
              ))}
              <button type="button" onClick={handleAddPriceRange}><FaPlus/> Add Price Range</button>
            </div>
          )}

          <div className="form2">
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleFileChange}
            />
            {fileDetails && (
              <div style={{ background: 'yellow', color: 'black' }}>
                <p><strong>File Name:</strong> {fileDetails.name}</p>
                <p><strong>File Size:</strong> {Math.round(fileDetails.size / 1024)} KB</p>
                <p><strong>File Type:</strong> {fileDetails.type}</p>
              </div>
            )}
            {formData.photo && !fileDetails && (
              <div>
                <img
                  src={`http://localhost:5000/machine/${formData.photo.split('/').pop()}`}
                  alt="Machine"
                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                />
                <p><strong>Current Photo</strong></p>
              </div>
            )}
          </div>
          <div className="form2">
            <button className="btn-ad" type="submit">
            {machine ? <FaEdit/> : <FaPlus/>}
              {machine ? "Modifier" : "Ajouter"}</button>
            <button className="btn-c" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MachineModal;
