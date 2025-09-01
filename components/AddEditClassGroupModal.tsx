import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { FormLabel, FormInput, FormSelect, Checkbox, Fieldset, ModalFooter, PrimaryButton } from './FormControls';
import type { AcademicStructure, ClassGroup, Subject } from '../types';
import { SubjectCategory } from '../types';

interface AddEditClassGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicStructure: AcademicStructure;
  setClassGroups: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  existingGroup?: ClassGroup | null;
  currentAcademicYear: string;
}

const AddEditClassGroupModal: React.FC<AddEditClassGroupModalProps> = ({ isOpen, onClose, academicStructure, setClassGroups, existingGroup, currentAcademicYear }) => {
    
    const [formData, setFormData] = useState({
        name: '',
        curriculum: academicStructure.curricula[0] || '',
        grade: academicStructure.grades[0] || '',
        mode: academicStructure.modes[0] || '',
        learnerCount: '',
        subjectIds: [] as string[],
        academicYear: currentAcademicYear,
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
                academicYear: currentAcademicYear,
                addToTimetable: true,
            });
        }
    }, [existingGroup, isOpen, academicStructure, currentAcademicYear]);

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
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={existingGroup ? "Edit Class Group" : "Create Group"} 
        size="lg"
        footer={
            <ModalFooter onCancel={onClose}>
                <PrimaryButton onClick={handleSubmit}>
                    {existingGroup ? 'Save Changes' : 'Save Group'}
                </PrimaryButton>
            </ModalFooter>
        }
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        <Fieldset legend="Group Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <FormLabel htmlFor="name">Class Name / Identifier</FormLabel>
                    <FormInput id="name" name="name" value={formData.name} onChange={handleChange} error={errors.name} />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                    <FormLabel htmlFor="academicYear">Academic Year</FormLabel>
                    <FormInput id="academicYear" name="academicYear" value={formData.academicYear} onChange={handleChange} error={errors.academicYear} type="text" />
                    {errors.academicYear && <p className="text-red-500 text-xs mt-1">{errors.academicYear}</p>}
                </div>
                <div>
                    <FormLabel htmlFor="curriculum">Curriculum</FormLabel>
                    <FormSelect id="curriculum" name="curriculum" value={formData.curriculum} onChange={handleChange}>
                         {academicStructure.curricula.map(c => <option key={c} value={c}>{c}</option>)}
                    </FormSelect>
                    {errors.curriculum && <p className="text-red-500 text-xs mt-1">{errors.curriculum}</p>}
                </div>
                <div>
                    <FormLabel htmlFor="grade">Grade</FormLabel>
                    <FormSelect id="grade" name="grade" value={formData.grade} onChange={handleChange}>
                        {academicStructure.grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </FormSelect>
                     {errors.grade && <p className="text-red-500 text-xs mt-1">{errors.grade}</p>}
                </div>
                 <div>
                    <FormLabel htmlFor="learnerCount">Learner Count</FormLabel>
                    <FormInput id="learnerCount" name="learnerCount" value={formData.learnerCount} onChange={handleChange} type="number" error={errors.learnerCount} />
                    {errors.learnerCount && <p className="text-red-500 text-xs mt-1">{errors.learnerCount}</p>}
                </div>
                <div>
                    <FormLabel htmlFor="mode">Mode</FormLabel>
                    <FormSelect id="mode" name="mode" value={formData.mode} onChange={handleChange}>
                        {academicStructure.modes.map(m => <option key={m} value={m}>{m}</option>)}
                    </FormSelect>
                    {errors.mode && <p className="text-red-500 text-xs mt-1">{errors.mode}</p>}
                </div>
                <div className="md:col-span-2">
                     <Checkbox 
                        id="excludeFromTimetable" 
                        name="addToTimetable" 
                        label="Exclude this class group from timetable generation"
                        checked={!formData.addToTimetable} 
                        onChange={(e) => setFormData(prev => ({ ...prev, addToTimetable: !e.target.checked }))}
                     />
                </div>
            </div>
        </Fieldset>
        
        <Fieldset legend="Subjects">
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-3">Select the subjects to include in this group (filtered by selected grade and curriculum).</p>
            <div className="p-4 border dark:border-slate-600 rounded-md max-h-60 overflow-y-auto space-y-4 bg-gray-50 dark:bg-slate-900/50">
                {availableSubjects.length === 0 ? (
                     <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No subjects are configured for the selected grade and curriculum.</p>
                ) : (
                    <>
                        {subjectGroups.core.length > 0 && (
                            <div>
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-2">Core Subjects</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
                                    {subjectGroups.core.map(subject => (
                                        <Checkbox key={subject.id} label={subject.name} checked={formData.subjectIds.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {Object.keys(subjectGroups.groupedElectives).length > 0 && (
                             <div>
                                <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mt-4 mb-2">Elective Subjects</h4>
                                <div className="space-y-3">
                                    {Object.entries(subjectGroups.groupedElectives).map(([groupName, subjectsInGroup]) => (
                                        <div key={groupName} className="p-3 bg-white dark:bg-slate-800/50 rounded-md border dark:border-slate-700">
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
                                                        <Checkbox key={subject.id} label={subject.name} checked={formData.subjectIds.includes(subject.id)} onChange={() => handleSubjectToggle(subject.id)} />
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
        </Fieldset>
      </form>
    </Modal>
  );
};

export default AddEditClassGroupModal;