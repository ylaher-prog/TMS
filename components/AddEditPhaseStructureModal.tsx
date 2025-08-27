import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import type { PhaseStructure, AcademicStructure, Teacher } from '../types';

interface AddEditPhaseStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (structure: PhaseStructure) => void;
  existingStructure: PhaseStructure | null;
  academicStructure: AcademicStructure;
  teachers: Teacher[];
}

const AddEditPhaseStructureModal: React.FC<AddEditPhaseStructureModalProps> = ({ isOpen, onClose, onSave, existingStructure, academicStructure, teachers }) => {
    
    const [formData, setFormData] = useState<Omit<PhaseStructure, 'id'>>({
        phase: '',
        phaseHeadId: '',
        grades: [],
        curricula: [],
    });
    
    const phaseHeads = useMemo(() => {
        const phaseHeadPosition = academicStructure.positions.find(p => p.name === 'Phase Head');
        if (!phaseHeadPosition) return [];
        return teachers.filter(t => t.positionId === phaseHeadPosition.id);
    }, [teachers, academicStructure.positions]);

    useEffect(() => {
        if (existingStructure) {
            setFormData({
                phase: existingStructure.phase,
                phaseHeadId: existingStructure.phaseHeadId,
                grades: existingStructure.grades,
                curricula: existingStructure.curricula,
            });
        } else {
            setFormData({
                phase: '',
                phaseHeadId: phaseHeads[0]?.id || '',
                grades: [],
                curricula: [],
            });
        }
    }, [existingStructure, isOpen, phaseHeads]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (field: 'grades' | 'curricula', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues.sort() };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phase.trim()) {
            alert("Phase name cannot be empty.");
            return;
        }
        
        const finalStructure: PhaseStructure = {
            id: existingStructure?.id || `phase-${Date.now()}`,
            ...formData,
        };
        onSave(finalStructure);
    };

    const CheckboxGroup: React.FC<{ title: string; items: string[]; selectedItems: string[]; onChange: (item: string) => void; }> = ({ title, items, selectedItems, onChange }) => (
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{title}</label>
            <div className="mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded-md max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {items.map(item => (
                        <label key={item} className="flex items-center space-x-2 text-sm cursor-pointer dark:text-gray-300">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(item)}
                                onChange={() => onChange(item)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700"
                            />
                            <span>{item}</span>
                        </label>
                    ))}
                </div>
                 {items.length === 0 && <p className="text-xs text-center text-gray-400">No items available. Please add them in Base Items first.</p>}
            </div>
        </div>
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingStructure ? `Edit ${existingStructure.phase} Phase` : "Add New Phase"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label htmlFor="phase" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phase Name</label>
                <input 
                    type="text" 
                    name="phase" 
                    id="phase" 
                    value={formData.phase} 
                    onChange={handleChange} 
                    required 
                    className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:text-gray-200" 
                />
            </div>
            <div>
                <label htmlFor="phaseHeadId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phase Head</label>
                 <select
                    name="phaseHeadId"
                    id="phaseHeadId"
                    value={formData.phaseHeadId}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:bg-slate-800 dark:text-gray-200"
                >
                    <option value="">-- Select a Head --</option>
                    {phaseHeads.length > 0 ? (
                        phaseHeads.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)
                    ) : (
                        <option value="" disabled>No teachers with 'Phase Head' position found.</option>
                    )}
                </select>
            </div>
        </div>
        
        <CheckboxGroup 
            title="Associated Grades"
            items={academicStructure.grades}
            selectedItems={formData.grades}
            onChange={(grade) => handleMultiSelectChange('grades', grade)}
        />

        <CheckboxGroup 
            title="Associated Curricula"
            items={academicStructure.curricula}
            selectedItems={formData.curricula}
            onChange={(curriculum) => handleMultiSelectChange('curricula', curriculum)}
        />

        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditPhaseStructureModal;