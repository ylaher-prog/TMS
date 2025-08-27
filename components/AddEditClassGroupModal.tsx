import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import type { AcademicStructure, ClassGroup, Subject } from '../types';
import { SubjectCategory } from '../types';

interface AddEditClassGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicStructure: AcademicStructure;
  setClassGroups: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  existingGroup?: ClassGroup | null;
}

const AddEditClassGroupModal: React.FC<AddEditClassGroupModalProps> = ({ isOpen, onClose, academicStructure, setClassGroups, existingGroup }) => {
    
    const [formData, setFormData] = useState({
        name: '',
        curriculum: academicStructure.curricula[0] || '',
        grade: academicStructure.grades[0] || '',
        mode: academicStructure.modes[0] || '',
        learnerCount: '',
        subjectIds: [] as string[],
        academicYear: new Date().getFullYear().toString(),
        addToTimetable: true,
    });

    const [errors, setErrors] = useState<Partial<Omit<typeof formData, 'subjectIds' | 'addToTimetable'>>>({});
    
    useEffect(() => {
        if (existingGroup) {
            setFormData({
                name: existingGroup.name,
                curriculum: existingGroup.curriculum,
                grade: existingGroup.grade,
                mode: existingGroup.mode,
                learnerCount: String(existingGroup.learnerCount),
                subjectIds: existingGroup.subjectIds,
                academicYear: existingGroup.academicYear,
                addToTimetable: existingGroup.addToTimetable ?? true,
            });
        } else {
            setFormData({
                name: '',
                curriculum: academicStructure.curricula[0] || '',
                grade: academicStructure.grades[0] || '',
                mode: academicStructure.modes[0] || '',
                learnerCount: '',
                subjectIds: [],
                academicYear: new Date().getFullYear().toString(),
                addToTimetable: true,
            });
        }
    }, [existingGroup, isOpen, academicStructure]);

    const availableSubjects = useMemo(() => {
        if (!formData.grade || !formData.curriculum) return [];
        return academicStructure.subjects.filter(s => 
            s.grades.includes(formData.grade) && 
            s.curricula.includes(formData.curriculum)
        );
    }, [formData.grade, formData.curriculum, academicStructure.subjects]);

    const subjectGroups = useMemo(() => {
        const core = availableSubjects.filter(s => s.category === SubjectCategory.Core);
        const electives = availableSubjects.filter(s => s.category === SubjectCategory.Elective);
        
        const groupedElectives = electives.reduce((acc, subject) => {
            const groupName = subject.electiveGroup || 'Ungrouped Electives';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(subject);
            return acc;
        }, {} as Record<string, Subject[]>);

        return { core, groupedElectives };
    }, [availableSubjects]);

    // When the grade/curriculum changes, we need to filter out subjectIds that are no longer valid
    useEffect(() => {
        const validSubjectIds = availableSubjects.map(s => s.id);
        setFormData(prev => ({
            ...prev,
            subjectIds: prev.subjectIds.filter(id => validSubjectIds.includes(id))
        }));
    }, [availableSubjects]);

    const handleSubjectToggle = (subjectId: string) => {
        setFormData(prev => {
            const newSubjectIds = prev.subjectIds.includes(subjectId)
                ? prev.subjectIds.filter(id => id !== subjectId)
                : [...prev.subjectIds, subjectId];
            return { ...prev, subjectIds: newSubjectIds };
        });
    };

     const handleElectiveRadioChange = (subjectId: string, groupName: string) => {
        const groupSubjects = subjectGroups.groupedElectives[groupName].map(s => s.id);
        setFormData(prev => {
            // Remove all subjects from this elective group first, then add the newly selected one.
            const otherSubjectIds = prev.subjectIds.filter(id => !groupSubjects.includes(id));
            return {
                ...prev,
                subjectIds: [...otherSubjectIds, subjectId]
            };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setFormData(prev => ({ 
            ...prev, 
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
        }));
    };
    
    const validate = () => {
        const newErrors: Partial<Omit<typeof formData, 'subjectIds' | 'academicYear' | 'addToTimetable'> & { academicYear?: string }> = {};
        if (!formData.name.trim()) newErrors.name = "Group name is required.";
        if (!formData.curriculum) newErrors.curriculum = "Curriculum is required.";
        if (!formData.grade) newErrors.grade = "Grade is required.";
        if (!formData.mode) newErrors.mode = "Mode is required.";
        if (!formData.academicYear.trim()) newErrors.academicYear = "Academic Year is required.";
        else if (!/^\d{4}$/.test(formData.academicYear.trim())) newErrors.academicYear = "Enter a valid 4-digit year.";

        const learnerCountNum = Number(formData.learnerCount);
        if (!formData.learnerCount) newErrors.learnerCount = "Learner count is required.";
        else if (isNaN(learnerCountNum) || learnerCountNum <= 0) newErrors.learnerCount = "Must be a positive number.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        const groupData: Omit<ClassGroup, 'id'> = {
            ...formData,
            learnerCount: Number(formData.learnerCount),
        };

        if (existingGroup) {
            setClassGroups(prev => prev.map(g => g.id === existingGroup.id ? { ...g, ...groupData } : g));
        } else {
             const newClassGroup: ClassGroup = {
                id: `cg-${Date.now()}`,
                ...groupData
            };
            setClassGroups(prev => [...prev, newClassGroup]);
        }
       
        onClose();
    };

    const FormInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; error?: string; type?: string }> = 
    ({ label, name, value, onChange, error, type = 'text' }) => (
        <div>
            <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input 
                type={type} 
                name={name} 
                id={name} 
                value={value} 
                onChange={onChange} 
                className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:text-gray-200" 
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );

    const FormSelect: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; error?: string; children: React.ReactNode }> = 
    ({ label, name, value, onChange, error, children }) => (
         <div>
            <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <select 
                name={name} 
                id={name} 
                value={value} 
                onChange={onChange} 
                className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:bg-slate-700 dark:text-gray-200"
            >
                {children}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingGroup ? "Edit Class Group" : "Create Group"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="Class Name / Identifier" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
            <FormInput label="Academic Year" name="academicYear" value={formData.academicYear} onChange={handleChange} error={errors.academicYear} type="text" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormSelect label="Curriculum" name="curriculum" value={formData.curriculum} onChange={handleChange} error={errors.curriculum}>
                 {academicStructure.curricula.map(c => <option key={c} value={c}>{c}</option>)}
            </FormSelect>
            <FormSelect label="Grade" name="grade" value={formData.grade} onChange={handleChange} error={errors.grade}>
                {academicStructure.grades.map(g => <option key={g} value={g}>{g}</option>)}
            </FormSelect>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput label="Learner Count" name="learnerCount" value={formData.learnerCount} onChange={handleChange} error={errors.learnerCount} type="number" />
            <FormSelect label="Mode" name="mode" value={formData.mode} onChange={handleChange} error={errors.mode}>
                {academicStructure.modes.map(m => <option key={m} value={m}>{m}</option>)}
            </FormSelect>
        </div>
        
        <div className="pt-4 border-t dark:border-slate-700">
             <label className="flex items-center space-x-3 text-sm cursor-pointer dark:text-gray-300 font-medium">
                <input type="checkbox" name="addToTimetable" checked={formData.addToTimetable} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700" />
                <span>Add this class group to the Timetable module</span>
            </label>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subjects</label>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select the subjects to include in this group (filtered by selected grade and curriculum).</p>
            <div className="mt-2 p-4 border border-gray-300 dark:border-slate-600 rounded-md max-h-60 overflow-y-auto space-y-4">
                {availableSubjects.length === 0 ? (
                     <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No subjects are configured for the selected grade and curriculum.</p>
                ) : (
                    <>
                        {/* Core Subjects */}
                        {subjectGroups.core.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Core Subjects</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                    {subjectGroups.core.map(subject => (
                                        <label key={subject.id} className="flex items-center space-x-3 text-sm cursor-pointer dark:text-gray-300">
                                            <input type="checkbox" checked={formData.subjectIds.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700" />
                                            <span>{subject.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Elective Subjects */}
                        {Object.keys(subjectGroups.groupedElectives).length > 0 && (
                             <div>
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-4 mb-2">Elective Subjects</h4>
                                <div className="space-y-3">
                                    {Object.entries(subjectGroups.groupedElectives).map(([groupName, subjectsInGroup]) => (
                                        <div key={groupName} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                                            <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{groupName}</h5>
                                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                                {subjectsInGroup.length > 1 && groupName !== 'Ungrouped Electives' ? (
                                                    // Radio buttons for mutually exclusive groups
                                                    subjectsInGroup.map(subject => (
                                                        <label key={subject.id} className="flex items-center space-x-3 text-sm cursor-pointer dark:text-gray-300">
                                                            <input type="radio" name={`elective-${groupName.replace(/\s+/g, '-')}`} checked={formData.subjectIds.includes(subject.id)} onChange={() => handleElectiveRadioChange(subject.id, groupName)} className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                                            <span>{subject.name}</span>
                                                        </label>
                                                    ))
                                                ) : (
                                                    // Checkboxes for ungrouped or single-item elective groups
                                                    subjectsInGroup.map(subject => (
                                                        <label key={subject.id} className="flex items-center space-x-3 text-sm cursor-pointer dark:text-gray-300">
                                                            <input type="checkbox" checked={formData.subjectIds.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                                            <span>{subject.name}</span>
                                                        </label>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>


        <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-md font-semibold hover:bg-gray-300 text-sm dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="bg-brand-primary text-white px-5 py-2.5 rounded-md font-semibold hover:bg-rose-900 text-sm">{existingGroup ? 'Save Changes' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditClassGroupModal;