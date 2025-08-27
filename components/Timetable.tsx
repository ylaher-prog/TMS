import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { TimeGrid, TimeConstraint, GeneratedTimetable, Teacher, ClassGroup, TeacherAllocation, AcademicStructure, TimetablePeriod, GeneratedSlot, Subject, TimetableHistoryEntry, Conflict, LessonDefinition } from '../types';
import TabButton from './TabButton';
import { PlusIcon, TrashIcon, XMarkIcon, SparklesIcon, PencilIcon, ArrowDownTrayIcon, CheckIcon, CheckCircleIcon } from './Icons';
import { getSubjectPeriods } from '../App';
import { SubjectCategory } from '../types';
import ConfirmationModal from './ConfirmationModal';
import AddEditConstraintModal from './AddEditConstraintModal';
import { TIME_GRID_COLORS } from '../constants';


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
}

type TimetableTab = 'grids' | 'classRules' | 'teacherAvailability' | 'generalConstraints' | 'generator' | 'viewer';

const TimeGridsComponent: React.FC<Pick<TimetableProps, 'timeGrids' | 'setTimeGrids'>> = ({ timeGrids, setTimeGrids }) => {
    const [gridToDelete, setGridToDelete] = useState<TimeGrid | null>(null);

    const handleAddGrid = () => {
        const newGrid: TimeGrid = {
            id: `grid-${Date.now()}`,
            name: 'New Time Grid',
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            periods: [],
            color: TIME_GRID_COLORS[timeGrids.length % TIME_GRID_COLORS.length],
        };
        setTimeGrids(prev => [...prev, newGrid]);
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
                    <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Define the weekly schedules, including working days and period timings.</p>
                </div>
                <button onClick={handleAddGrid} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Time Grid</span>
                </button>
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {timeGrids.map(grid => (
                    <div key={grid.id} className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-3 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: grid.color }}></div>
                                <input 
                                    type="text"
                                    value={grid.name}
                                    onChange={e => handleUpdateGrid(grid.id, { name: e.target.value })}
                                    className="text-lg font-semibold text-brand-text-dark dark:text-white bg-transparent border-none focus:ring-0 p-0"
                                />
                            </div>
                            <button onClick={() => setGridToDelete(grid)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" title="Delete Grid">
                                <TrashIcon className="w-5 h-5" />
                            </button>
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
                                            onClick={() => {
                                                const newDays = grid.days.includes(day)
                                                    ? grid.days.filter(d => d !== day)
                                                    : [...grid.days, day];
                                                handleUpdateGrid(grid.id, { days: newDays });
                                            }}
                                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border
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
                                            className="flex-grow p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary"
                                        />
                                        <input
                                            type="time"
                                            value={period.startTime ?? ''}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'startTime', e.target.value)}
                                            className="w-28 p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary"
                                        />
                                        <input
                                            type="time"
                                            value={period.endTime ?? ''}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'endTime', e.target.value)}
                                            className="w-28 p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary"
                                        />
                                        <select
                                            value={period.type ?? 'Lesson'}
                                            onChange={e => handleUpdatePeriod(grid.id, period.id, 'type', e.target.value)}
                                            className="w-32 p-2 border rounded-md text-sm bg-white dark:bg-slate-700/80 dark:border-slate-600 focus:ring-1 focus:ring-brand-primary"
                                        >
                                            <option value="Lesson">Lesson</option>
                                            <option value="Break">Break</option>
                                        </select>
                                        <button
                                            onClick={() => handleDeletePeriod(grid.id, period.id)}
                                            className="text-gray-400 hover:text-red-500 p-2"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                             </div>
                             <button onClick={() => handleAddPeriod(grid.id)} className="mt-3 text-sm font-semibold text-brand-primary hover:text-rose-800 dark:text-rose-400">+ Add Period</button>
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
}> = ({ definition, onUpdate, onDelete }) => {
    return (
        <div className="flex items-center gap-2 text-sm">
            <input 
                type="number"
                value={definition.count}
                onChange={e => onUpdate(definition.id, { count: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-20 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-center"
            />
            <span>x</span>
            <input 
                type="number"
                value={definition.duration}
                onChange={e => onUpdate(definition.id, { duration: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-20 p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-center"
            />
            <span>periods</span>
            <button onClick={() => onDelete(definition.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
        </div>
    );
};


const SubjectRuleRow: React.FC<{
    subjects: Subject[];
    classGroup: ClassGroup;
    rule: Extract<TimeConstraint, { type: 'subject-rule' }> | undefined;
    onRuleChange: (classGroupId: string, subjectIds: string[], updatedRules: Partial<Extract<TimeConstraint, { type: 'subject-rule' }>['rules']>) => void;
    colorClasses: typeof ELECTIVE_GROUP_COLORS[0] | null;
}> = ({ subjects, classGroup, rule, onRuleChange, colorClasses }) => {
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
        <div className={`p-3 rounded-lg border dark:border-slate-700 ${colorClasses?.bg} ${colorClasses?.darkBg} transition-colors ${sumMatches ? 'border-green-200 dark:border-green-800' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                    <h5 className={`font-semibold ${colorClasses?.text} ${colorClasses?.darkText}`}>{subjects.map(s => s.name).join(' / ')}</h5>
                    <div className={`mt-1 p-2 rounded-md inline-block ${sumMatches ? 'bg-green-100 dark:bg-green-900/40' : 'bg-red-100 dark:bg-red-900/40'}`}>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Calculated / Total Periods</span>
                        <p className={`text-center font-bold text-lg ${sumMatches ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                            {calculatedPeriods} / {totalPeriods}
                        </p>
                    </div>
                </div>
                <div className="md:col-span-9 space-y-4">
                    <div>
                         <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Lesson Definitions</label>
                         <div className="space-y-2">
                            {lessonDefs.map(def => (
                                <LessonDefinitionRow key={def.id} definition={def} onUpdate={handleUpdateDefinition} onDelete={handleDeleteDefinition}/>
                            ))}
                         </div>
                         <button onClick={handleAddDefinition} className="text-xs font-semibold text-brand-primary mt-2">+ Add Definition</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t dark:border-slate-600">
                        <div>
                             <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Min Days Apart</label>
                             <input
                                type="number" min="0" value={rule?.rules.minDaysApart ?? 0}
                                onChange={e => onRuleChange(classGroup.id, subjectIds, { minDaysApart: parseInt(e.target.value) || 0 })}
                                className="w-full p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Max Periods / Day</label>
                            <input type="number" min="0" placeholder="None" value={rule?.rules.maxPeriodsPerDay ?? ''}
                                onChange={e => onRuleChange(classGroup.id, subjectIds, { maxPeriodsPerDay: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Max Consecutive</label>
                            <input type="number" min="0" placeholder="None" value={rule?.rules.maxConsecutive ?? ''}
                                onChange={e => onRuleChange(classGroup.id, subjectIds, { maxConsecutive: e.target.value ? parseInt(e.target.value) : null })}
                                className="w-full p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Other Rules</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 items-center">
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={rule?.rules.mustBeEveryDay ?? false}
                                    onChange={e => onRuleChange(classGroup.id, subjectIds, { mustBeEveryDay: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                                Must be every day
                            </label>
                            <div className="flex items-center gap-2">
                                <label className="text-sm">Preferred Time:</label>
                                <select value={rule?.rules.preferredTime ?? 'any'}
                                    onChange={e => onRuleChange(classGroup.id, subjectIds, { preferredTime: e.target.value as 'any' | 'morning' | 'afternoon' })}
                                    className="p-1 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-sm" >
                                    <option value="any">Any</option>
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                </select>
                            </div>
                        </div>
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
}> = ({ classGroup, subjectRules, subjectMap, timeGridMap, onRuleChange }) => {
    
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
        return { core, electivesByGroup: electives };
    }, [classGroup.subjectIds, subjectMap]);

    const electiveGroupColorMap = useMemo(() => {
        const map = new Map<string, typeof ELECTIVE_GROUP_COLORS[0]>();
        Object.keys(electivesByGroup).forEach((groupName, i) => {
            map.set(groupName, ELECTIVE_GROUP_COLORS[i % ELECTIVE_GROUP_COLORS.length]);
        });
        return map;
    }, [electivesByGroup]);

    return (
        <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-300">{classGroup.name} <span className="text-sm font-normal text-gray-500">({classGroup.mode})</span></h4>
            {assignedGrid ? (
                 <div className="mt-2 space-y-2">
                    {core.map((subject) => (
                        <SubjectRuleRow
                            key={subject.id}
                            subjects={[subject]}
                            classGroup={classGroup}
                            rule={subjectRules.find(r => r.classGroupId === classGroup.id && r.subjectId === subject.id)}
                            onRuleChange={onRuleChange}
                            colorClasses={null}
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
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-yellow-600 text-sm p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">Please assign a Time Grid to this class group to set subject distribution rules.</p>
            )}
        </div>
    );
};


const ClassGroupRulesComponent: React.FC<TimetableProps> = ({ classGroups, setClassGroups, academicStructure, timeConstraints, setTimeConstraints, timeGrids }) => {
    // State for bulk assignment
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [gridToApply, setGridToApply] = useState<string>(timeGrids[0]?.id || '');

    // State for accordions
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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
        const newOrUpdatedConstraints: TimeConstraint[] = [];
        const currentSubjectRules = timeConstraints.filter(c => c.type === 'subject-rule') as Extract<TimeConstraint, {type: 'subject-rule'}>[];

        classGroups.forEach(cg => {
            cg.subjectIds.forEach(subjectId => {
                const existingRule = currentSubjectRules.find(r => r.classGroupId === cg.id && r.subjectId === subjectId);
                
                if (existingRule) return;

                const subject = subjectMap.get(subjectId);
                if (!subject) return;

                const totalPeriods = getSubjectPeriods(subject, cg.curriculum, cg.grade, cg.mode);
                
                const newRule: TimeConstraint = {
                    id: `sr-${cg.id}-${subjectId}`,
                    type: 'subject-rule',
                    classGroupId: cg.id,
                    subjectId,
                    rules: { 
                        lessonDefinitions: totalPeriods > 0 ? [{ id: `def-${cg.id}-${subjectId}`, count: totalPeriods, duration: 1 }] : [],
                        minDaysApart: 0,
                    }
                };
                newOrUpdatedConstraints.push(newRule);
            });
        });

        if (newOrUpdatedConstraints.length > 0) {
            setTimeConstraints(prev => {
                const constraintsMap = new Map(prev.map(c => [c.id, c]));
                newOrUpdatedConstraints.forEach(c => constraintsMap.set(c.id, c));
                return Array.from(constraintsMap.values());
            });
        }
    }, [classGroups, timeConstraints, subjectMap, setTimeConstraints]);

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
            subjectIds.forEach(subjectId => {
                const existingRule = prev.find(c => c.type === 'subject-rule' && c.classGroupId === classGroupId && c.subjectId === subjectId) as Extract<TimeConstraint, { type: 'subject-rule' }> | undefined;
                if (existingRule) {
                    constraintsMap.set(existingRule.id, { ...existingRule, rules: { ...existingRule.rules, ...updatedRules }});
                } else {
                    const newId = `sr-${classGroupId}-${subjectId}`;
                    const emptyRule: Extract<TimeConstraint, { type: 'subject-rule' }>['rules'] = { lessonDefinitions: [], minDaysApart: 0 };
                    constraintsMap.set(newId, { id: newId, type: 'subject-rule', classGroupId, subjectId, rules: { ...emptyRule, ...updatedRules } });
                }
            });
            return Array.from(constraintsMap.values());
        });
    }, [setTimeConstraints]);
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">1. Assign Time Grids to Class Groups</h3>
                <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">A time grid must be assigned to set subject distribution rules below.</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center p-3 border dark:border-slate-700 rounded-md">
                    <select value={gridToApply} onChange={e => setGridToApply(e.target.value)} className="w-full sm:w-auto flex-grow p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                        {timeGrids.map(tg => <option key={tg.id} value={tg.id}>{tg.name}</option>)}
                    </select>
                    <button onClick={handleApplyGridToSelected} disabled={selectedGroupIds.length === 0} className="w-full sm:w-auto bg-brand-primary text-white px-4 py-2 rounded-md font-medium disabled:opacity-50">Apply to Selected ({selectedGroupIds.length})</button>
                </div>
                <div className="max-h-60 overflow-y-auto mt-4 border dark:border-slate-700 rounded-md">
                     <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                <th className="p-2"><input type="checkbox" checked={isAllSelected} onChange={handleSelectAll}/></th>
                                <th className="p-2 text-left font-semibold">Class Group</th>
                                <th className="p-2 text-left font-semibold">Assigned Grid</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classGroups.map(cg => {
                                const assignedGrid = timeGridMap.get(cg.timeGridId || '');
                                return (
                                <tr key={cg.id} className="border-t dark:border-slate-700">
                                    <td className="p-2"><input type="checkbox" checked={selectedGroupIds.includes(cg.id)} onChange={() => handleSelectGroup(cg.id)}/></td>
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
                                            const isGradeComplete = groups.every(cg => {
                                                const assignedGrid = timeGridMap.get(cg.timeGridId || '');
                                                if (!assignedGrid) return false;
                                                return cg.subjectIds.every(sid => {
                                                    const subject = subjectMap.get(sid);
                                                    if (!subject) return true;
                                                    const totalPeriods = getSubjectPeriods(subject, cg.curriculum, cg.grade, cg.mode);
                                                    if (totalPeriods === 0) return true;
                                                    const rule = subjectRules.find(r => r.classGroupId === cg.id && r.subjectId === sid);
                                                    const calculatedPeriods = (rule?.rules.lessonDefinitions || []).reduce((sum, def) => sum + (def.count * def.duration), 0);
                                                    return calculatedPeriods === totalPeriods;
                                                });
                                            });

                                            return (
                                                <div key={gradeKey} className="border dark:border-slate-600 rounded-md">
                                                     <button onClick={() => toggleExpand(gradeKey)} className="w-full flex justify-between items-center p-3 text-left font-medium text-brand-navy dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                                                        <div className="flex items-center gap-2">
                                                            {isGradeComplete && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                                                            <span>Grade: {grade}</span>
                                                        </div>
                                                        <svg className={`w-5 h-5 transition-transform ${isGradeOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                     </button>
                                                     {isGradeOpen && (
                                                        <div className="p-3 border-t dark:border-slate-600 space-y-4">
                                                            {groups.map(cg => (
                                                                <ClassGroupRuleTable
                                                                    key={cg.id}
                                                                    classGroup={cg}
                                                                    subjectRules={subjectRules}
                                                                    subjectMap={subjectMap}
                                                                    timeGridMap={timeGridMap}
                                                                    onRuleChange={handleRuleChange}
                                                                />
                                                            ))}
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

const TeacherAvailabilityComponent: React.FC<TimetableProps> = ({ timeGrids, teachers, timeConstraints, setTimeConstraints }) => {
    const [selectedGridId, setSelectedGridId] = useState(timeGrids[0]?.id || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState(teachers[0]?.id || '');

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

    const handleBulkToggle = (
        targetState: 'available' | 'unavailable',
        slotsToToggle: { day: string, periodId: string }[]
    ) => {
// FIX: The component was returning void. Added full implementation with JSX.
    if (targetState === 'unavailable') {
        const newConstraints: TimeConstraint[] = slotsToToggle
            .filter(slot => !unavailableSlots.has(`${slot.day}-${slot.periodId}`))
            .map(slot => ({
                id: `na-${selectedTeacherId}-${slot.day}-${slot.periodId}`,
                type: 'not-available',
                targetType: 'teacher',
                targetId: selectedTeacherId,
                day: slot.day,
                periodId: slot.periodId,
            }));
        setTimeConstraints(prev => [...prev, ...newConstraints]);
    } else { // 'available'
        const slotsToRemove = new Set(slotsToToggle.map(s => `${s.day}-${s.periodId}`));
        setTimeConstraints(prev => prev.filter(c =>
            !(c.type === 'not-available' && c.targetType === 'teacher' && c.targetId === selectedTeacherId && slotsToRemove.has(`${c.day}-${c.periodId}`))
        ));
    }
};

const handleSlotToggle = (day: string, periodId: string) => {
    const slotKey = `${day}-${periodId}`;
    const isUnavailable = unavailableSlots.has(slotKey);

    if (isUnavailable) {
        setTimeConstraints(prev => prev.filter(c => !(c.type === 'not-available' && c.targetId === selectedTeacherId && c.day === day && c.periodId === periodId)));
    } else {
        const newConstraint: TimeConstraint = {
            id: `na-${selectedTeacherId}-${day}-${periodId}`,
            type: 'not-available',
            targetType: 'teacher',
            targetId: selectedTeacherId,
            day: day,
            periodId: periodId,
        };
        setTimeConstraints(prev => [...prev, newConstraint]);
    }
};

return (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Teacher Availability</h3>
        <div className="flex gap-4">
            <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
            </select>
            <select value={selectedGridId} onChange={e => setSelectedGridId(e.target.value)} className="p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                {timeGrids.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
        </div>
        {selectedGrid && selectedTeacherId && (
            <div className="overflow-x-auto">
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
                                <td className="p-2 border dark:border-slate-700 text-xs font-semibold">{period.name}</td>
                                {selectedGrid.days.map(day => {
                                    const isUnavailable = unavailableSlots.has(`${day}-${period.id}`);
                                    if (period.type === 'Break') {
                                        return <td key={day} className="p-2 border dark:border-slate-700 bg-gray-200 dark:bg-slate-700 text-center text-xs">Break</td>
                                    }
                                    return (
                                        <td key={day} className="p-1 border dark:border-slate-700 text-center">
                                            <button onClick={() => handleSlotToggle(day, period.id)} className={`w-full h-full py-2 rounded-md text-sm ${isUnavailable ? 'bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-200' : 'bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-200'}`}>
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

const GeneralConstraintsComponent: React.FC<Pick<TimetableProps, 'teachers' | 'timeConstraints' | 'setTimeConstraints'>> = ({ teachers, timeConstraints, setTimeConstraints }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [constraintToEdit, setConstraintToEdit] = useState<Extract<TimeConstraint, { type: 'teacher-max-periods-day' | 'teacher-max-consecutive' }> | null>(null);

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
            <button onClick={() => { setConstraintToEdit(null); setIsModalOpen(true); }} className="my-4 bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium">
                <PlusIcon className="w-4 h-4" /> Add Constraint
            </button>
            {isModalOpen && (
                <AddEditConstraintModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveConstraint}
                    existingConstraint={constraintToEdit}
                    teachers={teachers}
                />
            )}
        </div>
    );
};

const GeneratorComponent: React.FC<TimetableProps> = (props) => {
    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold">Timetable Generator</h3>
            <p className="text-sm text-gray-500">Click the button below to generate a new timetable based on all defined rules and constraints.</p>
            <button className="my-4 bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium">
                <SparklesIcon className="w-4 h-4" /> Generate Timetable
            </button>
        </div>
    );
};

const ViewerComponent: React.FC<TimetableProps> = (props) => {
    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold">Timetable Viewer</h3>
            <p className="text-sm text-gray-500">View the most recently generated timetable. Select a class group to see its schedule.</p>
        </div>
    );
};

const Timetable: React.FC<TimetableProps> = (props) => {
    const [activeTab, setActiveTab] = useState<TimetableTab>('viewer');

    const renderContent = () => {
        switch (activeTab) {
            case 'grids':
                return <TimeGridsComponent timeGrids={props.timeGrids} setTimeGrids={props.setTimeGrids} />;
            case 'classRules':
                return <ClassGroupRulesComponent {...props} />;
            case 'teacherAvailability':
                return <TeacherAvailabilityComponent {...props} />;
            case 'generalConstraints':
                return <GeneralConstraintsComponent teachers={props.teachers} timeConstraints={props.timeConstraints} setTimeConstraints={props.setTimeConstraints} />;
            case 'generator':
                return <GeneratorComponent {...props} />;
            case 'viewer':
                return <ViewerComponent {...props} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="viewer" label="Viewer" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="generator" label="Generator" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="grids" label="Time Grids" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="classRules" label="Class Rules" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="teacherAvailability" label="Teacher Availability" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="generalConstraints" label="General Constraints" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>
            <div>{renderContent()}</div>
        </div>
    );
};

export default Timetable;
