

import React, { useMemo, useState, useEffect } from 'react';
import type { Teacher, ClassGroup, TeacherAllocation, Subject, AcademicStructure, TeacherWorkload, AllocationSettings, GeneralSettings, PhaseStructure, TimeGrid, TimetableHistoryEntry, Permission } from '../types';
import { AllocationRole, AllocationStrategy, SubjectCategory } from '../types';
import { SparklesIcon, ArrowDownTrayIcon, XMarkIcon, TrashIcon } from './Icons';
import AllocationCell from './AllocationCell';
import AllocationTeacherDashboard from './AllocationTeacherDashboard';
import TabButton from './TabButton';
import MultiSelectFilter from './MultiSelectFilter';
import { getSubjectPeriods } from '../App';
import ConfirmationModal from './ConfirmationModal';

interface AllocationsProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    classGroups: ClassGroup[];
    allocations: TeacherAllocation[];
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    setAllocations: React.Dispatch<React.SetStateAction<TeacherAllocation[]>>;
    teacherWorkloads: Map<string, TeacherWorkload>;
    allocationSettings: AllocationSettings;
    generalSettings: GeneralSettings;
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
}

type AllocationsTab = 'builder' | 'data';

const HIGHLIGHT_COLORS = [
    { dot: 'bg-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
    { dot: 'bg-green-400', bg: 'bg-green-100 dark:bg-green-900/40' },
    { dot: 'bg-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
    { dot: 'bg-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' },
    { dot: 'bg-teal-400', bg: 'bg-teal-100 dark:bg-teal-900/40' },
    { dot: 'bg-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' },
    { dot: 'bg-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/40' },
    { dot: 'bg-sky-400', bg: 'bg-sky-100 dark:bg-sky-900/40' },
    { dot: 'bg-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
    { dot: 'bg-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/40' },
    { dot: 'bg-lime-400', bg: 'bg-lime-100 dark:bg-lime-900/40' },
    { dot: 'bg-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-900/40' },
];

const getEffectiveLearnerCount = (subject: Subject, group: ClassGroup, allSubjectsInGroup: Subject[]): number => {
    if (subject.category === SubjectCategory.Elective && subject.electiveGroup) {
        const competingSubjects = allSubjectsInGroup.filter(
            s => s.category === SubjectCategory.Elective && s.electiveGroup === subject.electiveGroup && group.subjectIds.includes(s.id)
        );
        if (competingSubjects.length > 1) {
            return Math.ceil(group.learnerCount / competingSubjects.length);
        }
    }
    return group.learnerCount;
};

const Allocations: React.FC<AllocationsProps> = (props) => {
    const { teachers, setTeachers, classGroups, allocations, academicStructure, phaseStructures, setAllocations, teacherWorkloads, allocationSettings, generalSettings, timeGrids, timetableHistory, permissions, logAction } = props;
    const [activeTab, setActiveTab] = useState<AllocationsTab>('builder');
    const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
    
    const [filters, setFilters] = useState({
        curricula: [] as string[],
        grades: [] as string[],
        modes: [] as string[],
        subjects: [] as string[],
    });

    const { subjects, curricula, grades, modes } = academicStructure;
    const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
    
    const handleFilterChange = (filterName: keyof typeof filters, selectedValues: string[]) => {
        setFilters(prev => ({ ...prev, [filterName]: selectedValues }));
    };
    
    const filteredClassGroups = useMemo(() => {
        return classGroups.filter(cg => 
            (filters.curricula.length === 0 || filters.curricula.includes(cg.curriculum)) &&
            (filters.grades.length === 0 || filters.grades.includes(cg.grade)) &&
            (filters.modes.length === 0 || filters.modes.includes(cg.mode))
        );
    }, [classGroups, filters]);
    
    const matrixSubjects = useMemo(() => {
        const subjectIdSet = new Set<string>();
        filteredClassGroups.forEach(group => {
            group.subjectIds.forEach(id => subjectIdSet.add(id));
        });
        const allAvailableSubjects = Array.from(subjectIdSet).map(id => subjectMap.get(id)).filter((s): s is Subject => !!s)
        
        const filtered = filters.subjects.length > 0 
            ? allAvailableSubjects.filter(s => filters.subjects.includes(s.name))
            : allAvailableSubjects;

        return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredClassGroups, subjectMap, filters.subjects]);

    const teacherColorMap = useMemo(() => {
        const map = new Map<string, { dot: string, bg: string }>();
        teachers.forEach((teacher, index) => {
            map.set(teacher.id, HIGHLIGHT_COLORS[index % HIGHLIGHT_COLORS.length]);
        });
        return map;
    }, [teachers]);

    const handleUpdateAllocation = (classGroupId: string, subjectId: string, teacherId: string) => {
        setAllocations(prev => {
            const existingIndex = prev.findIndex(a => a.classGroupId === classGroupId && a.subjectId === subjectId);
            if (teacherId === 'unassigned') {
                return existingIndex > -1 ? prev.filter((_, i) => i !== existingIndex) : prev;
            }
            
            const newAllocation: TeacherAllocation = {
                id: `alloc-${classGroupId}-${subjectId}`,
                classGroupId,
                subjectId,
                teacherId,
                role: AllocationRole.Lead,
            };

            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newAllocation;
                return updated;
            } else {
                return [...prev, newAllocation];
            }
        });
    };
    
    const handleAutoAllocate = () => {
        // Create a map to track teachers' assigned grades in this allocation run
        const assignedGrades = new Map<string, Set<string>>();
        allocations.forEach(alloc => {
            const group = classGroups.find(g => g.id === alloc.classGroupId);
            if (group) {
                if (!assignedGrades.has(alloc.teacherId)) {
                    assignedGrades.set(alloc.teacherId, new Set());
                }
                assignedGrades.get(alloc.teacherId)!.add(group.grade);
            }
        });
        
        // Create a deep copy of workloads to simulate allocations
        const tempWorkloads = new Map<string, TeacherWorkload>();
        teachers.forEach(t => {
            const currentWorkload = teacherWorkloads.get(t.id);
            tempWorkloads.set(t.id, JSON.parse(JSON.stringify(currentWorkload || { totalPeriods: 0, totalLearners: 0, totalClasses: 0, periodsByMode: {} })));
        });

        const allocationsToCreate: { group: ClassGroup, subject: Subject }[] = [];
        const existingAllocationKeys = new Set(allocations.map(a => `${a.classGroupId}-${a.subjectId}`));

        filteredClassGroups.forEach(group => {
            group.subjectIds.forEach(subjectId => {
                const subject = subjectMap.get(subjectId);
                if (subject && matrixSubjects.find(ms => ms.id === subject.id) && !existingAllocationKeys.has(`${group.id}-${subjectId}`)) {
                   allocationsToCreate.push({ group, subject });
                }
            });
        });

        if (allocationsToCreate.length === 0) {
             alert('No unallocated subjects found in the current view to auto-allocate.');
             return;
        }
        
        // Sort by periods descending to allocate the "heaviest" classes first.
        allocationsToCreate.sort((a, b) => getSubjectPeriods(b.subject, b.group.curriculum, b.group.grade, b.group.mode) - getSubjectPeriods(a.subject, a.group.curriculum, a.group.grade, a.group.mode));

        const newAllocations: TeacherAllocation[] = [];

        allocationsToCreate.forEach(({ group, subject }) => {
            const qualifiedTeachers = teachers.filter(t =>
                t.specialties.includes(subject.name) && t.employmentStatus !== 'On Leave'
            );
            
            if (qualifiedTeachers.length > 0) {
                const subjectPeriods = getSubjectPeriods(subject, group.curriculum, group.grade, group.mode);
                const allSubjectsInGroup = group.subjectIds.map(id => subjectMap.get(id)!).filter(Boolean);
                const subjectLearners = getEffectiveLearnerCount(subject, group, allSubjectsInGroup);

                const getTeacherScore = (teacher: Teacher) => {
                    const current = tempWorkloads.get(teacher.id)!;
                    const projectedPeriods = current.totalPeriods + subjectPeriods;
                    
                    // PENALTY: Check against hard limits from teacher profile
                    const maxLearners = teacher.maxLearners;
                    const maxPeriodsForMode = teacher.maxPeriodsByMode[group.mode] || 0;
                    const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode).reduce((s, p) => s + p, 0);

                    let penalty = 0;
                    if (current.totalLearners + subjectLearners > maxLearners) penalty += 500;
                    if (maxPeriodsForMode > 0 && (current.periodsByMode[group.mode] || 0) + subjectPeriods > maxPeriodsForMode) penalty += 500;
                    if (totalMaxPeriods > 0 && projectedPeriods > totalMaxPeriods) penalty += 250;


                    // SCORE: Workload balance (lower is better)
                    const periodUtil = totalMaxPeriods > 0 ? (projectedPeriods / totalMaxPeriods) : 1;
                    const learnerUtil = maxLearners > 0 ? ((current.totalLearners + subjectLearners) / maxLearners) : 1;
                    let score = (periodUtil * 0.7) + (learnerUtil * 0.3); // Weight periods more

                    // PENALTY/BONUS: Grade Consolidation based on strategy
                    const teacherGrades = assignedGrades.get(teacher.id);
                    if (teacherGrades && teacherGrades.size > 0 && !teacherGrades.has(group.grade)) {
                        if (allocationSettings.strategy === AllocationStrategy.Strict) penalty += 200;
                        if (allocationSettings.strategy === AllocationStrategy.Balanced) penalty += 100;
                        if (allocationSettings.strategy === AllocationStrategy.Flexible) penalty += 10;
                    }

                    // PENALTY/BONUS: Preferred Grade
                    if (allocationSettings.prioritizePreferredGrades) {
                        if (teacher.preferredGrades?.includes(group.grade)) {
                            if (allocationSettings.strategy === AllocationStrategy.Strict) score -= 0.4;
                            if (allocationSettings.strategy === AllocationStrategy.Balanced) score -= 0.2;
                            if (allocationSettings.strategy === AllocationStrategy.Flexible) score -= 0.1;
                        }
                    }

                    return { teacher, score: score + penalty };
                };
                
                const scoredTeachers = qualifiedTeachers.map(getTeacherScore).sort((a, b) => a.score - b.score);
                
                const bestChoice = scoredTeachers[0];

                if (bestChoice) {
                    const bestTeacher = bestChoice.teacher;

                    newAllocations.push({
                        id: `alloc-${group.id}-${subject.id}`,
                        teacherId: bestTeacher.id,
                        classGroupId: group.id,
                        subjectId: subject.id,
                        role: AllocationRole.Lead,
                    });
                    
                    // Update temp data for next iteration
                    const tempTeacherWorkload = tempWorkloads.get(bestTeacher.id)!;
                    tempTeacherWorkload.totalPeriods += subjectPeriods;
                    
                    // Only add learner count if the teacher isn't already in this class group
                    const isNewGroupForTeacher = ![...assignedGrades.get(bestTeacher.id) || []].includes(group.grade);
                    if (isNewGroupForTeacher) {
                         tempTeacherWorkload.totalLearners += group.learnerCount;
                         tempTeacherWorkload.totalClasses += 1;
                    }
                   
                    tempTeacherWorkload.periodsByMode[group.mode] = (tempTeacherWorkload.periodsByMode[group.mode] || 0) + subjectPeriods;
                    
                    if (!assignedGrades.has(bestTeacher.id)) {
                        assignedGrades.set(bestTeacher.id, new Set());
                    }
                    assignedGrades.get(bestTeacher.id)!.add(group.grade);
                }
            }
        });

        if (newAllocations.length > 0) {
            setAllocations(prev => [...prev, ...newAllocations]);
            alert(`Successfully created ${newAllocations.length} new allocations based on your settings.`);
        } else {
            alert('No unallocated subjects could be matched with a qualified teacher based on your settings.');
        }
    };

    const handleClearVisible = () => {
        if (window.confirm("Are you sure you want to clear all allocations currently visible in the matrix? This action will unassign all teachers in view.")) {
            const visibleCellKeys = new Set<string>();
            filteredClassGroups.forEach(group => {
                const visibleSubjectIds = group.subjectIds.filter(sid => matrixSubjects.some(s => s.id === sid));
                visibleSubjectIds.forEach(subjectId => {
                    visibleCellKeys.add(`${group.id}-${subjectId}`);
                });
            });
    
            const allocationsToClearCount = allocations.filter(alloc => visibleCellKeys.has(`${alloc.classGroupId}-${alloc.subjectId}`)).length;
            
            if (allocationsToClearCount === 0) {
                alert("No allocated cells found in the current view to clear.");
                return;
            }
            
            const updatedAllocations = allocations.filter(alloc => !visibleCellKeys.has(`${alloc.classGroupId}-${alloc.subjectId}`));
            
            setAllocations(updatedAllocations);
            alert(`Cleared ${allocationsToClearCount} visible allocations.`);
        }
    };
    
    const handleResetAllAllocations = () => {
        setAllocations([]);
        setIsResetAllModalOpen(false);
    }
    
    const handleResetFilters = () => {
        setFilters({
            curricula: [] as string[],
            grades: [] as string[],
            modes: [] as string[],
            subjects: [] as string[],
        });
    };

    const renderBuilder = () => (
        <div className="bg-white dark:bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Allocation Matrix</h3>
                    <div className="flex items-center mt-1">
                        <span className="px-2 py-0.5 text-xs font-semibold text-brand-gold bg-yellow-100 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full">
                            {filteredClassGroups.length} classes &bull; {matrixSubjects.length} subjects
                        </span>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                     <button onClick={handleResetFilters} className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-2">
                        <XMarkIcon className="h-4 w-4" />
                        Reset View
                    </button>
                    <button onClick={handleClearVisible} className="px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 flex items-center gap-2" title="Clear visible allocations">
                        <XMarkIcon className="h-4 w-4" />
                        Clear Allocations
                    </button>
                     <button onClick={() => setIsResetAllModalOpen(true)} className="px-3 py-1.5 text-sm font-semibold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800/50 rounded-md hover:bg-red-200 dark:hover:bg-red-900/80 flex items-center gap-2" title="Reset all allocations">
                        <TrashIcon className="h-4 w-4" />
                        Reset All
                    </button>
                    <button onClick={handleAutoAllocate} className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-navy rounded-md hover:bg-slate-800 dark:bg-brand-primary dark:hover:bg-rose-900 flex items-center gap-2">
                        <SparklesIcon className="h-4 w-4" />
                        Auto-Allocate
                    </button>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-4 p-3 border-y dark:border-slate-700">
                <MultiSelectFilter label="Curricula" options={curricula.map(c => ({ id: c, name: c }))} selected={filters.curricula} onChange={(s) => handleFilterChange('curricula', s)} />
                <MultiSelectFilter label="Grades" options={grades.map(g => ({ id: g, name: g }))} selected={filters.grades} onChange={(s) => handleFilterChange('grades', s)} />
                <MultiSelectFilter label="Modes" options={modes.map(m => ({ id: m, name: m }))} selected={filters.modes} onChange={(s) => handleFilterChange('modes', s)} />
                <MultiSelectFilter label="Subjects" options={subjects.map(s => ({id: s.name, name: s.name})).sort((a,b) => a.name.localeCompare(b.name))} selected={filters.subjects} onChange={(s) => handleFilterChange('subjects', s)} />
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th scope="col" className="sticky left-0 bg-gray-50 dark:bg-slate-700/50 px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 w-48 z-10">Class</th>
                            {matrixSubjects.map(subject => (
                                <th key={subject.id} scope="col" className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300 min-w-[280px]">
                                    {subject.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                       {filteredClassGroups.map(group => {
                           const totalPeriods = group.subjectIds
                                .map(id => subjectMap.get(id))
                                .reduce((sum, subject) => sum + (subject ? getSubjectPeriods(subject, group.curriculum, group.grade, group.mode) : 0), 0);
                           return (
                               <tr key={group.id}>
                                   <td className="sticky left-0 bg-white dark:bg-slate-800 px-4 py-3 font-semibold text-gray-800 dark:text-gray-200 w-48 border-r dark:border-slate-700 z-10">
                                       <div>{group.name}</div>
                                       <div className="font-normal text-xs text-gray-500 dark:text-gray-400">{group.curriculum}</div>
                                       <div className="font-normal text-xs text-gray-400 dark:text-gray-500 flex justify-between">
                                          <span>{group.mode}</span>
                                          {totalPeriods > 0 && <span className="font-semibold">{totalPeriods}p total</span>}
                                       </div>
                                   </td>
                                   {matrixSubjects.map(subject => (
                                       <td key={subject.id} className="px-2 py-2 align-top border-r dark:border-slate-700">
                                           {group.subjectIds.includes(subject.id) ? (
                                               <AllocationCell 
                                                    classGroup={group}
                                                    subject={subject}
                                                    allocations={allocations}
                                                    teachers={teachers}
                                                    teacherWorkloads={teacherWorkloads}
                                                    onUpdate={handleUpdateAllocation}
                                                    teacherColorMap={teacherColorMap}
                                                    subjectMap={subjectMap}
                                                    permissions={permissions}
                                               />
                                           ) : (
                                               <div className="h-full w-full bg-gray-50 dark:bg-slate-800/30"></div>
                                           )}
                                       </td>
                                   ))}
                               </tr>
                           );
                       })}
                    </tbody>
                </table>
                 {classGroups.length > 0 && filteredClassGroups.length === 0 && (
                     <div className="text-center py-20 text-brand-text-light dark:text-gray-400">
                        No class groups match your current filter selection.
                    </div>
                 )}
                 {classGroups.length === 0 && (
                    <div className="text-center py-20 text-brand-text-light dark:text-gray-400">
                        No class groups have been created.
                        <p className="text-xs mt-1">Please add class groups and subjects in Settings to begin building your allocation matrix.</p>
                    </div>
                 )}
            </div>
        </div>
    );


    return (
        <>
            <div className="space-y-4">
                <div className="bg-gray-100 dark:bg-slate-800/50 p-1 rounded-lg self-start flex w-min">
                    <TabButton label="Allocation Builder" tabId="builder" activeTab={activeTab} setActiveTab={setActiveTab as (tab: string) => void} />
                    <TabButton label="Data" tabId="data" activeTab={activeTab} setActiveTab={setActiveTab as (tab: string) => void} />
                </div>

                {activeTab === 'builder' && renderBuilder()}
                {activeTab === 'data' && (
                    <AllocationTeacherDashboard 
                        teachers={teachers} 
                        setTeachers={setTeachers}
                        workloads={teacherWorkloads}
                        subjects={subjects}
                        academicStructure={academicStructure}
                        phaseStructures={phaseStructures}
                        allocations={allocations}
                        classGroups={classGroups}
                        generalSettings={generalSettings}
                        timeGrids={timeGrids}
                        timetableHistory={timetableHistory}
                    />
                )}
            </div>
            
            {isResetAllModalOpen && (
                <ConfirmationModal
                    isOpen={isResetAllModalOpen}
                    onClose={() => setIsResetAllModalOpen(false)}
                    onConfirm={handleResetAllAllocations}
                    title="Reset All Allocations"
                    message="Are you sure you want to unassign ALL teachers from ALL subjects? This action will clear the entire allocation table and cannot be undone."
                    confirmButtonText="Yes, Reset All"
                />
            )}
        </>
    );
};

export default Allocations;