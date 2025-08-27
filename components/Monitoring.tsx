import React, { useState, useMemo } from 'react';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate } from '../types';
import TabButton from './TabButton';
import MonitoringDashboard from './MonitoringDashboard';
import MonitoringData from './MonitoringData';
import MonitoringSetup from './MonitoringSetup';

interface MonitoringProps {
    teachers: Teacher[];
    observations: Observation[];
    setObservations: React.Dispatch<React.SetStateAction<Observation[]>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    monitoringTemplates: MonitoringTemplate[];
    setMonitoringTemplates: React.Dispatch<React.SetStateAction<MonitoringTemplate[]>>;
}

type MonitoringTab = 'dashboard' | 'data' | 'setup';

const Monitoring: React.FC<MonitoringProps> = (props) => {
    const { phaseStructures, observations, monitoringTemplates } = props;
    const [activeTab, setActiveTab] = useState<MonitoringTab>('dashboard');
    const [selectedPhaseId, setSelectedPhaseId] = useState<string>(phaseStructures[0]?.id || 'all');
    
    const phaseMap = useMemo(() => new Map(phaseStructures.map(p => [p.id, p])), [phaseStructures]);

    const filteredObservations = useMemo(() => {
        if (selectedPhaseId === 'all') return observations;
        const selectedPhase = phaseMap.get(selectedPhaseId);
        if (!selectedPhase) return [];
        return observations.filter(obs => obs.phase === selectedPhase.phase);
    }, [selectedPhaseId, observations, phaseMap]);

    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard':
                return <MonitoringDashboard observations={filteredObservations} teachers={props.teachers} monitoringTemplates={monitoringTemplates} />;
            case 'data':
                return <MonitoringData {...props} observations={filteredObservations} />;
            case 'setup':
                return <MonitoringSetup monitoringTemplates={props.monitoringTemplates} setMonitoringTemplates={props.setMonitoringTemplates} />;
            default:
                return null;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center space-x-6">
                     <nav className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1">
                        <TabButton tabId="dashboard" label="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                        <TabButton tabId="data" label="Data Entries" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                        <TabButton tabId="setup" label="Setup" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
                    </nav>
                </div>
                <div className="mt-4 sm:mt-0">
                    <label htmlFor="phase-filter" className="sr-only">Filter by Phase</label>
                    <select
                        id="phase-filter"
                        value={selectedPhaseId}
                        onChange={e => setSelectedPhaseId(e.target.value)}
                        className="bg-gray-100 dark:bg-slate-700 border-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600 py-2 px-3"
                    >
                        <option value="all">All Phases</option>
                        {phaseStructures.map(phase => (
                            <option key={phase.id} value={phase.id}>{phase.phase}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                {renderContent()}
            </div>
        </div>
    );
};

export default Monitoring;