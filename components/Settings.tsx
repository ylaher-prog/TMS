import React, { useState, useMemo } from 'react';
import type { Teacher, AcademicStructure, ClassGroup, Position, PhaseStructure, Subject, AllocationSettings, GeneralSettings } from '../types';
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
}

type SettingsTab = 'baseItems' | 'subjects' | 'classGroups' | 'teacherTools' | 'phases' | 'general';
type GeneralSubTab = 'allocations' | 'email' | 'system';

const TabButton: React.FC<{ tabId: string; label: string; activeTab: string; setActiveTab: (tabId: string) => void; }> = ({ tabId, label, activeTab, setActiveTab }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${isActive
          ? 'bg-brand-primary text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`
      }
    >
      {label}
    </button>
  );
};


const Settings: React.FC<SettingsProps> = (props) => {
  const { 
    teachers, setTeachers, 
    academicStructure, setAcademicStructure, 
    phaseStructures, setPhaseStructures,
    classGroups, setClassGroups,
    allocationSettings, setAllocationSettings,
    generalSettings, setGeneralSettings,
    currentUser,
    onResetState
  } = props;
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('baseItems');
  const [activeGeneralTab, setActiveGeneralTab] = useState<GeneralSubTab>('allocations');
  const [isAddTeacherModalOpen, setAddTeacherModalOpen] = useState(false);
  const [isBulkTeacherModalOpen, setBulkTeacherModalOpen] = useState(false);

  const [classGroupToEdit, setClassGroupToEdit] = useState<ClassGroup | null>(null);
  const [classGroupToDelete, setClassGroupToDelete] = useState<ClassGroup | null>(null);
  const [isAddClassGroupModalOpen, setAddClassGroupModalOpen] = useState(false);
  const [isBulkGroupModalOpen, setBulkGroupModalOpen] = useState(false);
  const [isResetModalOpen, setResetModalOpen] = useState(false);

  // State for Positions & Hierarchy manager
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [newPositionName, setNewPositionName] = useState('');
  const [newPositionReportsToId, setNewPositionReportsToId] = useState('none');
  const [draggedPositionId, setDraggedPositionId] = useState<string | null>(null);

  const [groupFilters, setGroupFilters] = useState({ name: '', academicYear: '', details: '' });
  const [groupSortConfig, setGroupSortConfig] = useState<{key: string, direction: 'ascending' | 'descending'} | null>(null);


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
  
  const getGroupSortIcon = (key: string) => {
    if (!groupSortConfig || groupSortConfig.key !== key) return <ArrowsUpDownIcon className="h-4 w-4" />;
    return groupSortConfig.direction === 'ascending' ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />;
  }

  const handleExportTeachers = () => {
    if (teachers.length === 0) {
      alert("There are no teachers to export.");
      return;
    }

    const headers = "fullName,email,employmentStatus,startDate,specialties,preferredGrades,position,maxLearners,maxPeriodsByMode,managerEmail";
    const csvRows = teachers.map(t => {
      const specialties = t.specialties.join(';');
      const preferredGrades = (t.preferredGrades || []).join(';');
      const positionName = positionMap.get(t.positionId) || '';
      const manager = t.managerId ? teacherMap.get(t.managerId) : null;
      const managerEmail = manager ? manager.email : '';
      const maxPeriods = Object.entries(t.maxPeriodsByMode).map(([mode, periods]) => `${mode}=${periods}`).join(';');

      return [t.fullName, t.email, t.employmentStatus, t.startDate, `"${specialties}"`, `"${preferredGrades}"`, positionName, t.maxLearners, `"${maxPeriods}"`, managerEmail].join(',');
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "teachers_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleExportClassGroups = () => {
    if (classGroups.length === 0) {
        alert("There are no class groups to export.");
        return;
    }

    const headers = "name,academicYear,curriculum,grade,mode,learnerCount,subjects,addToTimetable";
    const csvRows = classGroups.map(cg => {
        const subjectNames = cg.subjectIds.map(id => subjectMap.get(id) || 'Unknown').join(';');
        return [cg.name, cg.academicYear, cg.curriculum, cg.grade, cg.mode, cg.learnerCount, `"${subjectNames}"`, cg.addToTimetable ? 'yes' : 'no'].join(',');
    });

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "class_groups_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleResetConfirm = () => {
    onResetState();
    setResetModalOpen(false);
  };

  // --- CRUD for Positions & Hierarchy ---
  const handleAddPosition = () => {
    if (newPositionName.trim()) {
        const newPosition: Position = { 
            id: `pos-${Date.now()}`, 
            name: newPositionName.trim(),
            reportsToId: newPositionReportsToId === 'none' ? undefined : newPositionReportsToId,
        };
        handleUpdateStructure('positions', [...positions, newPosition]);
        setNewPositionName('');
        setNewPositionReportsToId('none');
    }
  };
  const handleSavePosition = (id: string, newName: string, newReportsToId: string) => {
    if (newName.trim()) {
        const updatedPositions = positions.map(p => p.id === id ? { ...p, name: newName.trim(), reportsToId: newReportsToId === 'none' ? undefined : newReportsToId } : p);
        handleUpdateStructure('positions', updatedPositions);
        setEditingPosition(null);
    }
  };
  const handleDeletePosition = (id: string) => {
    const assignedTeachers = teachers.filter(t => t.positionId === id).length;
    if(assignedTeachers > 0) {
      alert(`Cannot delete this position as it is currently assigned to ${assignedTeachers} teacher(s). Please reassign them first.`);
      return;
    }
    
    // Update any positions that report to this one
    const updatedPositions = positions
      .filter(p => p.id !== id)
      .map(p => p.reportsToId === id ? { ...p, reportsToId: undefined } : p);

    handleUpdateStructure('positions', updatedPositions);
  };

  const handlePositionDrop = (targetId: string) => {
    if (!draggedPositionId || draggedPositionId === targetId) return;

    const currentPositions = [...positions];
    const draggedIndex = currentPositions.findIndex(p => p.id === draggedPositionId);
    const targetIndex = currentPositions.findIndex(p => p.id === targetId);
    
    const [draggedItem] = currentPositions.splice(draggedIndex, 1);
    currentPositions.splice(targetIndex, 0, draggedItem);
    
    handleUpdateStructure('positions', currentPositions);
    setDraggedPositionId(null);
  };

  const renderPositionsHierarchy = () => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm col-span-1 md:col-span-2 lg:col-span-3">
        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Positions & Hierarchy</h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-4 p-4 border dark:border-slate-700 rounded-lg">
            <input 
                type="text" 
                value={newPositionName} 
                onChange={(e) => setNewPositionName(e.target.value)} 
                placeholder="New position name.." 
                className="flex-grow border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary bg-transparent"
            />
            <select 
                value={newPositionReportsToId} 
                onChange={(e) => setNewPositionReportsToId(e.target.value)} 
                className="flex-grow border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-transparent dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
                <option value="none">-- Top Level (No reporting) --</option>
                {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button 
                onClick={handleAddPosition} 
                disabled={!newPositionName.trim()}
                className="bg-brand-primary text-white px-5 py-2 rounded-md flex items-center justify-center gap-2 text-sm font-semibold hover:bg-rose-900 transition-colors disabled:opacity-50"
            >
                Add Position
            </button>
        </div>
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
            {positions.map(p => (
                <div 
                    key={p.id} 
                    className={`p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-grab ${draggedPositionId === p.id ? 'opacity-50' : ''}`}
                    draggable
                    onDragStart={() => setDraggedPositionId(p.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handlePositionDrop(p.id)}
                >
                    {editingPosition?.id === p.id ? (
                        <div className="space-y-2">
                             <input type="text" value={editingPosition.name} onChange={e => setEditingPosition({...editingPosition, name: e.target.value})} className="w-full border rounded-md px-2 py-1 text-sm bg-transparent dark:border-slate-600" />
                            <select value={editingPosition.reportsToId || 'none'} onChange={e => setEditingPosition({...editingPosition, reportsToId: e.target.value === 'none' ? undefined : e.target.value})} className="w-full border rounded-md px-2 py-1 text-sm bg-transparent dark:bg-slate-700 dark:border-slate-600">
                                <option value="none">-- Top Level --</option>
                                {positions.filter(r => r.id !== p.id).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                            <div className="flex items-center justify-end">
                                <button onClick={() => handleSavePosition(editingPosition.id, editingPosition.name, editingPosition.reportsToId || 'none')} className="text-green-500"><CheckIcon className="w-5 h-5"/></button>
                                <button onClick={() => setEditingPosition(null)} className="text-red-500 ml-2"><XMarkIcon className="w-5 h-5"/></button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <div className="text-sm">
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{p.name}</span>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Reports to: {positionMap.get(p.reportsToId || '') || 'Top Level'}
                                </div>
                            </div>
                            <div>
                                <button onClick={() => setEditingPosition(p)} className="text-brand-accent hover:text-amber-600"><PencilIcon className="w-4 h-4"/></button>
                                <button onClick={() => handleDeletePosition(p.id)} className="text-red-500 hover:text-red-700 ml-2"><TrashIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
             {positions.length === 0 && <p className="text-sm text-center text-gray-400 py-4">No positions created yet.</p>}
        </div>
    </div>
  );

  const renderBaseItems = () => (
     <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StructureManager title="Curricula" items={curricula} onUpdateItems={(items) => handleUpdateStructure('curricula', items)} itemNoun="curriculum" />
            <StructureManager title="Grades" items={grades} onUpdateItems={(items) => handleUpdateStructure('grades', items)} itemNoun="grade" />
            <StructureManager title="Modes" items={modes} onUpdateItems={(items) => handleUpdateStructure('modes', items)} itemNoun="mode" />
            <StructureManager title="Academic Periods" items={academicPeriods} onUpdateItems={(items) => handleUpdateStructure('academicPeriods', items)} itemNoun="period" />
        </div>
        {renderPositionsHierarchy()}
    </div>
  );

  const renderTeacherTools = () => (
    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Staff Management Tools</h3>
        <p className="text-sm text-brand-text-light dark:text-gray-400 mb-4 mt-1">
            Add new staff to the system individually or import multiple staff members at once using a CSV format. Manager assignment is part of the "Add/Edit Staff" form.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
             <button
                onClick={() => setBulkTeacherModalOpen(true)}
                className="bg-brand-dark-gray text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
            >
                <ArrowUpTrayIcon className="w-5 h-5" />
                Import Staff
            </button>
            <button
                onClick={handleExportTeachers}
                className="bg-brand-accent text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-amber-700 transition-colors"
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Export Staff
            </button>
            <button
                onClick={() => setAddTeacherModalOpen(true)}
                className="bg-brand-primary text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-rose-900 transition-colors"
            >
                <PlusIcon className="w-5 h-5" />
                Add Staff
            </button>
        </div>
    </div>
  );

  const renderClassGroups = () => (
     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Class Groups</h3>
                 <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">A Class Group is a combination of a curriculum and a grade, containing multiple subjects.</p>
            </div>
             <div className="flex items-center gap-2 mt-3 sm:mt-0 flex-shrink-0">
                <button
                    onClick={() => setBulkGroupModalOpen(true)}
                    className="bg-brand-dark-gray text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors"
                >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    <span>Import</span>
                </button>
                <button
                    onClick={handleExportClassGroups}
                    className="bg-brand-accent text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-amber-700 transition-colors"
                >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    <span>Export</span>
                </button>
                <button
                    onClick={() => setAddClassGroupModalOpen(true)}
                    className="bg-brand-primary text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-rose-900 transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Group</span>
                </button>
            </div>
        </div>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                    <tr>
                        {['Group Name', 'Academic Year', 'Details', 'Subjects', 'Learners', 'Total Periods', 'Actions'].map(header => (
                            <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {header !== 'Actions' && header !== 'Subjects' ? (
                                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => requestGroupSort(header.toLowerCase().replace(' ', ''))}>
                                        {header} {getGroupSortIcon(header.toLowerCase().replace(' ', ''))}
                                    </div>
                                ) : header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                    {sortedAndFilteredClassGroups.map(cg => {
                        const totalPeriods = cg.subjectIds.reduce((total, subjectId) => {
                            const subject = fullSubjectMap.get(subjectId);
                            if (subject) {
                                return total + getSubjectPeriods(subject, cg.curriculum, cg.grade, cg.mode);
                            }
                            return total;
                        }, 0);

                        return (
                            <tr key={cg.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-semibold text-gray-900 dark:text-gray-200">{cg.name}</div><div className="text-xs text-gray-500 dark:text-gray-400">{cg.mode}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{cg.academicYear}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{cg.grade} - {cg.curriculum}</td>
                                <td className="px-6 py-4 max-w-sm"><div className="flex flex-wrap gap-1">{cg.subjectIds.map(id => <span key={id} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full">{subjectMap.get(id) || 'Unknown'}</span>)}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{cg.learnerCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{totalPeriods}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => setClassGroupToEdit(cg)} className="text-brand-accent hover:text-amber-700"><PencilIcon className="w-4 h-4" /></button>
                                        <button onClick={() => setClassGroupToDelete(cg)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {sortedAndFilteredClassGroups.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400">No class groups found.</div>}
        </div>
    </div>
  );
  
  const renderGeneralSettings = () => (
    <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
            <nav className="flex flex-col space-y-1">
                 <button onClick={() => setActiveGeneralTab('allocations')} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${activeGeneralTab === 'allocations' ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>Allocation Settings</button>
                 <button onClick={() => setActiveGeneralTab('email')} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${activeGeneralTab === 'email' ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>Email Configuration</button>
                 <button onClick={() => setActiveGeneralTab('system')} className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md ${activeGeneralTab === 'system' ? 'bg-brand-primary text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>System</button>
            </nav>
        </div>
        <div className="flex-1">
            {activeGeneralTab === 'allocations' && <AllocationSettingsManager settings={allocationSettings} setSettings={setAllocationSettings} academicStructure={academicStructure} />}
            {activeGeneralTab === 'email' && <EmailSettingsManager generalSettings={generalSettings} setGeneralSettings={setGeneralSettings} />}
            {activeGeneralTab === 'system' && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm border border-red-200 dark:border-red-800/50">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">System Actions</h3>
                     <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1 mb-4">Be careful, these actions are irreversible.</p>
                     <button
                        onClick={() => setResetModalOpen(true)}
                        className="bg-red-600 text-white px-4 py-2 text-sm rounded-lg flex items-center gap-2 font-medium hover:bg-red-800 transition-colors"
                    >
                        Reset All Application Data
                    </button>
                </div>
            )}
        </div>
    </div>
  );


  const renderContent = () => {
    switch(activeTab) {
        case 'baseItems': return renderBaseItems();
        case 'subjects': return <SubjectManager academicStructure={academicStructure} onUpdateSubjects={(s) => handleUpdateStructure('subjects', s)} />;
        case 'classGroups': return renderClassGroups();
        case 'teacherTools': return renderTeacherTools();
        case 'phases': return <PhaseStructureManager phaseStructures={phaseStructures} setPhaseStructures={setPhaseStructures} academicStructure={academicStructure} teachers={teachers} />;
        case 'general': return renderGeneralSettings();
        default: return null;
    }
  }

  return (
    <div className="space-y-6">
        <div className="p-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-lg flex flex-wrap gap-1">
            <TabButton tabId="baseItems" label="Base Items" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            <TabButton tabId="subjects" label="Subjects" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            <TabButton tabId="classGroups" label="Class Groups" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            <TabButton tabId="teacherTools" label="Staff Tools" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            <TabButton tabId="phases" label="Phases" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
            <TabButton tabId="general" label="General" activeTab={activeTab} setActiveTab={setActiveTab as (tabId: string) => void} />
        </div>

        <div>{renderContent()}</div>

        {isAddTeacherModalOpen && (
            <AddEditTeacherModal
                isOpen={isAddTeacherModalOpen}
                onClose={() => setAddTeacherModalOpen(false)}
                setTeachers={setTeachers}
                academicStructure={academicStructure}
                teachers={teachers}
            />
        )}
        {isBulkTeacherModalOpen && (
            <BulkImportModal 
                isOpen={isBulkTeacherModalOpen} 
                onClose={() => setBulkTeacherModalOpen(false)} 
                setTeachers={setTeachers} 
                academicStructure={academicStructure}
                teachers={teachers}
            />
        )}
        {(isAddClassGroupModalOpen || classGroupToEdit) && (
            <AddEditClassGroupModal
                isOpen={isAddClassGroupModalOpen || !!classGroupToEdit}
                onClose={() => { setAddClassGroupModalOpen(false); setClassGroupToEdit(null); }}
                academicStructure={academicStructure}
                setClassGroups={setClassGroups}
                existingGroup={classGroupToEdit}
            />
        )}
        {isBulkGroupModalOpen && (
            <BulkImportClassGroupsModal
                isOpen={isBulkGroupModalOpen}
                onClose={() => setBulkGroupModalOpen(false)}
                academicStructure={academicStructure}
                setClassGroups={setClassGroups}
            />
        )}
        {classGroupToDelete && (
            <ConfirmationModal
                isOpen={!!classGroupToDelete}
                onClose={() => setClassGroupToDelete(null)}
                onConfirm={handleDeleteClassGroup}
                title="Delete Class Group"
                message={`Are you sure you want to delete "${classGroupToDelete.name}"? This might affect existing teacher allocations.`}
            />
        )}
        {isResetModalOpen && (
            <ConfirmationModal 
                isOpen={isResetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={handleResetConfirm}
                title="Confirm Factory Reset"
                message="Are you sure you want to reset all application data? All teachers, settings, and allocations will be permanently deleted."
                confirmButtonText="Yes, Reset Everything"
            />
        )}
    </div>
  );
};

export default Settings;