import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import type { Teacher, AcademicStructure } from '../types';
import { EmploymentStatus } from '../types';
import { ArrowDownTrayIcon } from './Icons';
import FileUpload from './FileUpload';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  academicStructure: AcademicStructure;
  teachers: Teacher[];
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, setTeachers, academicStructure, teachers }) => {
    const [csvData, setCsvData] = useState('');
    const [error, setError] = useState('');

    const positionNameToIdMap = useMemo(() => 
        new Map(academicStructure.positions.map(p => [p.name.toLowerCase(), p.id])), 
        [academicStructure.positions]
    );

    const validatedData = useMemo(() => {
        if (!csvData.trim()) return [];
        
        let content = csvData.trim();
        // Handle potential UTF-8 BOM at the start of the file
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return [{ error: "CSV file must have a header row and at least one data row." }];

        const headerRow = lines[0];

        // Auto-detect delimiter by checking the header row
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
        
        const findHeaderIndex = (possibleNames: string[]): number => {
            for (const name of possibleNames) {
                const index = headerLine.indexOf(name);
                if (index !== -1) return index;
            }
            return -1;
        };

        const headerMap: { [key: string]: number } = {
            fullname: findHeaderIndex(['fullname', 'fullnames']),
            email: findHeaderIndex(['email']),
            employeecode: findHeaderIndex(['employeecode', 'edcode']),
            employmentstatus: findHeaderIndex(['employmentstatus']),
            startdate: findHeaderIndex(['startdate']),
            specialties: findHeaderIndex(['specialties']),
            preferredgrades: findHeaderIndex(['preferredgrades']),
            position: findHeaderIndex(['position']),
            maxlearners: findHeaderIndex(['maxlearners']),
            maxperiodsbymode: findHeaderIndex(['maxperiodsbymode']),
            manageremail: findHeaderIndex(['manageremail']),
            managername: findHeaderIndex(['managername', 'reportstomanagername', 'reportsto']),
        };
        
        const requiredHeaders = ['fullname', 'email', 'employmentstatus', 'position'];
        for(const required of requiredHeaders) {
            if (headerMap[required] === -1) {
                const readableHeader = required.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return [{ error: `Missing required CSV header. Could not find a column for "${readableHeader}".` }];
            }
        }

        const parsedItems = dataLines.map((line, index) => {
            const columns = line.split(splitRegex).map(s => s.trim().replace(/^"|"$/g, ''));

            const getColumn = (key: string) => headerMap[key] > -1 ? (columns[headerMap[key]] || '') : '';
            
            const fullName = getColumn('fullname');
            const email = getColumn('email');
            const employeeCode = getColumn('employeecode');
            const status = getColumn('employmentstatus');
            const startDate = getColumn('startdate');
            const specialties = getColumn('specialties');
            const preferredGradesStr = getColumn('preferredgrades');
            const positionName = getColumn('position');
            const maxLearnersStr = getColumn('maxlearners');
            const maxPeriodsByModeStr = getColumn('maxperiodsbymode');
            const managerEmail = getColumn('manageremail');
            const managerName = getColumn('managername');
            
            if(!fullName || !email || !status || !positionName) {
                return { error: `Invalid data on line ${index + 2}. Required fields (Full Name, Email, Status, Position) missing.` };
            }
            
            const isValidStatus = Object.values(EmploymentStatus).some(s => s.toLowerCase() === status.toLowerCase());
            if(!isValidStatus) {
                 return { error: `Invalid status "${status}" on line ${index + 2}.` };
            }
            
            const positionId = positionNameToIdMap.get(positionName.toLowerCase());
            if(!positionId) {
                return { error: `Invalid position "${positionName}" on line ${index + 2}. Please define it in Settings first.` };
            }

            const maxLearners = Number(maxLearnersStr || '250');
            if (isNaN(maxLearners)) {
                 return { error: `Invalid max learners value on line ${index + 2}.` };
            }

            const preferredGrades = preferredGradesStr ? preferredGradesStr.split(';').map(s => s.trim()) : [];
            for (const grade of preferredGrades) {
                if (grade && !academicStructure.grades.includes(grade)) {
                    return { error: `Invalid preferred grade "${grade}" on line ${index + 2}. Please define it in Settings first.` };
                }
            }

            const maxPeriodsByMode: { [mode: string]: number } = {};
            if (maxPeriodsByModeStr) {
                 const pairs = maxPeriodsByModeStr.split(';');
                 for (const pair of pairs) {
                    const [mode, periodsVal] = pair.split('=');
                    if (mode && periodsVal && academicStructure.modes.includes(mode.trim())) {
                        maxPeriodsByMode[mode.trim()] = Number(periodsVal) || 0;
                    }
                 }
            }

            return {
                fullName, email, employeeCode, employmentStatus: status as EmploymentStatus, startDate, positionId,
                specialties: specialties ? specialties.split(';').map(s => s.trim()) : [],
                preferredGrades,
                maxLearners, maxPeriodsByMode, 
                managerEmail: managerEmail || '',
                managerName: managerName || '',
            };
        });

        // Second pass for manager validation
        const parsedValidItems = parsedItems.filter(p => !p.error);
        const newTeacherEmails = new Set(parsedValidItems.map(p => p.email!.toLowerCase()));
        const existingTeacherEmails = new Set(teachers.map(t => t.email.toLowerCase()));
        
        const newTeacherNames = new Set(parsedValidItems.map(p => p.fullName!.toLowerCase()));
        const existingTeacherNames = new Set(teachers.map(t => t.fullName.toLowerCase()));

        const allFullNames = [...teachers.map(t => t.fullName.toLowerCase()), ...parsedValidItems.map(p => p.fullName!.toLowerCase())];
        const nameCounts = allFullNames.reduce((acc, name) => {
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return parsedItems.map((item, index) => {
            if (item.error) return item;
            
            // Validate email and employee code uniqueness
            const existingEmailUser = teachers.find(t => t.email.toLowerCase() === item.email?.toLowerCase());
            if (existingEmailUser) {
                return { ...item, error: `Email "${item.email}" already exists in the system for another teacher.` };
            }
            if (item.employeeCode) {
                 const existingCodeUser = teachers.find(t => t.employeeCode?.toLowerCase() === item.employeeCode?.toLowerCase());
                 if (existingCodeUser) {
                     return { ...item, error: `Employee Code "${item.employeeCode}" already exists in the system.` };
                 }
            }

            const managerEmail = item.managerEmail;
            const managerName = item.managerName;

            if (managerEmail) {
                const managerEmailLower = managerEmail.toLowerCase();
                 if (item.email!.toLowerCase() === managerEmailLower) {
                    return { ...item, error: `A teacher cannot be their own manager (by email) on line ${index + 2}.` };
                }
                if (!existingTeacherEmails.has(managerEmailLower) && !newTeacherEmails.has(managerEmailLower)) {
                    return { ...item, error: `Manager with email "${managerEmail}" not found on line ${index + 2}.` };
                }
            } else if (managerName) {
                const managerNameLower = managerName.toLowerCase();
                if (item.fullName!.toLowerCase() === managerNameLower) {
                    return { ...item, error: `A teacher cannot be their own manager (by name) on line ${index + 2}.` };
                }
                if (nameCounts[managerNameLower] > 1) {
                     return { ...item, error: `Manager name "${managerName}" on line ${index + 2} is ambiguous because it belongs to multiple teachers. Please use the unique manager's email instead.` };
                }
                if (!existingTeacherNames.has(managerNameLower) && !newTeacherNames.has(managerNameLower)) {
                    return { ...item, error: `Manager with name "${managerName}" not found on line ${index + 2}.` };
                }
            }
            return item;
        });

    }, [csvData, academicStructure, teachers, positionNameToIdMap]);
    
    const hasParseErrors = useMemo(() => validatedData.some(d => d.error), [validatedData]);

    const handleImport = () => {
        if (hasParseErrors || validatedData.length === 0) {
            setError('Cannot import. Please fix the errors in the data or provide valid data.');
            return;
        }

        const validNewTeachersData = validatedData.filter(d => !d.error);

        // Step 1: Assign final IDs to all new teachers
        const newTeachersWithIds = validNewTeachersData.map(item => ({
            ...item,
            id: `t${Date.now()}${Math.random()}`
        }));

        // Step 2: Create comprehensive maps including existing and newly-created teachers
        const combinedEmailToIdMap = new Map(teachers.map(t => [t.email.toLowerCase(), t.id]));
        const combinedNameToIdMap = new Map(teachers.map(t => [t.fullName.toLowerCase(), t.id]));
        
        newTeachersWithIds.forEach(t => {
            combinedEmailToIdMap.set(t.email!.toLowerCase(), t.id);
            combinedNameToIdMap.set(t.fullName!.toLowerCase(), t.id);
        });

        // Step 3: Map to the final Teacher structure, resolving managerId
        const finalNewTeachers: Teacher[] = newTeachersWithIds.map(item => {
            let managerId: string | undefined = undefined;
            if (item.managerEmail) {
                managerId = combinedEmailToIdMap.get(item.managerEmail.toLowerCase());
            } else if (item.managerName) {
                managerId = combinedNameToIdMap.get(item.managerName.toLowerCase());
            }
            
            const { 
                fullName, email, employeeCode, employmentStatus, startDate, positionId,
                specialties, preferredGrades, maxLearners, maxPeriodsByMode, id
            } = item;

            return {
                id,
                avatarUrl: `https://picsum.photos/seed/${id}/100/100`,
                fullName: fullName!,
                email: email!,
                employeeCode: employeeCode!,
                employmentStatus: employmentStatus!,
                startDate: startDate!,
                positionId: positionId!,
                managerId,
                specialties: specialties!,
                preferredGrades: preferredGrades!,
                maxLearners: maxLearners!,
                maxPeriodsByMode: maxPeriodsByMode!,
                markingTasks: 0,
                slas: { messageResponse: 0, markingTurnaround: 0 },
            };
        });

        setTeachers(prev => [...prev, ...finalNewTeachers]);
        setCsvData('');
        setError('');
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = "FullName,Email,EmployeeCode,EmploymentStatus,StartDate,Specialties,PreferredGrades,Position,MaxLearners,MaxPeriodsByMode,ManagerEmail,ManagerName";
        const example1 = "\"John Doe\",john.doe@example.com,EMP001,Permanent,2023-09-01,\"Mathematics;Physics\",\"Grade 10;Grade 11\",\"Senior Teacher\",250,\"Live=18;Flipped Afternoon=5\",manager.jane@example.com,";
        const example2 = "\"Jane Smith\",jane.smith@example.com,EMP002,Probation,2024-02-15,\"English;History\",\"Grade 9\",\"Junior Teacher\",220,\"Live=20;Self-Paced=2\",,John Doe";
        const csvContent = [headers, example1, example2].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        if (link.href) {
            URL.revokeObjectURL(link.href);
        }
        link.href = URL.createObjectURL(blob);
        link.download = "teacher_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Teachers" size="xl">
      <div className="space-y-4">
        <div>
            <div className="flex justify-between items-center">
                 <h4 className="font-semibold text-gray-800 dark:text-gray-200">Instructions</h4>
                 <button 
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 text-sm text-brand-primary font-medium hover:underline"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download Template
                 </button>
            </div>
            <ul className="list-disc list-inside text-sm text-brand-text-light dark:text-gray-400 mt-2 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md">
                <li>Use the template or ensure your CSV file has the correct headers. Headers are flexible (e.g., `Full Name` and `fullname` are both accepted).</li>
                <li><strong>Required columns:</strong> `FullName`, `Email`, `EmploymentStatus`, `Position`.</li>
                <li><strong>Highly Recommended:</strong> `EmployeeCode` is crucial for linking salary data. Please ensure it is present and unique.</li>
                <li><code>Employment Status</code> must be one of: {Object.values(EmploymentStatus).join(', ')}.</li>
                 <li><code>Position</code> must match one of the positions defined in Settings.</li>
                <li>For fields with multiple values (like `Specialties`), separate them with a semicolon (`;`). If the content contains a comma, enclose it in double quotes (e.g., `"Subject, with comma;Another Subject"`).</li>
                <li><code>Max Periods by Mode</code> should be a semicolon-separated list of pairs (e.g. <code>"Live=18;Flipped=5"</code>).</li>
                <li>Provide `ManagerEmail` or `ManagerName` (e.g., `Reports To (Manager Name)`) to assign a manager. Email is preferred for accuracy.</li>
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
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Email</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Employee Code</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Position</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Manager</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-600">
                           {validatedData.map((item, index) => (
                               <tr key={index} className={item.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                   {item.error ? (
                                        <td colSpan={5} className="px-4 py-2 text-red-700 dark:text-red-400">{item.error}</td>
                                   ) : (
                                       <>
                                        <td className="px-4 py-2 dark:text-gray-300">{item.fullName}</td>
                                        <td className="px-4 py-2 dark:text-gray-300">{item.email}</td>
                                        <td className="px-4 py-2 dark:text-gray-300">{item.employeeCode || <span className="text-yellow-500 text-xs">Not Provided</span>}</td>
                                        <td className="px-4 py-2 dark:text-gray-300">{academicStructure.positions.find(p => p.id === item.positionId)?.name}</td>
                                        <td className="px-4 py-2 dark:text-gray-300">{item.managerEmail || item.managerName || 'N/A'}</td>
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
                disabled={hasParseErrors || validatedData.length === 0}
                className="bg-brand-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                Import {validatedData.filter(d => !d.error).length} Teachers
            </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;