import React, { useState } from 'react';
import type { AcademicStructure, Position, Permission } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { FormInput, FormSelect } from './FormControls';

interface PositionManagerProps {
    academicStructure: AcademicStructure;
    setAcademicStructure: React.Dispatch<React.SetStateAction<AcademicStructure>>;
}

const PositionManager: React.FC<PositionManagerProps> = ({ academicStructure, setAcademicStructure }) => {
    const { positions } = academicStructure;

    const [newPositionName, setNewPositionName] = useState('');
    const [newPositionReportsTo, setNewPositionReportsTo] = useState('none');
    
    const [editingPosition, setEditingPosition] = useState<Position | null>(null);
    const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);

    const handleUpdatePositions = (newPositions: Position[]) => {
        setAcademicStructure(prev => ({ ...prev, positions: newPositions }));
    };

    const handleAddPosition = () => {
        if (!newPositionName.trim()) return;
        const newPosition: Position = {
            id: `pos-${Date.now()}`,
            name: newPositionName.trim(),
            reportsToId: newPositionReportsTo === 'none' ? undefined : newPositionReportsTo,
            permissions: [],
        };
        handleUpdatePositions([...positions, newPosition]);
        setNewPositionName('');
        setNewPositionReportsTo('none');
    };

    const handleStartEdit = (pos: Position) => {
        setEditingPosition({ ...pos });
    };

    const handleCancelEdit = () => {
        setEditingPosition(null);
    };

    const handleSaveEdit = () => {
        if (!editingPosition || !editingPosition.name.trim()) return;
        const updatedPositions = positions.map(p =>
            p.id === editingPosition.id ? { ...editingPosition, reportsToId: editingPosition.reportsToId === 'none' ? undefined : editingPosition.reportsToId } : p
        );
        handleUpdatePositions(updatedPositions);
        setEditingPosition(null);
    };
    
     const handleDeleteConfirm = () => {
        if (positionToDelete) {
            const updatedPositions = positions.filter(p => p.id !== positionToDelete.id);
            handleUpdatePositions(updatedPositions);
            setPositionToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Positions & Hierarchy</h3>
                <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Define all staff job titles and their reporting structure.</p>
                
                <div className="mt-4 space-y-2">
                    {positions.map(pos => (
                        <div key={pos.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                            {editingPosition?.id === pos.id ? (
                                <>
                                    <FormInput
                                        value={editingPosition.name}
                                        onChange={(e) => setEditingPosition(p => p ? { ...p, name: e.target.value } : null)}
                                        className="!mt-0 flex-grow"
                                    />
                                    <FormSelect
                                        value={editingPosition.reportsToId || 'none'}
                                        onChange={(e) => setEditingPosition(p => p ? { ...p, reportsToId: e.target.value } : null)}
                                        className="!mt-0 flex-grow"
                                    >
                                        <option value="none">-- Reports to Nobody --</option>
                                        {positions.filter(p => p.id !== editingPosition.id).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </FormSelect>
                                    <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-700 p-1"><CheckIcon className="w-5 h-5"/></button>
                                    <button onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 p-1"><XMarkIcon className="w-5 h-5"/></button>
                                </>
                            ) : (
                                <>
                                    <div className="flex-grow">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">{pos.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Reports to: {positions.find(p => p.id === pos.reportsToId)?.name || 'N/A'}
                                        </p>
                                    </div>
                                    <button onClick={() => handleStartEdit(pos)} className="text-brand-accent hover:text-amber-700 p-1"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setPositionToDelete(pos)} className="text-red-500 hover:text-red-700 p-1"><TrashIcon className="w-4 h-4"/></button>
                                </>
                            )}
                        </div>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t dark:border-slate-700 flex items-end gap-2">
                    <div className="flex-grow">
                        <label className="text-xs font-semibold">Position Name</label>
                        <FormInput
                            type="text"
                            value={newPositionName}
                            onChange={(e) => setNewPositionName(e.target.value)}
                            placeholder="e.g., Senior Teacher"
                            className="!mt-0"
                        />
                    </div>
                    <div className="flex-grow">
                        <label className="text-xs font-semibold">Reports To</label>
                        <FormSelect value={newPositionReportsTo} onChange={(e) => setNewPositionReportsTo(e.target.value)} className="!mt-0">
                             <option value="none">-- Reports to Nobody --</option>
                            {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </FormSelect>
                    </div>
                     <button
                        onClick={handleAddPosition}
                        className="bg-brand-primary text-white px-3 py-2.5 rounded-md flex items-center gap-2 text-sm font-semibold hover:bg-rose-900 transition-colors disabled:opacity-50"
                        disabled={!newPositionName.trim()}
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add
                    </button>
                </div>
            </div>
            {positionToDelete && (
                <ConfirmationModal
                    isOpen={!!positionToDelete}
                    onClose={() => setPositionToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Position"
                    message={`Are you sure you want to delete the "${positionToDelete.name}" position? Teachers assigned to this position will need to be updated.`}
                />
            )}
        </>
    );
};

export default PositionManager;