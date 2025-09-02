import React, { useState, useMemo } from 'react';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, Permission, ClassGroup, TeacherAllocation, Subject } from '../types';
import TabButton from './TabButton';
import MonitoringDashboard from './MonitoringDashboard';
import MonitoringData from './MonitoringData';
import MonitoringSetup from './MonitoringSetup';
import MultiSelectFilter from './MultiSelectFilter';
import AIReportGenerator from './AIReportGenerator';

interface MonitoringProps {
    teachers: Teacher[];
    observations: Observation[];
    setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    monitoringTemplates: MonitoringTemplate[];
    setMonitoringTemplates: React.Dispatch<React.SetStateAction<MonitoringTemplate[]>>;
    currentAcademicYear: string;
    permissions: Permission[];
    classGroups: ClassGroup[];
    allocations: TeacherAllocation[];
    logAction: (action: string, details: string) => void;
}

type MonitoringTab = 'dashboard' | 'data' | 'setup' | 'ai';

const Monitoring: React.FC<MonitoringProps> = (props) => {
    const { teachers, observations, academicStructure, phaseStructures, classGroups } = props;
    const [activeTab, setActiveTab] = useState<MonitoringTab>('dashboard');
    
    const [filters, setFilters] = useState({
        phases: [] as string[],
        teachers: [] as string[],
        classGroups: [] as string[],
        subjects: [] as string[],
    });

    const handleFilterChange = (filterName: keyof typeof filters, selectedValues: string[]) => {
        setFilters(prev => ({ ...prev, [filterName]: selectedValues }));
    };

    const phaseMap = useMemo(() => new Map(phaseStructures.map(p => [p.id, p])), [phaseStructures]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg])), [classGroups]);

    const filteredObservations = useMemo(() => {
        return observations.filter(obs => {
            const teacher = teacherMap.get(obs.teacherId);
            const classGroup = obs.classGroupId ? classGroupMap.get(obs.classGroupId) : null;
            
            const phaseMatch = filters.phases.length === 0 || filters.phases.some(phaseId => {
                const phase = phaseMap.get(phaseId);
                return phase && phase.grades.includes(obs.grade) && phase.curricula.includes(obs.curriculum);
            });
            const teacherMatch = filters.teachers.length === 0 || (teacher && filters.teachers.includes(teacher.id));
            const classGroupMatch = filters.classGroups.length === 0 || (classGroup && filters.classGroups.includes(classGroup.id));
            const subjectMatch = filters.subjects.length === 0 || (obs.subjectId && filters.subjects.includes(obs.subjectId));

            return teacherMatch && classGroupMatch && subjectMatch && phaseMatch;
        });
    }, [filters, observations, teacherMap, classGroupMap, phaseMap]);

    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard':
                return <MonitoringDashboard observations={filteredObservations} {...props} />;
            case 'data':
                return <MonitoringData {...props} observations={filteredObservations} />;
            case 'setup':
                return <MonitoringSetup {...props} />;
            case 'ai':
                return <AIReportGenerator observations={filteredObservations} {...props} />;
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
                <nav className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1">
                    <TabButton tabId="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="data" label="Data Entries" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="setup" label="Setup" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    <TabButton tabId="ai" label="AI Insights" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                </nav>
            </div>
            
            <div className="bg-white dark:bg-slate-800/50 p-4 rounded-xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <MultiSelectFilter label="Phases" options={phaseStructures.map(p => ({id: p.id, name: p.phase}))} selected={filters.phases} onChange={s => handleFilterChange('phases', s)} />
                     <MultiSelectFilter label="Teachers" options={teachers.map(t => ({id: t.id, name: t.fullName}))} selected={filters.teachers} onChange={s => handleFilterChange('teachers', s)} />
                     <MultiSelectFilter label="Class Groups" options={classGroups.map(cg => ({id: cg.id, name: cg.name}))} selected={filters.classGroups} onChange={s => handleFilterChange('classGroups', s)} />
                     <MultiSelectFilter label="Subjects" options={academicStructure.subjects.map(s => ({id: s.id, name: s.name}))} selected={filters.subjects} onChange={s => handleFilterChange('subjects', s)} />
                </div>
            </div>

            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default Monitoring;
