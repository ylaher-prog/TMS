import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import type { TaskBoard, Teacher } from '../types';
import MultiSelectFilter from './MultiSelectFilter';

interface AddEditBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (board: TaskBoard) => void;
    existingBoard?: TaskBoard | null;
    allTeachers: Teacher[];
}

const AddEditBoardModal: React.FC<AddEditBoardModalProps> = ({ isOpen, onClose, onSave, existingBoard, allTeachers }) => {
    const [title, setTitle] = useState('');
    const [memberIds, setMemberIds] = useState<string[]>([]);
    
    useEffect(() => {
        if (existingBoard) {
            setTitle(existingBoard.title);
            setMemberIds(existingBoard.memberIds);
        } else {
            setTitle('');
            setMemberIds([]);
        }
    }, [existingBoard, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Board title cannot be empty.");
            return;
        }

        const boardData: TaskBoard = {
            id: existingBoard?.id || `board-${Date.now()}`,
            title: title.trim(),
            memberIds,
            columns: existingBoard?.columns || [
                { id: `col-${Date.now()}-1`, title: 'To Do', cardIds: [] },
                { id: `col-${Date.now()}-2`, title: 'In Progress', cardIds: [] },
                { id: `col-${Date.now()}-3`, title: 'Done', cardIds: [] },
            ],
            tasks: existingBoard?.tasks || [],
        };
        
        onSave(boardData);
    };

    const teacherOptions = allTeachers.map(t => ({ id: t.id, name: t.fullName }));

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={existingBoard ? "Edit Board" : "Create New Board"}
            footer={
                <ModalFooter onCancel={onClose}>
                    <PrimaryButton onClick={handleSubmit}>
                        {existingBoard ? "Save Changes" : "Create Board"}
                    </PrimaryButton>
                </ModalFooter>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <Fieldset legend="Board Details">
                    <div>
                        <FormLabel htmlFor="board-title">Board Title</FormLabel>
                        <FormInput 
                            id="board-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>
                </Fieldset>
                <Fieldset legend="Team Members">
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-2">Select the staff who should have access to this board.</p>
                    <MultiSelectFilter
                        label="Members"
                        options={teacherOptions}
                        selected={memberIds}
                        onChange={setMemberIds}
                    />
                </Fieldset>
            </form>
        </Modal>
    );
};

export default AddEditBoardModal;