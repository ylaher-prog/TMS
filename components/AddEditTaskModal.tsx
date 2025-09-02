import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, FormTextarea, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import type { TaskCard, Teacher } from '../types';

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (task: TaskCard) => void;
    existingTask?: TaskCard | null;
    boardMembers: Teacher[];
}

const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({ isOpen, onClose, onSave, existingTask, boardMembers }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        assignedToId: '',
    });

    useEffect(() => {
        if (existingTask) {
            setFormData({
                title: existingTask.title,
                description: existingTask.description || '',
                dueDate: existingTask.dueDate || '',
                assignedToId: existingTask.assignedToId || '',
            });
        } else {
            setFormData({
                title: '',
                description: '',
                dueDate: '',
                assignedToId: '',
            });
        }
    }, [existingTask, isOpen]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            alert("Task title cannot be empty.");
            return;
        }

        const taskData: TaskCard = {
            id: existingTask?.id || '', // ID will be set/kept in parent
            title: formData.title.trim(),
            description: formData.description || undefined,
            dueDate: formData.dueDate || undefined,
            assignedToId: formData.assignedToId || undefined,
        };
        onSave(taskData);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={existingTask ? "Edit Task" : "Create New Task"}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>
                        {existingTask ? "Save Changes" : "Add Task"}
                    </PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Fieldset legend="Task Details">
                    <div>
                        <FormLabel htmlFor="task-title">Title</FormLabel>
                        <FormInput 
                            id="task-title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>
                     <div>
                        <FormLabel htmlFor="task-description">Description</FormLabel>
                        <FormTextarea
                            id="task-description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={4}
                        />
                    </div>
                </Fieldset>
                 <Fieldset legend="Assignment & Date">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormLabel htmlFor="assignedToId">Assign to</FormLabel>
                            <FormSelect 
                                id="assignedToId"
                                name="assignedToId"
                                value={formData.assignedToId}
                                onChange={handleChange}
                            >
                                <option value="">-- Unassigned --</option>
                                {boardMembers.map(member => (
                                    <option key={member.id} value={member.id}>{member.fullName}</option>
                                ))}
                            </FormSelect>
                        </div>
                         <div>
                            <FormLabel htmlFor="dueDate">Due Date</FormLabel>
                            <FormInput 
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </Fieldset>
            </form>
        </Modal>
    );
};

export default AddEditTaskModal;