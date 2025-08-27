
import React, { useState, useMemo } from 'react';
import type { Teacher, SalaryInfo } from '../types';
import { PlusIcon, ArrowUpTrayIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import BulkImportSalaryModal from './BulkImportSalaryModal';

interface PayrollProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
}

type SortableKey = 'name' | 'employeeCode' | 'nettPay' | 'salaryCost';

const Payroll: React.FC<PayrollProps> = ({ teachers, setTeachers }) => {
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'ascending' | 'descending' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const teachersWithSalary = useMemo(() => teachers.filter(t => !!t.salaryInfo), [teachers]);

    const sortedAndFilteredTeachers = useMemo(() => {
        let filtered = teachersWithSalary.filter(teacher =>
            teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (teacher.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;

                if (sortConfig.key === 'name') {
                    aValue = a.fullName;
                    bValue = b.fullName;
                } else if (sortConfig.key === 'employeeCode') {
                    aValue = a.employeeCode || '';
                    bValue = b.employeeCode || '';
                } else if (sortConfig.key === 'nettPay') {
                    aValue = a.salaryInfo?.nettPay || 0;
                    bValue = b.salaryInfo?.nettPay || 0;
                } else { // salaryCost
                    aValue = a.salaryInfo?.salaryCost || 0;
                    bValue = b.salaryInfo?.salaryCost || 0;
                }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [searchTerm, teachersWithSalary, sortConfig]);
    
    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        }
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                 <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-2 sm:mb-0">Teacher Payroll</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input 
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64 px-3 py-2 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600"
                        />
                         <button
                            onClick={() => setImportModalOpen(true)}
                            className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-rose-900 transition-colors flex-shrink-0"
                        >
                            <ArrowUpTrayIcon className="w-4 h-4" />
                            <span>Import Salary Data</span>
                        </button>
                    </div>
                </div>

                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('name')}>Name {getSortIcon('name')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('employeeCode')}>Employee Code {getSortIcon('employeeCode')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Earnings</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Deductions</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('nettPay')}>Nett Pay {getSortIcon('nettPay')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company Contributions</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('salaryCost')}>Total Salary Cost {getSortIcon('salaryCost')}</div></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedAndFilteredTeachers.map(teacher => (
                                <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{teacher.fullName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{teacher.employeeCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatCurrency(teacher.salaryInfo!.totalEarnings)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">{formatCurrency(teacher.salaryInfo!.totalDeductions)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700 dark:text-green-400">{formatCurrency(teacher.salaryInfo!.nettPay)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatCurrency(teacher.salaryInfo!.totalCompanyContributions)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-200">{formatCurrency(teacher.salaryInfo!.salaryCost)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedAndFilteredTeachers.length === 0 && (
                        <div className="text-center py-10 text-brand-text-light dark:text-gray-400">
                            {teachersWithSalary.length === 0 
                                ? "No salary data has been imported yet."
                                : "No teachers found matching your search."
                            }
                        </div>
                    )}
                 </div>
            </div>
            {isImportModalOpen && (
                <BulkImportSalaryModal
                    isOpen={isImportModalOpen}
                    onClose={() => setImportModalOpen(false)}
                    teachers={teachers}
                    setTeachers={setTeachers}
                />
            )}
        </>
    );
};

export default Payroll;
