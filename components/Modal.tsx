import React from 'react';
import { XMarkIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl'
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
      md: 'max-w-xl',
      lg: 'max-w-3xl',
      xl: 'max-w-5xl'
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} m-4 flex flex-col max-h-[90vh]`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b dark:border-slate-700 flex-shrink-0">
          <h3 className="text-xl font-semibold text-brand-dark dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
         {footer && (
            <div className="flex-shrink-0 px-6 py-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-lg">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};

export default Modal;