import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import type { Teacher, ParentQuery } from '../types';
import { MonitoringStatus, ParentQueryCategory } from '../types';

interface AddEditParentQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  setQueries: React.Dispatch<React.SetStateAction<ParentQuery[]>>;
  existingQuery?: ParentQuery | null;
  teachers: Teacher[];
}

const AddEditParentQueryModal: React.FC<AddEditParentQueryModalProps> = ({ isOpen, onClose, setQueries, existingQuery, teachers }) => {
    
    const [formData, setFormData] = useState({
        parentName: '',
        parentEmail: '',
        studentName: '',
        teacherId: teachers[0]?.id || '',
        category: ParentQueryCategory.Academic,
        queryDetails: '',
        status: MonitoringStatus.Open,
        resolutionNotes: '',
    });

    useEffect(() => {
        if (existingQuery) {
            setFormData({
                parentName: existingQuery.parentName,
                parentEmail: existingQuery.parentEmail,
                studentName: existingQuery.studentName,
                teacherId: existingQuery.teacherId,
                category: existingQuery.category,
                queryDetails: existingQuery.queryDetails,
                status: existingQuery.status,
                resolutionNotes: existingQuery.resolutionNotes || '',
            });
        } else {
             setFormData({
                parentName: '',
                parentEmail: '',
                studentName: '',
                teacherId: teachers[0]?.id || '',
                category: ParentQueryCategory.Academic,
                queryDetails: '',
                status: MonitoringStatus.Open,
                resolutionNotes: '',
            });
        }
    }, [existingQuery, isOpen, teachers]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.parentName.trim() || !formData.studentName.trim() || !formData.queryDetails.trim()) {
            alert('Parent Name, Student Name, and Query Details are required.');
            return;
        }

        const queryData: Omit<ParentQuery, 'id' | 'creationDate'> = {
            parentName: formData.parentName,
            parentEmail: formData.parentEmail,
            studentName: formData.studentName,
            teacherId: formData.teacherId,
            category: formData.category,
            queryDetails: formData.queryDetails,
            status: formData.status,
            resolutionNotes: formData.resolutionNotes,
        };
        
        if (existingQuery) {
            setQueries(prev => prev.map(q => q.id === existingQuery.id ? { ...existingQuery, ...queryData } : q));
        } else {
            const newQuery: ParentQuery = {
                id: `pq-${Date.now()}`,
                creationDate: new Date().toISOString().split('T')[0],
                ...queryData,
            };
            setQueries(prev => [...prev, newQuery]);
        }
        onClose();
    };
    
    const FormLabel: React.FC<{ children: React.ReactNode}> = ({ children }) => (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{children}</label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingQuery ? "Edit Parent Query" : "Log New Parent Query"} size="lg">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <FormLabel>Parent Full Name</FormLabel>
                        <input type="text" name="parentName" value={formData.parentName} onChange={handleChange} required className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-transparent" />
                    </div>
                    <div>
                        <FormLabel>Parent Email</FormLabel>
                        <input type="email" name="parentEmail" value={formData.parentEmail} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-transparent" />
                    </div>
                </div>
                <div>
                    <FormLabel>Student Name</FormLabel>
                    <input type="text" name="studentName" value={formData.studentName} onChange={handleChange} required className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-transparent" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <FormLabel>Associated Teacher</FormLabel>
                        <select name="teacherId" value={formData.teacherId} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 bg-transparent dark:bg-slate-800">
                            {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>
                    <div>
                        <FormLabel>Category</FormLabel>
                        <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 bg-transparent dark:bg-slate-800">
                           {Object.values(ParentQueryCategory).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <FormLabel>Query Details</FormLabel>
                    <textarea name="queryDetails" value={formData.queryDetails} onChange={handleChange} required rows={5} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 dark:border-slate-700">
                    <div>
                        <FormLabel>Status</FormLabel>
                        <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 bg-transparent dark:bg-slate-800">
                            {Object.values(MonitoringStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <FormLabel>Resolution Notes</FormLabel>
                    <textarea name="resolutionNotes" value={formData.resolutionNotes} onChange={handleChange} rows={3} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2 bg-transparent" />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">{existingQuery ? "Save Changes" : "Log Query"}</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddEditParentQueryModal;
