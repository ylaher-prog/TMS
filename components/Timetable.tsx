import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { TimeGrid, TimeConstraint, GeneratedTimetable, Teacher, ClassGroup, TeacherAllocation, AcademicStructure, TimetablePeriod, GeneratedSlot, Subject, TimetableHistoryEntry, Conflict, LessonDefinition, Permission } from '../types';
import TabButton from './TabButton';
import { PlusIcon, TrashIcon, XMarkIcon, SparklesIcon, PencilIcon, ArrowDownTrayIcon, CheckIcon, CheckCircleIcon, InformationCircleIcon } from './Icons';
import { getSubjectPeriods } from '../App';
import { SubjectCategory } from '../types';
import ConfirmationModal from './ConfirmationModal';
import AddEditConstraintModal from './AddEditConstraintModal';
import { TIME_GRID_COLORS } from '../constants';
import { hasPermission } from '../permissions';
import { formatLogDetails } from '../utils/logging';
import ConstraintAnalysisModal from './ConstraintAnalysisModal';


// Props for the main Timetable component and subcomponents
interface TimetableProps {
    timeGrids: TimeGrid[];
    setTimeGrids: React.Dispatch<React.SetStateAction<TimeGrid[]>>;
    timeConstraints: TimeConstraint[];
    setTimeConstraints: React.Dispatch<React.SetStateAction<TimeConstraint[]>>;
    timetableHistory: TimetableHistoryEntry[];
    setTimetableHistory: React.Dispatch<React.SetStateAction<TimetableHistoryEntry[]>>;
    teachers: Teacher[];
    classGroups: ClassGroup[];
    setClassGroups: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
    allocations: TeacherAllocation[];
    academicStructure: AcademicStructure;
    currentAcademicYear: string;
    permissions: Permission[];
    logAction: (action: string, details: string) => void;
}

type TimetableTab = 'grids' | 'classRules' | 'teacherAvailability' | 'generalConstraints' | 'generator' | 'viewer';

const TimeGridsComponent: React.FC<Pick<TimetableProps, 'timeGrids' | 'setTimeGrids' | 'permissions' | 'academicStructure'>> = ({ timeGrids, setTimeGrids, permissions, academicStructure }) => {
    const [gridToDelete, setGridToDelete] = useState<TimeGrid | null>(null);
    const [isAddGridOpen, setIsAddGridOpen] = useState(false);
    const addGridButtonRef = useRef<HTMLDivElement>(null);
    const canEdit = hasPermission(permissions, 'setup:timetable-grids');

    const assignedGridNames = useMemo(() => new Set(timeGrids.map(g => g.name)), [timeGrids]);
    const unassignedModes = useMemo(() => academicStructure.modes.filter(m => !assignedGridNames.has(m)), [academicStructure.modes, assignedGridNames]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addGridButtonRef.current && !addGridButtonRef.current.contains(event.target as Node)) {
                setIsAddGridOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddGrid = (modeName: string) => {
        const newGrid: TimeGrid = {
            id: `grid-${Date.now()}`,
            name: modeName,
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            periods: [],
            color: TIME_GRID_COLORS[timeGrids.length % TIME_GRID_COLORS.length],
        };
        setTimeGrids(prev => [...prev, newGrid]);
        setIsAddGridOpen(false);
    };

    const handleUpdateGrid = (gridId: string, updates: Partial<TimeGrid>) => {
        setTimeGrids(prev => prev.map(g => g.id === gridId ? { ...g, ...updates } : g));
    };

    const handleDeleteGrid = () => {
        if (gridToDelete) {
            setTimeGrids(prev => prev.filter(g => g.id !== gridToDelete.id));
            setGridToDelete(null);
        }
    };

    const handleAddPeriod = (gridId: string) => {
        const newPeriod: TimetablePeriod = {
            id: `p-${Date.now()}`,
            name: 'New Period',
            startTime: '00:00',
            endTime: '00:00',
            type: 'Lesson',
        };
        const grid = timeGrids.find(g => g.id === gridId);
        if (grid) {
            handleUpdateGrid(gridId, { periods: [...grid.periods, newPeriod] });
        }
    };
    
    const handleUpdatePeriod = (gridId: string, periodId: string, field: keyof TimetablePeriod, value: string) => {
        const grid = timeGrids.find(g => g.id === gridId);
        if(grid) {
            const updatedPeriods = grid.periods.map(p => 
                p.id === periodId ? {...p, [field]: value} : p
            );
            handleUpdateGrid(gridId, { periods: updatedPeriods });
        }
    };
    
    const handleDeletePeriod = (gridId: string, periodId: string) => {
         const grid = timeGrids.find(g => g.id === gridId);
        if(grid) {
            const updatedPeriods = grid.periods.filter(p => p.id !== periodId);
            handleUpdateGrid(gridId, { periods: updatedPeriods });
        }
    };

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Time Grids</h3>
                    <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Define the weekly schedules for each academic mode.</p>
                </div>
                {canEdit && (
                    <div className="relative" ref={addGridButtonRef}>
                        <button onClick={() => setIsAddGridOpen(p => !p)} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors">
                            <PlusIcon className="w-4 h-4" />
                            <span>Add Time Grid</span>
                        </button>
                        {isAddGridOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border dark:border-slate-700">
                                {unassignedModes.length > 0 ? (
                                    unassignedModes.map(mode => (
                                        <button key={mode} onClick={() => handleAddGrid(mode)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700">
                                            For {mode}
                                        </button>
                                    ))
                                ) : (
                                    <p className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">All modes have grids.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {timeGrids.map(grid => (
                    <div key={grid.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: grid.color }}></div>
                                <h4 className="text-lg font-semibold text-brand-text-dark dark:text-white">{grid.name}</h4>
                            </div>
                            {canEdit && (
                                <button onClick={() => setGridToDelete(grid)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete Grid">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        
                        <div>
                            <h4 className="text-sm font-semibold mb-2">Working Days</h4>
                            <div className="flex flex-wrap gap-2">
                                {weekDays.map(day => {
                                    const isSelected = grid.days.includes(day);
                                    return (
                                        <button
                                            key={day}
                                            type="button"
                                            disabled={!canEdit}
                                            onClick={() => {
                                                const newDays = grid.days.includes(day)
                                                    ? grid.days.filter(d => d !== day)
                                                    : [...grid.days, day];
                                                handleUpdateGrid(grid.id, { days: newDays });
                                            }}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border disabled:opacity-70 disabled:cursor-not-allowed
                                                ${isSelected
                                                    ? 'bg-brand-magenta border-brand-magenta text-white'
                                                    : 'bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                                                }`
                                            }
                                        >
                                            {day}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                             <h4 className="text-sm font-semibold mb-2">Periods</h4>
                             <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                                {grid.periods.map(period => (
                                    <div key={period.id} className={`flex items-center gap-2 p-2 rounded-lg ${period.type === 'Lesson' ? 'bg-sky-50 dark:bg-sky-900/30' : 'bg-amber-50 dark:bg-amber-900/30'}`}>
                                        <input
                                            type="text"
                                            value={period.name ?? ''}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'name', e.target.value)}
                                            placeholder="Period Name"
                                            className="flex-grow p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary disabled:opacity-70"
                                            disabled={!canEdit}
                                        />
                                        <input
                                            type="time"
                                            value={period.startTime ?? ''}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'startTime', e.target.value)}
                                            className="w-28 p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary disabled:opacity-70"
                                            disabled={!canEdit}
                                        />
                                        <input
                                            type="time"
                                            value={period.endTime ?? ''}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'endTime', e.target.value)}
                                            className="w-28 p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary disabled:opacity-70"
                                            disabled={!canEdit}
                                        />
                                        <select
                                            value={period.type ?? 'Lesson'}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'type', e.target.value)}
                                            className="w-32 p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary disabled:opacity-70"
                                            disabled={!canEdit}
                                        >
                                            <option value="Lesson">Lesson</option>
                                            <option value="Break">Break</option>
                                        </select>
                                        {canEdit && (
                                            <button
                                                onClick={() => handleDeletePeriod(grid.id, period.id)}
                                                className="text-gray-400 hover:text-red-500 p-2"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                             </div>
                             {canEdit && <button onClick={() => handleAddPeriod(grid.id)} className="mt-3 text-sm font-semibold text-brand-primary hover:text-rose-800 dark:text-rose-400">+ Add Period</button>}
                        </div>
                    </div>
                ))}
            </div>

            {gridToDelete && (
                <ConfirmationModal
                    isOpen={!!gridToDelete}
                    onClose={() => setGridToDelete(null)}
                    onConfirm={handleDeleteGrid}
                    title="Delete Time Grid"
                    message={`Are you sure you want to delete "${gridToDelete.name}"? This could affect class groups that are assigned to it.`}
                />
            )}
        </div>
    );
};

const ELECTIVE_GROUP_COLORS = [
    { bg: 'bg-blue-50', text: 'text-blue-800', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-200' },
    { bg: 'bg-purple-50', text: 'text-purple-800', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-200' },
    { bg: 'bg-teal-50', text: 'text-teal-800', darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-200' },
    { bg: 'bg-orange-50', text: 'text-orange-800', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-200' },
    { bg: 'bg-pink-50', text: 'text-pink-800', darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-800', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-200' },
];

const LessonDefinitionRow: React.FC<{
    definition: LessonDefinition;
    onUpdate: (id: string, updates: Partial<LessonDefinition>) => void;
    onDelete: (id: string) => void;
    disabled: boolean;
}> = ({ definition, onUpdate, onDelete, disabled }) => {
    return (
        <div className="flex items-center gap-2 text-sm">
            <input 
                type="number"
                value={definition.count}
                onChange={e => onUpdate(definition.id, { count: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-20 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-center disabled:opacity-70"
                disabled={disabled}
            />
            <span>x</span>
            <input 
                type="number"
                value={definition.duration}
                onChange={e => onUpdate(definition.id, { duration: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-20 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-center disabled:opacity-70"
                disabled={disabled}
            />
            <span>periods</span>
            {!disabled && <button onClick={() => onDelete(definition.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>}
        </div>
    );
};


const SubjectRuleRow: React.FC<{
    subjects: Subject[];
    classGroup: ClassGroup;
    rule: Extract<TimeConstraint, { type: 'subject-rule' }> | undefined;
    onRuleChange: (classGroupId: string, subjectIds: string[], updatedRules: Partial<Extract<TimeConstraint, { type: 'subject-rule' }>['rules']>) => void;
    colorClasses: typeof ELECTIVE_GROUP_COLORS[0] | null;
    disabled: boolean;
}> = ({ subjects, classGroup, rule, onRuleChange, colorClasses, disabled }) => {
    const mainSubject = subjects[0];
    const subjectIds = subjects.map(s => s.id);

    const totalPeriods = getSubjectPeriods(mainSubject, classGroup.curriculum, classGroup.grade, classGroup.mode);
    
    const lessonDefs = rule?.rules.lessonDefinitions || [];
    const calculatedPeriods = lessonDefs.reduce((sum, def) => sum + (def.count * def.duration), 0);
    const sumMatches = calculatedPeriods === totalPeriods && totalPeriods > 0;
    
    const updateDefinitions = (newDefs: LessonDefinition[]) => {
        onRuleChange(classGroup.id, subjectIds, { lessonDefinitions: newDefs });
    };

    const handleAddDefinition = () => {
        const newDef: LessonDefinition = { id: `def-${Date.now()}`, count: 1, duration: 1 };
        updateDefinitions([...lessonDefs, newDef]);
    };
    
    const handleUpdateDefinition = (id: string, updates: Partial<LessonDefinition>) => {
        updateDefinitions(lessonDefs.map(d => d.id === id ? { ...d, ...updates } : d));
    };

    const handleDeleteDefinition = (id: string) => {
        updateDefinitions(lessonDefs.filter(d => d.id !== id));
    };
    
    return (
        <div className={`p-2 rounded-lg border dark:border-slate-700 ${colorClasses?.bg} ${colorClasses?.darkBg} transition-colors ${sumMatches ? 'border-green-200 dark:border-green-800' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
                <h5 className={`font-semibold text-sm ${colorClasses?.text} ${colorClasses?.darkText}`}>{subjects.map(s => s.name).join(' / ')}</h5>
                <div className={`p-1.5 rounded-md inline-block text-center ${sumMatches ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Calculated / Total</span>
                    <p className={`font-bold ${sumMatches ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {calculatedPeriods} / {totalPeriods}
                    </p>
                </div>
            </div>

            <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Lesson Distribution</label>
                <div className="space-y-1">
                    {lessonDefs.map(def => (
                        <LessonDefinitionRow key={def.id} definition={def} onUpdate={handleUpdateDefinition} onDelete={handleDeleteDefinition} disabled={disabled}/>
                    ))}
                </div>
                {!disabled && <button onClick={handleAddDefinition} className="text-xs font-semibold text-brand-primary mt-1">+ Add Definition</button>}
            </div>

            <div className="mt-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block">Placement Constraints</label>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1 text-sm">
                    <div className="flex items-center gap-2">
                        <label className="text-gray-600 dark:text-gray-300 text-xs">Min Days Apart:</label>
                         <input
                            type="number" min="0" value={rule?.rules.minDaysApart ?? 0}
                            onChange={e => onRuleChange(classGroup.id, subjectIds, { minDaysApart: parseInt(e.target.value) || 0 })}
                            className="w-16 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 disabled:opacity-70 text-center"
                            disabled={disabled} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-gray-600 dark:text-gray-300 text-xs">Max Periods/Day:</label>
                        <input type="number" min="0" placeholder="None" value={rule?.rules.maxPeriodsPerDay ?? ''}
                            onChange={e => onRuleChange(classGroup.id, subjectIds, { maxPeriodsPerDay: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-16 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 disabled:opacity-70 text-center"
                            disabled={disabled} />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-gray-600 dark:text-gray-300 text-xs">Max Consecutive:</label>
                        <input type="number" min="0" placeholder="None" value={rule?.rules.maxConsecutive ?? ''}
                            onChange={e => onRuleChange(classGroup.id, subjectIds, { maxConsecutive: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-16 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 disabled:opacity-70 text-center"
                            disabled={disabled} />
                    </div>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={rule?.rules.mustBeEveryDay ?? false}
                            onChange={e => onRuleChange(classGroup.id, subjectIds, { mustBeEveryDay: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary disabled:opacity-70"
                            disabled={disabled} />
                        <span className="text-xs">Must be every day</span>
                    </label>
                    <div className="flex items-center gap-2">
                        <label className="text-gray-600 dark:text-gray-300 text-xs">Preferred Time:</label>
                        <select value={rule?.rules.preferredTime ?? 'any'}
                            onChange={e => onRuleChange(classGroup.id, subjectIds, { preferredTime: e.target.value as 'any' | 'morning' | 'afternoon' })}
                            className="p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-xs disabled:opacity-70"
                            disabled={disabled} >
                            <option value="any">Any</option>
                            <option value="morning">Morning</option>
                            <option value="afternoon">Afternoon</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};


const ClassGroupRuleTable: React.FC<{
    classGroup: ClassGroup;
    subjectRules: Extract<TimeConstraint, {type: 'subject-rule'}>[];
    subjectMap: Map<string, Subject>;
    timeGridMap: Map<string, TimeGrid>;
    onRuleChange: (classGroupId: string, subjectIds: string[], updatedRules: Partial<Extract<TimeConstraint, { type: 'subject-rule' }>['rules']>) => void;
    disabled: boolean;
}> = ({ classGroup, subjectRules, subjectMap, timeGridMap, onRuleChange, disabled }) => {
    
    const assignedGrid = timeGridMap.get(classGroup.timeGridId || '');

    const { core, electivesByGroup } = useMemo(() => {
        const core: Subject[] = [];
        const electives: Record<string, Subject[]> = {};
        classGroup.subjectIds.forEach(id => {
            const subject = subjectMap.get(id);
            if (subject) {
                if (subject.category === SubjectCategory.Elective && subject.electiveGroup) {
                    if (!electives[subject.electiveGroup]) electives[subject.electiveGroup] = [];
                    electives[subject.electiveGroup].push(subject);
                } else {
                    core.push(subject);
                }
            }
        });
        return { core: core.sort((a,b) => a.name.localeCompare(b.name)), electivesByGroup: electives };
    }, [classGroup.subjectIds, subjectMap]);

    const electiveGroupColorMap = useMemo(() => {
        const map = new Map<string, typeof ELECTIVE_GROUP_COLORS[0]>();
        Object.keys(electivesByGroup).sort().forEach((groupName, i) => {
            map.set(groupName, ELECTIVE_GROUP_COLORS[i % ELECTIVE_GROUP_COLORS.length]);
        });
        return map;
    }, [electivesByGroup]);

    return (
        <div>
            {assignedGrid ? (
                 <div className="mt-2 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {core.map((subject) => (
                        <SubjectRuleRow
                            key={subject.id}
                            subjects={[subject]}
                            classGroup={classGroup}
                            rule={subjectRules.find(r => r.classGroupId === classGroup.id && r.subjectId === subject.id)}
                            onRuleChange={onRuleChange}
                            colorClasses={null}
                            disabled={disabled}
                        />
                    ))}
                    {Object.entries(electivesByGroup).map(([groupName, subjectsInGroup]) => (
                        <SubjectRuleRow
                            key={groupName}
                            subjects={subjectsInGroup}
                            classGroup={classGroup}
                            rule={subjectRules.find(r => r.classGroupId === classGroup.id && r.subjectId === subjectsInGroup[0].id)}
                            onRuleChange={onRuleChange}
                            colorClasses={electiveGroupColorMap.get(groupName) || null}
                            disabled={disabled}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-yellow-600 text-sm p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">Please assign a Time Grid to this class group to set subject distribution rules.</p>
            )}
        </div>
    );
};


const ClassGroupRulesComponent: React.FC<TimetableProps> = ({ classGroups, setClassGroups, academicStructure, timeConstraints, setTimeConstraints, timeGrids, currentAcademicYear, permissions }) => {
    const canEdit = hasPermission(permissions, 'setup:timetable-rules');
    // State for bulk assignment
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [gridToApply, setGridToApply] = useState<string>(timeGrids[0]?.id || '');

    // State for accordions
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    
    // State for copy-rules dropdowns
    const [copySources, setCopySources] = useState<Record<string, string>>({});

    // Memos
    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);
    const timeGridMap = useMemo(() => new Map(timeGrids.map(tg => [tg.id, tg])), [timeGrids]);
    const subjectRules = useMemo(() => 
        timeConstraints.filter(c => c.type === 'subject-rule') as Extract<TimeConstraint, {type: 'subject-rule'}>[],
        [timeConstraints]
    );

    const groupedClassGroups = useMemo(() => {
        return classGroups.reduce((acc, group) => {
            const { curriculum, grade } = group;
            if (!acc[curriculum]) acc[curriculum] = {};
            if (!acc[curriculum][grade]) acc[curriculum][grade] = [];
            acc[curriculum][grade].push(group);
            return acc;
        }, {} as Record<string, Record<string, ClassGroup[]>>);
    }, [classGroups]);
    
    // Pre-populate subject rules on component load
    useEffect(() => {
        if (!canEdit) return;

        const newOrUpdatedConstraints: TimeConstraint[] = [];
        const currentSubjectRules = timeConstraints.filter(c => c.type === 'subject-rule') as Extract<TimeConstraint, {type: 'subject-rule'}>[];

        classGroups.forEach(cg => {
            const groupedElectives: Record<string, Subject[]> = {};
            const coreSubjects: Subject[] = [];
            
            cg.subjectIds.forEach(sid => {
                const subject = subjectMap.get(sid);
                if (subject) {
                    if (subject.category === SubjectCategory.Elective && subject.electiveGroup) {
                        if (!groupedElectives[subject.electiveGroup]) groupedElectives[subject.electiveGroup] = [];
                        groupedElectives[subject.electiveGroup].push(subject);
                    } else {
                        coreSubjects.push(subject);
                    }
                }
            });

            const processSubjects = (subjects: Subject[]) => {
                if (subjects.length === 0) return;
                const representativeSubjectId = subjects[0].id;
                const existingRule = currentSubjectRules.find(r => r.classGroupId === cg.id && r.subjectId === representativeSubjectId);
                
                if (!existingRule) {
                    const subject = subjectMap.get(representativeSubjectId);
                    if (!subject) return;
                    const totalPeriods = getSubjectPeriods(subject, cg.curriculum, cg.grade, cg.mode);
                    
                    const newRule: TimeConstraint = {
                        id: `sr-${cg.id}-${representativeSubjectId}`,
                        type: 'subject-rule',
                        classGroupId: cg.id,
                        subjectId: representativeSubjectId,
                        academicYear: currentAcademicYear,
                        rules: { 
                            lessonDefinitions: totalPeriods > 0 ? [{ id: `def-${cg.id}-${representativeSubjectId}`, count: totalPeriods, duration: 1 }] : [],
                            minDaysApart: 0,
                        }
                    };
                    newOrUpdatedConstraints.push(newRule);
                }
            };

            coreSubjects.forEach(s => processSubjects([s]));
            Object.values(groupedElectives).forEach(group => processSubjects(group));
        });

        if (newOrUpdatedConstraints.length > 0) {
            setTimeConstraints(prev => {
                const constraintsMap = new Map(prev.map(c => [c.id, c]));
                newOrUpdatedConstraints.forEach(c => constraintsMap.set(c.id, c));
                return Array.from(constraintsMap.values());
            });
        }
    }, [classGroups, timeConstraints, subjectMap, setTimeConstraints, currentAcademicYear, canEdit]);

    // Bulk Assignment Handlers
    const handleSelectGroup = (groupId: string) => {
        setSelectedGroupIds(prev => 
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedGroupIds(e.target.checked ? classGroups.map(cg => cg.id) : []);
    };
    
    const handleApplyGridToSelected = () => {
        if (!gridToApply || selectedGroupIds.length === 0) return;
        setClassGroups(prev => prev.map(cg => 
            selectedGroupIds.includes(cg.id) ? { ...cg, timeGridId: gridToApply } : cg
        ));
        setSelectedGroupIds([]);
    };

    const handleAutoAssign = () => {
        const modeToGridIdMap = new Map(timeGrids.map(g => [g.name, g.id]));
        const updatedGroups = classGroups.map(cg => {
            const gridId = modeToGridIdMap.get(cg.mode);
            if (gridId && cg.timeGridId !== gridId) {
                return { ...cg, timeGridId: gridId };
            }
            return cg;
        });
        setClassGroups(updatedGroups);
        alert('Time grids have been auto-assigned to class groups based on their mode.');
    };

    const isAllSelected = classGroups.length > 0 && selectedGroupIds.length === classGroups.length;

    // Accordion handler
    const toggleExpand = useCallback((key: string) => {
        setExpandedKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) newSet.delete(key);
            else newSet.add(key);
            return newSet;
        });
    }, []);

    // Rule change handler
    const handleRuleChange = useCallback((classGroupId: string, subjectIds: string[], updatedRules: Partial<Extract<TimeConstraint, { type: 'subject-rule' }>['rules']>) => {
        setTimeConstraints(prev => {
            const constraintsMap = new Map(prev.map(c => [c.id, c]));
            
            const representativeSubjectId = subjectIds[0];
            const existingRule = prev.find(c => c.type === 'subject-rule' && c.classGroupId === classGroupId && c.subjectId === representativeSubjectId) as Extract<TimeConstraint, { type: 'subject-rule' }> | undefined;
            
            if (existingRule) {
                constraintsMap.set(existingRule.id, { ...existingRule, rules: { ...existingRule.rules, ...updatedRules }});
            } else {
                const newId = `sr-${classGroupId}-${representativeSubjectId}`;
                const emptyRule: Extract<TimeConstraint, { type: 'subject-rule' }>['rules'] = { lessonDefinitions: [], minDaysApart: 0 };
                constraintsMap.set(newId, { id: newId, type: 'subject-rule', classGroupId, subjectId: representativeSubjectId, academicYear: currentAcademicYear, rules: { ...emptyRule, ...updatedRules } });
            }
            return Array.from(constraintsMap.values());
        });
    }, [setTimeConstraints, currentAcademicYear]);
    
    const handleCopyRules = (targetGroupId: string, sourceGroupId: string | undefined) => {
        if (!sourceGroupId) {
            alert("Please select a class group to copy rules from.");
            return;
        }
        
        const sourceRules = timeConstraints.filter(c => c.type === 'subject-rule' && c.classGroupId === sourceGroupId) as Extract<TimeConstraint, {type: 'subject-rule'}>[];
        
        if (sourceRules.length === 0) {
            alert("The selected source group has no rules to copy.");
            return;
        }

        const targetGroup = classGroups.find(cg => cg.id === targetGroupId);
        if(!targetGroup) return;
        
        const targetSubjectIds = new Set(targetGroup.subjectIds);
        const sourceGroup = classGroups.find(cg => cg.id === sourceGroupId);

        const newConstraints = new Map(timeConstraints.map(c => [c.id, c]));

        sourceRules.forEach(sourceRule => {
            if (targetSubjectIds.has(sourceRule.subjectId)) {
                const newRule: TimeConstraint = {
                    ...sourceRule,
                    id: `sr-${targetGroupId}-${sourceRule.subjectId}`,
                    classGroupId: targetGroupId,
                };
                newConstraints.set(newRule.id, newRule);
            }
        });
        
        setTimeConstraints(Array.from(newConstraints.values()));
        alert(`Copied rules from ${sourceGroup?.name} to ${targetGroup.name}.`);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">1. Assign Time Grids to Class Groups</h3>
                <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">A time grid must be assigned to set subject distribution rules below.</p>
                {canEdit && (
                    <div className="flex flex-col sm:flex-row gap-4 items-center p-3 border dark:border-slate-700 rounded-md">
                        <select value={gridToApply} onChange={e => setGridToApply(e.target.value)} className="w-full sm:w-auto flex-grow p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                            {timeGrids.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
                        </select>
                        <button onClick={handleApplyGridToSelected} disabled={selectedGroupIds.length === 0} className="w-full sm:w-auto bg-brand-primary text-white px-4 py-2 rounded-md font-medium disabled:opacity-50">Apply to Selected ({selectedGroupIds.length})</button>
                        <button onClick={handleAutoAssign} className="w-full sm:w-auto bg-brand-navy text-white px-4 py-2 rounded-md font-medium hover:bg-slate-700 dark:bg-brand-accent dark:hover:bg-amber-700">Auto-assign by Mode</button>
                    </div>
                )}
                <div className="max-h-60 overflow-y-auto mt-4 border dark:border-slate-700 rounded-md">
                     <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                {canEdit && <th className="p-2"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll}/></th>}
                                <th className="p-2 text-left font-semibold">Class Group</th>
                                <th className="p-2 text-left font-semibold">Assigned Grid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classGroups.map(cg => {
                                const assignedGrid = timeGridMap.get(cg.timeGridId || '');
                                return (
                                <tr key={cg.id} className="border-t dark:border-slate-700">
                                    {canEdit && <td className="p-2"><input type="checkbox" checked={selectedGroupIds.includes(cg.id)} onChange={() => handleSelectGroup(cg.id)}/></td>}
                                    <td className="p-2">{cg.name}</td>
                                    <td className="p-2">
                                        {assignedGrid ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: assignedGrid.color }}></div>
                                                <span>{assignedGrid.name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-yellow-500">Unassigned</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                 <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">2. Set Subject-Specific Rules</h3>
                 <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">Configure period distribution and consecutive lesson limits for each subject within its class group.</p>
                <div className="space-y-2 mt-4">
                    {Object.entries(groupedClassGroups).map(([curriculum, grades]) => {
                        const curriculumKey = `curr_${curriculum}`;
                        const isCurriculumOpen = expandedKeys.has(curriculumKey);
                        return (
                            <div key={curriculumKey} className="border dark:border-slate-700 rounded-lg">
                                <button onClick={() => toggleExpand(curriculumKey)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-brand-primary dark:text-rose-400 bg-gray-50 dark:bg-slate-800/70 hover:bg-gray-100 dark:hover:bg-slate-800">
                                    <span>Curriculum: {curriculum}</span>
                                    <svg className={`w-5 h-5 transition-transform ${isCurriculumOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                {isCurriculumOpen && (
                                    <div className="p-2 space-y-2">
                                        {Object.entries(grades).map(([grade, groups]) => {
                                            const gradeKey = `${curriculumKey}_grade_${grade}`;
                                            const isGradeOpen = expandedKeys.has(gradeKey);
                                            return (
                                                <div key={gradeKey} className="border dark:border-slate-600 rounded-md">
                                                     <button onClick={() => toggleExpand(gradeKey)} className="w-full flex justify-between items-center p-3 text-left font-medium text-brand-navy dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                        <span>Grade: {grade}</span>
                                                        <svg className={`w-5 h-5 transition-transform ${isGradeOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                     </button>
                                                     {isGradeOpen && (
                                                        <div className="p-3 border-t dark:border-slate-600 space-y-4">
                                                            {groups.map(cg => {
                                                                const classGroupKey = `${gradeKey}_cg_${cg.id}`;
                                                                const isClassGroupOpen = expandedKeys.has(classGroupKey);
                                                                return (
                                                                    <div key={classGroupKey} className="border dark:border-slate-600 rounded-md">
                                                                         <button onClick={() => toggleExpand(classGroupKey)} className="w-full flex justify-between items-center p-3 text-left font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700">
                                                                            <span>{cg.name} <span className="text-xs text-gray-400">({cg.mode})</span></span>
                                                                            <svg className={`w-5 h-5 transition-transform ${isClassGroupOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                                         </button>
                                                                        {isClassGroupOpen && (
                                                                            <div className="p-3 border-t dark:border-slate-600">
                                                                                {canEdit && (
                                                                                    <div className="flex items-center gap-2 mb-4 p-2 bg-gray-100 dark:bg-slate-900/50 rounded-md">
                                                                                        <label className="text-sm font-semibold flex-shrink-0">Copy Rules From:</label>
                                                                                        <select
                                                                                            value={copySources[cg.id] || ''}
                                                                                            onChange={e => setCopySources(prev => ({...prev, [cg.id]: e.target.value}))}
                                                                                            className="flex-grow p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm"
                                                                                        >
                                                                                            <option value="">-- Select a group --</option>
                                                                                            {classGroups.filter(g => g.id !== cg.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                                                                        </select>
                                                                                        <button onClick={() => handleCopyRules(cg.id, copySources[cg.id])} disabled={!copySources[cg.id]} className="bg-brand-dark-gray text-white px-3 py-1 text-sm rounded-md font-medium hover:bg-slate-600 disabled:opacity-50">Copy</button>
                                                                                    </div>
                                                                                )}
                                                                                <ClassGroupRuleTable
                                                                                    classGroup={cg}
                                                                                    subjectRules={subjectRules}
                                                                                    subjectMap={subjectMap}
                                                                                    timeGridMap={timeGridMap}
                                                                                    onRuleChange={handleRuleChange}
                                                                                    disabled={!canEdit}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                     )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

const TeacherAvailabilityComponent: React.FC<Pick<TimetableProps, 'timeGrids' | 'teachers' | 'timeConstraints' | 'setTimeConstraints' | 'currentAcademicYear' | 'permissions'>> = ({ timeGrids, teachers, timeConstraints, setTimeConstraints, currentAcademicYear, permissions }) => {
    const [selectedGridId, setSelectedGridId] = useState(timeGrids[0]?.id || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');
    const canEdit = hasPermission(permissions, 'setup:timetable-rules');

    const selectedGrid = useMemo(() => timeGrids.find(g => g.id === selectedGridId), [timeGrids, selectedGridId]);

    const unavailableSlots = useMemo(() => {
        const slots = new Set<string>();
        timeConstraints.forEach(c => {
            if (c.type === 'not-available' && c.targetType === 'teacher' && c.targetId === selectedTeacherId) {
                slots.add(`${c.day}-${c.periodId}`);
            }
        });
        return slots;
    }, [timeConstraints, selectedTeacherId]);

    
    const handleSlotToggle = (day: string, periodId: string) => {
        if (!canEdit) return;
        const slotKey = `${day}-${periodId}`;
        const isUnavailable = unavailableSlots.has(slotKey);

        if (isUnavailable) {
            setTimeConstraints(prev => prev.filter(c => {
                 if (c.type !== 'not-available') return true;
                 if (c.targetType !== 'teacher') return true;
                 return !(c.targetId === selectedTeacherId && c.day === day && c.periodId === periodId);
            }));
        } else {
            const newConstraint: TimeConstraint = {
                id: `na-${selectedTeacherId}-${day}-${periodId}`,
                type: 'not-available',
                targetType: 'teacher',
                targetId: selectedTeacherId,
                day: day,
                periodId: periodId,
                academicYear: currentAcademicYear,
            };
            setTimeConstraints(prev => [...prev, newConstraint]);
        }
    };
    
    // Reset selected teacher/grid if they are removed from the main list
    useEffect(() => {
        if(!teachers.find(t => t.id === selectedTeacherId)) {
            setSelectedTeacherId(teachers[0]?.id || '');
        }
    }, [teachers, selectedTeacherId]);

    useEffect(() => {
        if(!timeGrids.find(g => g.id === selectedGridId)) {
            setSelectedGridId(timeGrids[0]?.id || '');
        }
    }, [timeGrids, selectedGridId]);

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Teacher Availability</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mark the times when a specific teacher is unavailable for lessons.</p>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="w-full sm:w-60 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
                <select value={selectedGridId} onChange={e => setSelectedGridId(e.target.value)} className="w-full sm:w-60 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                    {timeGrids.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
            </div>
            {selectedGrid && selectedTeacherId && teachers.length > 0 && (
                <div className="overflow-x-auto mt-4">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr className="text-sm">
                                <th className="p-2 border dark:border-slate-700">Period</th>
                                {selectedGrid.days.map(day => <th key={day} className="p-2 border dark:border-slate-700">{day}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {selectedGrid.periods.map(period => (
                                <tr key={period.id}>
                                    <td className="p-2 border dark:border-slate-700 text-xs font-semibold">{period.name} <br/> <span className="font-normal text-gray-500">{period.startTime}-{period.endTime}</span></td>
                                    {selectedGrid.days.map(day => {
                                        const isUnavailable = unavailableSlots.has(`${day}-${period.id}`);
                                        if (period.type === 'Break') {
                                            return <td key={day} className="p-2 border dark:border-slate-700 bg-gray-200 dark:bg-slate-700 text-center text-xs">Break</td>
                                        }
                                        return (
                                            <td key={day} className="p-1 border dark:border-slate-700 text-center">
                                                <button onClick={() => handleSlotToggle(day, period.id)} disabled={!canEdit} className={`w-full h-full py-2 rounded-md text-sm transition-colors disabled:cursor-not-allowed ${isUnavailable ? 'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200 hover:bg-red-300' : 'bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200 hover:bg-green-300'}`}>
                                                    {isUnavailable ? 'Unavailable' : 'Available'}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const GeneralConstraintsComponent: React.FC<Pick<TimetableProps, 'teachers' | 'timeConstraints' | 'setTimeConstraints' | 'currentAcademicYear' | 'permissions'>> = ({ teachers, timeConstraints, setTimeConstraints, currentAcademicYear, permissions }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [constraintToEdit, setConstraintToEdit] = useState<Extract<TimeConstraint, { type: 'teacher-max-periods-day' | 'teacher-max-consecutive' }> | null>(null);
    const canEdit = hasPermission(permissions, 'setup:timetable-rules');

    const teacherConstraints = useMemo(() =>
        timeConstraints.filter(c => c.type === 'teacher-max-periods-day' || c.type === 'teacher-max-consecutive') as Extract<TimeConstraint, { type: 'teacher-max-periods-day' | 'teacher-max-consecutive' }>[],
        [timeConstraints]
    );

    const handleSaveConstraint = (constraint: Extract<TimeConstraint, { type: 'teacher-max-periods-day' | 'teacher-max-consecutive' }>) => {
        setTimeConstraints(prev => {
            const index = prev.findIndex(c => c.id === constraint.id);
            if (index > -1) {
                const updated = [...prev];
                updated[index] = constraint;
                return updated;
            }
            return [...prev, constraint];
        });
        setIsModalOpen(false);
        setConstraintToEdit(null);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold">General Teacher Constraints</h3>
            <p className="text-sm text-gray-500">Define global rules for teachers that apply across all their classes.</p>
            {canEdit && (
                <button onClick={() => { setConstraintToEdit(null); setIsModalOpen(true); }} className="my-4 bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium">
                    <PlusIcon className="w-4 h-4" /> Add Constraint
                </button>
            )}
            {isModalOpen && (
                <AddEditConstraintModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveConstraint}
                    existingConstraint={constraintToEdit}
                    teachers={teachers}
                    currentAcademicYear={currentAcademicYear}
                />
            )}
        </div>
    );
};

// --- START OF NEW GENERATOR LOGIC ---

type Lesson = {
    classGroup: ClassGroup;
    subject: Subject;
    teacher: Teacher;
    duration: number;
    id: string; // Unique ID for this specific lesson instance
};

type PlacedLesson = Lesson & {
    day: string;
    startPeriodIndex: number;
};

// Check if a specific period is booked for a teacher
const isTeacherBooked = (teacherId: string, day: string, periodId: string, timetable: GeneratedTimetable): boolean => {
    for (const classGroupId in timetable) {
        if (timetable[classGroupId]?.[day]?.[periodId]?.some(slot => slot.teacherId === teacherId)) {
            return true;
        }
    }
    return false;
};

// Check if a class group has any lesson in a specific period
const isClassGroupBooked = (classGroupId: string, day: string, periodId: string, timetable: GeneratedTimetable, lessonToPlace: Lesson, subjectMap: Map<string, Subject>): boolean => {
    const existingSlots = timetable[classGroupId]?.[day]?.[periodId];
    if (!existingSlots || existingSlots.length === 0) {
        return false; // Slot is free
    }

    // A core subject cannot be placed if anything else is there
    if (lessonToPlace.subject.category === SubjectCategory.Core) {
        return true;
    }
    
    // An elective cannot be placed if a core subject is there
    if (existingSlots.some(s => subjectMap.get(s.subjectId)?.category === SubjectCategory.Core)) {
        return true;
    }

    // An elective cannot be placed if another elective from a *different* group is there.
    const lessonElectiveGroup = lessonToPlace.subject.electiveGroup;
    if (existingSlots.some(s => {
        const existingSubject = subjectMap.get(s.subjectId);
        return existingSubject?.category === SubjectCategory.Elective && existingSubject.electiveGroup !== lessonElectiveGroup;
    })) {
        return true;
    }

    return false; // It's an elective and can be placed with other electives of the same group
};

const countSubjectPeriodsOnDay = (classGroupId: string, subjectId: string, day: string, timetable: GeneratedTimetable): number => {
    let count = 0;
    const daySchedule = timetable[classGroupId]?.[day];
    if (daySchedule) {
        for (const periodId in daySchedule) {
            if (daySchedule[periodId]?.some(s => s.subjectId === subjectId)) {
                count++;
            }
        }
    }
    return count;
};

interface GenerationStatus {
    running: boolean;
    placed: number;
    total: number;
    currentLessonText: string;
    backtracks: number;
    mostDifficultLesson: Lesson | null;
}


const GeneratorComponent: React.FC<TimetableProps & { setActiveTab: (tab: TimetableTab) => void }> = (props) => {
    const { timeGrids, timeConstraints, setTimetableHistory, teachers, classGroups, allocations, academicStructure, setActiveTab, currentAcademicYear, permissions, logAction } = props;
    
    const [generationStatus, setGenerationStatus] = useState<GenerationStatus>({
        running: false, placed: 0, total: 0, currentLessonText: '', backtracks: 0, mostDifficultLesson: null
    });
    const [generationResult, setGenerationResult] = useState<{ conflicts: number } | null>(null);
    const [lessonToAnalyze, setLessonToAnalyze] = useState<Lesson | null>(null);

    // Use refs for values that change frequently inside the recursive algorithm to avoid performance issues from state updates
    const cancelGenerationRef = useRef(false);
    const lessonsToPlaceRef = useRef<Lesson[]>([]);
    const backtrackStatsRef = useRef<Map<string, number>>(new Map());

    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg])), [classGroups]);
    
    const handleCancelGeneration = () => {
        cancelGenerationRef.current = true;
    };

    const handleGenerateTimetable = useCallback(async () => {
        cancelGenerationRef.current = false;
        backtrackStatsRef.current.clear();
        setGenerationStatus({ running: true, placed: 0, total: 0, currentLessonText: 'Preparing lessons...', backtracks: 0, mostDifficultLesson: null });
        setGenerationResult(null);

        await new Promise(resolve => setTimeout(resolve, 50));

        const classGroupsToSchedule = classGroups.filter(cg => cg.addToTimetable && cg.timeGridId && timeGrids.find(g => g.id === cg.timeGridId));
        const subjectRules = timeConstraints.filter(c => c.type === 'subject-rule') as Extract<TimeConstraint, { type: 'subject-rule' }>[];
        const teacherUnavailableConstraints = timeConstraints.filter(c => c.type === 'not-available' && c.targetType === 'teacher');
        
        let lessons: Lesson[] = [];
        allocations.forEach(alloc => {
            const classGroup = classGroupsToSchedule.find(cg => cg.id === alloc.classGroupId);
            const subject = subjectMap.get(alloc.subjectId);
            const teacher = teacherMap.get(alloc.teacherId);
            if (!classGroup || !subject || !teacher) return;
            
            const rule = subjectRules.find(r => r.classGroupId === classGroup.id && r.subjectId === subject.id) ||
                         (subject.electiveGroup ? subjectRules.find(r => r.classGroupId === classGroup.id && subjectMap.get(r.subjectId)?.electiveGroup === subject.electiveGroup) : undefined);

            if (rule && rule.rules.lessonDefinitions.length > 0) {
                rule.rules.lessonDefinitions.forEach(def => {
                    for (let i = 0; i < def.count; i++) {
                        lessons.push({ classGroup, subject, teacher, duration: def.duration, id: `${classGroup.id}-${subject.id}-${def.duration}-${i}` });
                    }
                });
            }
        });
        lessonsToPlaceRef.current = lessons;
        
        setGenerationStatus(prev => ({...prev, total: lessons.length}));

        const isPlacementValid = (lesson: Lesson, day: string, startPeriodIndex: number, timetable: GeneratedTimetable, grid: TimeGrid): boolean => {
            for (let j = 0; j < lesson.duration; j++) {
                const periodIndex = startPeriodIndex + j;
                if (periodIndex >= grid.periods.length) return false;
                const period = grid.periods[periodIndex];
                if (period.type !== 'Lesson') return false;
                if (isTeacherBooked(lesson.teacher.id, day, period.id, timetable)) return false;
                if (isClassGroupBooked(lesson.classGroup.id, day, period.id, timetable, lesson, subjectMap)) return false;
                if (teacherUnavailableConstraints.some(c => 'targetId' in c && c.targetId === lesson.teacher.id && c.day === day && c.periodId === period.id)) return false;
            }
            const rule = subjectRules.find(r => r.classGroupId === lesson.classGroup.id && r.subjectId === lesson.subject.id) || (lesson.subject.electiveGroup ? subjectRules.find(r => r.classGroupId === lesson.classGroup.id && subjectMap.get(r.subjectId)?.electiveGroup === lesson.subject.electiveGroup) : undefined);
            if (rule) {
                if (rule.rules.maxPeriodsPerDay) {
                    const periodsOnDay = countSubjectPeriodsOnDay(lesson.classGroup.id, lesson.subject.id, day, timetable);
                    if (periodsOnDay + lesson.duration > rule.rules.maxPeriodsPerDay) return false;
                }
                if (rule.rules.minDaysApart > 0) {
                    const dayIndex = grid.days.indexOf(day);
                    for (let d = 1; d <= rule.rules.minDaysApart; d++) {
                        const prevDayIndex = dayIndex - d;
                        if (prevDayIndex >= 0) if (countSubjectPeriodsOnDay(lesson.classGroup.id, lesson.subject.id, grid.days[prevDayIndex], timetable) > 0) return false;
                    }
                }
                if (rule.rules.maxConsecutive) {
                    let periodsBefore = 0;
                    for (let k = startPeriodIndex - 1; k >= 0; k--) if (timetable[lesson.classGroup.id]?.[day]?.[grid.periods[k].id]?.some(s => s.subjectId === lesson.subject.id)) periodsBefore++; else break;
                    let periodsAfter = 0;
                    for (let k = startPeriodIndex + lesson.duration; k < grid.periods.length; k++) if (timetable[lesson.classGroup.id]?.[day]?.[grid.periods[k].id]?.some(s => s.subjectId === lesson.subject.id)) periodsAfter++; else break;
                    if (periodsBefore + lesson.duration + periodsAfter > rule.rules.maxConsecutive) return false;
                }
                if (rule.rules.preferredTime && rule.rules.preferredTime !== 'any') {
                    const lunchBreakIndex = grid.periods.findIndex(p => p.type === 'Break' && p.name.toLowerCase().includes('lunch'));
                    const morningCutoff = lunchBreakIndex !== -1 ? lunchBreakIndex : Math.floor(grid.periods.filter(p => p.type === 'Lesson').length / 2);
                    if (rule.rules.preferredTime === 'morning' && startPeriodIndex >= morningCutoff) return false;
                    if (rule.rules.preferredTime === 'afternoon' && startPeriodIndex < morningCutoff) return false;
                }
            }
            return true;
        };

        const findValidSlots = (lesson: Lesson, timetable: GeneratedTimetable): { day: string; periodIndex: number }[] => {
            const validSlots: { day: string; periodIndex: number }[] = [];
            const grid = timeGrids.find(g => g.id === lesson.classGroup.timeGridId)!;
            if (!grid) return [];
            for (const day of grid.days) for (let i = 0; i <= grid.periods.length - lesson.duration; i++) if (isPlacementValid(lesson, day, i, timetable, grid)) validSlots.push({ day, periodIndex: i });
            return validSlots;
        };

        // Heuristic: Prioritize lessons with the fewest possible placements (Minimum Remaining Values)
        const lessonsWithDomainSize = lessons.map(lesson => ({ lesson, domainSize: findValidSlots(lesson, {}).length }));
        lessonsWithDomainSize.sort((a, b) => a.domainSize !== b.domainSize ? a.domainSize - b.domainSize : b.lesson.duration - a.lesson.duration);
        const sortedLessons = lessonsWithDomainSize.map(item => item.lesson);
        
        const solve = async (lessons: Lesson[], timetable: GeneratedTimetable, placedCount: number): Promise<{ success: boolean; timetable: GeneratedTimetable; unplacedLessons: Lesson[]; backtracks: number; }> => {
            if (cancelGenerationRef.current) throw new Error("Cancelled");
            if (lessons.length === 0) return { success: true, timetable, unplacedLessons: [], backtracks: 0 };
            
            await new Promise(r => setTimeout(r, 0)); 

            const currentLesson = lessons[0];
            const remainingLessons = lessons.slice(1);
            const grid = timeGrids.find(g => g.id === currentLesson.classGroup.timeGridId)!;
            
            setGenerationStatus(prev => ({...prev, currentLessonText: `${currentLesson.subject.name} for ${currentLesson.classGroup.name}...`}));

            const possibleSlots = findValidSlots(currentLesson, timetable);
            let totalBacktracks = 0;

            for (const slot of possibleSlots) {
                const newTimetable = JSON.parse(JSON.stringify(timetable));
                for (let j = 0; j < currentLesson.duration; j++) {
                    const period = grid.periods[slot.periodIndex + j];
                    const newSlot: GeneratedSlot = { id: currentLesson.id, classGroupId: currentLesson.classGroup.id, subjectId: currentLesson.subject.id, teacherId: currentLesson.teacher.id };
                    if (!newTimetable[currentLesson.classGroup.id][slot.day][period.id]) newTimetable[currentLesson.classGroup.id][slot.day][period.id] = [];
                    newTimetable[currentLesson.classGroup.id][slot.day][period.id]!.push(newSlot);
                }
                setGenerationStatus(prev => ({...prev, placed: placedCount + 1}));
                const result = await solve(remainingLessons, newTimetable, placedCount + 1);
                totalBacktracks += result.backtracks;

                if (result.success) return { ...result, backtracks: totalBacktracks };
                setGenerationStatus(prev => ({...prev, placed: placedCount}));
            }
            
            // Backtrack logic
            totalBacktracks += 1;
            const currentBacktrackCount = (backtrackStatsRef.current.get(currentLesson.id) || 0) + 1;
            backtrackStatsRef.current.set(currentLesson.id, currentBacktrackCount);

            setGenerationStatus(prev => {
                let mostDifficult = prev.mostDifficultLesson;
                if ((prev.backtracks + 1) % 10 === 0) { // Update text every 10 backtracks for performance
                    let maxBacktracks = -1;
                    let hardestLessonId: string | null = null;
                    for (const [lessonId, count] of backtrackStatsRef.current.entries()) {
                        if (count > maxBacktracks) { maxBacktracks = count; hardestLessonId = lessonId; }
                    }
                    const hardestLesson = lessonsToPlaceRef.current.find(l => l.id === hardestLessonId);
                    if (hardestLesson) mostDifficult = hardestLesson;
                }
                return { ...prev, backtracks: prev.backtracks + totalBacktracks, mostDifficultLesson: mostDifficult };
            });
            return { success: false, timetable: timetable, unplacedLessons: lessons, backtracks: totalBacktracks };
        };

        try {
            const initialTimetable: GeneratedTimetable = {};
            classGroupsToSchedule.forEach(cg => {
                initialTimetable[cg.id] = {};
                const grid = timeGrids.find(g => g.id === cg.timeGridId)!;
                grid.days.forEach(day => { initialTimetable[cg.id][day] = {}; grid.periods.forEach(p => initialTimetable[cg.id][day][p.id] = null); });
            });
            const solution = await solve(sortedLessons, initialTimetable, 0);
            
            const finalTimetable = solution.timetable;
            let conflicts: Conflict[] = solution.unplacedLessons.map(lesson => ({ id: `conflict-place-${lesson.id}`, type: 'Placement Failure', message: `Could not find a valid slot for ${lesson.subject.name} for class ${lesson.classGroup.name}.`, details: { classGroupId: lesson.classGroup.id, subjectId: lesson.subject.id, teacherId: lesson.teacher.id } }));
            subjectRules.forEach(rule => {
                if (rule.rules.mustBeEveryDay) {
                    const classGroup = classGroupMap.get(rule.classGroupId);
                    const grid = classGroup ? timeGrids.find(g => g.id === classGroup.timeGridId) : null;
                    if(grid && classGroup) grid.days.forEach(day => { if (countSubjectPeriodsOnDay(rule.classGroupId, rule.subjectId, day, finalTimetable) === 0) conflicts.push({ id: `conflict-daily-${rule.id}-${day}`, type: 'Constraint Violation', message: `${subjectMap.get(rule.subjectId)?.name} for ${classGroup.name} was not scheduled on ${day}.`, details: { classGroupId: rule.classGroupId, subjectId: rule.subjectId }}); });
                }
            });

            const objectiveScore = Math.max(0, Math.round(1000 - (conflicts.length * 20) - (solution.backtracks * 0.1)));
            const solverSeed = Math.random().toString(36).substring(2, 10).toUpperCase();
            const solverVersion = '1.2.1-backtracking-js';

            const newHistoryEntry: TimetableHistoryEntry = { 
                id: `tt-${Date.now()}`, 
                timestamp: new Date().toISOString(), 
                timetable: finalTimetable, 
                conflicts, 
                academicYear: currentAcademicYear,
                objectiveScore,
                solverSeed,
                solverVersion,
            };

            setTimetableHistory(prev => [newHistoryEntry, ...prev].slice(0, 10));
            logAction('generate:timetable', formatLogDetails('generate:timetable', newHistoryEntry));
            setGenerationResult({ conflicts: conflicts.length });
            setActiveTab('viewer');
        } catch (error) {
            if ((error as Error).message === "Cancelled") { console.log("Generation cancelled."); } 
            else { console.error("Generation failed:", error); alert("An unexpected error occurred."); }
        } finally {
            setGenerationStatus({ running: false, placed: 0, total: 0, currentLessonText: '', backtracks: 0, mostDifficultLesson: null });
        }

    }, [classGroups, allocations, timeConstraints, timeGrids, teachers, subjectMap, teacherMap, classGroupMap, setTimetableHistory, setActiveTab, currentAcademicYear, logAction]);

    return (
        <>
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm text-center">
            {generationStatus.running ? (
                <div className="max-w-2xl mx-auto space-y-4">
                    <h3 className="text-lg font-semibold">Generating Timetable...</h3>
                    <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4">
                        <div className="bg-brand-primary h-4 rounded-full transition-all duration-500" style={{ width: `${(generationStatus.placed / (generationStatus.total || 1)) * 100}%` }}></div>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                        <span>{generationStatus.placed} / {generationStatus.total} lessons placed</span>
                        <span>Backtracks: <span className="font-bold">{generationStatus.backtracks}</span></span>
                    </div>
                    <div className="h-12 p-3 bg-gray-100 dark:bg-slate-700/50 rounded-md text-sm text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Currently placing:</p>
                        <p className="font-semibold truncate">{generationStatus.currentLessonText}</p>
                    </div>
                    <div className="h-12 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md text-sm text-center flex items-center justify-center gap-4">
                        <div>
                            <p className="text-xs text-amber-600 dark:text-amber-400">Most Difficult Lesson:</p>
                            <p className="font-semibold truncate text-amber-800 dark:text-amber-300">{generationStatus.mostDifficultLesson ? `${generationStatus.mostDifficultLesson.subject.name} for ${generationStatus.mostDifficultLesson.classGroup.name}` : 'Calculating...'}</p>
                        </div>
                        {generationStatus.mostDifficultLesson && (
                            <button onClick={() => setLessonToAnalyze(generationStatus.mostDifficultLesson)} className="text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200" title="Analyse Constraints">
                                <InformationCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {generationStatus.backtracks > 500 && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                            Constraints seem tight. If this is taking too long, consider reviewing the rules for the most difficult lesson.
                        </p>
                    )}
                    <button onClick={handleCancelGeneration} className="mt-4 bg-red-600 text-white px-6 py-2 text-sm rounded-lg font-medium hover:bg-red-700">
                        Cancel Generation
                    </button>
                </div>
            ) : (
                <>
                    <h3 className="text-lg font-semibold">Timetable Generator</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">Click the button below to generate a new timetable based on all the rules, availability, and constraints you've defined.</p>
                    
                    <div className="mt-6">
                        <button 
                            onClick={handleGenerateTimetable}
                            disabled={!hasPermission(permissions, 'generate:timetable')}
                            className="bg-brand-primary text-white px-8 py-3 text-base rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-rose-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>Generate Timetable</span>
                        </button>
                    </div>
                    {generationResult && (
                        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg max-w-md mx-auto text-left">
                             <div className="flex items-center gap-3">
                                <CheckCircleIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-green-800 dark:text-green-200">Generation Complete!</h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">Timetable generated with {generationResult.conflicts} conflicts. Check the 'Viewer & History' tab to see the results.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
        {lessonToAnalyze && (
            <ConstraintAnalysisModal
                isOpen={!!lessonToAnalyze}
                onClose={() => setLessonToAnalyze(null)}
                lesson={lessonToAnalyze}
                timeConstraints={timeConstraints}
                timeGrids={timeGrids}
            />
        )}
        </>
    );
};

const ViewerComponent: React.FC<TimetableProps> = (props) => {
    const { timetableHistory, setTimetableHistory, teachers, classGroups, academicStructure, timeGrids, allocations, permissions } = props;
    
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(timetableHistory[0]?.id || null);
    const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [entryToDelete, setEntryToDelete] = useState<TimetableHistoryEntry | null>(null);

    const canManageHistory = hasPermission(permissions, 'manage:timetable-history');

    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg])), [classGroups]);

    useEffect(() => {
        if (viewMode === 'class') {
            setSelectedTargetId(classGroups[0]?.id || null);
        } else {
            setSelectedTargetId(teachers[0]?.id || null);
        }
    }, [viewMode, classGroups, teachers]);
    
    const activeTimetableData = useMemo(() => {
        if (!selectedHistoryId) return null;
        return timetableHistory.find(entry => entry.id === selectedHistoryId);
    }, [selectedHistoryId, timetableHistory]);

    const handleSetAsActive = (historyId: string) => {
        const entryToMove = timetableHistory.find(e => e.id === historyId);
        if (entryToMove) {
            const others = timetableHistory.filter(e => e.id !== historyId);
            setTimetableHistory([entryToMove, ...others]);
            alert("Timetable set as active.");
        }
    };
    
    const handleDeleteEntry = () => {
        if (entryToDelete) {
            setTimetableHistory(prev => prev.filter(e => e.id !== entryToDelete.id));
            if (selectedHistoryId === entryToDelete.id) {
                setSelectedHistoryId(timetableHistory[0]?.id || null);
            }
            setEntryToDelete(null);
        }
    };

    const handleExport = () => {
        alert("Export functionality not yet implemented.");
    };

    const targetList = viewMode === 'class' ? classGroups : teachers;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold">Viewer & History</h3>
                <div className="mt-4">
                    <label className="text-sm font-semibold">History</label>
                    <select value={selectedHistoryId || ''} onChange={e => setSelectedHistoryId(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                        {timetableHistory.length === 0 && <option disabled>No timetables generated yet</option>}
                        {timetableHistory.map(entry => (
                            <option key={entry.id} value={entry.id}>
                                {new Date(entry.timestamp).toLocaleString()} ({entry.conflicts.length} conflicts)
                            </option>
                        ))}
                    </select>
                </div>
                {activeTimetableData && (
                    <div className="mt-4 space-y-2">
                         {canManageHistory && timetableHistory.length > 1 && activeTimetableData.id !== timetableHistory[0].id && (
                             <button onClick={() => handleSetAsActive(activeTimetableData.id)} className="w-full text-sm font-semibold bg-green-600 text-white py-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2">
                                <CheckIcon className="w-4 h-4"/> Set as Active
                            </button>
                         )}
                         <button onClick={handleExport} className="w-full text-sm font-semibold bg-brand-dark-gray text-white py-2 rounded-md hover:bg-slate-700 flex items-center justify-center gap-2">
                            <ArrowDownTrayIcon className="w-4 h-4"/> Export CSV
                        </button>
                        {canManageHistory && (
                             <button onClick={() => setEntryToDelete(activeTimetableData)} className="w-full text-sm font-semibold bg-red-600 text-white py-2 rounded-md hover:bg-red-700 flex items-center justify-center gap-2">
                                <TrashIcon className="w-4 h-4"/> Delete
                            </button>
                        )}
                        <div className="pt-2 text-xs space-y-1 font-mono text-gray-600 dark:text-gray-400">
                             <p><strong>Score:</strong> {activeTimetableData.objectiveScore ?? 'N/A'}</p>
                             <p><strong>Seed:</strong> {activeTimetableData.solverSeed ?? 'N/A'}</p>
                             <p><strong>Version:</strong> {activeTimetableData.solverVersion ?? 'N/A'}</p>
                        </div>
                        <div className="pt-2">
                            <h4 className="font-semibold text-sm">Conflicts ({activeTimetableData.conflicts.length})</h4>
                            <div className="max-h-40 overflow-y-auto text-xs space-y-2 mt-2">
                                {activeTimetableData.conflicts.map(c => (
                                    <div key={c.id} className="p-2 bg-red-50 dark:bg-red-900/30 rounded-md">
                                        <p className="font-bold text-red-700 dark:text-red-300">{c.type}</p>
                                        <p className="text-red-600 dark:text-red-400">{c.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                    <div className="p-1 bg-gray-100 dark:bg-slate-700/50 rounded-lg flex gap-1">
                        <button onClick={() => setViewMode('class')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'class' ? 'bg-brand-primary text-white' : ''}`}>Class View</button>
                        <button onClick={() => setViewMode('teacher')} className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === 'teacher' ? 'bg-brand-primary text-white' : ''}`}>Teacher View</button>
                    </div>
                     <select value={selectedTargetId || ''} onChange={e => setSelectedTargetId(e.target.value)} className="w-full sm:w-72 mt-3 sm:mt-0 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                         {targetList.map(item => <option key={item.id} value={item.id}>{viewMode === 'class' ? (item as ClassGroup).name : (item as Teacher).fullName}</option>)}
                    </select>
                </div>
                {/* Viewer will go here */}
            </div>
             {entryToDelete && (
                <ConfirmationModal
                    isOpen={!!entryToDelete}
                    onClose={() => setEntryToDelete(null)}
                    onConfirm={handleDeleteEntry}
                    title="Delete Timetable History Entry"
                    message={`Are you sure you want to delete this timetable generated at ${new Date(entryToDelete.timestamp).toLocaleString()}?`}
                />
            )}
        </div>
    );
};


const Timetable: React.FC<TimetableProps> = (props) => {
    const { timeGrids, setTimeGrids, timeConstraints, setTimeConstraints, timetableHistory, setTimetableHistory, teachers, classGroups, setClassGroups, allocations, academicStructure, currentAcademicYear, permissions } = props;
    
    const [activeTab, setActiveTab] = useState<TimetableTab>('generator');

    const canSetup = hasPermission(permissions, 'setup:timetable-grids') || hasPermission(permissions, 'setup:timetable-rules');
    const canGenerate = hasPermission(permissions, 'generate:timetable');

    useEffect(() => {
        if (!canSetup && !canGenerate) {
            setActiveTab('viewer');
        } else if (activeTab === 'grids' && !hasPermission(permissions, 'setup:timetable-grids')) {
            setActiveTab('classRules');
        } else if ((activeTab === 'classRules' || activeTab === 'teacherAvailability' || activeTab === 'generalConstraints') && !hasPermission(permissions, 'setup:timetable-rules')) {
             setActiveTab('generator');
        } else if (activeTab === 'generator' && !canGenerate) {
            setActiveTab('viewer');
        }

    }, [permissions, activeTab, canSetup, canGenerate]);


    const renderContent = () => {
        switch (activeTab) {
            case 'grids':
                return <TimeGridsComponent timeGrids={timeGrids} setTimeGrids={setTimeGrids} permissions={permissions} academicStructure={academicStructure}/>;
            case 'classRules':
                return <ClassGroupRulesComponent {...props} />;
            case 'teacherAvailability':
                return <TeacherAvailabilityComponent timeGrids={timeGrids} teachers={teachers} timeConstraints={timeConstraints} setTimeConstraints={setTimeConstraints} currentAcademicYear={currentAcademicYear} permissions={permissions} />;
            case 'generalConstraints':
                return <GeneralConstraintsComponent teachers={teachers} timeConstraints={timeConstraints} setTimeConstraints={setTimeConstraints} currentAcademicYear={currentAcademicYear} permissions={permissions}/>;
            case 'generator':
                return <GeneratorComponent {...props} setActiveTab={setActiveTab} />;
            case 'viewer':
                return <ViewerComponent {...props} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                {canSetup && <TabButton tabId="grids" label="1. Time Grids" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
                {canSetup && <TabButton tabId="classRules" label="2. Class Rules" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
                {canSetup && <TabButton tabId="teacherAvailability" label="3. Teacher Availability" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
                {canGenerate && <TabButton tabId="generator" label="4. Generator" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
                <TabButton tabId="viewer" label="5. Viewer & History" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>
            {renderContent()}
        </div>
    );
};

export default Timetable;