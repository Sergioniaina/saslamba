import React from 'react'
import './modalConfirm.css';

function Modal({message,onConfirm,onCancel}) {
  return (
    <div className='modalConf'>
        <div className='modalConfirm-content'>
            <span>{message}</span>
            <div className='btn-modalConfirm'>
            <button onClick={onConfirm}>Confirmer</button>
            <button onClick={onCancel}>annuler</button>
            </div>
        </div>
    </div>
  )
}

export default Modal;
