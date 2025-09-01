

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { TimeConstraint, Teacher } from '../types';

interface AddEditConstraintModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (constraint: TeacherConstraint) => void;
    existingConstraint: TeacherConstraint | null;
    teachers: Teacher[];
    currentAcademicYear: string;
}

// Define a more specific type for the state this modal handles
type TeacherConstraint = Extract<TimeConstraint, { type: 'teacher-max-periods-day' | 'teacher-max-consecutive' }>;

const AddEditConstraintModal: React.FC<AddEditConstraintModalProps> = (props) => {
    const { isOpen, onClose, onSave, existingConstraint, teachers, currentAcademicYear } = props;

    // Use a state that doesn't include fields managed outside the form
    const [formState, setFormState] = useState<Omit<TeacherConstraint, 'id' | 'academicYear'>>({
        type: 'teacher-max-periods-day',
        teacherId: teachers[0]?.id || '',
        maxPeriods: 5,
    });
    
    useEffect(() => {
        if (existingConstraint) {
            const { id, academicYear, ...rest } = existingConstraint;
            setFormState(rest);
        } else {
            setFormState({
                type: 'teacher-max-periods-day',
                teacherId: teachers[0]?.id || '',
                maxPeriods: 5,
            });
        }
    }, [isOpen, existingConstraint, teachers]);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newType = e.target.value as 'teacher-max-periods-day' | 'teacher-max-consecutive';
        switch(newType) {
            case 'teacher-max-periods-day':
                setFormState({ type: newType, teacherId: teachers[0]?.id || '', maxPeriods: 5 });
                break;
            case 'teacher-max-consecutive':
                setFormState({ type: newType, teacherId: teachers[0]?.id || '', maxPeriods: 3 });
                break;
        }
    };
    
    const handleChange = (field: keyof Omit<TeacherConstraint, 'id' | 'type' | 'academicYear'>, value: any) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalConstraint: TeacherConstraint = {
            id: existingConstraint?.id || `tc-${Date.now()}`,
            ...formState,
            academicYear: existingConstraint ? existingConstraint.academicYear : currentAcademicYear,
        }
        onSave(finalConstraint);
    };

    const renderFieldsForType = () => {
        return (
             <>
                <div>
                    <label className="block text-sm font-medium">Teacher</label>
                    <select value={formState.teacherId} onChange={e => handleChange('teacherId', e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Max Periods</label>
                    <input type="number" value={formState.maxPeriods} onChange={e => handleChange('maxPeriods', parseInt(e.target.value) || 0)} min="0" className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                </div>
            </>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingConstraint ? "Edit Teacher Constraint" : "Add Teacher Constraint"}>
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800 dark:text-gray-200">
                <div>
                    <label className="block text-sm font-medium">Constraint Type</label>
                    <select value={formState.type} onChange={handleTypeChange} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                        <option value="teacher-max-periods-day">Max Periods per Day</option>
                        <option value="teacher-max-consecutive">Max Consecutive Periods</option>
                    </select>
                </div>

                {renderFieldsForType()}

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">Save Constraint</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditConstraintModal;