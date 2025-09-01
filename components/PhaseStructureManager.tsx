import React, { useState, useMemo } from 'react';
import type { PhaseStructure, AcademicStructure, Teacher } from '../types';
import { PencilIcon, UsersIcon, AcademicCapIcon, ClipboardDocumentListIcon, PlusIcon, TrashIcon } from './Icons';
import AddEditPhaseStructureModal from './AddEditPhaseStructureModal';
import ConfirmationModal from './ConfirmationModal';

interface PhaseStructureManagerProps {
  phaseStructures: PhaseStructure[];
  setPhaseStructures: React.Dispatch<React.SetStateAction<PhaseStructure[]>>;
  academicStructure: AcademicStructure;
  teachers: Teacher[];
}

const PhaseStructureManager: React.FC<PhaseStructureManagerProps> = ({ phaseStructures, setPhaseStructures, academicStructure, teachers }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [phaseToEdit, setPhaseToEdit] = useState<PhaseStructure | null>(null);
    const [phaseToDelete, setPhaseToDelete] = useState<PhaseStructure | null>(null);

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);

    const handleAdd = () => {
        setPhaseToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (phaseStructure: PhaseStructure) => {
        setPhaseToEdit(phaseStructure);
        setIsModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (phaseToDelete) {
            setPhaseStructures(prev => prev.filter(p => p.id !== phaseToDelete.id));
            setPhaseToDelete(null);
        }
    };
    
    const handleSave = (structure: PhaseStructure) => {
        if (phaseToEdit) {
            setPhaseStructures(prev => prev.map(p => p.id === structure.id ? structure : p));
        } else {
            setPhaseStructures(prev => [...prev, structure]);
        }
        setIsModalOpen(false);
        setPhaseToEdit(null);
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Phase Management</h3>
                        <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">
                            Define which grades and curricula fall under each academic phase and assign a Phase Head responsible for oversight.
                        </p>
                    </div>
                    <button onClick={handleAdd} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors mt-3 sm:mt-0 flex-shrink-0">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Phase</span>
                    </button>
                </div>

                {phaseStructures.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed dark:border-slate-700 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Phases Defined</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click "Add Phase" to create your first academic phase.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {phaseStructures.map(ps => (
                            <div key={ps.id} className="bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-5 flex flex-col">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <h4 className="text-xl font-bold text-brand-primary dark:text-rose-400">{ps.phase}</h4>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => handleEdit(ps)} className="flex items-center gap-1.5 text-sm text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-semibold">
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => setPhaseToDelete(ps)} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                        <UsersIcon className="w-6 h-6 text-brand-dark-gray dark:text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Phase Head</p>
                                            <p className="font-semibold">{teacherMap.get(ps.phaseHeadId) || 'Unassigned'}</p>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2"><AcademicCapIcon className="w-4 h-4" />Grades</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ps.grades.map(g => <span key={g} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 rounded-full">{g}</span>)}
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-2"><ClipboardDocumentListIcon className="w-4 h-4" />Curricula</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {ps.curricula.map(c => <span key={c} className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-gray-300 rounded-full">{c}</span>)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <AddEditPhaseStructureModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    existingStructure={phaseToEdit}
                    academicStructure={academicStructure}
                    teachers={teachers}
                />
            )}
            {phaseToDelete && (
                 <ConfirmationModal
                    isOpen={!!phaseToDelete}
                    onClose={() => setPhaseToDelete(null)}
                    onConfirm={handleDeleteConfirm}
                    title="Delete Phase"
                    message={`Are you sure you want to delete the "${phaseToDelete.phase}" phase? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default PhaseStructureManager;
