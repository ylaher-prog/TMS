import React, { useState } from 'react';
import type { Teacher, AcademicStructure, TeacherWorkload, PhaseStructure, TeacherAllocation, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, TimetableHistoryEntry, TimeGrid } from '../types';
import TeacherList from './TeacherList';
import Organogram from './Organogram';
import TabButton from './TabButton';

interface AcademicTeamProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    workloads: Map<string, TeacherWorkload>;
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    leaveRequests: LeaveRequest[];
    observations: Observation[];
    monitoringTemplates: MonitoringTemplate[];
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
}

type AcademicTeamTab = 'list' | 'organogram';

const AcademicTeam: React.FC<AcademicTeamProps> = (props) => {
    const [activeTab, setActiveTab] = useState<AcademicTeamTab>('list');

    return (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="list" label="Staff List" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                <TabButton tabId="organogram" label="Organogram" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            </div>

            {activeTab === 'list' && <TeacherList {...props} />}
            {activeTab === 'organogram' && <Organogram teachers={props.teachers} academicStructure={props.academicStructure} phaseStructures={props.phaseStructures} allocations={props.allocations} classGroups={props.classGroups} />}
        </div>
    );
};

export default AcademicTeam;