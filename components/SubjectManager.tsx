import React, { useState } from 'react';
import type { Subject, AcademicStructure } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpTrayIcon, ArrowDownTrayIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { AddEditSubjectModal } from './AddEditSubjectModal';
import BulkImportSubjectsModal from './BulkImportSubjectsModal';

interface SubjectManagerProps {
  academicStructure: AcademicStructure;
  onUpdateSubjects: (newSubjects: Subject[]) => void;
}

const SubjectManager: React.FC<SubjectManagerProps> = ({ academicStructure, onUpdateSubjects }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
    const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

    const { subjects } = academicStructure;

    const handleSaveSubject = (subjectData: Omit<Subject, 'id'>) => {
        if (subjectToEdit) {
            const updatedSubjects = subjects.map(s => 
                s.id === subjectToEdit.id ? { ...s, ...subjectData } : s
            );
            onUpdateSubjects(updatedSubjects);
        } else {
            const newSubject: Subject = {
                id: `subj-${Date.now()}`,
                ...subjectData
            };
            onUpdateSubjects([...subjects, newSubject]);
        }
    };
    
    const handleDeleteSubject = () => {
        if(subjectToDelete) {
            onUpdateSubjects(subjects.filter(s => s.id !== subjectToDelete.id));
            setSubjectToDelete(null);
        }
    };

    const handleExportSubjects = () => {
        if (subjects.length === 0) {
            alert("There are no subjects to export.");
            return;
        }

        const headers = "name,grades,curricula,periodsByMode,category,electiveGroup";
        const csvRows = subjects.map(s => {
            const name = s.name;
            const grades = s.grades.join(';');
            const curricula = s.curricula.join(';');
            const periodsByMode = (s.periodsByMode || [])
                .map(p => `${p.mode}=${p.periods}`)
                .join(';');

            return [name, `"${grades}"`, `"${curricula}"`, `"${periodsByMode}"`, s.category || 'Core', s.electiveGroup || ''].join(',');
        });

        const csvContent = [headers, ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "subjects_export.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
  
    const openAddModal = () => {
        setSubjectToEdit(null);
        setIsModalOpen(true);
    };

    const openEditModal = (subject: Subject) => {
        setSubjectToEdit(subject);
        setIsModalOpen(true);
    };

  return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm flex flex-col relative">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Subjects</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage all subjects offered. These are the building blocks for Class Groups.</p>
            </div>
            <div className="flex items-center gap-2">
                 <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="bg-brand-dark-gray text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors flex-shrink-0"
                    title="Import subjects"
                >
                     <ArrowUpTrayIcon className="w-4 h-4" />
                     <span>Import</span>
                </button>
                <button
                    onClick={handleExportSubjects}
                    className="bg-brand-accent text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-amber-700 transition-colors flex-shrink-0"
                    title="Export subjects"
                >
                     <ArrowDownTrayIcon className="w-4 h-4" />
                     <span>Export</span>
                </button>
                <button
                    onClick={openAddModal}
                    className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-rose-900 transition-colors flex-shrink-0"
                    title="Add new subject"
                >
                     <PlusIcon className="w-4 h-4" />
                     <span>Add Subject</span>
                </button>
            </div>
        </div>
         <div className="overflow-x-auto max-h-[60vh]">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicable Curricula</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Applicable Grades</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periods by Mode</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                    {subjects.map((subject) => (
                        <tr key={subject.id}>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{subject.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${subject.category === 'Core' ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-300' : 'bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300'}`}>
                                    {subject.category}
                                </span>
                                {subject.electiveGroup && <div className="text-xs mt-1 text-gray-400">Group: {subject.electiveGroup}</div>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                               <div className="flex flex-wrap gap-1 max-w-xs">
                                    {subject.curricula.map(c => <span key={c} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 rounded-full">{c}</span>)}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                               <div className="flex flex-wrap gap-1 max-w-xs">
                                    {subject.grades.map(g => <span key={g} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 rounded-full">{g}</span>)}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                <div className="flex flex-wrap gap-1.5">
                                    {(subject.periodsByMode || []).map(pbm => (
                                        <span key={pbm.mode} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300 rounded-full font-mono">
                                            {pbm.mode}: {pbm.periods}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                    <button onClick={() => openEditModal(subject)} className="text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300" title="Edit Subject">
                                        <PencilIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setSubjectToDelete(subject)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete Subject">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {subjects.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">No subjects added yet.</p>}
        </div>

        {isModalOpen && (
            <AddEditSubjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSubject}
                existingSubject={subjectToEdit}
                academicStructure={academicStructure}
            />
        )}

        {isImportModalOpen && (
            <BulkImportSubjectsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                academicStructure={academicStructure}
                onUpdateSubjects={onUpdateSubjects}
            />
        )}
        
        {subjectToDelete && (
            <ConfirmationModal
                isOpen={!!subjectToDelete}
                onClose={() => setSubjectToDelete(null)}
                onConfirm={handleDeleteSubject}
                title="Delete Subject"
                message={`Are you sure you want to delete "${subjectToDelete.name}"? This may affect existing class groups and teacher specialties.`}
            />
        )}
    </div>
  );
};

export default SubjectManager;
