import React from 'react';
import Modal from './Modal';

const AddClassSectionModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Class Section">
            <p>This is a placeholder for the Add Class Section modal.</p>
        </Modal>
    );
};

export default AddClassSectionModal;
