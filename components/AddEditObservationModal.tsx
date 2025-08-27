import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, FormField } from '../types';
import { MonitoringStatus, ObservationPriority, FormFieldType } from '../types';

interface AddEditObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
  existingObservation?: Observation | null;
  teachers: Teacher[];
  academicStructure: AcademicStructure;
  phaseStructures: PhaseStructure[];
  monitoringTemplates: MonitoringTemplate[];
}

const FormLabel: React.FC<{ htmlFor?: string, children: React.ReactNode}> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</label>
)

const StarRating: React.FC<{ value: number; onChange: (value: number) => void }> = ({ value, onChange }) => {
    return (
        <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="focus:outline-none"
                >
                    <svg
                        className={`w-7 h-7 ${star <= value ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.956a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.364 2.44a1 1 0 00-.364 1.118l1.287 3.956c.3.921-.755 1.688-1.539 1.118l-3.364-2.44a1 1 0 00-1.175 0l-3.364 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.956a1 1 0 00-.364-1.118L2.073 9.383c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
                    </svg>
                </button>
            ))}
        </div>
    );
};


const AddEditObservationModal: React.FC<AddEditObservationModalProps> = (props) => {
    const { isOpen, onClose, setObservations, existingObservation, teachers, academicStructure, phaseStructures, monitoringTemplates } = props;
    
    const [formData, setFormData] = useState({
        observationType: monitoringTemplates[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        grade: academicStructure.grades[0] || '',
        curriculum: academicStructure.curricula[0] || '',
        observationDate: new Date().toISOString().split('T')[0],
        status: MonitoringStatus.Open,
        priority: ObservationPriority.Medium,
        customFormData: {} as Record<string, any>,
        followUpDate: '',
    });

    const [derivedData, setDerivedData] = useState({
        phase: '',
        phaseHeadId: '',
        phaseHeadName: 'N/A',
    });
    
    const activeTemplate = monitoringTemplates.find(t => t.id === formData.observationType);

    useEffect(() => {
        const initialCustomData: Record<string, any> = {};
        if (activeTemplate) {
            activeTemplate.fields.forEach(field => {
                initialCustomData[field.id] = field.type === FormFieldType.Checkbox ? false :
                                            field.type === FormFieldType.Rating ? 0 : '';
            });
        }
        
        if (existingObservation) {
            setFormData({
                observationType: existingObservation.observationType,
                teacherId: existingObservation.teacherId,
                grade: existingObservation.grade,
                curriculum: existingObservation.curriculum,
                observationDate: existingObservation.observationDate,
                status: existingObservation.status,
                priority: existingObservation.priority,
                customFormData: { ...initialCustomData, ...existingObservation.formData },
                followUpDate: existingObservation.followUpDate || '',
            });
        } else {
             setFormData(prev => ({
                ...prev,
                observationType: monitoringTemplates[0]?.id || '',
                teacherId: teachers[0]?.id || '',
                grade: academicStructure.grades[0] || '',
                curriculum: academicStructure.curricula[0] || '',
                observationDate: new Date().toISOString().split('T')[0],
                status: MonitoringStatus.Open,
                priority: ObservationPriority.Medium,
                customFormData: initialCustomData,
                followUpDate: '',
            }));
        }
    }, [existingObservation, isOpen, teachers, academicStructure, activeTemplate, monitoringTemplates]);
    
    useEffect(() => {
        const { grade, curriculum } = formData;
        
        const foundPhaseInfo = phaseStructures.find(p => 
            p.grades.includes(grade) && 
            p.curricula.includes(curriculum)
        );

        if (foundPhaseInfo) {
            const head = teachers.find(t => t.id === foundPhaseInfo.phaseHeadId);
            setDerivedData({ 
                phase: foundPhaseInfo.phase, 
                phaseHeadId: foundPhaseInfo.phaseHeadId,
                phaseHeadName: head?.fullName || 'N/A' 
            });
        } else {
            setDerivedData({ phase: '', phaseHeadId: '', phaseHeadName: 'N/A' });
        }
    }, [formData.grade, formData.curriculum, phaseStructures, teachers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomFormChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            customFormData: {
                ...prev.customFormData,
                [fieldId]: value,
            }
        }));
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const observationData: Omit<Observation, 'id'> = {
            observationType: formData.observationType,
            teacherId: formData.teacherId,
            grade: formData.grade,
            curriculum: formData.curriculum,
            observationDate: formData.observationDate,
            status: formData.status,
            priority: formData.priority,
            followUpDate: formData.followUpDate,
            formData: formData.customFormData,
            phase: derivedData.phase,
            phaseHeadId: derivedData.phaseHeadId,
        };

        if (existingObservation) {
            setObservations(prev => prev.map(o => o.id === existingObservation.id ? { ...observationData, id: o.id } : o));
        } else {
            const newObservation: Observation = {
                id: `obs-${Date.now()}`,
                ...observationData,
            };
            setObservations(prev => [...prev, newObservation]);
        }
        onClose();
    };
    
    const renderField = (field: FormField) => {
        const value = formData.customFormData[field.id];
        const baseClasses = "mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:text-gray-200";

        switch(field.type) {
            case FormFieldType.Text:
                return <input type="text" id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} className={baseClasses} />;
            case FormFieldType.Textarea:
                return <textarea id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} rows={4} className={baseClasses} />;
            case FormFieldType.Select:
                return <select id={field.id} value={value || ''} onChange={(e) => handleCustomFormChange(field.id, e.target.value)} required={field.required} className={`${baseClasses} dark:bg-slate-800`}>
                    <option value="">-- Select --</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>;
            case FormFieldType.Checkbox:
                return <input type="checkbox" id={field.id} checked={!!value} onChange={(e) => handleCustomFormChange(field.id, e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />;
            case FormFieldType.Rating:
                return <StarRating value={value || 0} onChange={(rating) => handleCustomFormChange(field.id, rating)} />;
            default: return null;
        }
    }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={existingObservation ? "Edit Monitoring Entry" : "Add Monitoring Entry"} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- Standard Fields --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <FormLabel htmlFor="observationType">Type</FormLabel>
                <select name="observationType" id="observationType" value={formData.observationType} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-base bg-transparent dark:bg-slate-800">
                    {monitoringTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
            </div>
             <div>
                <FormLabel htmlFor="teacherId">Educator / Staff</FormLabel>
                <select name="teacherId" id="teacherId" value={formData.teacherId} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-base bg-transparent dark:bg-slate-800">
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
            </div>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-md grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div><FormLabel>Grade</FormLabel><select name="grade" value={formData.grade} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-sm bg-transparent dark:bg-slate-800">{academicStructure.grades.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
             <div><FormLabel>Curriculum</FormLabel><select name="curriculum" value={formData.curriculum} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-sm bg-transparent dark:bg-slate-800">{academicStructure.curricula.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
             <div><FormLabel>Phase</FormLabel><p className="mt-1 h-[46px] flex items-center px-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md text-sm text-gray-500 dark:text-gray-400">{derivedData.phase || 'N/A'}</p></div>
             <div><FormLabel>Phase Head</FormLabel><p className="mt-1 h-[46px] flex items-center px-3 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md text-sm text-gray-500 dark:text-gray-400">{derivedData.phaseHeadName}</p></div>
        </div>
        
        {/* --- Dynamic Form Section --- */}
        {activeTemplate && activeTemplate.fields.length > 0 && (
             <div className="space-y-4 border-t pt-6 dark:border-slate-700">
                 {activeTemplate.fields.map(field => (
                    <div key={field.id}>
                        <FormLabel htmlFor={field.id}>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                        {renderField(field)}
                    </div>
                ))}
             </div>
        )}

        {/* --- Closing Fields --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t pt-6 dark:border-slate-700">
            <div><FormLabel>Date of Event</FormLabel><input type="date" name="observationDate" value={formData.observationDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-base bg-transparent" /></div>
            <div><FormLabel>Status</FormLabel><select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-base bg-transparent dark:bg-slate-800">{Object.values(MonitoringStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><FormLabel>Priority</FormLabel><select name="priority" value={formData.priority} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-base bg-transparent dark:bg-slate-800">{Object.values(ObservationPriority).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
        </div>

        <div>
            <FormLabel>Follow-up Date</FormLabel>
            <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 sm:text-base bg-transparent" />
        </div>
       
        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
            <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">{existingObservation ? "Save Changes" : "Add Entry"}</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEditObservationModal;