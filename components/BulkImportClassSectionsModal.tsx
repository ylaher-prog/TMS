import React from 'react';
import Modal from './Modal';

const BulkImportClassSectionsModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Class Sections">
            <p>This is a placeholder for the Bulk Import Class Sections modal.</p>
        </Modal>
    );
};

export default BulkImportClassSectionsModal;
