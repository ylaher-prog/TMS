import React, { useMemo } from 'react';
import type { Teacher, TimetableHistoryEntry, TimeGrid, AcademicStructure, GeneratedSlot, ClassGroup, TeacherAllocation } from '../types';

interface TeacherTimetableViewerProps {
    teacher: Teacher;
    timetableHistory: TimetableHistoryEntry[];
    timeGrids: TimeGrid[];
    academicStructure: AcademicStructure;
    classGroups: ClassGroup[];
    allocations: TeacherAllocation[];
}

const TeacherTimetableViewer: React.FC<TeacherTimetableViewerProps> = (props) => {
    const { teacher, timetableHistory, timeGrids, academicStructure, classGroups, allocations } = props;

    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg])), [classGroups]);

    const subjectColorMap = useMemo(() => {
        const map = new Map<string, string>();
        academicStructure.subjects.forEach((subject, index) => {
            const colors = [
                'bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/40 dark:border-sky-700 dark:text-sky-200',
                'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/40 dark:border-purple-700 dark:text-purple-200',
                'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/40 dark:border-green-700 dark:text-green-200',
                'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/40 dark:border-yellow-700 dark:text-yellow-200',
                'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/40 dark:border-pink-700 dark:text-pink-200',
                'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/40 dark:border-indigo-700 dark:text-indigo-200',
            ];
            map.set(subject.id, colors[index % colors.length]);
        });
        return map;
    }, [academicStructure.subjects]);

    const { timetable, grid } = useMemo(() => {
        const activeHistoryEntry = timetableHistory.length > 0 ? timetableHistory[0] : null;
        if (!activeHistoryEntry) return { timetable: null, grid: null };
        const generatedTimetable = activeHistoryEntry.timetable;

        const teacherTimetable: Record<string, Record<string, GeneratedSlot & { classGroupName: string; subjectName: string }>> = {};
        
        const firstAllocation = allocations.find(a => a.teacherId === teacher.id);
        const firstGroup = firstAllocation ? classGroupMap.get(firstAllocation.classGroupId) : null;
        const grid = firstGroup ? timeGrids.find(g => g.id === firstGroup.timeGridId) : timeGrids[0];

        if (grid) {
            grid.days.forEach(day => teacherTimetable[day] = {});

            Object.values(generatedTimetable).forEach(classSchedule => {
                Object.entries(classSchedule).forEach(([day, periods]) => {
                    Object.entries(periods).forEach(([periodId, slotsInPeriod]) => {
                        if (slotsInPeriod) {
                            const teacherSlot = slotsInPeriod.find(s => s.teacherId === teacher.id);
                            if (teacherSlot) {
                                const group = classGroupMap.get(teacherSlot.classGroupId);
                                const subject = subjectMap.get(teacherSlot.subjectId);
                                teacherTimetable[day][periodId] = { 
                                    ...teacherSlot, 
                                    classGroupName: group?.name || '?',
                                    subjectName: subject?.name || '?',
                                };
                            }
                        }
                    });
                });
            });
        }

        return { timetable: teacherTimetable, grid };
    }, [teacher.id, timetableHistory, timeGrids, allocations, classGroupMap, subjectMap]);

    if (!grid || !timetable) {
        return <p className="text-sm text-gray-500 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-md text-center">Your timetable has not been generated yet.</p>;
    }

    return (
        <div className="overflow-x-auto border dark:border-slate-700 rounded-lg">
            <table className="min-w-full border-collapse text-xs text-center">
                <thead>
                    <tr className="bg-gray-50 dark:bg-slate-700/50">
                        <th className="p-1 border dark:border-slate-700 w-28">Period</th>
                        {grid.days.map(day => <th key={day} className="p-2 border dark:border-slate-700">{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {grid.periods.map(period => (
                        <tr key={period.id}>
                            <td className="p-1 border dark:border-slate-700 align-top">
                                <b>{period.name}</b><br/>
                                <span className="text-gray-500 dark:text-gray-400">{period.startTime}-{period.endTime}</span>
                            </td>
                            {grid.days.map(day => {
                                if (period.type === 'Break') {
                                    return <td key={day} className="p-1 border dark:border-slate-700 bg-gray-100 dark:bg-slate-800 text-xs text-gray-400 rotate-180" style={{writingMode: 'vertical-rl'}}>{period.name}</td>;
                                }
                                const slot = timetable[day]?.[period.id];
                                return (
                                    <td key={day} className="p-0.5 border dark:border-slate-700 align-top h-16">
                                        {slot && (
                                            <div className={`h-full w-full rounded p-1 border-l-4 text-left ${subjectColorMap.get(slot.subjectId) || ''}`}>
                                                <p className="font-bold">{slot.subjectName}</p>
                                                <p className="text-[10px]">{slot.classGroupName}</p>
                                            </div>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TeacherTimetableViewer;
