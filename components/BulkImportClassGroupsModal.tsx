import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import type { AcademicStructure, ClassGroup, Subject } from '../types';
import { ArrowDownTrayIcon } from './Icons';

interface BulkImportClassGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  academicStructure: AcademicStructure;
  setClassGroups: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
}

type ParsedGroup = {
  name: string;
  academicYear: string;
  curriculum: string;
  grade: string;
  mode: string;
  learnerCount: number;
  subjectNames: string[];
  subjectIds: string[];
  addToTimetable: boolean;
  error?: string;
}

const BulkImportClassGroupsModal: React.FC<BulkImportClassGroupsModalProps> = ({ isOpen, onClose, academicStructure, setClassGroups }) => {
    const [csvData, setCsvData] = useState('');
    const [error, setError] = useState('');
    
    const subjectNameMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.name.toLowerCase(), s.id])), [academicStructure.subjects]);

    const parsedData: ParsedGroup[] = useMemo(() => {
        if (!csvData.trim()) return [];
        
        let content = csvData.trim();
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return [{ error: "CSV must have a header and at least one data row." } as ParsedGroup];
        
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
            academicYear: headerLine.indexOf('academicyear'),
            curriculum: headerLine.indexOf('curriculum'),
            grade: headerLine.indexOf('grade'),
            mode: headerLine.indexOf('mode'),
            learnerCount: headerLine.indexOf('learnercount'),
            subjects: headerLine.indexOf('subjects'),
            addToTimetable: headerLine.indexOf('addtotimetable'), // new optional field
        };

        if (Object.values(h).slice(0, 7).some(index => index === -1)) {
            return [{ error: `CSV validation failed: Missing one or more required headers (name, academicYear, curriculum, grade, mode, learnerCount, subjects).` } as ParsedGroup];
        }

        return dataLines.map((line, index) => {
            const columns = line.split(splitRegex).map(s => s.trim().replace(/^"|"$/g, ''));
            const name = columns[h.name];
            const academicYear = columns[h.academicYear];
            const curriculum = columns[h.curriculum];
            const grade = columns[h.grade];
            const mode = columns[h.mode];
            const learnerCountStr = columns[h.learnerCount];
            const subjectsStr = columns[h.subjects];
            const addToTimetableStr = h.addToTimetable > -1 ? columns[h.addToTimetable] : 'yes';

            if (!name || !academicYear || !curriculum || !grade || !mode || !learnerCountStr || !subjectsStr) {
                return { error: `Line ${index + 2}: Missing required fields.` } as ParsedGroup;
            }

            if (!/^\d{4}$/.test(academicYear.trim())) {
                return { error: `Line ${index + 2}: Academic Year must be a 4-digit year.` } as ParsedGroup;
            }
            if (!academicStructure.curricula.includes(curriculum)) {
                return { error: `Line ${index + 2}: Curriculum "${curriculum}" not found.` } as ParsedGroup;
            }
            if (!academicStructure.grades.includes(grade)) {
                return { error: `Line ${index + 2}: Grade "${grade}" not found.` } as ParsedGroup;
            }
            if (!academicStructure.modes.includes(mode)) {
                return { error: `Line ${index + 2}: Mode "${mode}" not found.` } as ParsedGroup;
            }
            const learnerCount = Number(learnerCountStr);
            if (isNaN(learnerCount) || learnerCount <= 0) {
                return { error: `Line ${index + 2}: Learner count must be a positive number.` } as ParsedGroup;
            }
            
            const subjectNames = subjectsStr.split(';').map(s => s.trim());
            const subjectIds: string[] = [];
            let subjectError = '';

            for (const subName of subjectNames) {
                if(!subName) continue;
                const id = subjectNameMap.get(subName.toLowerCase());
                if (!id) {
                    subjectError = `Subject "${subName}" not found.`;
                    break;
                }
                subjectIds.push(id);
            }
            
            if (subjectError) {
                 return { error: `Line ${index + 2}: ${subjectError}` } as ParsedGroup;
            }
            
            const addToTimetable = ['yes', 'true', '1'].includes(addToTimetableStr.toLowerCase());

            return { name, academicYear, curriculum, grade, mode, learnerCount, subjectNames, subjectIds, addToTimetable };
        });
    }, [csvData, academicStructure]);
    
    const hasParseErrors = useMemo(() => parsedData.some(d => d.error), [parsedData]);
    
    const handleImport = () => {
        if (hasParseErrors || parsedData.length === 0) {
            setError('Cannot import. Please fix the errors in your CSV file.');
            return;
        }

        const newClassGroups: ClassGroup[] = parsedData.filter(d => !d.error).map(item => ({
            id: `cg-${Date.now()}-${Math.random()}`,
            name: item.name,
            academicYear: item.academicYear,
            curriculum: item.curriculum,
            grade: item.grade,
            mode: item.mode,
            learnerCount: item.learnerCount,
            subjectIds: item.subjectIds,
            addToTimetable: item.addToTimetable,
        }));

        setClassGroups(prev => [...prev, ...newClassGroups]);
        setCsvData('');
        setError('');
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = "name,academicYear,curriculum,grade,mode,learnerCount,subjects,addToTimetable";
        const example1 = "\"Grade 10 Science A\",2024,IEB,Grade 10,Live,25,\"Mathematics;Physics;English\",yes";
        const example2 = "\"Grade 11 Cambridge Bio\",2024,Cambridge,\"Grade 11\",Flipped,22,\"Biology;Chemistry\",no";
        const csvContent = [headers, example1, example2].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        if (link.href) URL.revokeObjectURL(link.href);
        link.href = URL.createObjectURL(blob);
        link.download = "classgroup_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Class Groups" size="xl">
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
                        <li>CSV headers: <code>name,academicYear,curriculum,grade,mode,learnerCount,subjects,addToTimetable</code>.</li>
                        <li><code>curriculum</code>, <code>grade</code>, and <code>mode</code> must match items defined in 'Base Items'.</li>
                         <li><code>subjects</code> must be a semicolon-separated list of valid subject names (e.g., <code>Mathematics;Physics</code>).</li>
                         <li><code>addToTimetable</code> is optional. Use 'yes' or 'no'. Defaults to 'yes' if column is omitted.</li>
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
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Group Name</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Details</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Subjects</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-600">
                                   {parsedData.map((item, index) => (
                                       <tr key={index} className={item.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                           {item.error ? (
                                                <td colSpan={3} className="px-4 py-2 text-red-700 dark:text-red-400">{item.error}</td>
                                           ) : (
                                               <>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.name}</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.academicYear} - {item.grade} - {item.curriculum} - {item.mode} ({item.learnerCount} learners)</td>
                                                <td className="px-4 py-2 dark:text-gray-300">{item.subjectNames.join(', ')}</td>
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
                        Import {parsedData.filter(d => !d.error).length} Groups
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkImportClassGroupsModal;
