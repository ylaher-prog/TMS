import React from 'react';
import Modal from './Modal';
import type { MonitoringTemplate, FormField } from '../types';
import { FormFieldType } from '../types';
import { FormLabel, FormInput, FormSelect, FormTextarea, Checkbox } from './FormControls';

interface FormPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    template: MonitoringTemplate | null;
}

const StarRatingDisplay: React.FC = () => (
    <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <svg key={star} className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.956a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.364 2.44a1 1 0 00-.364 1.118l1.287 3.956c.3.921-.755 1.688-1.539 1.118l-3.364-2.44a1 1 0 00-1.175 0l-3.364 2.44c-.784.57-1.838-.197-1.539-1.118l1.287-3.956a1 1 0 00-.364-1.118L2.073 9.383c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69L9.049 2.927z" />
            </svg>
        ))}
    </div>
);


const renderPreviewField = (field: FormField) => {
    switch(field.type) {
        case FormFieldType.Text:
            return <FormInput type="text" id={field.id} placeholder={field.placeholder} disabled />;
        case FormFieldType.Number:
            return <FormInput type="number" id={field.id} placeholder={field.placeholder} disabled />;
        case FormFieldType.Date:
            return <FormInput type="date" id={field.id} disabled />;
        case FormFieldType.Textarea:
            return <FormTextarea id={field.id} placeholder={field.placeholder} rows={4} disabled />;
        case FormFieldType.Select:
            return <FormSelect id={field.id} disabled>
                <option value="">-- Select --</option>
                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </FormSelect>;
        case FormFieldType.Checkbox:
            return <div className="mt-2"><Checkbox id={field.id} label={field.label} disabled /></div>;
        case FormFieldType.Rating:
            return <StarRatingDisplay />;
        case FormFieldType.FileUpload:
            return <FormInput type="file" id={field.id} disabled />;
        default: return null;
    }
}


const FormPreviewModal: React.FC<FormPreviewModalProps> = ({ isOpen, onClose, template }) => {
    if (!template) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Preview: ${template.name}`} size="lg">
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg">
                {template.fields.length > 0 ? (
                    template.fields.map(field => (
                        <div key={field.id}>
                            {field.type !== FormFieldType.Checkbox && (
                                <FormLabel htmlFor={field.id}>{field.label} {field.required && <span className="text-red-500">*</span>}</FormLabel>
                            )}
                            {renderPreviewField(field)}
                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">This form has no fields yet.</p>
                )}
            </div>
        </Modal>
    );
};

export default FormPreviewModal;