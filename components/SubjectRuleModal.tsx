import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import type { TimeConstraint, ClassGroup, AcademicStructure, Subject } from '../types';

interface SubjectRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (constraint: TimeConstraint) => void;
    existingConstraint?: TimeConstraint | null;
    classGroups: ClassGroup[];
    academicStructure: AcademicStructure;
}

const SubjectRuleModal: React.FC<SubjectRuleModalProps> = ({
    isOpen,
    onClose,
    onSave,
    existingConstraint,
    classGroups,
    academicStructure,
}) => {
    
    type SubjectRuleConstraint = Extract<TimeConstraint, { type: 'subject-rule' }>;
    type SubjectRules = SubjectRuleConstraint['rules'];

    const [classGroupId, setClassGroupId] = useState<string>('');
    const [subjectId, setSubjectId] = useState<string>('');
    const [rules, setRules] = useState<SubjectRules>({
        lessonDefinitions: [],
        minDaysApart: 0,
        maxPeriodsPerDay: undefined,
        maxConsecutive: undefined,
        mustBeEveryDay: false,
        preferredTime: 'any',
    });

    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);

    const availableSubjects = useMemo(() => {
        if (!classGroupId) return [];
        const group = classGroups.find(cg => cg.id === classGroupId);
        if (!group) return [];
        return group.subjectIds.map(id => subjectMap.get(id)).filter((s): s is Subject => !!s);
    }, [classGroupId, classGroups, subjectMap]);
    
    useEffect(() => {
        if (existingConstraint && existingConstraint.type === 'subject-rule') {
            setClassGroupId(existingConstraint.classGroupId);
            setSubjectId(existingConstraint.subjectId);
            setRules(existingConstraint.rules);
        } else {
            const firstGroup = classGroups[0];
            setClassGroupId(firstGroup?.id || '');
            const firstGroupSubjects = firstGroup ? firstGroup.subjectIds.map(id => subjectMap.get(id)).filter(Boolean) as Subject[] : [];
            setSubjectId(firstGroupSubjects[0]?.id || '');
            setRules({
                lessonDefinitions: [],
                minDaysApart: 0,
                maxPeriodsPerDay: undefined,
                maxConsecutive: undefined,
                mustBeEveryDay: false,
                preferredTime: 'any',
            });
        }
    }, [isOpen, existingConstraint, classGroups, subjectMap]);
    
     useEffect(() => {
        if (availableSubjects.length > 0 && !availableSubjects.find(s => s.id === subjectId)) {
            setSubjectId(availableSubjects[0].id);
        } else if (availableSubjects.length === 0) {
            setSubjectId('');
        }
    }, [availableSubjects, subjectId]);


    const handleRuleChange = (field: keyof SubjectRules, value: any) => {
        setRules(prev => {
            const newValue = (typeof value === 'string' && value === '') ? null : value;
            return { ...prev, [field]: newValue };
        });
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!classGroupId || !subjectId) {
            alert('Please select a class group and a subject.');
            return;
        }

        const selectedGroup = classGroups.find(cg => cg.id === classGroupId);
        if (!selectedGroup) {
            alert('Selected class group not found.');
            return;
        }

        const constraint: SubjectRuleConstraint = {
            id: existingConstraint?.id || `sr-${Date.now()}`,
            type: 'subject-rule',
            classGroupId,
            subjectId,
            academicYear: selectedGroup.academicYear,
            rules: {
                ...rules,
                maxPeriodsPerDay: rules.maxPeriodsPerDay ? Number(rules.maxPeriodsPerDay) : null,
                maxConsecutive: rules.maxConsecutive ? Number(rules.maxConsecutive) : null,
            },
        };
        onSave(constraint);
    };
    
    const FormLabel: React.FC<{ children: React.ReactNode}> = ({ children }) => (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{children}</label>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={existingConstraint ? "Edit Subject Rule" : "Add Subject Rule"}>
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800 dark:text-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <FormLabel>Class Group</FormLabel>
                        <select value={classGroupId} onChange={e => setClassGroupId(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                            {classGroups.map(cg => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <FormLabel>Subject</FormLabel>
                        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!classGroupId} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                            {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="border-t dark:border-slate-700 pt-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <FormLabel>Max Periods Per Day</FormLabel>
                            <input type="number" min="0" value={rules.maxPeriodsPerDay ?? ''} onChange={e => handleRuleChange('maxPeriodsPerDay', e.target.value)} placeholder="Leave blank for no limit" className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                         <div>
                            <FormLabel>Max Consecutive Periods</FormLabel>
                            <input type="number" min="0" value={rules.maxConsecutive ?? ''} onChange={e => handleRuleChange('maxConsecutive', e.target.value)} placeholder="Leave blank for no limit" className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                    </div>
                    <div>
                        <FormLabel>Preferred Time of Day</FormLabel>
                        <div className="flex items-center space-x-4 mt-1">
                            {['any', 'morning', 'afternoon'].map(time => (
                                <label key={time} className="flex items-center space-x-2 cursor-pointer">
                                    <input type="radio" name="preferredTime" value={time} checked={rules.preferredTime === time} onChange={e => handleRuleChange('preferredTime', e.target.value)} className="h-4 w-4 text-brand-primary focus:ring-brand-primary" />
                                    <span className="capitalize">{time}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" checked={!!rules.mustBeEveryDay} onChange={e => handleRuleChange('mustBeEveryDay', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
                            <span>This subject must be scheduled every day of the week.</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                    <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">Save Rule</button>
                </div>
            </form>
        </Modal>
    );
};

export default SubjectRuleModal;