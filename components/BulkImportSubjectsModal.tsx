import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import type { AcademicStructure, Subject } from '../types';
import { SubjectCategory } from '../types';
import { ArrowDownTrayIcon } from './Icons';

interface BulkImportSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicStructure: AcademicStructure;
  onUpdateSubjects: (subjects: Subject[]) => void;
}

type ParsedSubject = {
  name: string;
  grades: string[];
  modes: string[];
  curricula: string[];
  periodsByMode: Array<{mode: string, periods: number}>;
  category: SubjectCategory;
  electiveGroup?: string;
  error?: string;
}

const BulkImportSubjectsModal: React.FC<BulkImportSubjectsModalProps> = ({ isOpen, onClose, academicStructure, onUpdateSubjects }) => {
    const [csvData, setCsvData] = useState('');
    const [error, setError] = useState('');
    
    const { grades: availableGrades, modes: availableModes, curricula: availableCurricula, subjects: existingSubjects } = academicStructure;

    const parsedData: ParsedSubject[] = useMemo(() => {
        if (!csvData.trim()) return [];
        
        let content = csvData.trim();
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return [{ error: "CSV must have a header and at least one data row." } as ParsedSubject];

        const headerRow = lines[0];
        const detectDelimiter = (header: string): string => {
            const delimiters = [',', ';', '\t'];
            return delimiters.reduce((best, current) => 
                header.split(current).length > header.split(best).length ? current : best
            );
        };
        const delimiter = detectDelimiter(headerRow);
        const splitRegex = new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`);

        const headerCells = headerRow.split(splitRegex);
        const headerLine = headerCells.map(h => 
            h.trim().replace(/^"|"$/g, '').toLowerCase().replace(/[\s\(\)-]+/g, '')
        );
        const dataLines = lines.slice(1);

        const h = {
            name: headerLine.indexOf('name'),
            grades: headerLine.indexOf('grades'),
            curricula: headerLine.indexOf('curricula'),
            periodsByMode: headerLine.indexOf('periodsbymode'),
            category: headerLine.indexOf('category'),
            electiveGroup: headerLine.indexOf('electivegroup'),
        };

        if (h.name === -1) {
            return [{ error: `CSV validation failed: Missing required header 'name'.` } as ParsedSubject];
        }

        return dataLines.map((line, index) => {
            const columns = line.split(splitRegex).map(s => s.trim().replace(/^"|"$/g, ''));
            const name = columns[h.name];
            const gradesStr = columns[h.grades] || '';
            const curriculaStr = columns[h.curricula] || '';
            const periodsByModeStr = columns[h.periodsByMode] || '';
            const categoryStr = columns[h.category] || '';
            const electiveGroup = columns[h.electiveGroup] || '';

            if (!name) {
                return { error: `Line ${index + 2}: Missing required field 'name'.` } as ParsedSubject;
            }

            const grades = gradesStr ? gradesStr.split(';').map(g => g.trim()) : [];
            for (const grade of grades) {
                if (grade && !availableGrades.includes(grade)) {
                    return { error: `Line ${index + 2}: Grade "${grade}" not found.` } as ParsedSubject;
                }
            }
            
            const curricula = curriculaStr ? curriculaStr.split(';').map(c => c.trim()) : [];
            for (const curriculum of curricula) {
                if (curriculum && !availableCurricula.includes(curriculum)) {
                    return { error: `Line ${index + 2}: Curriculum "${curriculum}" not found.` } as ParsedSubject;
                }
            }

            const periodsByMode: { mode: string, periods: number }[] = [];
            if (periodsByModeStr) {
                const pairs = periodsByModeStr.split(';');
                for (const pair of pairs) {
                    const [mode, periodsVal] = pair.split('=');
                    if (mode && periodsVal) {
                        const periods = parseInt(periodsVal, 10);
                        if (!isNaN(periods) && periods >= 0) {
                            if (!availableModes.includes(mode.trim())) {
                                return { error: `Line ${index + 2}: Mode "${mode}" not found.` } as ParsedSubject;
                            }
                            periodsByMode.push({ mode: mode.trim(), periods });
                        } else {
                            return { error: `Line ${index + 2}: Invalid period value for mode "${mode}".` } as ParsedSubject;
                        }
                    }
                }
            }
            
            const modes = periodsByMode.map(p => p.mode);
            const category = (categoryStr.toLowerCase() === 'elective') ? SubjectCategory.Elective : SubjectCategory.Core;

            return { name, grades, modes, curricula, periodsByMode, category, electiveGroup };
        });
    }, [csvData, availableGrades, availableModes, availableCurricula]);
    
    const hasParseErrors = useMemo(() => parsedData.some(d => d.error), [parsedData]);
    
    const handleImport = () => {
        if (hasParseErrors || parsedData.length === 0) {
            setError('Cannot import. Please fix the errors in your CSV file.');
            return;
        }

        const newSubjects: Subject[] = parsedData.filter(d => !d.error).map(item => ({
            id: `subj-${Date.now()}-${Math.random()}`,
            name: item.name,
            grades: item.grades,
            modes: item.modes,
            curricula: item.curricula,
            periodsByMode: item.periodsByMode,
            category: item.category,
            electiveGroup: item.electiveGroup,
        }));

        onUpdateSubjects([...existingSubjects, ...newSubjects]);
        setCsvData('');
        setError('');
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = "name,grades,curricula,periodsByMode,category,electiveGroup";
        const example1 = "\"Mathematics\",\"Grade 10;Grade 11\",\"British;Cambridge\",\"Live=8;Flipped Afternoon=4\",Core,";
        const example2 = "\"Art History\",\"Grade 12\",\"British\",\"Self-Paced=2\",Elective,Arts";
        const example3 = "\"Afrikaans\",\"Grade 10\",\"British\",\"Live=4\",Elective,\"Language Choice\"";
        const csvContent = [headers, example1, example2, example3].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        if (link.href) URL.revokeObjectURL(link.href);
        link.href = URL.createObjectURL(blob);
        link.download = "subject_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Subjects" size="xl">
            <div className="space-y-4">
                <div>
                     <div className="flex justify-between items-center">
                         <h4 className="font-semibold text-gray-800 dark:text-gray-200">Instructions</h4>
                         <button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-sm text-brand-primary font-medium hover:underline">
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Download Template
                         </button>
                    </div>
                    <ul className="list-disc list-inside text-sm text-brand-text-light dark:text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md">
                        <li>CSV headers: <code>name,grades,curricula,periodsByMode,category,electiveGroup</code>.</li>
                        <li><code>grades</code> and <code>curricula</code> should be semicolon-separated lists of valid items (e.g., <code>Grade 10;Grade 11</code>). These fields are optional.</li>
                        <li><code>periodsByMode</code> defines the modes and periods, e.g., <code>"Live=8;Flipped Morning=4"</code>. This field is optional.</li>
                        <li><code>category</code> must be either 'Core' or 'Elective'. Defaults to 'Core' if blank.</li>
                        <li><code>electiveGroup</code> is a text identifier for mutually exclusive electives.</li>
                    </ul>
                </div>
                
                <FileUpload onFileRead={setCsvData} />

                {csvData.trim() && (
                    <div>
                         <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Preview</h4>
                         <div className="max-h-60 overflow-y-auto border dark:border-slate-600 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Name</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Category</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Curricula</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Grades</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Periods by Mode</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-600">
                                   {parsedData.map((item, index) => (
                                       <tr key={index} className={item.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                           {item.error ? (
                                                <td colSpan={5} className="px-4 py-2 text-red-700 dark:text-red-400">{item.error}</td>
                                           ) : (
                                               <>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.name}</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.category}{item.electiveGroup ? ` (${item.electiveGroup})` : ''}</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.curricula.join(', ')}</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.grades.join(', ')}</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.periodsByMode.map(p => `${p.mode}: ${p.periods}`).join(', ')}</td>
                                               </>
                                           )}
                                       </tr>
                                   ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm">{error}</p>}
                
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={hasParseErrors || parsedData.length === 0}
                        className="bg-brand-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Import {parsedData.filter(d => !d.error).length} Subjects
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkImportSubjectsModal;