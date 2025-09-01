import React from 'react';
import Modal from './Modal';
import { PrimaryButton } from './FormControls';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Delete' }) => {
  
  const footer = (
      <div className="flex justify-end gap-4">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600"
        >
          Cancel
        </button>
        <PrimaryButton 
          type="button" 
          onClick={onConfirm} 
          className="!bg-red-600 hover:!bg-red-700 focus:ring-red-500"
        >
          {confirmButtonText}
        </PrimaryButton>
      </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer}>
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
    </Modal>
  );
};

export default ConfirmationModal;