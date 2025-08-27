import React, { useMemo, useState } from 'react';
import type { Teacher, ProcurementRequest } from '../types';
import { RequestStatus } from '../types';
import StatusTag from './StatusTag';
import { CheckIcon, HandThumbDownIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface ProcurementProps {
    teachers: Teacher[];
    procurementRequests: ProcurementRequest[];
    setProcurementRequests: React.Dispatch<React.SetStateAction<ProcurementRequest[]>>;
}

type SortableKey = 'requester' | 'item' | 'amount' | 'requestDate' | 'status';

const Procurement: React.FC<ProcurementProps> = ({ teachers, procurementRequests, setProcurementRequests }) => {
    const [filters, setFilters] = useState({
        status: 'all',
        requester: '',
        item: '',
        category: 'all',
    });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'requestDate', direction: 'descending'});

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const categories = useMemo(() => Array.from(new Set(procurementRequests.map(r => r.category))), [procurementRequests]);

    const handleStatusChange = (id: string, newStatus: RequestStatus) => {
        setProcurementRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredRequests = useMemo(() => {
        let filtered = procurementRequests.filter(req => {
            const teacher = teacherMap.get(req.requesterId);
            return (
                (filters.status === 'all' || req.status === filters.status) &&
                (teacher?.fullName.toLowerCase().includes(filters.requester.toLowerCase()) || false) &&
                ((req.itemDescription.toLowerCase().includes(filters.item.toLowerCase()) || req.category.toLowerCase().includes(filters.item.toLowerCase()))) &&
                (filters.category === 'all' || req.category === filters.category)
            );
        });
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'requester') {
                    aValue = teacherMap.get(a.requesterId)?.fullName || '';
                    bValue = teacherMap.get(b.requesterId)?.fullName || '';
                } else if (sortConfig.key === 'item') {
                    aValue = a.itemDescription;
                    bValue = b.itemDescription;
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [procurementRequests, filters, sortConfig, teacherMap]);
    
    const requestSort = (key: SortableKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };
    
    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-6">Procurement Requests</h3>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('requester')}>Requester {getSortIcon('requester')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('item')}>Item / Category {getSortIcon('item')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('amount')}>Amount {getSortIcon('amount')}</div></th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('requestDate')}>Date {getSortIcon('requestDate')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                        <tr>
                            <th className="px-4 py-2"><input type="text" name="requester" placeholder="Filter..." value={filters.requester} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-md text-sm" /></th>
                            <th className="px-4 py-2"><input type="text" name="item" placeholder="Filter..." value={filters.item} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-md text-sm" /></th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2">
                                <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-md text-sm">
                                    <option value="all">All</option>{Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </th>
                            <th className="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                        {sortedAndFilteredRequests.map((req) => {
                            const teacher = teacherMap.get(req.requesterId);
                            return (
                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{teacher?.fullName || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{req.itemDescription}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{req.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">${req.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{req.requestDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={req.status} /></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {req.status === RequestStatus.Pending ? (
                                            <div className="flex items-center space-x-2">
                                                <button onClick={() => handleStatusChange(req.id, RequestStatus.Approved)} className="p-1.5 text-green-600 bg-green-100 dark:bg-green-900/50 dark:text-green-300 rounded-full hover:bg-green-200 dark:hover:bg-green-900" title="Approve">
                                                    <CheckIcon className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleStatusChange(req.id, RequestStatus.Denied)} className="p-1.5 text-red-600 bg-red-100 dark:bg-red-900/50 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900" title="Deny">
                                                    <HandThumbDownIcon className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">No actions</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {sortedAndFilteredRequests.length === 0 && (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No procurement requests match the current filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Procurement;