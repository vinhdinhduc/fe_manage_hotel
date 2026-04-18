import { useEffect } from 'react';
import { FaXmark } from 'react-icons/fa6';
import Button from '../Button/Button';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'md', footer, hideClose }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !hideClose) onClose(); }}>
      <div className={`modal modal--${size}`}>
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          {!hideClose && (
            <button className="modal__close" onClick={onClose}><FaXmark /></button>
          )}
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
