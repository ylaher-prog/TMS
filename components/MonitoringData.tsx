
import React, { useMemo, useState } from 'react';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, ClassGroup, TeacherAllocation } from '../types';
import { MonitoringStatus, ObservationPriority } from '../types';
import StatusTag from './StatusTag';
import AddEditObservationModal from './AddEditObservationModal';
import ConfirmationModal from './ConfirmationModal';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import { TableFilterInput, TableFilterSelect } from './FormControls';

interface MonitoringDataProps {
    teachers: Teacher[];
    observations: Observation[];
    setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    monitoringTemplates: MonitoringTemplate[];
    setMonitoringTemplates: React.Dispatch<React.SetStateAction<MonitoringTemplate[]>>;
    currentAcademicYear: string;
    classGroups: ClassGroup[];
    allocations: TeacherAllocation[];
}

const getPriorityColor = (priority: ObservationPriority) => {
    switch(priority) {
        case ObservationPriority.High: return 'text-red-600 dark:text-red-400';
        case ObservationPriority.Medium: return 'text-yellow-600 dark:text-yellow-400';
        case ObservationPriority.Low: return 'text-gray-600 dark:text-gray-400';
        default: return 'text-gray-600 dark:text-gray-400';
    }
}

type SortableKey = 'type' | 'educator' | 'phase' | 'date' | 'status' | 'priority';

const MonitoringData: React.FC<MonitoringDataProps> = (props) => {
    const { teachers, observations, setObservations, academicStructure, phaseStructures, monitoringTemplates, currentAcademicYear, classGroups, allocations } = props;
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [observationToEdit, setObservationToEdit] = useState<Observation | null>(null);
    const [observationToDelete, setObservationToDelete] = useState<Observation | null>(null);
    
    const [filters, setFilters] = useState({ type: 'all', status: 'all', priority: 'all', educator: '', phaseHead: '' });
    const [sortConfig, setSortConfig] = useState<{key: SortableKey, direction: 'ascending' | 'descending'}>({key: 'date', direction: 'descending'});

    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const templateMap = useMemo(() => new Map(monitoringTemplates.map(t => [t.id, t.name])), [monitoringTemplates]);
    
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const sortedAndFilteredObservations = useMemo(() => {
        let filtered = observations.filter(obs => {
            const educator = teacherMap.get(obs.teacherId);
            const phaseHead = teacherMap.get(obs.phaseHeadId);
            return (
                (filters.type === 'all' || obs.observationType === filters.type) &&
                (filters.status === 'all' || obs.status === filters.status) &&
                (filters.priority === 'all' || obs.priority === filters.priority) &&
                (educator?.fullName.toLowerCase().includes(filters.educator.toLowerCase()) || false) &&
                (phaseHead?.fullName.toLowerCase().includes(filters.phaseHead.toLowerCase()) || false)
            );
        });
        
        if (sortConfig) {
            filtered.sort((a, b) => {
                let aValue: any, bValue: any;
                if(sortConfig.key === 'type') { aValue = templateMap.get(a.observationType) || ''; bValue = templateMap.get(b.observationType) || ''; }
                else if (sortConfig.key === 'educator') { aValue = teacherMap.get(a.teacherId)?.fullName || ''; bValue = teacherMap.get(b.teacherId)?.fullName || ''; }
                else if (sortConfig.key === 'phase') { aValue = a.phase; bValue = b.phase; }
                else if (sortConfig.key === 'date') { aValue = a.observationDate; bValue = b.observationDate; }
                else { aValue = a[sortConfig.key]; bValue = b[sortConfig.key]; }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [observations, filters, sortConfig, teacherMap, templateMap]);
    
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
        setObservationToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (obs: Observation) => {
        setObservationToEdit(obs);
        setIsModalOpen(true);
    }
    
    const handleDelete = () => {
        if (observationToDelete) {
            setObservations(prev => prev.filter(o => o.id !== observationToDelete.id));
            setObservationToDelete(null);
        }
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-4 sm:mb-0">All Entries</h3>
                    <button onClick={handleAdd} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors">
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Entry</span>
                    </button>
                </div>
                
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('type')}>Type / Educator {getSortIcon('type')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('phase')}>Phase / Head {getSortIcon('phase')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIcon('date')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('status')}>Status {getSortIcon('status')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('priority')}>Priority {getSortIcon('priority')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                            <tr>
                                <th className="px-4 py-2 space-y-1">
                                    <TableFilterSelect name="type" value={filters.type} onChange={handleFilterChange}>
                                        <option value="all">All Types</option>{monitoringTemplates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                                    </TableFilterSelect>
                                    <TableFilterInput type="text" name="educator" placeholder="Filter educator..." value={filters.educator} onChange={handleFilterChange} />
                                </th>
                                <th className="px-4 py-2">
                                    <TableFilterInput type="text" name="phaseHead" placeholder="Filter head..." value={filters.phaseHead} onChange={handleFilterChange} />
                                </th>
                                <th className="px-4 py-2"></th>
                                <th className="px-4 py-2"><TableFilterSelect name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All</option>{Object.values(MonitoringStatus).map(s=><option key={s} value={s}>{s}</option>)}</TableFilterSelect></th>
                                <th className="px-4 py-2"><TableFilterSelect name="priority" value={filters.priority} onChange={handleFilterChange}><option value="all">All</option>{Object.values(ObservationPriority).map(p=><option key={p} value={p}>{p}</option>)}</TableFilterSelect></th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedAndFilteredObservations.map((obs) => (
                                <tr key={obs.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{templateMap.get(obs.observationType) || obs.observationType}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{teacherMap.get(obs.teacherId)?.fullName || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{obs.phase}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{teacherMap.get(obs.phaseHeadId)?.fullName || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{obs.observationDate}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><StatusTag status={obs.status} /></td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${getPriorityColor(obs.priority)}`}>{obs.priority}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <button onClick={() => handleEdit(obs)} className="text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300" title="Edit Entry">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                            <button onClick={() => setObservationToDelete(obs)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete Entry">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {sortedAndFilteredObservations.length === 0 && (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            No monitoring entries match the current filters.
                        </div>
                    )}
                </div>
            </div>
            
            {isModalOpen && (
                <AddEditObservationModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    setObservations={setObservations}
                    teachers={teachers}
                    academicStructure={academicStructure}
                    phaseStructures={phaseStructures}
                    existingObservation={observationToEdit}
                    monitoringTemplates={monitoringTemplates}
                    currentAcademicYear={currentAcademicYear}
                    classGroups={classGroups}
                    allocations={allocations}
                />
            )}

            {observationToDelete && (
                <ConfirmationModal
                    isOpen={!!observationToDelete}
                    onClose={() => setObservationToDelete(null)}
                    onConfirm={handleDelete}
                    title="Delete Monitoring Entry"
                    message={`Are you sure you want to delete this entry? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default MonitoringData;
