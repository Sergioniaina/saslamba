import React from "react";
import "./confirm.css";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
function ModalConfirm({ onConfirm, onCancel, message }) {
  return (
    <div className="modalConfirm" onClick={onCancel}>
      <div className="modalConfirm-content" onClick={(e)=>e.stopPropagation()}>
        <div className="message">{message}</div>
        <div className="btn-btn">
          <button className="btn-modal-c" onClick={onConfirm}>
            <FaCheckCircle/>
            confirmer
          </button>
          <button className="btn-m-a" onClick={onCancel}>
            <FaTimes /> Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
export default ModalConfirm;
