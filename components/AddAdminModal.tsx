import React from 'react';
import Modal from './Modal';

const AddAdminModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Admin User">
            <p>This is a placeholder for the Add Admin User modal.</p>
        </Modal>
    );
};

export default AddAdminModal;
