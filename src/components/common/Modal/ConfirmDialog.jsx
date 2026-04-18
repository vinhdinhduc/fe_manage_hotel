import Modal from './Modal';
import Button from '../Button/Button';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmLabel = 'Xác nhận', confirmVariant = 'danger' }) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title || 'Xác nhận'}
    size="sm"
    footer={
      <>
        <Button variant="secondary" onClick={onCancel}>Hủy</Button>
        <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
      </>
    }
  >
    <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.925rem' }}>{message}</p>
  </Modal>
);

export default ConfirmDialog;
