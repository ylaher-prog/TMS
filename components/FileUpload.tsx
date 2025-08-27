import React, { useState, useCallback } from 'react';
import { DocumentArrowUpIcon } from './Icons';

interface FileUploadProps {
  onFileRead: (content: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileRead }) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileRead(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid .csv file.");
    }
  }, [onFileRead]);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          handleFile(e.target.files[0]);
      }
  };

  const handleClick = () => {
      inputRef.current?.click();
  }

  return (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload CSV File</label>
        <div
            className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-md cursor-pointer
                ${isDragging ? 'border-brand-primary bg-rose-50 dark:bg-rose-900/20' : 'border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-700/50'}`
            }
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input 
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
            />
            <div className="text-center">
                <DocumentArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-brand-primary">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV file up to 1MB</p>
            </div>
        </div>
    </div>
  );
};

export default FileUpload;