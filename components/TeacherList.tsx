import React, { useState, useMemo } from 'react';
import type { Teacher, AcademicStructure, TeacherWorkload, PhaseStructure, TeacherAllocation, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, TimetableHistoryEntry, TimeGrid } from '../types';
import { EmploymentStatus } from '../types';
import { PencilIcon, TrashIcon, PlusIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon, UserCircleIcon } from './Icons';
import AddEditTeacherModal from './AddEditTeacherModal';
import ConfirmationModal from './ConfirmationModal';
import TeacherReportModal from './TeacherReportModal';

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
      <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
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
}

type SortableKey = 'fullName' | 'employmentStatus' | 'position' | 'periods';
type SortDirection = 'ascending' | 'descending';

const TeacherList: React.FC<TeacherListProps> = (props) => {
    const { teachers, setTeachers, academicStructure, phaseStructures, workloads, allocations, classGroups, leaveRequests, observations, monitoringTemplates, timeGrids, timetableHistory } = props;
    const [filters, setFilters] = useState({ name: '', status: 'all', position: '', specialties: '', phases: '' });
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: SortDirection } | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
    const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
    const [teacherForReport, setTeacherForReport] = useState<Teacher | null>(null);
    const [isAddModalOpen, setAddModalOpen] = useState(false);

    const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);
    
    const teacherPhasesMap = useMemo(() => {
        const subjectMap = new Map(academicStructure.subjects.map(s => [s.name, s]));
        const phaseMap = new Map<string, Set<string>>(); // teacherId -> Set of phase names

        teachers.forEach(teacher => {
            const phases = new Set<string>();
            teacher.specialties.forEach(specialtyName => {
                const subject = subjectMap.get(specialtyName);
                if (subject) {
                    subject.grades.forEach(grade => {
                        subject.curricula.forEach(curriculum => {
                            phaseStructures.forEach(phase => {
                                if (phase.grades.includes(grade) && phase.curricula.includes(curriculum)) {
                                    phases.add(phase.phase);
                                }
                            });
                        });
                    });
                }
            });
            phaseMap.set(teacher.id, phases);
        });
        return phaseMap;
    }, [teachers, academicStructure.subjects, phaseStructures]);

    const reportsMap = useMemo(() => {
        const map = new Map<string, Teacher[]>();
        teachers.forEach(t => {
            if (t.managerId) {
                if (!map.has(t.managerId)) {
                    map.set(t.managerId, []);
                }
                map.get(t.managerId)!.push(t);
            }
        });
        return map;
    }, [teachers]);

    const sortedAndFilteredTeachers = useMemo(() => {
        let filtered = teachers.filter(teacher => {
            const positionName = positionMap.get(teacher.positionId) || '';
            const teacherPhases = Array.from(teacherPhasesMap.get(teacher.id) || []).join(', ');
            return (
                (teacher.fullName.toLowerCase().includes(filters.name.toLowerCase()) || teacher.email.toLowerCase().includes(filters.name.toLowerCase())) &&
                (filters.status === 'all' || teacher.employmentStatus === filters.status) &&
                positionName.toLowerCase().includes(filters.position.toLowerCase()) &&
                teacher.specialties.join(', ').toLowerCase().includes(filters.specialties.toLowerCase()) &&
                teacherPhases.toLowerCase().includes(filters.phases.toLowerCase())
            );
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: string | number, bValue: string | number;

                if (sortConfig.key === 'position') {
                    aValue = positionMap.get(a.positionId) || '';
                    bValue = positionMap.get(b.positionId) || '';
                } else if (sortConfig.key === 'periods') {
                    aValue = workloads.get(a.id)?.totalPeriods || 0;
                    bValue = workloads.get(b.id)?.totalPeriods || 0;
                } else {
                    aValue = a[sortConfig.key as keyof Teacher] as string;
                    bValue = b[sortConfig.key as keyof Teacher] as string;
                }
                
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [filters, sortConfig, teachers, positionMap, workloads, teacherPhasesMap]);

    const requestSort = (key: SortableKey) => {
        let direction: SortDirection = 'ascending';
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
    
    const toggleRow = (teacherId: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(teacherId)) {
            newSet.delete(teacherId);
        } else {
            newSet.add(teacherId);
        }
        setExpandedRows(newSet);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleDeleteTeacher = () => {
        if (teacherToDelete) {
            setTeachers(prev => prev.filter(t => t.id !== teacherToDelete.id));
            setTeacherToDelete(null);
        }
    };
    
    const FilterInput: React.FC<{name: string, placeholder: string}> = ({name, placeholder}) => (
        <input
            type="text"
            name={name}
            placeholder={placeholder}
            value={filters[name as keyof typeof filters]}
            onChange={handleFilterChange}
            className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
        />
    )

    return (
        <>
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-2 sm:mb-0">All Staff ({teachers.length})</h3>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                         <button
                            onClick={() => setAddModalOpen(true)}
                            className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-rose-900 transition-colors flex-shrink-0"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Staff</span>
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('fullName')}>Name {getSortIcon('fullName')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                     <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('employmentStatus')}>Status {getSortIcon('employmentStatus')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                     <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('position')}>Position {getSortIcon('position')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                     <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('periods')}>Total Periods {getSortIcon('periods')}</div>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialties</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phases</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                            <tr>
                                <th className="px-4 py-2"><FilterInput name="name" placeholder="Filter by name..." /></th>
                                <th className="px-4 py-2">
                                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-2 py-1 bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary">
                                        <option value="all">All</option>
                                        {Object.values(EmploymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </th>
                                <th className="px-4 py-2"><FilterInput name="position" placeholder="Filter by position..." /></th>
                                <th className="px-4 py-2"></th>
                                <th className="px-4 py-2"><FilterInput name="specialties" placeholder="Filter by specialty..." /></th>
                                <th className="px-4 py-2"><FilterInput name="phases" placeholder="Filter by phase..." /></th>
                                <th className="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedAndFilteredTeachers.map((teacher) => {
                                const workload = workloads.get(teacher.id);
                                const currentPeriods = workload?.totalPeriods || 0;
                                const maxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);
                                const directReports = reportsMap.get(teacher.id) || [];
                                const isExpanded = expandedRows.has(teacher.id);
                                const teacherPhases = Array.from(teacherPhasesMap.get(teacher.id) || []);

                                return (
                                <React.Fragment key={teacher.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-slate-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full" src={teacher.avatarUrl} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{teacher.fullName}</div>
                                                    <div className="text-sm text-brand-text-light dark:text-gray-400">{teacher.email}</div>
                                                </div>
                                                 {directReports.length > 0 && (
                                                    <button onClick={() => toggleRow(teacher.id)} className="ml-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                                                        <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teacher.employmentStatus)}`}>
                                                {teacher.employmentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{positionMap.get(teacher.positionId) || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-gray-200">{currentPeriods} / {maxPeriods}</div>
                                            <WorkloadBar current={currentPeriods} max={maxPeriods} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light dark:text-gray-400 max-w-xs truncate">
                                            {teacher.specialties.join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light dark:text-gray-400 max-w-xs truncate" title={teacherPhases.join(', ')}>
                                            {teacherPhases.join(', ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                 <button onClick={() => setTeacherForReport(teacher)} className="text-brand-navy dark:text-gray-300 hover:text-brand-primary" title="View Report">
                                                    <UserCircleIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setTeacherToEdit(teacher)} className="text-brand-accent hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300" title="Edit Teacher">
                                                    <PencilIcon className="h-5 w-5" />
                                                </button>
                                                <button onClick={() => setTeacherToDelete(teacher)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300" title="Delete Teacher">
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {isExpanded && directReports.length > 0 && (
                                        <tr className="bg-gray-50 dark:bg-slate-800/50">
                                            <td colSpan={7} className="py-2 px-6">
                                                <div className="pl-8 border-l-2 border-brand-accent ml-4">
                                                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Direct Reports ({directReports.length})</h4>
                                                    <ul className="space-y-1">
                                                        {directReports.map(report => (
                                                            <li key={report.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-center">
                                                                <img src={report.avatarUrl} className="w-6 h-6 rounded-full mr-2" />
                                                                {report.fullName} 
                                                                <span className="ml-2 text-xs text-gray-400">({positionMap.get(report.positionId)})</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                    {sortedAndFilteredTeachers.length === 0 && (
                        <div className="text-center py-10 text-brand-text-light dark:text-gray-400">
                            No staff found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            {(teacherToEdit || isAddModalOpen) && (
                <AddEditTeacherModal
                    isOpen={true}
                    onClose={() => { setTeacherToEdit(null); setAddModalOpen(false); }}
                    setTeachers={setTeachers}
                    existingTeacher={teacherToEdit}
                    academicStructure={academicStructure}
                    teachers={teachers}
                />
            )}
            
            {teacherForReport && (
                 <TeacherReportModal
                    isOpen={!!teacherForReport}
                    onClose={() => setTeacherForReport(null)}
                    teacher={teacherForReport}
                    teachers={teachers}
                    workload={workloads.get(teacherForReport.id)}
                    academicStructure={academicStructure}
                    phaseStructures={phaseStructures}
                    allocations={allocations}
                    classGroups={classGroups}
                    leaveRequests={leaveRequests}
                    observations={observations}
                    monitoringTemplates={monitoringTemplates}
                    timeGrids={timeGrids}
                    timetableHistory={timetableHistory}
                />
            )}

            {teacherToDelete && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setTeacherToDelete(null)}
                    onConfirm={handleDeleteTeacher}
                    title="Delete Staff Member"
                    message={`Are you sure you want to delete ${teacherToDelete.fullName}? This action cannot be undone.`}
                />
            )}
        </>
    );
};

export default TeacherList;