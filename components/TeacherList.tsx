
import React, { useState, useMemo } from 'react';
import type { Teacher, AcademicStructure, TeacherWorkload, PhaseStructure, TeacherAllocation, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, TimetableHistoryEntry, TimeGrid, Permission } from '../types';
import { EmploymentStatus } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, UserCircleIcon, DocumentChartBarIcon, KeyIcon } from './Icons';
import AddEditTeacherModal from './AddEditTeacherModal';
import ConfirmationModal from './ConfirmationModal';
import TeacherReportModal from './TeacherReportModal';
import { TableFilterInput, TableFilterSelect } from './FormControls';
import { hasPermission } from '../permissions';
import CredentialsModal from './CredentialsModal';

const getStatusColor = (status: EmploymentStatus) => {
  switch (status) {
    case EmploymentStatus.Permanent: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case EmploymentStatus.Probation: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case EmploymentStatus.Contract: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case EmploymentStatus.OnLeave: return 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    case EmploymentStatus.Exited: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const WorkloadBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const bgColor = percentage > 90 ? 'bg-red-500' : percentage > 75 ? 'bg-yellow-500' : 'bg-brand-accent';

  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
    </div>
  );
};

interface TeacherListProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    workloads: Map<string, TeacherWorkload>;
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    leaveRequests: LeaveRequest[];
    observations: Observation[];
    monitoringTemplates: MonitoringTemplate[];
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
    permissions: Permission[];
}

type SortableKey = 'fullName' | 'employmentStatus' | 'position' | 'periods' | 'username';
type SortDirection = 'ascending' | 'descending';

const TeacherList: React.FC<TeacherListProps> = (props) => {
    const { teachers, setTeachers, academicStructure, phaseStructures, workloads, allocations, classGroups, leaveRequests, observations, monitoringTemplates, timeGrids, timetableHistory, permissions } = props;
    const [filters, setFilters] = useState({ name: '', status: 'all', position: '', specialties: '', phases: '' });
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: SortDirection } | null>(null);

    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [teacherForReport, setTeacherForReport] = useState<Teacher | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [credentialsModalData, setCredentialsModalData] = useState<{ username: string; tempPassword?: string; title: string; message: string; } | null>(null);


    const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);

    const sortedAndFilteredTeachers = useMemo(() => {
        let filtered = teachers.filter(teacher => {
            const positionName = positionMap.get(teacher.positionId) || '';
            return (
                (teacher.fullName.toLowerCase().includes(filters.name.toLowerCase()) || teacher.email.toLowerCase().includes(filters.name.toLowerCase())) &&
                (filters.status === 'all' || teacher.employmentStatus === filters.status) &&
                positionName.toLowerCase().includes(filters.position.toLowerCase())
            );
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: string | number;
                let bValue: string | number;
                
                switch (sortConfig.key) {
                    case 'fullName':
                        aValue = a.fullName;
                        bValue = b.fullName;
                        break;
                    case 'employmentStatus':
                        aValue = a.employmentStatus;
                        bValue = b.employmentStatus;
                        break;
                    case 'position':
                        aValue = positionMap.get(a.positionId) || '';
                        bValue = positionMap.get(b.positionId) || '';
                        break;
                    case 'periods':
                        aValue = workloads.get(a.id)?.totalPeriods || 0;
                        bValue = workloads.get(b.id)?.totalPeriods || 0;
                        break;
                    case 'username':
                        aValue = a.username || '';
                        bValue = b.username || '';
                        break;
                    default:
                        return 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [teachers, filters, sortConfig, positionMap, workloads]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const requestSort = (key: SortableKey) => {
        let direction: SortDirection = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortableKey) => {
        if (!sortConfig || sortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
        return sortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
    };

    const handleDelete = () => {
        if (teacherToDelete) {
            setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
            setTeacherToDelete(null);
        }
    };
    
    const handleResetPassword = (teacher: Teacher) => {
        const tempPassword = 'password123'; // Using static password for demo consistency
        setCredentialsModalData({
            username: teacher.username || teacher.email.split('@')[0],
            tempPassword,
            title: "Password Reset",
            message: `The password for ${teacher.fullName} has been reset. Please share these new credentials securely.`
        });
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Staff Directory ({teachers.length})</h3>
                    {hasPermission(permissions, 'add:teacher') && (
                        <button onClick={() => setAddModalOpen(true)} className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-rose-900 transition-colors">
                            <PlusIcon className="w-4 h-4"/> Add Staff Member
                        </button>
                    )}
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('fullName')}>Name {getSortIcon('fullName')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('employmentStatus')}>Status {getSortIcon('employmentStatus')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('position')}>Position {getSortIcon('position')}</div></th>
                                {hasPermission(permissions, 'view:teacher-logins') && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('username')}>Login Details {getSortIcon('username')}</div></th>}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('periods')}>Workload {getSortIcon('periods')}</div></th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                            <tr>
                                <th className="px-4 py-2"><TableFilterInput type="text" name="name" placeholder="Filter..." value={filters.name} onChange={handleFilterChange} /></th>
                                <th className="px-4 py-2"><TableFilterSelect name="status" value={filters.status} onChange={handleFilterChange}><option value="all">All</option>{Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s}</option>)}</TableFilterSelect></th>
                                <th className="px-4 py-2"><TableFilterInput type="text" name="position" placeholder="Filter..." value={filters.position} onChange={handleFilterChange} /></th>
                                {hasPermission(permissions, 'view:teacher-logins') && <th className="px-4 py-2"></th>}
                                <th className="px-4 py-2"></th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedAndFilteredTeachers.map(teacher => {
                                const workload = workloads.get(teacher.id);
                                const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);
                                return (
                                <tr key={teacher.id}>
                                    <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img className="h-10 w-10 rounded-full" src={teacher.avatarUrl} alt="" /><div className="ml-4"><div className="text-sm font-medium text-gray-900 dark:text-gray-200">{teacher.fullName}</div><div className="text-sm text-gray-500 dark:text-gray-400">{teacher.email}</div></div></div></td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(teacher.employmentStatus)}`}>{teacher.employmentStatus}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{positionMap.get(teacher.positionId) || 'N/A'}</td>
                                    {hasPermission(permissions, 'view:teacher-logins') && <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700 dark:text-gray-300">{teacher.username || 'N/A'}</td>}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 w-48">
                                        <div>Periods: {workload?.totalPeriods || 0} / {totalMaxPeriods}</div>
                                        <WorkloadBar current={workload?.totalPeriods || 0} max={totalMaxPeriods} />
                                        <div className="mt-1">Learners: {workload?.totalLearners || 0} / {teacher.maxLearners}</div>
                                        <WorkloadBar current={workload?.totalLearners || 0} max={teacher.maxLearners} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            {hasPermission(permissions, 'edit:teacher') && <button onClick={() => setTeacherToEdit(teacher)} className="text-brand-accent hover:text-amber-700"><PencilIcon className="h-5 w-5"/></button>}
                                            {hasPermission(permissions, 'delete:teacher') && <button onClick={() => setTeacherToDelete(teacher)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5"/></button>}
                                            {hasPermission(permissions, 'view:teacher-report') && <button onClick={() => setTeacherForReport(teacher)} className="text-brand-primary hover:text-rose-800"><DocumentChartBarIcon className="h-5 w-5"/></button>}
                                            {hasPermission(permissions, 'reset:teacher-password') && <button onClick={() => handleResetPassword(teacher)} className="text-gray-500 hover:text-brand-navy dark:hover:text-gray-200"><KeyIcon className="h-5 w-5"/></button>}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {isAddModalOpen && <AddEditTeacherModal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} setTeachers={setTeachers} academicStructure={academicStructure} teachers={teachers}/>}
            {teacherToEdit && <AddEditTeacherModal isOpen={!!teacherToEdit} onClose={() => setTeacherToEdit(null)} setTeachers={setTeachers} existingTeacher={teacherToEdit} academicStructure={academicStructure} teachers={teachers} />}
            {teacherToDelete && <ConfirmationModal isOpen={!!teacherToDelete} onClose={() => setTeacherToDelete(null)} onConfirm={handleDelete} title="Delete Teacher" message={`Are you sure you want to delete ${teacherToDelete.fullName}? This may affect existing allocations and historical data.`} />}
            {teacherForReport && <TeacherReportModal isOpen={!!teacherForReport} onClose={() => setTeacherForReport(null)} teacher={teacherForReport} teachers={teachers} workload={workloads.get(teacherForReport.id)} academicStructure={academicStructure} phaseStructures={phaseStructures} allocations={allocations} classGroups={classGroups} leaveRequests={leaveRequests} observations={observations} monitoringTemplates={monitoringTemplates} timeGrids={timeGrids} timetableHistory={timetableHistory} />}
            {credentialsModalData && <CredentialsModal isOpen={!!credentialsModalData} onClose={() => setCredentialsModalData(null)} {...credentialsModalData} />}
        </>
    );
};

export default TeacherList;
