import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Subject, AcademicStructure } from '../types';
import { SubjectCategory } from '../types';
import { TrashIcon } from './Icons';

interface AddEditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subjectData: Omit<Subject, 'id'>) => void;
  existingSubject?: Subject | null;
  academicStructure: AcademicStructure;
}

export const AddEditSubjectModal: React.FC<AddEditSubjectModalProps> = ({ isOpen, onClose, onSave, existingSubject, academicStructure }) => {
    
    type Override = { curriculum: string; grade: string; mode: string; periods: number };

    const [formData, setFormData] = useState<{
        name: string;
        grades: string[];
        curricula: string[];
        periodsByMode: Array<{mode: string; periods: number}>;
        periodOverrides: Override[];
        category: SubjectCategory;
        electiveGroup: string;
    }>({
        name: '',
        grades: [],
        curricula: [],
        periodsByMode: [],
        periodOverrides: [],
        category: SubjectCategory.Core,
        electiveGroup: '',
    });
    
    useEffect(() => {
        if (existingSubject) {
            setFormData({
                name: existingSubject.name,
                grades: existingSubject.grades,
                curricula: existingSubject.curricula || [],
                periodsByMode: existingSubject.periodsByMode || [],
                periodOverrides: existingSubject.periodOverrides || [],
                category: existingSubject.category || SubjectCategory.Core,
                electiveGroup: existingSubject.electiveGroup || '',
            });
        } else {
             setFormData({
                name: '',
                grades: [],
                curricula: [],
                periodsByMode: [],
                periodOverrides: [],
                category: SubjectCategory.Core,
                electiveGroup: '',
            });
        }
    }, [existingSubject, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;

        if (type === 'radio' && name === 'category') {
             setFormData(prev => ({ ...prev, category: value as SubjectCategory }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleMultiSelectChange = (field: 'grades' | 'curricula', value: string) => {
        setFormData(prev => {
            const currentValues = prev[field];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };

    const handleModeToggle = (mode: string) => {
        setFormData(prev => {
            const exists = prev.periodsByMode.some(pbm => pbm.mode === mode);
            if (exists) {
                return { ...prev, periodsByMode: prev.periodsByMode.filter(pbm => pbm.mode !== mode) };
            } else {
                return { ...prev, periodsByMode: [...prev.periodsByMode, { mode, periods: 0 }] };
            }
        });
    };

    const handlePeriodChange = (mode: string, value: string) => {
        const periods = parseInt(value, 10);
        setFormData(prev => ({
            ...prev,
            periodsByMode: prev.periodsByMode.map(pbm => 
                pbm.mode === mode ? { ...pbm, periods: isNaN(periods) ? 0 : periods } : pbm
            )
        }));
    };
    
    const handleAddOverride = () => {
        setFormData(prev => ({
            ...prev,
            periodOverrides: [
                ...prev.periodOverrides,
                { curriculum: academicStructure.curricula[0] || '', grade: academicStructure.grades[0] || '', mode: academicStructure.modes[0] || '', periods: 1 }
            ]
        }));
    };

    const handleUpdateOverride = (index: number, field: keyof Override, value: string) => {
        setFormData(prev => {
            const newOverrides = [...prev.periodOverrides];
            const updatedValue = field === 'periods' ? parseInt(value) || 0 : value;
            (newOverrides[index] as any)[field] = updatedValue;
            return { ...prev, periodOverrides: newOverrides };
        });
    };

    const handleRemoveOverride = (index: number) => {
        setFormData(prev => ({
            ...prev,
            periodOverrides: prev.periodOverrides.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert("Please provide a valid name.");
            return;
        }

        if (formData.periodsByMode.some(p => isNaN(p.periods) || p.periods < 0)) {
            alert("Periods must be a non-negative number for all selected modes.");
            return;
        }

        onSave({ 
            name: formData.name,
            grades: formData.grades,
            modes: formData.periodsByMode.map(p => p.mode),
            curricula: formData.curricula,
            periodsByMode: formData.periodsByMode,
            periodOverrides: formData.periodOverrides,
            category: formData.category,
            electiveGroup: formData.category === SubjectCategory.Elective ? formData.electiveGroup : '',
         });
        onClose();
    };

    const CheckboxGroup: React.FC<{ title: string; items: string[]; selectedItems: string[]; onChange: (item: string) => void; }> = ({ title, items, selectedItems, onChange }) => (
         <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{title}</label>
            <div className="mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded-md max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            </div>
        </div>
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingSubject ? "Edit Subject" : "Add New Subject"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-transparent dark:text-gray-200" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Subject Category</label>
                <div className="mt-2 flex items-center gap-x-6 h-11">
                    <label className="flex items-center text-sm gap-x-2 dark:text-gray-300">
                        <input type="radio" name="category" value={SubjectCategory.Core} checked={formData.category === SubjectCategory.Core} onChange={handleChange} className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-primary"/>
                        <span>Core</span>
                    </label>
                    <label className="flex items-center text-sm gap-x-2 dark:text-gray-300">
                        <input type="radio" name="category" value={SubjectCategory.Elective} checked={formData.category === SubjectCategory.Elective} onChange={handleChange} className="h-4 w-4 border-gray-300 text-brand-primary focus:ring-brand-primary"/>
                        <span>Elective</span>
                    </label>
                </div>
            </div>
        </div>

        {formData.category === SubjectCategory.Elective && (
             <div>
                <label htmlFor="electiveGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Elective Group (Optional)</label>
                <p className="text-xs text-gray-500 dark:text-gray-400">Subjects in the same group are mutually exclusive (e.g., Arabic/Afrikaans).</p>
                <input type="text" name="electiveGroup" id="electiveGroup" value={formData.electiveGroup} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-transparent dark:text-gray-200" placeholder="e.g., Language Choice" />
            </div>
        )}

        <CheckboxGroup 
            title="Applicable Curricula"
            items={academicStructure.curricula}
            selectedItems={formData.curricula}
            onChange={(curriculum) => handleMultiSelectChange('curricula', curriculum)}
        />
        
        <CheckboxGroup 
            title="Applicable Grades"
            items={academicStructure.grades}
            selectedItems={formData.grades}
            onChange={(grade) => handleMultiSelectChange('grades', grade)}
        />
        
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Available Modes &amp; Periods</label>
            <div className="mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded-md max-h-48 overflow-y-auto space-y-3">
                {academicStructure.modes.map(mode => {
                    const modeData = formData.periodsByMode.find(pbm => pbm.mode === mode);
                    const isChecked = !!modeData;

                    return (
                        <div key={mode} className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-md">
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleModeToggle(mode)}
                                className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700"
                            />
                            <span className="flex-1 text-sm dark:text-gray-300 font-medium">{mode}</span>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-500 dark:text-gray-400">Periods:</label>
                                <input
                                    type="number"
                                    value={isChecked ? modeData.periods : ''}
                                    onChange={(e) => handlePeriodChange(mode, e.target.value)}
                                    disabled={!isChecked}
                                    min="0"
                                    className="w-24 border-gray-300 dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-transparent dark:text-gray-200 disabled:bg-gray-200 dark:disabled:bg-slate-800"
                                    placeholder="Periods"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Period Overrides</label>
            <p className="text-xs text-gray-500 dark:text-gray-400">Define specific period counts for certain curriculum/grade/mode combinations.</p>
            <div className="mt-2 space-y-2">
                {formData.periodOverrides.map((override, index) => (
                    <div key={index} className="grid grid-cols-5 items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-md">
                        <select value={override.curriculum} onChange={(e) => handleUpdateOverride(index, 'curriculum', e.target.value)} className="w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-transparent dark:bg-slate-800 col-span-2">
                            {academicStructure.curricula.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={override.grade} onChange={(e) => handleUpdateOverride(index, 'grade', e.target.value)} className="w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-transparent dark:bg-slate-800">
                            {academicStructure.grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                        <select value={override.mode} onChange={(e) => handleUpdateOverride(index, 'mode', e.target.value)} className="w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-transparent dark:bg-slate-800">
                            {academicStructure.modes.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                            <input type="number" value={override.periods} onChange={(e) => handleUpdateOverride(index, 'periods', e.target.value)} min="0" className="w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm sm:text-sm bg-transparent" />
                            <button type="button" onClick={() => handleRemoveOverride(index)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
            <button type="button" onClick={handleAddOverride} className="mt-2 text-sm font-semibold text-brand-primary hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300">+ Add Override</button>
        </div>


        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">{existingSubject ? "Save Changes" : "Add Subject"}</button>
        </div>
      </form>
    </Modal>
  );
};