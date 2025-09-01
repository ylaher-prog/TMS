import React, { useState } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, ModalFooter, PrimaryButton } from './FormControls';
import type { Teacher } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Teacher;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, setTeachers }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Mock password check
        if (currentPassword !== 'password123') {
            setError('Current password is incorrect.');
            return;
        }

        if (newPassword.length < 8) {
            setError('New password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        // In a real app, this would be a secure hash.
        // For now, we are not updating the mock hash.
        alert('Password changed successfully! (Note: In this demo, the password for the mock user is not actually updated).');
        onClose();
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Edit Profile"
            footer={
                 <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>
                        Save Changes
                    </PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <FormLabel htmlFor="currentPassword">Current Password</FormLabel>
                    <FormInput
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <FormLabel htmlFor="newPassword">New Password</FormLabel>
                    <FormInput
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>
                 <div>
                    <FormLabel htmlFor="confirmPassword">Confirm New Password</FormLabel>
                    <FormInput
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
            </form>
        </Modal>
    );
};

export default EditProfileModal;