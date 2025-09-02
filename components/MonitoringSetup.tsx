import React, { useState, useMemo, useRef } from 'react';
import type { MonitoringTemplate, FormField, PhaseStructure } from '../types';
import { FormFieldType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon, EyeIcon, Bars3Icon, Bars3BottomLeftIcon, Bars4Icon, ChevronUpDownIcon, StarIcon, CheckSquareIcon, CalendarDaysIcon, ArrowUpTrayIcon, HashtagIcon, PlusCircleIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';
import { FormLabel, FormInput, FormSelect, FormTextarea, Checkbox } from './FormControls';
import FormPreviewModal from './FormPreviewModal';


interface MonitoringSetupProps {
    monitoringTemplates: MonitoringTemplate[];
    setMonitoringTemplates: React.Dispatch<React.SetStateAction<MonitoringTemplate[]>>;
    phaseStructures: PhaseStructure[];
}

const FieldTypeButton: React.FC<{ type: FormFieldType; icon: React.ReactNode; onAddField: (type: FormFieldType) => void }> = ({ type, icon, onAddField }) => (
    <button
        onClick={() => onAddField(type)}
        className="w-full flex items-center gap-3 p-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 rounded-md border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
    >
        <span className="text-brand-primary dark:text-rose-400">{icon}</span>
        {type}
    </button>
);

const MonitoringSetup: React.FC<MonitoringSetupProps> = ({ monitoringTemplates, setMonitoringTemplates, phaseStructures }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(monitoringTemplates[0]?.id || null);
    const [templateToDelete, setTemplateToDelete] = useState<MonitoringTemplate | null>(null);
    const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Drag and Drop state
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const activeTemplate = useMemo(() => {
        return monitoringTemplates.find(t => t.id === selectedTemplateId) || null;
    }, [selectedTemplateId, monitoringTemplates]);

    const editingField = useMemo(() => {
        return activeTemplate?.fields.find(f => f.id === editingFieldId) || null;
    }, [activeTemplate, editingFieldId]);

    const handleSaveTemplate = (updatedTemplate: MonitoringTemplate) => {
        setMonitoringTemplates(prev => {
            const exists = prev.some(t => t.id === updatedTemplate.id);
            if (exists) {
                return prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
            }
            return [...prev, updatedTemplate];
        });
    };

    const handleAddNewTemplate = () => {
        const newTemplate: MonitoringTemplate = {
            id: `template-${Date.now()}`,
            name: "New Form Template",
            fields: []
        };
        setMonitoringTemplates(prev => [...prev, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
        setEditingFieldId(null);
    };
    
    const handleDeleteTemplate = () => {
        if (templateToDelete) {
            setMonitoringTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            if (selectedTemplateId === templateToDelete.id) {
                setSelectedTemplateId(monitoringTemplates[0]?.id || null);
            }
            setTemplateToDelete(null);
        }
    };
    
    const handleAddField = (type: FormFieldType) => {
        if (!activeTemplate) return;
        const newField: FormField = {
            id: `field-${Date.now()}`,
            label: `New ${type} Field`,
            type,
            required: false,
            options: type === FormFieldType.Select ? ['Option 1', 'Option 2'] : [],
            placeholder: '',
        };
        const updatedTemplate = { ...activeTemplate, fields: [...activeTemplate.fields, newField] };
        handleSaveTemplate(updatedTemplate);
        setEditingFieldId(newField.id);
    };

    const handleUpdateField = (fieldId: string, updatedProps: Partial<FormField>) => {
        if (!activeTemplate) return;
        const updatedFields = activeTemplate.fields.map(f => f.id === fieldId ? { ...f, ...updatedProps } : f);
        handleSaveTemplate({ ...activeTemplate, fields: updatedFields });
    };

    const handleDeleteField = (fieldId: string) => {
        if (!activeTemplate) return;
        if (window.confirm("Are you sure you want to delete this field?")) {
            const updatedFields = activeTemplate.fields.filter(f => f.id !== fieldId);
            handleSaveTemplate({ ...activeTemplate, fields: updatedFields });
            if (editingFieldId === fieldId) {
                setEditingFieldId(null);
            }
        }
    };

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, position: number) => {
        dragItem.current = position;
    };
    const handleDragEnter = (e: React.DragEvent, position: number) => {
        dragOverItem.current = position;
    };
    const handleDrop = (e: React.DragEvent) => {
        if (!activeTemplate || dragItem.current === null || dragOverItem.current === null) return;
        
        const newFields = [...activeTemplate.fields];
        const dragItemContent = newFields[dragItem.current];
        newFields.splice(dragItem.current, 1);
        newFields.splice(dragOverItem.current, 0, dragItemContent);
        
        dragItem.current = null;
        dragOverItem.current = null;
        
        handleSaveTemplate({ ...activeTemplate, fields: newFields });
    };
    
    const fieldTypes: { type: FormFieldType, icon: React.ReactNode }[] = [
        { type: FormFieldType.Text, icon: <Bars3BottomLeftIcon className="w-5 h-5" /> },
        { type: FormFieldType.Textarea, icon: <Bars4Icon className="w-5 h-5" /> },
        { type: FormFieldType.Number, icon: <HashtagIcon className="w-5 h-5" /> },
        { type: FormFieldType.Select, icon: <ChevronUpDownIcon className="w-5 h-5" /> },
        { type: FormFieldType.Checkbox, icon: <CheckSquareIcon className="w-5 h-5" /> },
        { type: FormFieldType.Date, icon: <CalendarDaysIcon className="w-5 h-5" /> },
        { type: FormFieldType.Rating, icon: <StarIcon className="w-5 h-5" /> },
        { type: FormFieldType.FileUpload, icon: <ArrowUpTrayIcon className="w-5 h-5" /> },
    ];

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                 <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Monitoring Form Builder</h3>
                 <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">
                    Create and customize the data captured for each type of monitoring event. Select a template to begin.
                 </p>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="template-select" className="text-sm font-medium">Form Template:</label>
                        <FormSelect id="template-select" value={selectedTemplateId || ''} onChange={e => {setSelectedTemplateId(e.target.value); setEditingFieldId(null);}}>
                            {monitoringTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </FormSelect>
                        <button onClick={handleAddNewTemplate} className="text-brand-primary p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full" title="Add New Template"><PlusCircleIcon className="w-6 h-6"/></button>
                    </div>
                    {activeTemplate && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsPreviewOpen(true)} className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-2">
                                <EyeIcon className="h-4 w-4" />
                                Preview Form
                            </button>
                            <button onClick={() => setTemplateToDelete(activeTemplate)} className="px-3 py-1.5 text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900/80 flex items-center gap-2">
                                <TrashIcon className="h-4 w-4" />
                                Delete Form
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col lg:flex-row gap-6 mt-4 border-t dark:border-slate-700 pt-4">
                    {/* Left: Field Toolbar */}
                    <div className="lg:w-1/4">
                        <h4 className="font-semibold mb-2">Add a field</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {fieldTypes.map(ft => <FieldTypeButton key={ft.type} {...ft} onAddField={handleAddField} />)}
                        </div>
                    </div>

                    {/* Middle: Form Canvas */}
                    <div className="flex-1 lg:w-1/2 min-h-[50vh] bg-gray-50 dark:bg-slate-900/50 p-4 rounded-lg border-2 border-dashed dark:border-slate-700">
                        {activeTemplate ? (
                            <div className="space-y-3" onDrop={handleDrop}>
                                {activeTemplate.fields.map((field, index) => (
                                    <div
                                        key={field.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnter={(e) => handleDragEnter(e, index)}
                                        onDragOver={(e) => e.preventDefault()}
                                        onClick={() => setEditingFieldId(field.id)}
                                        className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${editingFieldId === field.id ? 'border-brand-primary bg-white dark:bg-slate-800' : 'border-transparent bg-white dark:bg-slate-800/50 hover:border-brand-primary/50'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="text-gray-400 mt-2.5 cursor-move"><Bars3Icon className="w-5 h-5" /></div>
                                            <div className="flex-grow">
                                                <FormLabel>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                                                <p className="text-xs text-gray-400">{field.type}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {activeTemplate.fields.length === 0 && (
                                    <div className="text-center text-gray-400 pt-20">
                                        <p>Click a field type on the left to add it to your form.</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                             <div className="text-center text-gray-400 pt-20">
                                <p>Select a form template or create a new one to begin.</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Field Editor */}
                    <div className="lg:w-1/4">
                        <h4 className="font-semibold mb-2">Field Properties</h4>
                        {editingField ? (
                            <div className="p-3 border dark:border-slate-700 rounded-lg space-y-4 bg-white dark:bg-slate-800/50">
                                <FormInput value={editingField.label} onChange={e => handleUpdateField(editingField.id, { label: e.target.value })} placeholder="Field Label"/>
                                <FormInput value={editingField.placeholder || ''} onChange={e => handleUpdateField(editingField.id, { placeholder: e.target.value })} placeholder="Placeholder Text"/>
                                {editingField.type === FormFieldType.Select && (
                                    <FormTextarea value={editingField.options?.join('\n') || ''} onChange={e => handleUpdateField(editingField.id, { options: e.target.value.split('\n') })} placeholder="Options (one per line)" rows={4} />
                                )}
                                <Checkbox label="Required" checked={editingField.required} onChange={e => handleUpdateField(editingField.id, { required: e.target.checked })} />
                                <button onClick={() => handleDeleteField(editingField.id)} className="w-full text-center text-sm text-red-500 hover:text-red-700">Delete Field</button>
                            </div>
                        ) : (
                            <div className="p-3 border dark:border-slate-700 rounded-lg text-center text-gray-400 text-sm h-full flex items-center justify-center">
                                Click on a field to edit its properties.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {templateToDelete && (
                <ConfirmationModal isOpen={!!templateToDelete} onClose={() => setTemplateToDelete(null)} onConfirm={handleDeleteTemplate} title="Delete Form Template" message={`Are you sure you want to delete "${templateToDelete.name}"? This cannot be undone.`} />
            )}
            
            <FormPreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} template={activeTemplate} />
        </>
    );
};

export default MonitoringSetup;