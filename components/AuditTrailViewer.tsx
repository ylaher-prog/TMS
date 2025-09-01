import React, { useState, useMemo } from 'react';
import type { AuditLog, Teacher } from '../types';
import { TableFilterInput } from './FormControls';
import { ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface AuditTrailViewerProps {
    logs: AuditLog[];
    teachers: Teacher[];
}

type SortableKey = 'timestamp' | 'userName' | 'action';

const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ logs, teachers }) => {
    const [filters, setFilters] = useState({ user: '', action: '', details: '' });
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'ascending' | 'descending' }>({ key: 'timestamp', direction: 'descending' });

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredLogs = useMemo(() => {
        let filtered = logs.filter(log =>
            log.userName.toLowerCase().includes(filters.user.toLowerCase()) &&
            log.action.toLowerCase().includes(filters.action.toLowerCase()) &&
            log.details.toLowerCase().includes(filters.details.toLowerCase())
        );

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [logs, filters, sortConfig]);

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
        <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('timestamp')}>Timestamp {getSortIcon('timestamp')}</div></th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('userName')}>User {getSortIcon('userName')}</div></th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('action')}>Action {getSortIcon('action')}</div></th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                    </tr>
                    <tr>
                        <th className="px-2 py-2"></th>
                        <th className="px-2 py-2"><TableFilterInput type="text" name="user" placeholder="Filter user..." value={filters.user} onChange={handleFilterChange} /></th>
                        <th className="px-2 py-2"><TableFilterInput type="text" name="action" placeholder="Filter action..." value={filters.action} onChange={handleFilterChange} /></th>
                        <th className="px-2 py-2"><TableFilterInput type="text" name="details" placeholder="Filter details..." value={filters.details} onChange={handleFilterChange} /></th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                    {sortedAndFilteredLogs.map(log => (
                        <tr key={log.id}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">{log.userName}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">{log.action}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-md truncate" title={log.details}>{log.details}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {sortedAndFilteredLogs.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No log entries match your filters.
                </div>
            )}
        </div>
    );
};

export default AuditTrailViewer;
