import React from 'react';

export const FormLabel: React.FC<{ htmlFor?: string; children: React.ReactNode; className?: string }> = ({ htmlFor, children, className = '' }) => (
    <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}>{children}</label>
);

export const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { error?: any }> = ({ error, ...props }) => (
    <input {...props} className={`mt-1 block w-full rounded-md shadow-sm p-2.5 text-base bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-gray-200 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-slate-600'} ${props.className || ''}`} />
);

export const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 text-base bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-gray-200 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed ${props.className}`} />
);

export const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea {...props} className={`mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 text-base bg-gray-50 dark:bg-slate-900/50 text-gray-900 dark:text-gray-200 focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50 disabled:cursor-not-allowed ${props.className}`} />
);

export const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string | React.ReactNode }> = ({ label, ...props }) => (
    <label className="flex items-center space-x-3 text-sm cursor-pointer dark:text-gray-300">
        <input
            type="checkbox"
            {...props}
            className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700"
        />
        <span>{label}</span>
    </label>
);

export const Radio: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string | React.ReactNode }> = ({ label, ...props }) => (
    <label className="flex items-start space-x-3 text-sm cursor-pointer dark:text-gray-300 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
        <input
            type="radio"
            {...props}
            className="h-4 w-4 mt-0.5 border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700"
        />
        <span>{label}</span>
    </label>
);

export const Fieldset: React.FC<{ legend: string; children: React.ReactNode }> = ({ legend, children }) => (
    <fieldset className="border-t border-gray-200 dark:border-slate-700 pt-5">
        <legend className="-ml-1 px-1 text-base font-semibold text-gray-900 dark:text-gray-200">{legend}</legend>
        <div className="mt-4 space-y-6">
            {children}
        </div>
    </fieldset>
);

export const ModalFooter: React.FC<{ onCancel: () => void; children: React.ReactNode }> = ({ onCancel, children }) => (
    <div className="flex justify-end items-center gap-4">
        <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600"
        >
            Cancel
        </button>
        {children}
    </div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
     <button
        {...props}
        className={`inline-flex justify-center items-center px-4 py-2 text-sm font-semibold text-white bg-brand-primary border border-transparent rounded-md shadow-sm hover:bg-rose-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 ${props.className}`}
    >
        {children}
    </button>
);

export const TableFilterInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className={`w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary ${props.className}`} />
)

export const TableFilterSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className={`w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary ${props.className}`} />
)
