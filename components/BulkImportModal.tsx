import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import type { Teacher, AcademicStructure } from '../types';
import { EmploymentStatus } from '../types';
import { ArrowDownTrayIcon, CheckCircleIcon } from './Icons';
import FileUpload from './FileUpload';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  academicStructure: AcademicStructure;
  teachers: Teacher[];
}

type NewUserCredential = {
    fullName: string;
    username: string;
    tempPassword: string;
};

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, setTeachers, academicStructure, teachers }) => {
    const [csvData, setCsvData] = useState('');
    const [error, setError] = useState('');
    const [importResult, setImportResult] = useState<NewUserCredential[] | null>(null);

    const positionNameToIdMap = useMemo(() => 
        new Map(academicStructure.positions.map(p => [p.name.toLowerCase(), p.id])), 
        [academicStructure.positions]
    );

    const validatedData = useMemo(() => {
        if (!csvData.trim()) return [];
        
        let content = csvData.trim();
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return [{ error: "CSV file must have a header row and at least one data row." }];

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
        
        const findHeaderIndex = (possibleNames: string[]): number => {
            for (const name of possibleNames) {
                const index = headerLine.indexOf(name);
                if (index !== -1) return index;
            }
            return -1;
        };

        const headerMap: { [key: string]: number } = {
            fullname: findHeaderIndex(['fullname', 'fullnames']), email: findHeaderIndex(['email']),
            employeecode: findHeaderIndex(['employeecode', 'edcode']), employmentstatus: findHeaderIndex(['employmentstatus']),
            startdate: findHeaderIndex(['startdate']), specialties: findHeaderIndex(['specialties']),
            preferredgrades: findHeaderIndex(['preferredgrades']), position: findHeaderIndex(['position']),
            maxlearners: findHeaderIndex(['maxlearners']), maxperiodsbymode: findHeaderIndex(['maxperiodsbymode']),
            manageremail: findHeaderIndex(['manageremail']), managername: findHeaderIndex(['managername', 'reportstomanagername', 'reportsto']),
        };
        
        const requiredHeaders = ['fullname', 'email', 'employmentstatus', 'position'];
        for(const required of requiredHeaders) {
            if (headerMap[required] === -1) {
                return [{ error: `Missing required CSV header for "${required}".` }];
            }
        }

        const parsedItems = dataLines.map((line, index) => {
            const columns = line.split(splitRegex).map(s => s.trim().replace(/^"|"$/g, ''));
            const getColumn = (key: string) => headerMap[key] > -1 ? (columns[headerMap[key]] || '') : '';
            
            const fullName = getColumn('fullname'); const email = getColumn('email'); const employeeCode = getColumn('employeecode');
            const status = getColumn('employmentstatus'); const startDate = getColumn('startdate'); const specialties = getColumn('specialties');
            const preferredGradesStr = getColumn('preferredgrades'); const positionName = getColumn('position');
            const maxLearnersStr = getColumn('maxlearners'); const maxPeriodsByModeStr = getColumn('maxperiodsbymode');
            const managerEmail = getColumn('manageremail'); const managerName = getColumn('managername');
            
            if(!fullName || !email || !status || !positionName) return { error: `Line ${index + 2}: Required fields (Full Name, Email, Status, Position) missing.` };
            if(!Object.values(EmploymentStatus).some(s => s.toLowerCase() === status.toLowerCase())) return { error: `Invalid status "${status}" on line ${index + 2}.` };
            const positionId = positionNameToIdMap.get(positionName.toLowerCase());
            if(!positionId) return { error: `Invalid position "${positionName}" on line ${index + 2}.` };
            const maxLearners = Number(maxLearnersStr || '250');
            if (isNaN(maxLearners)) return { error: `Invalid max learners value on line ${index + 2}.` };
            const preferredGrades = preferredGradesStr ? preferredGradesStr.split(';').map(s => s.trim()) : [];
            for (const grade of preferredGrades) if (grade && !academicStructure.grades.includes(grade)) return { error: `Invalid preferred grade "${grade}" on line ${index + 2}.` };
            
            const maxPeriodsByMode: { [mode: string]: number } = {};
            if (maxPeriodsByModeStr) {
                 const pairs = maxPeriodsByModeStr.split(';');
                 for (const pair of pairs) {
                    const [mode, periodsVal] = pair.split('=');
                    if (mode && periodsVal && academicStructure.modes.includes(mode.trim())) maxPeriodsByMode[mode.trim()] = Number(periodsVal) || 0;
                 }
            }
            return { fullName, email, employeeCode, employmentStatus: status as EmploymentStatus, startDate, positionId,
                specialties: specialties ? specialties.split(';').map(s => s.trim()) : [], preferredGrades,
                maxLearners, maxPeriodsByMode, managerEmail: managerEmail || '', managerName: managerName || '', };
        });

        const parsedValidItems = parsedItems.filter(p => !p.error);
        const newTeacherEmails = new Set(parsedValidItems.map(p => p.email!.toLowerCase()));
        const existingTeacherEmails = new Set(teachers.map(t => t.email.toLowerCase()));
        const newTeacherNames = new Set(parsedValidItems.map(p => p.fullName!.toLowerCase()));
        const existingTeacherNames = new Set(teachers.map(t => t.fullName.toLowerCase()));
        const allFullNames = [...teachers.map(t => t.fullName.toLowerCase()), ...parsedValidItems.map(p => p.fullName!.toLowerCase())];
        const nameCounts = allFullNames.reduce((acc, name) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {} as Record<string, number>);

        return parsedItems.map((item, index) => {
            if (item.error) return item;
            if (existingTeacherEmails.has(item.email?.toLowerCase())) return { ...item, error: `Email "${item.email}" already exists.` };
            if (item.employeeCode && teachers.find(t => t.employeeCode?.toLowerCase() === item.employeeCode?.toLowerCase())) return { ...item, error: `Employee Code "${item.employeeCode}" already exists.` };
            if (item.managerEmail && !existingTeacherEmails.has(item.managerEmail.toLowerCase()) && !newTeacherEmails.has(item.managerEmail.toLowerCase())) return { ...item, error: `Manager email "${item.managerEmail}" not found on line ${index + 2}.` };
            if (item.managerName && nameCounts[item.managerName.toLowerCase()] > 1) return { ...item, error: `Manager name "${item.managerName}" is ambiguous. Use manager's email.` };
            if (item.managerName && !existingTeacherNames.has(item.managerName.toLowerCase()) && !newTeacherNames.has(item.managerName.toLowerCase())) return { ...item, error: `Manager name "${item.managerName}" not found.` };
            return item;
        });
    }, [csvData, academicStructure, teachers, positionNameToIdMap]);
    
    const hasParseErrors = useMemo(() => validatedData.some(d => d.error), [validatedData]);

    const handleImport = () => {
        if (hasParseErrors || validatedData.length === 0) { setError('Cannot import. Fix errors.'); return; }
        const validNewTeachersData = validatedData.filter(d => !d.error);
        const newTeachersWithIds = validNewTeachersData.map(item => ({ ...item, id: `t${Date.now()}${Math.random()}` }));
        const combinedEmailToIdMap = new Map(teachers.map(t => [t.email.toLowerCase(), t.id]));
        const combinedNameToIdMap = new Map(teachers.map(t => [t.fullName.toLowerCase(), t.id]));
        newTeachersWithIds.forEach(t => { combinedEmailToIdMap.set(t.email!.toLowerCase(), t.id); combinedNameToIdMap.set(t.fullName!.toLowerCase(), t.id); });

        const createdCredentials: NewUserCredential[] = [];

        const finalNewTeachers: Teacher[] = newTeachersWithIds.map(item => {
            let managerId: string | undefined = undefined;
            if (item.managerEmail) managerId = combinedEmailToIdMap.get(item.managerEmail.toLowerCase());
            else if (item.managerName) managerId = combinedNameToIdMap.get(item.managerName.toLowerCase());

            const username = item.email!.split('@')[0].toLowerCase();
            const tempPassword = Math.random().toString(36).slice(-8);
            const passwordHash = '12345';

            createdCredentials.push({ fullName: item.fullName!, username, tempPassword });
            
            return {
                id: item.id, avatarUrl: `https://picsum.photos/seed/${item.id}/100/100`, fullName: item.fullName!, email: item.email!,
                employeeCode: item.employeeCode!, employmentStatus: item.employmentStatus!, startDate: item.startDate!,
                positionId: item.positionId!, managerId, specialties: item.specialties!, preferredGrades: item.preferredGrades!,
                maxLearners: item.maxLearners!, maxPeriodsByMode: item.maxPeriodsByMode!,
                markingTasks: 0, slas: { messageResponse: 0, markingTurnaround: 0 }, username, passwordHash, };
        });

        setTeachers(prev => [...prev, ...finalNewTeachers]);
        setImportResult(createdCredentials);
    };

    const handleDownloadTemplate = () => {
        const headers = "FullName,Email,EmployeeCode,EmploymentStatus,StartDate,Specialties,PreferredGrades,Position,MaxLearners,MaxPeriodsByMode,ManagerEmail,ManagerName";
        const example1 = "\"John Doe\",john.doe@example.com,EMP001,Permanent,2023-09-01,\"Mathematics;Physics\",\"Grade 10;Grade 11\",\"Senior Teacher\",250,\"Live=18;Flipped Afternoon=5\",manager.jane@example.com,";
        const example2 = "\"Jane Smith\",jane.smith@example.com,EMP002,Probation,2024-02-15,\"English;History\",\"Grade 9\",\"Junior Teacher\",220,\"Live=20;Self-Paced=2\",,John Doe";
        const csvContent = [headers, example1, example2].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        if (link.href) URL.revokeObjectURL(link.href);
        link.href = URL.createObjectURL(blob);
        link.download = "teacher_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleExportCredentials = () => {
        if (!importResult) return;
        const headers = "FullName,Username,TemporaryPassword";
        const csvRows = importResult.map(cred => `"${cred.fullName}","${cred.username}","${cred.tempPassword}"`);
        const csvContent = [headers, ...csvRows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "new_user_credentials.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClose = () => {
        setCsvData('');
        setError('');
        setImportResult(null);
        onClose();
    };
    
    if (importResult) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="Import Successful" size="lg">
                <div className="text-center p-4">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{importResult.length} new staff accounts created!</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">The following user accounts have been created with temporary passwords. Export the list to securely distribute the credentials.</p>
                    <div className="mt-4 max-h-60 overflow-y-auto border dark:border-slate-600 rounded-md text-sm">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
                             <thead className="bg-gray-50 dark:bg-slate-700"><tr><th className="px-4 py-2 text-left font-medium">Full Name</th><th className="px-4 py-2 text-left font-medium">Username</th><th className="px-4 py-2 text-left font-medium">Password</th></tr></thead>
                             <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-600">
                                {importResult.map(cred => (
                                    <tr key={cred.username}>
                                        <td className="px-4 py-2 text-left">{cred.fullName}</td>
                                        <td className="px-4 py-2 text-left font-mono">{cred.username}</td>
                                        <td className="px-4 py-2 text-left font-mono">{cred.tempPassword}</td>
                                    </tr>
                                ))}
                             </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-end gap-4 pt-4 mt-4 border-t dark:border-slate-700">
                    <button type="button" onClick={handleExportCredentials} className="bg-brand-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 flex items-center gap-2"><ArrowDownTrayIcon className="w-4 h-4"/>Export Credentials (CSV)</button>
                    <button type="button" onClick={handleClose} className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">Done</button>
                </div>
            </Modal>
        )
    }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bulk Import Teachers" size="xl">
      <div className="space-y-4">
        <div>
            <div className="flex justify-between items-center"><h4 className="font-semibold">Instructions</h4><button onClick={handleDownloadTemplate} className="flex items-center gap-2 text-sm text-brand-primary font-medium hover:underline"><ArrowDownTrayIcon className="w-4 h-4"/>Download Template</button></div>
            <ul className="list-disc list-inside text-sm mt-2 bg-gray-50 dark:bg-slate-700/50 p-3 rounded-md"><li>Required columns: `FullName`, `Email`, `EmploymentStatus`, `Position`.</li><li>`EmployeeCode` is crucial for linking salary data.</li><li>`Employment Status` must be one of: {Object.values(EmploymentStatus).join(', ')}.</li><li>`Position` must match one of the positions defined in Settings.</li><li>Separate multiple values (`Specialties`) with a semicolon (`;`).</li><li>`Max Periods by Mode` should be a semicolon-separated list (e.g. `"Live=18;Flipped=5"`).</li><li>Provide `ManagerEmail` or `ManagerName` to assign a manager. Email is preferred.</li></ul>
        </div>
        <FileUpload onFileRead={setCsvData} />
        {csvData.trim() && (
            <div>
                 <h4 className="font-semibold mb-2">Preview</h4>
                 <div className="max-h-60 overflow-y-auto border dark:border-slate-600 rounded-md">
                    <table className="min-w-full divide-y text-sm"><thead className="bg-gray-50 dark:bg-slate-700"><tr><th className="px-4 py-2 text-left font-medium">Name</th><th className="px-4 py-2 text-left font-medium">Position</th><th className="px-4 py-2 text-left font-medium">Manager</th></tr></thead>
                        <tbody className="bg-white dark:bg-transparent divide-y">
                           {validatedData.map((item, index) => (<tr key={index} className={item.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                {item.error ? <td colSpan={3} className="px-4 py-2 text-red-700 dark:text-red-400">{item.error}</td>
                                : (<><td>{item.fullName}</td><td>{academicStructure.positions.find(p => p.id === item.positionId)?.name}</td><td>{item.managerEmail || item.managerName || 'N/A'}</td></>)}
                            </tr>))}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={handleClose} className="bg-gray-200 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:hover:bg-slate-500">Cancel</button>
            <button type="button" onClick={handleImport} disabled={hasParseErrors || validatedData.length === 0} className="bg-brand-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 disabled:bg-gray-400">Import {validatedData.filter(d => !d.error).length} Teachers</button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImportModal;