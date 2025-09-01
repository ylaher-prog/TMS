import React, { useMemo } from 'react';
import Modal from './Modal';
import type { Teacher, Subject, ClassGroup, TimeConstraint, TimeGrid } from '../types';
import { SubjectCategory } from '../types';

type Lesson = {
    classGroup: ClassGroup;
    subject: Subject;
    teacher: Teacher;
    duration: number;
    id: string;
};

interface ConstraintAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: Lesson | null;
    timeConstraints: TimeConstraint[];
    timeGrids: TimeGrid[];
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode; status?: 'ok' | 'warning' | 'error' }> = ({ label, value, status }) => {
    const statusClasses = {
        ok: 'text-green-600 dark:text-green-400',
        warning: 'text-amber-600 dark:text-amber-400',
        error: 'text-red-600 dark:text-red-400',
    };
    return (
        <div className="flex justify-between items-center py-2 border-b dark:border-slate-700">
            <span className="font-semibold text-gray-600 dark:text-gray-300">{label}</span>
            <span className={`text-sm ${status ? statusClasses[status] : ''}`}>{value}</span>
        </div>
    );
};

const ConstraintAnalysisModal: React.FC<ConstraintAnalysisModalProps> = ({ isOpen, onClose, lesson, timeConstraints, timeGrids }) => {
    
    const analysis = useMemo(() => {
        if (!lesson) return null;

        const { teacher, subject, classGroup } = lesson;
        const grid = timeGrids.find(g => g.id === classGroup.timeGridId);
        if (!grid) return null;

        const totalSlotsInGrid = grid.days.length * grid.periods.filter(p => p.type === 'Lesson').length;
        
        // Teacher Availability Analysis
        const teacherUnavailableSlots = timeConstraints.filter(c => c.type === 'not-available' && c.targetType === 'teacher' && c.targetId === teacher.id);
        const availableSlotsForTeacher = totalSlotsInGrid - teacherUnavailableSlots.length;
        const teacherAvailabilityPercent = totalSlotsInGrid > 0 ? (availableSlotsForTeacher / totalSlotsInGrid) * 100 : 0;
        let teacherAvailabilityStatus: 'ok' | 'warning' | 'error' = 'ok';
        if (teacherAvailabilityPercent < 50) teacherAvailabilityStatus = 'error';
        else if (teacherAvailabilityPercent < 75) teacherAvailabilityStatus = 'warning';

        // Subject Rule Analysis
        const subjectRule = timeConstraints.find(c => c.type === 'subject-rule' && c.classGroupId === classGroup.id && (c.subjectId === subject.id || (subject.category === SubjectCategory.Elective && subject.electiveGroup && (c as any).subject?.electiveGroup === subject.electiveGroup))) as Extract<TimeConstraint, { type: 'subject-rule' }> | undefined;
        
        // Class Group Saturation Analysis
        // This is a simplified analysis as we don't have the current state of the timetable being built
        const periodsRequiredForGroup = classGroup.subjectIds.reduce((total, sId) => {
            const subj = timeConstraints.find(c => c.type === 'subject-rule' && c.classGroupId === classGroup.id && c.subjectId === sId) as Extract<TimeConstraint, { type: 'subject-rule' }> | undefined;
            if (subj) {
                return total + subj.rules.lessonDefinitions.reduce((subTotal, def) => subTotal + (def.count * def.duration), 0);
            }
            return total;
        }, 0);
        
        const groupSaturationPercent = totalSlotsInGrid > 0 ? (periodsRequiredForGroup / totalSlotsInGrid) * 100 : 0;
        let groupSaturationStatus: 'ok' | 'warning' | 'error' = 'ok';
        if (groupSaturationPercent > 90) groupSaturationStatus = 'error';
        else if (groupSaturationPercent > 75) groupSaturationStatus = 'warning';


        return {
            teacher,
            subject,
            classGroup,
            grid,
            teacherAvailability: {
                total: totalSlotsInGrid,
                unavailable: teacherUnavailableSlots.length,
                available: availableSlotsForTeacher,
                percent: teacherAvailabilityPercent,
                status: teacherAvailabilityStatus,
            },
            subjectRule,
            groupSaturation: {
                total: totalSlotsInGrid,
                required: periodsRequiredForGroup,
                percent: groupSaturationPercent,
                status: groupSaturationStatus,
            }
        };

    }, [lesson, timeConstraints, timeGrids]);

    if (!analysis) {
        return <Modal isOpen={isOpen} onClose={onClose} title="Constraint Analysis"><p>Loading analysis...</p></Modal>;
    }
    
    const { teacher, subject, classGroup, teacherAvailability, subjectRule, groupSaturation } = analysis;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Constraint Analysis" size="lg">
            <div className="space-y-6">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                    <p className="text-xs text-amber-600 dark:text-amber-400">ANALYSING CONSTRAINTS FOR</p>
                    <p className="font-bold text-lg text-amber-800 dark:text-amber-300">
                        {subject.name} for {classGroup.name}
                    </p>
                </div>

                <div>
                    <h4 className="font-semibold text-brand-navy dark:text-gray-200 mb-2">Teacher: {teacher.fullName}</h4>
                    <div className="p-3 border dark:border-slate-700 rounded-md">
                        <InfoRow label="Availability" value={`${teacherAvailability.available} / ${teacherAvailability.total} slots (${teacherAvailability.percent.toFixed(0)}%)`} status={teacherAvailability.status} />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                           This teacher has been marked as unavailable for <strong>{teacherAvailability.unavailable}</strong> periods in this class group's time grid. Very low availability can make scheduling extremely difficult.
                        </p>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-semibold text-brand-navy dark:text-gray-200 mb-2">Subject Rules for "{subject.name}"</h4>
                    {subjectRule ? (
                        <div className="p-3 border dark:border-slate-700 rounded-md">
                            <InfoRow label="Lesson Distribution" value={subjectRule.rules.lessonDefinitions.map(d => `${d.count}x ${d.duration}p`).join(', ')} />
                            <InfoRow label="Min Days Apart" value={subjectRule.rules.minDaysApart} />
                            <InfoRow label="Max Periods / Day" value={subjectRule.rules.maxPeriodsPerDay || 'None'} />
                            <InfoRow label="Max Consecutive" value={subjectRule.rules.maxConsecutive || 'None'} />
                            <InfoRow label="Must Be Every Day" value={subjectRule.rules.mustBeEveryDay ? 'Yes' : 'No'} status={subjectRule.rules.mustBeEveryDay ? 'warning' : 'ok'} />
                            <InfoRow label="Preferred Time" value={subjectRule.rules.preferredTime || 'Any'} />
                             <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                Strict rules, especially 'Must be every day' or a low 'Max Periods/Day', significantly reduce the number of valid placement options.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No specific rules found for this subject.</p>
                    )}
                </div>

                 <div>
                    <h4 className="font-semibold text-brand-navy dark:text-gray-200 mb-2">Class Group: {classGroup.name}</h4>
                    <div className="p-3 border dark:border-slate-700 rounded-md">
                        <InfoRow label="Schedule Saturation" value={`${groupSaturation.required} / ${groupSaturation.total} slots (${groupSaturation.percent.toFixed(0)}%)`} status={groupSaturation.status} />
                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            This is the percentage of available lesson slots required by all subjects in this class group. A high saturation means there is very little flexibility for placement.
                        </p>
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default ConstraintAnalysisModal;