
import React, { useMemo } from 'react';
import type { Teacher, ClassGroup, Subject, TeacherAllocation, TeacherWorkload, Permission } from '../types';
import { SubjectCategory } from '../types';
import { getSubjectPeriods } from '../App';
import { hasPermission } from '../permissions';

interface AllocationCellProps {
    classGroup: ClassGroup;
    subject: Subject;
    teachers: Teacher[];
    allocations: TeacherAllocation[];
    teacherWorkloads: Map<string, TeacherWorkload>;
    onUpdate: (classGroupId: string, subjectId: string, teacherId: string) => void;
    teacherColorMap: Map<string, { dot: string; bg: string }>;
    subjectMap: Map<string, Subject>;
    permissions: Permission[];
}

const AllocationCell: React.FC<AllocationCellProps> = ({ classGroup, subject, teachers, allocations, teacherWorkloads, onUpdate, teacherColorMap, subjectMap, permissions }) => {
    
    const currentAllocation = useMemo(() => {
        return allocations.find(a => a.classGroupId === classGroup.id && a.subjectId === subject.id);
    }, [allocations, classGroup.id, subject.id]);

    const assignedTeacher = useMemo(() => {
        if (!currentAllocation) return null;
        return teachers.find(t => t.id === currentAllocation.teacherId);
    }, [currentAllocation, teachers]);

    const qualifiedTeachers = useMemo(() => {
        return teachers.filter(t => t.specialties.includes(subject.name) && t.employmentStatus !== 'On Leave');
    }, [teachers, subject.name]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate(classGroup.id, subject.id, e.target.value);
    };
    
    const assignedTeacherWorkload = assignedTeacher ? teacherWorkloads.get(assignedTeacher.id) : null;
    
    const color = assignedTeacher ? teacherColorMap.get(assignedTeacher.id) : undefined;
    
    const cellBg = color ? color.bg : 'bg-transparent';

    const actualPeriods = getSubjectPeriods(subject, classGroup.curriculum, classGroup.grade, classGroup.mode);

    const effectiveLearners = useMemo(() => {
        if (subject.category === SubjectCategory.Elective && subject.electiveGroup) {
            const competingSubjects = classGroup.subjectIds
                .map(id => subjectMap.get(id))
                .filter((s): s is Subject => !!s)
                .filter(s => s.category === SubjectCategory.Elective && s.electiveGroup === subject.electiveGroup);

            if (competingSubjects.length > 1) {
                return Math.ceil(classGroup.learnerCount / competingSubjects.length);
            }
        }
        return classGroup.learnerCount;
    }, [subject, classGroup, subjectMap]);

    return (
        <div className={`p-1.5 h-full w-full rounded-md transition-all duration-200 ${cellBg}`}>
            <select
                value={currentAllocation?.teacherId || 'unassigned'}
                onChange={handleChange}
                className="w-full text-sm font-medium border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-white dark:bg-slate-700 py-2 px-2.5 disabled:opacity-70 disabled:cursor-not-allowed"
                title={assignedTeacher ? `Assigned to ${assignedTeacher.fullName}`: 'Assign a teacher'}
                disabled={!hasPermission(permissions, 'edit:allocations')}
            >
                <option value="unassigned">-- Unassigned --</option>
                <optgroup label="Qualified Teachers">
                    {qualifiedTeachers.map(teacher => {
                        const workload = teacherWorkloads.get(teacher.id);
                        const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);
                        const workloadInfo = `(${workload?.totalPeriods || 0}/${totalMaxPeriods}p • ${workload?.totalLearners || 0}/${teacher.maxLearners}L)`;
                        return (
                            <option key={teacher.id} value={teacher.id} title={`${teacher.fullName} | ${workloadInfo}`}>
                                {teacher.fullName} {workloadInfo}
                            </option>
                        );
                    })}
                </optgroup>
            </select>
             <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 px-1 space-y-1">
                {assignedTeacher && assignedTeacherWorkload ? (
                    <>
                        <div className="font-semibold text-gray-800 dark:text-gray-200 truncate" title={assignedTeacher.fullName}>
                            {assignedTeacher.fullName}
                        </div>
                        <div className="truncate" title={`Teacher total: ${assignedTeacherWorkload.totalPeriods}p • ${assignedTeacherWorkload.totalClasses}c • ${assignedTeacherWorkload.totalLearners}L`}>
                            <span className="font-medium">T:</span> {assignedTeacherWorkload.totalPeriods}p &bull; {assignedTeacherWorkload.totalClasses}c &bull; {assignedTeacherWorkload.totalLearners}L
                        </div>
                    </>
                ) : (
                    <div className="h-[17px]"></div> // Placeholder for consistent height
                )}
                <div className="truncate text-gray-600 dark:text-gray-300 font-medium" title={`Class cost: ${actualPeriods} periods • 1 class • ${effectiveLearners} learners`}>
                     <span className="font-medium">C:</span> {actualPeriods}p &bull; 1c &bull; {effectiveLearners}L
                </div>
            </div>
        </div>
    );
};

export default AllocationCell;
