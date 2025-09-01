import React, { useState, useMemo } from 'react';
import type { Teacher, ParentQuery, Permission } from '../types';
import { MonitoringStatus, ParentQueryCategory } from '../types';
import StatusTag from './StatusTag';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import AddEditParentQueryModal from './AddEditParentQueryModal';
import ConfirmationModal from './ConfirmationModal';
import { TableFilterInput, TableFilterSelect } from './FormControls';

interface ParentsProps {
    teachers: Teacher[];
    queries: ParentQuery[];
    setQueries: React.Dispatch<React.SetStateAction<ParentQuery[]>>;
    currentAcademicYear: string;
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
}

type SortableKey = 'parent' | 'teacher' | 'date' | 'category' | 'status';

const Parents: React.FC<ParentsProps> = ({ teachers, queries, setQueries, currentAcademicYear, logAction }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [queryToEdit, setQueryToEdit] = useState<ParentQuery | null>(null);
    const [queryToDelete, setQueryToDelete] = useState<ParentQuery | null>(null);
    
    const [filters, setFilters] = useState({ status: 'all', category: 'all', parentStudent: '', teacher: '', querySnippet: '' });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'date', direction: 'descending'});

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredQueries = useMemo(() => {
        let filtered = queries.filter(q => {
            const teacherName = teacherMap.get(q.teacherId) || '';
            return (
                (filters.status === 'all' || q.status === filters.status) &&
                (filters.category === 'all' || q.category === filters.category) &&
                (`${q.parentName} ${q.studentName}`.toLowerCase().includes(filters.parentStudent.toLowerCase())) &&
                (teacherName.toLowerCase().includes(filters.teacher.toLowerCase())) &&
                (q.queryDetails.toLowerCase().includes(filters.querySnippet.toLowerCase()))
            )
        });
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'parent') { aValue = a.parentName; bValue = b.parentName; }
                else if (sortConfig.key === 'teacher') { aValue = teacherMap.get(a.teacherId) || ''; bValue = teacherMap.get(b.teacherId) || ''; }
                else if (sortConfig.key === 'date') { aValue = a.creationDate; bValue = b.creationDate; }
                else { aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [queries, filters, sortConfig, teacherMap]);

    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };

    const handleAdd = () => {
        setQueryToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (query: ParentQuery) => {
        setQueryToEdit(query);
        setIsModalOpen(true);
    };
    
    const handleDelete = () => {
        if (queryToDelete) {
            setQueries(prev => prev.filter(q => q.id !== queryToDelete.id));
            setQueryToDelete(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Parent Queries</h3>
                        <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Log, track, and manage queries and complaints from parents.</p>
                    </div>
                    <button onClick={handleAdd} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors mt-3 sm:mt-0">
                        <PlusIcon className="w-4 h-4" />
                        <span>Log New Query</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('parent')}>Parent / Student {getSortIcon('parent')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('teacher')}>Teacher {getSortIcon('teacher')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Query Snippet</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('date')}>Date / Category {getSortIcon('date')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                            <tr>
                                <th className="px-4 py-2"><TableFilterInput type="text" name="parentStudent" placeholder="Filter..." value={filters.parentStudent} onChange={handleFilterChange} /></th>
                                <th className="px-4 py-2"><TableFilterInput type="text" name="teacher" placeholder="Filter..." value={filters.teacher} onChange={handleFilterChange} /></th>
                                <th className="px-4 py-2"><TableFilterInput type="text" name="querySnippet" placeholder="Filter..." value={filters.querySnippet} onChange={handleFilterChange} /></th>
                                <th className="px-4 py-2">
                                    <TableFilterSelect name="category" value={filters.category} onChange={handleFilterChange}>
                                        <option value="all">All</option>{Object.values(ParentQueryCategory).map(c=><option key={c} value={c}>{c}</option>)}
                                    </TableFilterSelect>
                                </th>
                                <th className="px-4 py-2">
                                    <TableFilterSelect name="status" value={filters.status} onChange={handleFilterChange}>
                                        <option value="all">All</option>{Object.values(MonitoringStatus).map(s=><option key={s} value={s}>{s}</option>)}
                                    </TableFilterSelect>
                                </th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedAndFilteredQueries.map((query) => (
                                <tr key={query.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{query.parentName}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{query.studentName}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {teacherMap.get(query.teacherId) || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-sm truncate" title={query.queryDetails}>
                                        {query.queryDetails}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-200">{query.creationDate}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{query.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={query.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleEdit(query)} className="text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300" title="Edit Query">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => setQueryToDelete(query)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete Query">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedAndFilteredQueries.length === 0 && (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            No parent queries match the current filters.
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && (
                <AddEditParentQueryModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    setQueries={setQueries}
                    teachers={teachers}
                    existingQuery={queryToEdit}
                    currentAcademicYear={currentAcademicYear}
                />
            )}

            {queryToDelete && (
                <ConfirmationModal
                    isOpen={!!queryToDelete}
                    onClose={() => setQueryToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Parent Query"
                    message={`Are you sure you want to delete this query from ${queryToDelete.parentName}? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default Parents;