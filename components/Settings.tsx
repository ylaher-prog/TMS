

import React, { useState, useMemo, useEffect } from 'react';
import type { Teacher, AcademicStructure, ClassGroup, Position, PhaseStructure, Subject, AllocationSettings, GeneralSettings, Permission, AuditLog } from '../types';
import { PlusIcon, ArrowUpTrayIcon, PencilIcon, TrashIcon, ArrowDownTrayIcon, CheckIcon, XMarkIcon, ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';
import AddEditTeacherModal from './AddEditTeacherModal';
import BulkImportModal from './BulkImportModal';
import StructureManager from './StructureManager';
import AddEditClassGroupModal from './AddEditClassGroupModal';
import ConfirmationModal from './ConfirmationModal';
import SubjectManager from './SubjectManager';
import BulkImportClassGroupsModal from './BulkImportClassGroupsModal';
import PhaseStructureManager from './PhaseStructureManager';
import { getSubjectPeriods } from '../App';
import AllocationSettingsManager from './AllocationSettingsManager';
import EmailSettingsManager from './EmailSettingsManager';
import TabButton from './TabButton';
import PositionManager from './PositionManager';
import { TableFilterInput } from './FormControls';
import { hasPermission } from '../permissions';
import PermissionsManager from './PermissionsManager';
import AuditTrailViewer from './AuditTrailViewer';

interface SettingsProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  academicStructure: AcademicStructure;
  setAcademicStructure: React.Dispatch<React.SetStateAction<AcademicStructure>>;
  phaseStructures: PhaseStructure[];
  setPhaseStructures: React.Dispatch<React.SetStateAction<PhaseStructure[]>>;
  classGroups: ClassGroup[];
  setClassGroups: React.Dispatch<React.SetStateAction<ClassGroup[]>>;
  allocationSettings: AllocationSettings;
  setAllocationSettings: React.Dispatch<React.SetStateAction<AllocationSettings>>;
  generalSettings: GeneralSettings;
  setGeneralSettings: React.Dispatch<React.SetStateAction<GeneralSettings>>;
  currentUser: Teacher;
  onResetState: () => void;
  currentAcademicYear: string;
  permissions: Permission[];
  auditLog: AuditLog[];
  logAction: (action: string, details: string) => void;
}

type SettingsTab = 'academicSetup' | 'permissions' | 'general';
type AcademicSubTab = 'baseItems' | 'subjects' | 'classGroups' | 'phases' | 'teachers';
type GeneralSubTab = 'allocations' | 'email' | 'system';

const Settings: React.FC<SettingsProps> = (props) => {
  const { 
    teachers, setTeachers, 
    academicStructure, setAcademicStructure, 
    phaseStructures, setPhaseStructures,
    classGroups, setClassGroups,
    allocationSettings, setAllocationSettings,
    generalSettings, setGeneralSettings,
    currentUser,
    onResetState,
    currentAcademicYear,
    permissions,
    auditLog,
    logAction
  } = props;
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('academicSetup');
  const [activeAcademicTab, setActiveAcademicTab] = useState<AcademicSubTab>('baseItems');
  const [activeGeneralTab, setActiveGeneralTab] = useState<GeneralSubTab>('system');

  const [isAddTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [isBulkTeacherModalOpen, setBulkTeacherModalOpen] = useState(false);

  const [classGroupToEdit, setClassGroupToEdit] = useState<ClassGroup | null>(null);
  const [classGroupToDelete, setClassGroupToDelete] = useState<ClassGroup | null>(null);
  const [isAddClassGroupModalOpen, setAddClassGroupModalOpen] = useState(false);
  const [isBulkGroupModalOpen, setBulkGroupModalOpen] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);

  const [groupFilters, setGroupFilters] = useState({ name: '', academicYear: currentAcademicYear, details: '' });
  const [groupSortConfig, setGroupSortConfig] = useState<{key: string, direction: 'ascending' | 'descending'} | null>(null);

  useEffect(() => {
    setGroupFilters(prev => ({...prev, academicYear: currentAcademicYear}));
  }, [currentAcademicYear]);


  const { subjects, curricula, grades, modes, academicPeriods, positions } = academicStructure;
  const subjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s.name])), [subjects]);
  const fullSubjectMap = useMemo(() => new Map(subjects.map(s => [s.id, s])), [subjects]);
  const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p.name])), [positions]);
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);

  const handleUpdateStructure = (key: keyof AcademicStructure, items: any) => {
    setAcademicStructure(prev => ({...prev, [key]: items}));
  };
  
  const handleDeleteClassGroup = () => {
    if (classGroupToDelete) {
        setClassGroups(prev => prev.filter(cg => cg.id !== classGroupToDelete.id));
        setClassGroupToDelete(null);
    }
  };

  const sortedAndFilteredClassGroups = useMemo(() => {
    let filtered = classGroups.filter(cg =>
        cg.name.toLowerCase().includes(groupFilters.name.toLowerCase()) &&
        cg.academicYear.toLowerCase().includes(groupFilters.academicYear.toLowerCase()) &&
        `${cg.grade} - ${cg.curriculum}`.toLowerCase().includes(groupFilters.details.toLowerCase())
    );

    if (groupSortConfig !== null) {
        filtered.sort((a, b) => {
            const aVal = a[groupSortConfig.key as keyof ClassGroup];
            const bVal = b[groupSortConfig.key as keyof ClassGroup];
            if (aVal < bVal) return groupSortConfig.direction === 'ascending' ? -1 : 1;
            if (aVal > bVal) return groupSortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
    }

    return filtered;
  }, [classGroups, groupFilters, groupSortConfig]);
  
  const requestGroupSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (groupSortConfig && groupSortConfig.key === key && groupSortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setGroupSortConfig({ key, direction });
  };
  
  const handleGroupFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGroupFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const getGroupSortIcon = (key: string) => {
    if (!groupSortConfig || groupSortConfig.key !== key) {
        return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }
    return groupSortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
  };

  const canViewAcademicSetup = useMemo(() => 
    hasPermission(permissions, 'edit:settings-base') ||
    hasPermission(permissions, 'edit:settings-subjects') ||
    hasPermission(permissions, 'edit:settings-classgroups') ||
    hasPermission(permissions, 'edit:settings-phases') ||
    hasPermission(permissions, 'add:teacher') ||
    hasPermission(permissions, 'import:teachers'), 
  [permissions]);

  return (
    <div className="space-y-6">
      <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
        {canViewAcademicSetup && <TabButton tabId="academicSetup" label="Academic Setup" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
        {hasPermission(permissions, 'edit:settings-permissions') && <TabButton tabId="permissions" label="Permissions" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
        {hasPermission(permissions, 'edit:settings-general') && <TabButton tabId="general" label="General" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />}
      </div>

      {activeTab === 'academicSetup' && canViewAcademicSetup && (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1 self-start">
                {hasPermission(permissions, 'edit:settings-base') && <TabButton tabId="baseItems" label="Base Items" activeTab={activeAcademicTab} setActiveTab={setActiveAcademicTab as (tabId: string) => void} />}
                {hasPermission(permissions, 'edit:settings-subjects') && <TabButton tabId="subjects" label="Subjects" activeTab={activeAcademicTab} setActiveTab={setActiveAcademicTab as (tabId: string) => void} />}
                {hasPermission(permissions, 'edit:settings-classgroups') && <TabButton tabId="classGroups" label="Class Groups" activeTab={activeAcademicTab} setActiveTab={setActiveAcademicTab as (tabId: string) => void} />}
                {hasPermission(permissions, 'edit:settings-phases') && <TabButton tabId="phases" label="Phases & Hierarchy" activeTab={activeAcademicTab} setActiveTab={setActiveAcademicTab as (tabId: string) => void} />}
                {(hasPermission(permissions, 'add:teacher') || hasPermission(permissions, 'import:teachers')) && <TabButton tabId="teachers" label="Teachers" activeTab={activeAcademicTab} setActiveTab={setActiveAcademicTab as (tabId: string) => void} />}
            </div>

            {activeAcademicTab === 'baseItems' && hasPermission(permissions, 'edit:settings-base') && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <StructureManager title="Academic Years" items={academicStructure.academicYears.sort().reverse()} onUpdateItems={(items) => handleUpdateStructure('academicYears', items)} itemNoun="academic year" />
                  <StructureManager title="Curricula" items={curricula} onUpdateItems={(items) => handleUpdateStructure('curricula', items)} itemNoun="curriculum" />
                  <StructureManager title="Grades" items={grades} onUpdateItems={(items) => handleUpdateStructure('grades', items)} itemNoun="grade" />
                  <StructureManager title="Modes" items={modes} onUpdateItems={(items) => handleUpdateStructure('modes', items)} itemNoun="mode" />
                </div>
            )}
            
            {activeAcademicTab === 'subjects' && hasPermission(permissions, 'edit:settings-subjects') && (
                <SubjectManager academicStructure={academicStructure} onUpdateSubjects={(newSubjects) => handleUpdateStructure('subjects', newSubjects)} />
            )}

            {activeAcademicTab === 'classGroups' && hasPermission(permissions, 'edit:settings-classgroups') && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Class Groups ({classGroups.length})</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setBulkGroupModalOpen(true)} className="bg-brand-dark-gray text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-slate-800 transition-colors"><ArrowUpTrayIcon className="w-4 h-4"/> Import Groups</button>
                            <button onClick={() => setAddClassGroupModalOpen(true)} className="bg-brand-primary text-white px-3 py-2 text-sm rounded-md flex items-center gap-1.5 font-medium hover:bg-rose-900 transition-colors"><PlusIcon className="w-4 h-4"/> Add Group</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                            <thead className="bg-gray-50 dark:bg-slate-700/50">
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestGroupSort('name')}>Name {getGroupSortIcon('name')}</div></th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestGroupSort('academicYear')}>Year {getGroupSortIcon('academicYear')}</div></th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"><div className="flex items-center gap-1 cursor-pointer" onClick={() => requestGroupSort('grade')}>Details {getGroupSortIcon('grade')}</div></th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Learners</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subjects</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                                <tr>
                                    <th className="px-2 py-2"><TableFilterInput type="text" name="name" placeholder="Filter..." value={groupFilters.name} onChange={handleGroupFilterChange} /></th>
                                    <th className="px-2 py-2"><TableFilterInput type="text" name="academicYear" placeholder="Filter..." value={groupFilters.academicYear} onChange={handleGroupFilterChange} /></th>
                                    <th className="px-2 py-2"><TableFilterInput type="text" name="details" placeholder="Filter..." value={groupFilters.details} onChange={handleGroupFilterChange} /></th>
                                    <th className="px-2 py-2"></th>
                                    <th className="px-2 py-2"></th>
                                    <th className="px-2 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                                {sortedAndFilteredClassGroups.map(cg => (
                                    <tr key={cg.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-200">{cg.name}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{cg.academicYear}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{cg.grade} &bull; {cg.curriculum} &bull; {cg.mode}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{cg.learnerCount}</td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400" title={cg.subjectIds.map(id => subjectMap.get(id)).join(', ')}>{cg.subjectIds.length} subjects</td>
                                        <td className="px-4 py-3"><div className="flex items-center space-x-2"><button onClick={() => setClassGroupToEdit(cg)} className="text-brand-accent hover:text-amber-700"><PencilIcon className="h-5 w-5"/></button><button onClick={() => setClassGroupToDelete(cg)} className="text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5"/></button></div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {activeAcademicTab === 'phases' && hasPermission(permissions, 'edit:settings-phases') && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <PhaseStructureManager 
                        phaseStructures={phaseStructures} 
                        setPhaseStructures={setPhaseStructures} 
                        academicStructure={academicStructure} 
                        teachers={teachers} 
                    />
                    <PositionManager 
                        academicStructure={academicStructure}
                        setAcademicStructure={setAcademicStructure}
                    />
                </div>
            )}

            {activeAcademicTab === 'teachers' && (hasPermission(permissions, 'add:teacher') || hasPermission(permissions, 'import:teachers')) && (
                 <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-dark dark:text-white">Teacher Management Tools</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quickly add or import multiple teachers into the system.</p>
                        <div className="mt-4 flex flex-wrap gap-4">
                            {hasPermission(permissions, 'add:teacher') && <button onClick={() => setAddTeacherModalOpen(true)} className="bg-brand-primary text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors"><PlusIcon className="w-4 h-4"/> Add Single Teacher</button>}
                            {hasPermission(permissions, 'import:teachers') && <button onClick={() => setBulkTeacherModalOpen(true)} className="bg-brand-dark-gray text-white px-4 py-2 text-sm rounded-md flex items-center gap-2 font-medium hover:bg-slate-800 transition-colors"><ArrowUpTrayIcon className="w-4 h-4"/> Bulk Import Teachers</button>}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}

      {activeTab === 'permissions' && hasPermission(permissions, 'edit:settings-permissions') && (
        <PermissionsManager
            academicStructure={academicStructure}
            setAcademicStructure={setAcademicStructure}
        />
      )}

      {activeTab === 'general' && hasPermission(permissions, 'edit:settings-general') && (
        <div className="space-y-6">
            <div className="p-1.5 bg-gray-200 dark:bg-slate-700 rounded-lg flex flex-wrap gap-1 self-start">
                <TabButton tabId="allocations" label="Allocations" activeTab={activeGeneralTab} setActiveTab={setActiveGeneralTab as (tabId: string) => void} />
                <TabButton tabId="email" label="Email" activeTab={activeGeneralTab} setActiveTab={setActiveGeneralTab as (tabId: string) => void} />
                {hasPermission(permissions, 'view:audit-log') && <TabButton tabId="system" label="System" activeTab={activeGeneralTab} setActiveTab={setActiveGeneralTab as (tabId: string) => void} />}
            </div>
            {activeGeneralTab === 'allocations' && <AllocationSettingsManager settings={allocationSettings} setSettings={setAllocationSettings} academicStructure={academicStructure} />}
            {activeGeneralTab === 'email' && <EmailSettingsManager generalSettings={generalSettings} setGeneralSettings={setGeneralSettings} />}
            {activeGeneralTab === 'system' && hasPermission(permissions, 'view:audit-log') && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold">Audit Log</h3>
                        <p className="text-sm text-gray-500 mt-1">A log of all significant actions taken by users in the application.</p>
                        <AuditTrailViewer logs={auditLog} teachers={teachers} />
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold">Simulated Backend Architecture</h3>
                        <p className="text-sm text-gray-500 mt-1">This application simulates a best-practice architecture for complex tasks like timetabling.</p>
                        <ul className="list-disc list-inside mt-2 text-sm space-y-1 text-gray-700 dark:text-gray-300">
                            <li><strong>Job Queue:</strong> When "Generate" is clicked, the request is conceptually sent to a job queue (like RabbitMQ or AWS SQS).</li>
                            <li><strong>OR-Tools Solver:</strong> A separate worker service (e.g., a Python microservice or a serverless function with a long timeout) would pick up the job. This service would use a powerful constraint solver like Google's OR-Tools to find an optimal solution.</li>
                            <li><strong>Reproducibility:</strong> The solver returns a solution, conflicts, an objective score, and a unique seed/version, ensuring results can be reproduced for debugging and analysis.</li>
                            <li><strong>Auditing:</strong> The full input and output of the solver job are saved to the audit trail for complete transparency.</li>
                        </ul>
                    </div>
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-red-200 dark:border-red-800/50">
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">System Actions</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">These are destructive actions. Please be certain before proceeding.</p>
                        <div className="mt-4">
                            {hasPermission(permissions, 'action:reset-app') && (
                                <>
                                <button onClick={() => setResetModalOpen(true)} className="bg-red-600 text-white px-4 py-2 text-sm rounded-md font-semibold hover:bg-red-700">Reset All Application Data</button>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">This will wipe all data from your browser's local storage and reload the application with the default mock data. This action cannot be undone.</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
      )}
      
      {isAddTeacherModalOpen && <AddEditTeacherModal isOpen={isAddTeacherModalOpen} onClose={() => setAddTeacherModalOpen(false)} setTeachers={setTeachers} academicStructure={academicStructure} teachers={teachers}/>}
      {isBulkTeacherModalOpen && <BulkImportModal isOpen={isBulkTeacherModalOpen} onClose={() => setBulkTeacherModalOpen(false)} setTeachers={setTeachers} academicStructure={academicStructure} teachers={teachers} />}

      {(isAddClassGroupModalOpen || classGroupToEdit) && <AddEditClassGroupModal isOpen={true} onClose={() => { setAddClassGroupModalOpen(false); setClassGroupToEdit(null); }} setClassGroups={setClassGroups} academicStructure={academicStructure} existingGroup={classGroupToEdit} currentAcademicYear={currentAcademicYear} />}
      {isBulkGroupModalOpen && <BulkImportClassGroupsModal isOpen={isBulkGroupModalOpen} onClose={() => setBulkGroupModalOpen(false)} academicStructure={academicStructure} setClassGroups={setClassGroups} />}
      
      {classGroupToDelete && <ConfirmationModal isOpen={true} onClose={() => setClassGroupToDelete(null)} onConfirm={handleDeleteClassGroup} title="Delete Class Group" message={`Are you sure you want to delete ${classGroupToDelete.name}? This will also remove any teacher allocations associated with it.`} />}
      {isResetModalOpen && <ConfirmationModal isOpen={isResetModalOpen} onClose={() => setResetModalOpen(false)} onConfirm={onResetState} title="Confirm Application Reset" message="Are you absolutely sure you want to delete all application data? This cannot be undone." confirmButtonText="Yes, Reset Everything"/>}
    </div>
  );
};

export default Settings;