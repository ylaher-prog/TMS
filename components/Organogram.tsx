import React, { useState, useMemo } from 'react';
import type { Teacher, AcademicStructure, PhaseStructure, TeacherAllocation, ClassGroup } from '../types';
import MultiSelectFilter from './MultiSelectFilter';

interface OrganogramProps {
    teachers: Teacher[];
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
}

// A vibrant, accessible color palette for positions
const POSITION_COLORS = [
    '#0B2042', // brand-navy
    '#8D1D4B', // brand-primary
    '#AD9040', // brand-accent
    '#16A34A', // green-600
    '#0284C7', // sky-600
    '#7C3AED', // violet-600
    '#DB2777', // pink-600
    '#EA580C', // orange-600
];

const OrganogramNode: React.FC<{ teacher: Teacher; positionName: string; positionColor: string }> = ({ teacher, positionName, positionColor }) => {
    return (
        <div className="flex w-60 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 overflow-hidden">
            <div className="w-16 h-16 p-2 flex-shrink-0">
                <img className="h-full w-full rounded-full object-cover" src={teacher.avatarUrl} alt={teacher.fullName} />
            </div>
            <div className="flex-grow flex flex-col border-l dark:border-slate-700">
                <div style={{ backgroundColor: positionColor }} className="px-2 py-1 text-white text-[10px] font-bold uppercase tracking-wider text-center">
                    {positionName}
                </div>
                <div className="px-2 py-1 text-center flex-grow flex items-center justify-center">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 leading-tight">{teacher.fullName}</p>
                </div>
            </div>
        </div>
    );
};


const Organogram: React.FC<OrganogramProps> = ({ teachers, academicStructure, phaseStructures, allocations, classGroups }) => {
    const [filters, setFilters] = useState({
        positions: [] as string[],
        curricula: [] as string[],
        phases: [] as string[],
        subjects: [] as string[],
    });

    const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    
    const positionColorMap = useMemo(() => {
        const map = new Map<string, string>();
        academicStructure.positions.forEach((pos, index) => {
            map.set(pos.id, POSITION_COLORS[index % POSITION_COLORS.length]);
        });
        return map;
    }, [academicStructure.positions]);

    const reportsMap = useMemo(() => {
        const map = new Map<string, string[]>();
        teachers.forEach(t => {
            const managerId = t.managerId || 'root';
            if (!map.has(managerId)) {
                map.set(managerId, []);
            }
            map.get(managerId)!.push(t.id);
        });
        return map;
    }, [teachers]);

    const teacherContextMap = useMemo(() => {
        const contextMap = new Map<string, { curricula: Set<string>; phases: Set<string>; subjects: Set<string> }>();
        const groupMap = new Map(classGroups.map(cg => [cg.id, cg]));
        const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));

        allocations.forEach(alloc => {
            if (!contextMap.has(alloc.teacherId)) {
                contextMap.set(alloc.teacherId, { curricula: new Set(), phases: new Set(), subjects: new Set() });
            }
            const context = contextMap.get(alloc.teacherId)!;
            const group = groupMap.get(alloc.classGroupId);
            const subject = subjectMap.get(alloc.subjectId);

            if (group && subject) {
                context.curricula.add(group.curriculum);
                context.subjects.add(subject.name);
                const phase = phaseStructures.find(p => p.curricula.includes(group.curriculum) && p.grades.includes(group.grade));
                if (phase) {
                    context.phases.add(phase.phase);
                }
            }
        });
        return contextMap;
    }, [allocations, classGroups, phaseStructures, academicStructure.subjects]);

    const visibleTeacherIds = useMemo(() => {
        const hasFilters = filters.positions.length > 0 || filters.curricula.length > 0 || filters.phases.length > 0 || filters.subjects.length > 0;
        if (!hasFilters) {
            return new Set(teachers.map(t => t.id));
        }

        const filteredSet = new Set<string>();
        teachers.forEach(teacher => {
            const context = teacherContextMap.get(teacher.id) || { curricula: new Set(), phases: new Set(), subjects: new Set() };
            const positionName = positionMap.get(teacher.positionId) || '';

            const positionMatch = filters.positions.length === 0 || filters.positions.includes(positionName);
            const curriculumMatch = filters.curricula.length === 0 || filters.curricula.some(c => context.curricula.has(c));
            const phaseMatch = filters.phases.length === 0 || filters.phases.some(p => context.phases.has(p));
            const subjectMatch = filters.subjects.length === 0 || filters.subjects.some(s => context.subjects.has(s));

            if (positionMatch && curriculumMatch && phaseMatch && subjectMatch) {
                filteredSet.add(teacher.id);
            }
        });

        // Ensure managers of filtered staff are also visible to maintain the tree structure
        const finalSet = new Set(filteredSet);
        filteredSet.forEach(id => {
            let current = teacherMap.get(id);
            while (current && current.managerId) {
                finalSet.add(current.managerId);
                current = teacherMap.get(current.managerId);
            }
        });

        return finalSet;
    }, [filters, teachers, teacherMap, teacherContextMap, positionMap]);

    const renderTree = (managerId: string = 'root'): JSX.Element[] | null => {
        const reports = reportsMap.get(managerId) || [];
        const visibleReports = reports.filter(id => visibleTeacherIds.has(id));
        
        if (visibleReports.length === 0) return null;

        return visibleReports.map(teacherId => {
            const teacher = teacherMap.get(teacherId);
            if (!teacher) return null;
            
            const children = renderTree(teacherId);
            const positionName = positionMap.get(teacher.positionId) || 'N/A';
            const positionColor = positionColorMap.get(teacher.positionId) || '#6B7280'; // gray-500

            return (
                <li key={teacherId} className="flex flex-col items-center relative">
                    {/* The node itself */}
                    <OrganogramNode teacher={teacher} positionName={positionName} positionColor={positionColor} />

                    {/* Vertical connector line pointing down from the node */}
                    {children && children.length > 0 && (
                         <div className="absolute top-full left-1/2 -translate-x-1/2 h-8 w-px bg-gray-300 dark:bg-slate-600"></div>
                    )}
                    
                    {/* The container for children nodes */}
                    {children && children.length > 0 && (
                         <ul className="flex pt-16 relative">
                             {/* Horizontal connector line above children */}
                             <div className="absolute top-8 left-0 right-0 h-px bg-gray-300 dark:bg-slate-600"></div>
                             {children.map((child, index) => (
                                 <li key={index} className="px-4 relative">
                                     {/* Vertical connector lines pointing up from each child to the horizontal line */}
                                     <div className="absolute bottom-full left-1/2 -translate-x-1/2 h-8 w-px bg-gray-300 dark:bg-slate-600"></div>
                                     {child}
                                 </li>
                             ))}
                         </ul>
                    )}
                </li>
            );
        });
    };

    const handleFilterChange = (filterName: keyof typeof filters, selectedValues: string[]) => {
        setFilters(prev => ({ ...prev, [filterName]: selectedValues }));
    };

    const allPositions = academicStructure.positions.map(p => p.name).sort();
    const allCurricula = academicStructure.curricula.sort();
    const allPhases = [...new Set(phaseStructures.map(p => p.phase))].sort();
    const allSubjects = [...new Set(academicStructure.subjects.map(s => s.name))].sort();

    const renderedTree = renderTree();

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Organizational Chart</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-3 border-y dark:border-slate-700">
                <MultiSelectFilter label="Positions" options={allPositions} selected={filters.positions} onChange={(s) => handleFilterChange('positions', s)} />
                <MultiSelectFilter label="Curricula" options={allCurricula} selected={filters.curricula} onChange={(s) => handleFilterChange('curricula', s)} />
                <MultiSelectFilter label="Phases" options={allPhases} selected={filters.phases} onChange={(s) => handleFilterChange('phases', s)} />
                <MultiSelectFilter label="Subjects" options={allSubjects} selected={filters.subjects} onChange={(s) => handleFilterChange('subjects', s)} />
            </div>
            <div className="overflow-auto p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg min-h-[60vh]">
                {renderedTree && renderedTree.length > 0 ? (
                    <ul className="flex items-start justify-center">
                        {renderedTree}
                    </ul>
                ) : (
                    <div className="flex items-center justify-center h-full text-center text-brand-text-light dark:text-gray-400">
                        No staff members match the current filter criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Organogram;