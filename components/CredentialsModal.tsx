import React from 'react';
import Modal from './Modal';
import { PrimaryButton } from './FormControls';
import { CheckCircleIcon } from './Icons';

interface CredentialsModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    tempPassword?: string;
    title: string;
    message: string;
}

const CredentialsModal: React.FC<CredentialsModalProps> = ({ isOpen, onClose, username, tempPassword, title, message }) => {
    
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={title}
            footer={
                <div className="flex justify-end">
                    <PrimaryButton onClick={onClose}>Done</PrimaryButton>
                </div>
            }
        >
            <div className="text-center p-4">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{message}</p>
                <div className="mt-6 space-y-3 text-left bg-gray-100 dark:bg-slate-700 p-4 rounded-lg">
                    <div>
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">USERNAME</span>
                        <div className="flex items-center justify-between">
                            <p className="font-mono text-lg text-gray-800 dark:text-gray-200 tracking-wider">{username}</p>
                            <button onClick={() => copyToClipboard(username)} className="text-xs font-semibold text-brand-primary">COPY</button>
                        </div>
                    </div>
                    {tempPassword && (
                        <div>
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">TEMPORARY PASSWORD</span>
                             <div className="flex items-center justify-between">
                                <p className="font-mono text-lg text-gray-800 dark:text-gray-200 tracking-wider">{tempPassword}</p>
                                <button onClick={() => copyToClipboard(tempPassword)} className="text-xs font-semibold text-brand-primary">COPY</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CredentialsModal;