import React, { useMemo, useState } from 'react';
import type { Teacher, LeaveRequest } from '../types';
import { RequestStatus, LeaveType } from '../types';
import StatusTag from './StatusTag';
import { CheckIcon, HandThumbDownIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface LeaveProps {
    teachers: Teacher[];
    leaveRequests: LeaveRequest[];
    setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
}

type SortableKey = 'teacher' | 'leaveType' | 'startDate' | 'status';

const Leave: React.FC<LeaveProps> = ({ teachers, leaveRequests, setLeaveRequests }) => {
    const [filters, setFilters] = useState({
        status: 'all',
        teacherName: '',
        leaveType: 'all',
        reason: '',
    });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'startDate', direction: 'descending'});

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

    const handleStatusChange = (id: string, newStatus: RequestStatus) => {
        setLeaveRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredRequests = useMemo(() => {
        let filtered = leaveRequests.filter(req => {
            const teacher = teacherMap.get(req.teacherId);
            return (
                (filters.status === 'all' || req.status === filters.status) &&
                (teacher?.fullName.toLowerCase().includes(filters.teacherName.toLowerCase()) || false) &&
                (filters.leaveType === 'all' || req.leaveType === filters.leaveType) &&
                req.reason.toLowerCase().includes(filters.reason.toLowerCase())
            );
        });
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if (sortConfig.key === 'teacher') {
                    aValue = teacherMap.get(a.teacherId)?.fullName || '';
                    bValue = teacherMap.get(b.teacherId)?.fullName || '';
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
    }, [leaveRequests, filters, sortConfig, teacherMap]);
    
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
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4 sm:mb-0">Leave Requests</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('teacher')}>Teacher {getSortIcon('teacher')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('leaveType')}>Leave Type {getSortIcon('leaveType')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('startDate')}>Dates {getSortIcon('startDate')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reason</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                        <tr>
                            <th className="px-4 py-2"><input type="text" name="teacherName" placeholder="Filter..." value={filters.teacherName} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-md text-sm" /></th>
                            <th className="px-4 py-2">
                                <select name="leaveType" value={filters.leaveType} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-md text-sm">
                                    <option value="all">All</option>{Object.values(LeaveType).map(lt => <option key={lt} value={lt}>{lt}</option>)}
                                </select>
                            </th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2"><input type="text" name="reason" placeholder="Filter..." value={filters.reason} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 rounded-md text-sm" /></th>
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
                            const teacher = teacherMap.get(req.teacherId);
                            return (
                                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{teacher?.fullName || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{teacher?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{req.leaveType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{req.startDate} to {req.endDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{req.reason}</td>
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
                        No leave requests match the current filters.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leave;