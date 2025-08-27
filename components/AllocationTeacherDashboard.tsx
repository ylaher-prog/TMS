import React, { useState, useMemo } from 'react';
import type { Teacher, Subject, TeacherWorkload, AcademicStructure, TeacherAllocation, ClassGroup, GeneralSettings, PhaseStructure, TimeGrid, TimetableHistoryEntry } from '../types';
import { DocumentChartBarIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import WorkloadReportModal from './WorkloadReportModal';

interface AllocationTeacherDashboardProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    workloads: Map<string, TeacherWorkload>;
    subjects: Subject[];
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    generalSettings: GeneralSettings;
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
}

const WorkloadBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
  const percentage = max > 0 ? (current / max) * 100 : 0;
  const bgColor = percentage > 100 ? 'bg-red-500' : percentage > 90 ? 'bg-yellow-500' : 'bg-brand-accent';

  return (
    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5 mt-1">
      <div className={`${bgColor} h-2.5 rounded-full`} style={{ width: `${Math.min(percentage, 100)}%` }}></div>
    </div>
  );
};

type SortableKey = 'name' | 'periods' | 'learners' | 'classes' | string; // string for dynamic modes

const AllocationTeacherDashboard: React.FC<AllocationTeacherDashboardProps> = (props) => {
    const { teachers, setTeachers, workloads, subjects, academicStructure, phaseStructures, allocations, classGroups, generalSettings, timeGrids, timetableHistory } = props;
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
    const [teacherForReport, setTeacherForReport] = useState<Teacher | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortableKey, direction: 'ascending' | 'descending' } | null>(null);
    
    const displayModes = useMemo(() => academicStructure.modes.filter(m => m !== 'Self-Paced'), [academicStructure.modes]);


    const sortedAndFilteredTeachers = useMemo(() => {
        let filtered = teachers.filter(teacher => 
            teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const workloadA = workloads.get(a.id) || { totalPeriods: 0, totalLearners: 0, totalClasses: 0, periodsByMode: {} };
                const workloadB = workloads.get(b.id) || { totalPeriods: 0, totalLearners: 0, totalClasses: 0, periodsByMode: {} };
                
                let aValue: any, bValue: any;

                switch (sortConfig.key) {
                    case 'name':
                        aValue = a.fullName;
                        bValue = b.fullName;
                        break;
                    case 'periods':
                        aValue = workloadA.totalPeriods;
                        bValue = workloadB.totalPeriods;
                        break;
                    case 'learners':
                        aValue = workloadA.totalLearners;
                        bValue = workloadB.totalLearners;
                        break;
                    case 'classes':
                        aValue = workloadA.totalClasses;
                        bValue = workloadB.totalClasses;
                        break;
                    default: // mode periods
                         aValue = workloadA.periodsByMode[sortConfig.key] || 0;
                         bValue = workloadB.periodsByMode[sortConfig.key] || 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [searchTerm, teachers, workloads, sortConfig]);
    
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

    const handleSelectTeacher = (teacherId: string) => {
        setSelectedTeacherIds(prev => 
            prev.includes(teacherId)
                ? prev.filter(id => id !== teacherId)
                : [...prev, teacherId]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedTeacherIds(sortedAndFilteredTeachers.map(t => t.id));
        } else {
            setSelectedTeacherIds([]);
        }
    };
    
    const isAllSelected = sortedAndFilteredTeachers.length > 0 && selectedTeacherIds.length === sortedAndFilteredTeachers.length;

    const handleBulkEmail = () => {
        if(selectedTeacherIds.length === 0) return;
        alert(`This would trigger emails to ${selectedTeacherIds.length} selected teachers.`);
    }

    return (
        <>
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-2 sm:mb-0">Teacher Data & Workloads</h3>
                <input 
                    type="text"
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-72 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 border border-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600"
                />
            </div>
            {selectedTeacherIds.length > 0 && (
                <div className="bg-sky-100 dark:bg-sky-900/50 p-3 rounded-lg mb-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-sky-800 dark:text-sky-200">{selectedTeacherIds.length} teacher(s) selected.</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => alert("This would generate a multi-page PDF for the selected teachers.")} className="px-3 py-1 text-sm font-semibold text-white bg-brand-navy rounded-md hover:bg-slate-800">Download Selected</button>
                        <button onClick={handleBulkEmail} className="px-3 py-1 text-sm font-semibold text-white bg-brand-primary rounded-md hover:bg-rose-900">Email Selected</button>
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" checked={isAllSelected} onChange={handleSelectAll}/></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('name')}>Name {getSortIcon('name')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('periods')}>Periods {getSortIcon('periods')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('learners')}>Learners {getSortIcon('learners')}</div></th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort('classes')}>Classes {getSortIcon('classes')}</div></th>
                            {displayModes.map(mode => (
                                <th key={mode} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestSort(mode)}>{mode} {getSortIcon(mode)}</div></th>
                            ))}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Specialties</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                        {sortedAndFilteredTeachers.map((teacher) => {
                            const workload = workloads.get(teacher.id) || { totalPeriods: 0, totalLearners: 0, totalClasses: 0, periodsByMode: {} };
                            const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);

                            return (
                                <tr key={teacher.id} className={`hover:bg-gray-50 dark:hover:bg-slate-800 ${selectedTeacherIds.includes(teacher.id) ? 'bg-sky-50 dark:bg-sky-900/30' : ''}`}>
                                     <td className="p-4"><input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" checked={selectedTeacherIds.includes(teacher.id)} onChange={() => handleSelectTeacher(teacher.id)}/></td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full" src={teacher.avatarUrl} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{teacher.fullName}</div>
                                                <div className="text-sm text-brand-text-light dark:text-gray-400">{teacher.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-200">{workload.totalPeriods} / {totalMaxPeriods}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">Hours: {(workload.totalPeriods / 2).toFixed(1)}</div>
                                        <WorkloadBar current={workload.totalPeriods} max={totalMaxPeriods} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900 dark:text-gray-200">{workload.totalLearners} / {teacher.maxLearners}</div>
                                        <WorkloadBar current={workload.totalLearners} max={teacher.maxLearners} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-gray-200">{workload.totalClasses}</td>
                                    
                                    {displayModes.map(mode => {
                                        const current = workload.periodsByMode[mode] || 0;
                                        const max = teacher.maxPeriodsByMode[mode] || 0;
                                        return (
                                            <td key={mode} className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-gray-200">{current} / {max}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">Hours: {(current / 2).toFixed(1)}</div>
                                                <WorkloadBar current={current} max={max} />
                                            </td>
                                        )
                                    })}
                                    
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-light dark:text-gray-400 max-w-xs truncate">
                                        {teacher.specialties.join(', ')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <button onClick={() => setTeacherForReport(teacher)} className="text-brand-primary hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300" title="Generate Workload Report">
                                            <DocumentChartBarIcon className="h-6 w-6" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {sortedAndFilteredTeachers.length === 0 && (
                    <div className="text-center py-10 text-brand-text-light dark:text-gray-400">
                        No teachers found matching your search.
                    </div>
                )}
            </div>
        </div>
        {teacherForReport && (
            <WorkloadReportModal
                isOpen={!!teacherForReport}
                onClose={() => setTeacherForReport(null)}
                teacher={teacherForReport}
                setTeachers={setTeachers}
                teachers={teachers}
                workload={workloads.get(teacherForReport.id)}
                academicStructure={academicStructure}
                phaseStructures={phaseStructures}
                allocations={allocations}
                classGroups={classGroups}
                generalSettings={generalSettings}
                timeGrids={timeGrids}
                timetableHistory={timetableHistory}
            />
        )}
        </>
    );
};

export default AllocationTeacherDashboard;