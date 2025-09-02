import React from 'react';
import Modal from './Modal';

const SubjectDistributionModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Subject Distribution">
            <p>This is a placeholder for the Subject Distribution modal.</p>
        </Modal>
    );
};

export default SubjectDistributionModal;
