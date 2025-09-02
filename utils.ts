import type { Subject, ClassGroup } from './types';
import { SubjectCategory } from './types';

export const getSubjectPeriods = (subject: Subject, curriculum: string, grade: string, mode: string): number => {
    const override = subject.periodOverrides?.find(o => o.curriculum === curriculum && o.grade === grade && o.mode === mode);
    if (override) {
        return Number(override.periods) || 0;
    }
    
    const modePeriod = (subject.periodsByMode || []).find(p => p.mode === mode);
    return modePeriod ? (Number(modePeriod.periods) || 0) : 0;
};

export const getEffectiveLearnerCount = (subject: Subject, group: ClassGroup, subjectMap: Map<string, Subject>): number => {
    if (subject.category === SubjectCategory.Elective && subject.electiveGroup) {
        const competingSubjects = group.subjectIds
            .map(id => subjectMap.get(id))
            .filter((s): s is Subject => !!s)
            .filter(s => s.category === SubjectCategory.Elective && s.electiveGroup === subject.electiveGroup);

        if (competingSubjects.length > 1) {
            return Math.ceil(group.learnerCount / competingSubjects.length);
        }
    }
    return group.learnerCount;
};
