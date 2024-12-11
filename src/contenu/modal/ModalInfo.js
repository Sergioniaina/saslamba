import React from 'react';
import './modal.css';
import { FaExclamationTriangle } from 'react-icons/fa';
function ModalInfo({onOk,message}) {
  return (
    <div className='modal-info' onClick={onOk}>
      <div className='modal-info1' onClick={(e)=>e.stopPropagation()}>
        <FaExclamationTriangle className='warning'/>
        <span>{message}</span>
        <button onClick={onOk}>
            ok
        </button>
      </div>
    </div>
  )
}

export default ModalInfo;
