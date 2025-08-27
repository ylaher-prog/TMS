import React, { useState, useMemo } from 'react';
import type { MonitoringTemplate, FormField } from '../types';
import { ObservationType, FormFieldType } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, CheckIcon, XMarkIcon } from './Icons';
import ConfirmationModal from './ConfirmationModal';

interface MonitoringSetupProps {
    monitoringTemplates: MonitoringTemplate[];
    setMonitoringTemplates: React.Dispatch<React.SetStateAction<MonitoringTemplate[]>>;
}

const MonitoringSetup: React.FC<MonitoringSetupProps> = ({ monitoringTemplates, setMonitoringTemplates }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>(monitoringTemplates[0]?.id || '');
    const [editingField, setEditingField] = useState<FormField | null>(null);
    const [editingTemplateName, setEditingTemplateName] = useState<{ id: string, name: string } | null>(null);
    const [templateToDelete, setTemplateToDelete] = useState<MonitoringTemplate | null>(null);

    const activeTemplate = useMemo(() => {
        return monitoringTemplates.find(t => t.id === selectedTemplateId) || null;
    }, [selectedTemplateId, monitoringTemplates]);

    const handleSaveTemplate = (updatedTemplate: MonitoringTemplate) => {
        setMonitoringTemplates(prev => {
            const exists = prev.some(t => t.id === updatedTemplate.id);
            if (exists) {
                return prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
            }
            return [...prev, updatedTemplate];
        });
    };
    
    const handleAddNewType = () => {
        const newTemplate: MonitoringTemplate = {
            id: `template-${Date.now()}`,
            name: "New Monitoring Type",
            fields: []
        };
        setMonitoringTemplates(prev => [...prev, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
    };
    
    const handleSaveTemplateName = () => {
        if (editingTemplateName) {
            setMonitoringTemplates(prev => prev.map(t => t.id === editingTemplateName.id ? {...t, name: editingTemplateName.name} : t));
            setEditingTemplateName(null);
        }
    }
    
    const handleDeleteTemplate = () => {
        if(templateToDelete) {
            setMonitoringTemplates(prev => prev.filter(t => t.id !== templateToDelete.id));
            if (selectedTemplateId === templateToDelete.id) {
                setSelectedTemplateId(monitoringTemplates[0]?.id || '');
            }
            setTemplateToDelete(null);
        }
    }


    const handleAddField = () => {
        if (!activeTemplate) return;
        const newField: FormField = {
            id: `field-${Date.now()}`,
            label: 'New Field',
            type: FormFieldType.Text,
            required: false,
            options: [],
        };
        const updatedTemplate = { ...activeTemplate, fields: [...activeTemplate.fields, newField] };
        handleSaveTemplate(updatedTemplate);
        setEditingField(newField);
    };

    const handleUpdateField = (fieldId: string, updatedField: Partial<FormField>) => {
        if (!activeTemplate) return;
        const updatedFields = activeTemplate.fields.map(f => f.id === fieldId ? { ...f, ...updatedField } : f);
        handleSaveTemplate({ ...activeTemplate, fields: updatedFields });
    };
    
    const handleSaveEditingField = () => {
        if(editingField) {
            handleUpdateField(editingField.id, editingField);
            setEditingField(null);
        }
    }

    const handleDeleteField = (fieldId: string) => {
        if (!activeTemplate) return;
        if (window.confirm("Are you sure you want to delete this field? This may affect existing data entries.")) {
            const updatedFields = activeTemplate.fields.filter(f => f.id !== fieldId);
            handleSaveTemplate({ ...activeTemplate, fields: updatedFields });
        }
    };

    const renderEditFieldRow = (field: FormField) => (
        <div key={field.id} className="p-3 bg-gray-100 dark:bg-slate-700/50 rounded-md space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input 
                    type="text" 
                    value={editingField?.label} 
                    onChange={e => setEditingField(prev => prev ? {...prev, label: e.target.value} : null)}
                    placeholder="Field Label"
                    className="w-full border-gray-300 dark:border-slate-600 rounded-md sm:text-sm bg-transparent p-2"
                />
                <select 
                    value={editingField?.type} 
                    onChange={e => setEditingField(prev => prev ? {...prev, type: e.target.value as FormFieldType} : null)}
                    className="w-full border-gray-300 dark:border-slate-600 rounded-md sm:text-sm bg-transparent dark:bg-slate-800 p-2"
                >
                    {Object.values(FormFieldType).map(type => <option key={type} value={type}>{type}</option>)}
                </select>
                <div className="flex items-center justify-between">
                     <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                        <input 
                            type="checkbox" 
                            checked={!!editingField?.required}
                            onChange={e => setEditingField(prev => prev ? {...prev, required: e.target.checked} : null)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary"
                        />
                        <span>Required</span>
                    </label>
                    <div>
                        <button onClick={handleSaveEditingField} className="text-green-500 hover:text-green-700 p-1"><CheckIcon className="w-5 h-5"/></button>
                        <button onClick={() => setEditingField(null)} className="text-red-500 hover:text-red-700 p-1"><XMarkIcon className="w-5 h-5"/></button>
                    </div>
                </div>
            </div>
            {editingField?.type === FormFieldType.Select && (
                 <textarea 
                    value={editingField.options?.join('\n') || ''} 
                    onChange={e => setEditingField(prev => prev ? {...prev, options: e.target.value.split('\n')} : null)}
                    placeholder="Enter options, one per line."
                    rows={3}
                    className="w-full border-gray-300 dark:border-slate-600 rounded-md sm:text-sm bg-transparent p-2"
                />
            )}
        </div>
    );


    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Monitoring Form Builder</h3>
                <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">
                    Create and customize the data captured for each type of monitoring event. Select a type to configure its form fields.
                </p>
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Type Selector */}
                    <div className="md:w-1/3 border dark:border-slate-700 rounded-lg p-3">
                        <button onClick={handleAddNewType} className="w-full bg-brand-accent text-white px-3 py-2 text-sm rounded-md flex items-center justify-center gap-1.5 font-medium hover:bg-amber-700 mb-3">
                            <PlusIcon className="w-4 h-4" /> New Type
                        </button>
                        <nav className="flex flex-col space-y-1">
                            {monitoringTemplates.map(template => (
                                 <div key={template.id} className={`group w-full flex items-center justify-between rounded-md transition-colors ${selectedTemplateId === template.id ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
                                    {editingTemplateName?.id === template.id ? (
                                        <div className="flex-grow p-2">
                                            <input 
                                                type="text"
                                                value={editingTemplateName.name}
                                                onChange={e => setEditingTemplateName({id: template.id, name: e.target.value})}
                                                onKeyDown={e => e.key === 'Enter' && handleSaveTemplateName()}
                                                onBlur={handleSaveTemplateName}
                                                autoFocus
                                                className="w-full text-sm font-medium bg-transparent border rounded-md p-1"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <button onClick={() => setSelectedTemplateId(template.id)} className="flex-grow text-left px-3 py-2 text-sm font-medium">
                                                {template.name}
                                            </button>
                                            <div className="pr-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setEditingTemplateName({id: template.id, name: template.name})} className="p-1 hover:text-brand-accent"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => setTemplateToDelete(template)} className="p-1 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                    {/* Right: Form Editor */}
                    <div className="flex-1">
                        {activeTemplate ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-lg font-semibold text-brand-dark dark:text-white">Editing: {activeTemplate.name}</h4>
                                    <button onClick={handleAddField} className="bg-brand-primary text-white px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-rose-900">
                                    <PlusIcon className="w-4 h-4" /> Add Field
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {activeTemplate.fields.map(field => 
                                        editingField?.id === field.id ? renderEditFieldRow(field) : (
                                        <div key={field.id} className="flex justify-between items-center p-3 border dark:border-slate-700 rounded-md">
                                            <div>
                                                <span className="font-medium dark:text-gray-200">{field.label} {field.required && <span className="text-red-500">*</span>}</span>
                                                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{field.type}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => setEditingField(field)} className="text-brand-accent hover:text-amber-700"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDeleteField(field.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                    {activeTemplate.fields.length === 0 && (
                                        <div className="text-center py-10 border-2 border-dashed dark:border-slate-700 rounded-lg">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">This form has no custom fields. Click "Add Field" to get started.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                             <div className="text-center py-20 border-2 border-dashed dark:border-slate-700 rounded-lg h-full flex flex-col justify-center">
                                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Monitoring Type Selected</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select a type from the left panel or create a new one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             {templateToDelete && (
                <ConfirmationModal
                    isOpen={!!templateToDelete}
                    onClose={() => setTemplateToDelete(null)}
                    onConfirm={handleDeleteTemplate}
                    title="Delete Monitoring Type"
                    message={`Are you sure you want to delete "${templateToDelete.name}"? This will delete the form template and might affect filtering for existing entries.`}
                />
            )}
        </>
    );
};

export default MonitoringSetup;