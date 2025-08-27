import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import FileUpload from './FileUpload';
import type { Teacher, SalaryInfo } from '../types';
import { ArrowDownTrayIcon } from './Icons';

interface BulkImportSalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

type ParsedRow = {
    teacherName?: string;
    teacherId?: string;
    salaryInfo?: SalaryInfo;
    error?: string;
}

const BulkImportSalaryModal: React.FC<BulkImportSalaryModalProps> = ({ isOpen, onClose, teachers, setTeachers }) => {
    const [csvData, setCsvData] = useState('');

    const teacherCodeMap = useMemo(() => {
        const map = new Map<string, Teacher>();
        teachers.forEach(t => {
            if (t.employeeCode) {
                map.set(t.employeeCode.toLowerCase(), t);
            }
        });
        return map;
    }, [teachers]);

    const parsedData = useMemo((): ParsedRow[] => {
        if (!csvData.trim()) return [];
        
        let content = csvData.trim();
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) return [{ error: "CSV must have a header and at least one data row." }];

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
            code: headerLine.indexOf('employeecode'),
            surname: headerLine.indexOf('surname'),
            names: headerLine.indexOf('fullnames'),
            salary: headerLine.indexOf('edsalary'),
            medallowance: headerLine.indexOf('edmedallowance'),
            tax: headerLine.indexOf('ddtax'),
            uifded: headerLine.indexOf('dduif'),
            medaidded: headerLine.indexOf('ddmedicalaid'),
            vitalityded: headerLine.indexOf('ddvitality'),
            uifcc: headerLine.indexOf('ccuif'),
            sdl: headerLine.indexOf('ccsdl'),
            provident: headerLine.indexOf('ccprovidentfund'),
            totalearn: headerLine.indexOf('totalearnings'),
            totalded: headerLine.indexOf('totaldeductions'),
            nett: headerLine.indexOf('nettpay'),
            totalcc: headerLine.indexOf('totalcompanycontributions'),
            cost: headerLine.indexOf('salarycost'),
        };

        if (h.code === -1 || h.salary === -1 || h.nett === -1) {
            return [{ error: "CSV validation failed: Missing one or more required headers (Employee Code, ED-Salary, Nett Pay)." }];
        }
        
        return dataLines.map((line, index): ParsedRow => {
            const cols = line.split(splitRegex).map(s => s.trim().replace(/^"|"$/g, ''));
            const employeeCode = cols[h.code];

            if (!employeeCode) {
                return { error: `Line ${index + 2}: Employee Code is missing.` };
            }

            const teacher = teacherCodeMap.get(employeeCode.toLowerCase());

            if (!teacher) {
                return { error: `Line ${index + 2}: Teacher with Employee Code "${employeeCode}" not found.` };
            }

            const getNum = (index: number) => parseFloat(cols[index]) || 0;

            const salaryInfo: SalaryInfo = {
                employeeCode,
                salary: getNum(h.salary),
                medicalAllowance: getNum(h.medallowance),
                tax: getNum(h.tax),
                uifDeduction: getNum(h.uifded),
                medicalAidDeduction: getNum(h.medaidded),
                vitalityDeduction: getNum(h.vitalityded),
                uifContribution: getNum(h.uifcc),
                sdlContribution: getNum(h.sdl),
                providentFundContribution: getNum(h.provident),
                totalEarnings: getNum(h.totalearn),
                totalDeductions: getNum(h.totalded),
                nettPay: getNum(h.nett),
                totalCompanyContributions: getNum(h.totalcc),
                salaryCost: getNum(h.cost),
            };

            return { teacherName: teacher.fullName, teacherId: teacher.id, salaryInfo };
        });

    }, [csvData, teacherCodeMap]);

    const hasErrors = useMemo(() => parsedData.some(p => p.error), [parsedData]);

    const handleImport = () => {
        if (hasErrors || parsedData.length === 0) {
            alert("Cannot import. Please fix errors in the CSV file.");
            return;
        }

        const updates = new Map<string, SalaryInfo>();
        parsedData.forEach(row => {
            if (row.teacherId && row.salaryInfo) {
                updates.set(row.teacherId, row.salaryInfo);
            }
        });

        setTeachers(prevTeachers => 
            prevTeachers.map(t => 
                updates.has(t.id) ? { ...t, salaryInfo: updates.get(t.id) } : t
            )
        );
        onClose();
    };

    const handleDownloadTemplate = () => {
        const headers = "Employee Code,Surname,Full Names,ED-Salary,ED-Med Allowance,DD-Tax,DD-U.I.F.,DD-Medical Aid,DD-Vitality,CC-U.I.F.,CC-SDL,CC-Provident Fund,Total Earnings,Total Deductions,Nett Pay,Total Company Contributions,Salary Cost";
        const blob = new Blob([headers], { type: 'text/csv; charset=utf-8' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "salary_import_template.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Bulk Import Salary Data" size="xl">
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
                        <li>The CSV must contain the exact headers provided in the template.</li>
                        <li>The <strong>Employee Code</strong> column is used to match records to teachers in the system. Ensure teachers have this code assigned.</li>
                        <li>All monetary values should be numbers without currency symbols or commas.</li>
                    </ul>
                </div>
                
                <FileUpload onFileRead={setCsvData} />

                {csvData.trim() && (
                    <div>
                         <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Preview ({parsedData.filter(p=>!p.error).length} valid rows)</h4>
                         <div className="max-h-60 overflow-y-auto border dark:border-slate-600 rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600 text-sm">
                                <thead className="bg-gray-50 dark:bg-slate-700">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Teacher</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Nett Pay</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500 dark:text-gray-300">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-600">
                                   {parsedData.map((row, index) => (
                                       <tr key={index} className={row.error ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                            <td className="px-4 py-2">{row.teacherName || 'N/A'}</td>
                                            <td className="px-4 py-2">{row.salaryInfo ? new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(row.salaryInfo.nettPay) : 'N/A'}</td>
                                            <td className="px-4 py-2">
                                                {row.error 
                                                    ? <span className="text-red-600 dark:text-red-400 font-semibold">{row.error}</span>
                                                    : <span className="text-green-600 dark:text-green-400 font-semibold">Ready to Import</span>
                                                }
                                            </td>
                                       </tr>
                                   ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
                
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button 
                        type="button" 
                        onClick={handleImport} 
                        disabled={hasErrors || parsedData.length === 0}
                        className="bg-brand-accent text-white px-4 py-2 rounded-md font-semibold hover:bg-amber-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        Import {parsedData.filter(d => !d.error).length} Records
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default BulkImportSalaryModal;