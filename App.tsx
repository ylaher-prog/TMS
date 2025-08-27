import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import AcademicTeam from './components/AcademicTeam';
import Settings from './components/Settings';
import Allocations from './components/Allocations';
import Leave from './components/Leave';
import Monitoring from './components/Monitoring';
import Procurement from './components/Procurement';
import Parents from './components/Parents';
import LoginPage from './components/LoginPage';
import Payroll from './components/Payroll';
import Timetable from './components/Timetable';

import type { Page, Teacher, AcademicStructure, ClassGroup, TeacherAllocation, LeaveRequest, Observation, ProcurementRequest, TeacherWorkload, PhaseStructure, Subject, MonitoringTemplate, ParentQuery, AllocationSettings, GeneralSettings, TimeGrid, TimeConstraint, TimetableHistoryEntry, GeneratedTimetable, GeneratedSlot } from './types';
import { EmploymentStatus, SubjectCategory } from './types';
import { 
  MOCK_ACADEMIC_STRUCTURE,
  MOCK_TEACHERS,
  MOCK_PHASE_STRUCTURES,
  DEFAULT_MONITORING_TEMPLATES,
  DEFAULT_ALLOCATION_SETTINGS,
  DEFAULT_GENERAL_SETTINGS,
  DEFAULT_TIME_GRIDS,
  TIME_GRID_COLORS,
} from './constants';

const LOCAL_STORAGE_KEY = 'qtms_app_data';

interface AppState {
  teachers: Teacher[];
  academicStructure: AcademicStructure;
  phaseStructures: PhaseStructure[];
  classGroups: ClassGroup[];
  allocations: TeacherAllocation[];
  leaveRequests: LeaveRequest[];
  observations: Observation[];
  procurementRequests: ProcurementRequest[];
  monitoringTemplates: MonitoringTemplate[];
  parentQueries: ParentQuery[];
  allocationSettings: AllocationSettings;
  generalSettings: GeneralSettings;
  timeGrids: TimeGrid[];
  timeConstraints: TimeConstraint[];
  timetableHistory: TimetableHistoryEntry[];
  // adminUsers is now obsolete and will be migrated to teachers
  adminUsers?: any[];
  generatedTimetable?: any; // For migration
}

export const getSubjectPeriods = (subject: Subject, curriculum: string, grade: string, mode: string): number => {
    const override = subject.periodOverrides?.find(o => o.curriculum === curriculum && o.grade === grade && o.mode === mode);
    if (override) {
        return Number(override.periods) || 0;
    }
    
    const modePeriod = (subject.periodsByMode || []).find(p => p.mode === mode);
    return modePeriod ? (Number(modePeriod.periods) || 0) : 0;
};

const App: React.FC = () => {
  const loadState = (): AppState | null => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) return null;
        
        let state: AppState = JSON.parse(serializedState);
        
        // --- DATA MIGRATIONS ---

        // One-time migration from adminUsers to teachers
        if (state.adminUsers && state.adminUsers.length > 0) {
            const adminPosition: {id: string, name: string} = state.academicStructure.positions.find(p => p.name === 'Super Admin') || { id: 'pos-super-admin', name: 'Super Admin' };
            if (!state.academicStructure.positions.find(p => p.id === adminPosition.id)) {
                state.academicStructure.positions.push(adminPosition);
            }

            const adminsAsTeachers: Teacher[] = state.adminUsers.map(admin => ({
                id: admin.id,
                fullName: admin.username.charAt(0).toUpperCase() + admin.username.slice(1),
                email: `${admin.username}@qurtubaonline.co.za`,
                avatarUrl: admin.avatarUrl,
                employmentStatus: EmploymentStatus.Permanent,
                startDate: new Date().toISOString().split('T')[0],
                positionId: adminPosition.id,
                maxLearners: 999,
                maxPeriodsByMode: {},
                specialties: [],
                markingTasks: 0,
                slas: { messageResponse: 24, markingTurnaround: 48 },
                username: admin.username,
                passwordHash: admin.passwordHash,
            }));

            // Add new teachers, avoiding duplicates by email
            const existingEmails = new Set(state.teachers.map(t => t.email.toLowerCase()));
            const newTeachersToAdd = adminsAsTeachers.filter(t => !existingEmails.has(t.email.toLowerCase()));
            state.teachers.push(...newTeachersToAdd);
            
            // Mark adminUsers for deletion after loading
            state.adminUsers = [];
        }


        // One-time migration for observations to new formData structure
        if (state.observations && state.observations.length > 0 && (state.observations[0] as any).details !== undefined) {
            state.observations = state.observations.map((obs: any) => {
                if(obs.formData) return obs;
                const { details, actionTaken, nextSteps, ...rest } = obs;
                return { ...rest, formData: { details: details || '', actionTaken: actionTaken || '', nextSteps: nextSteps || '' } };
            });
        }
        
        // One-time migration for subjects to new periodsByMode structure
        if (state.academicStructure?.subjects) {
            state.academicStructure.subjects = state.academicStructure.subjects.map((s: any) => {
                if (s.periods && !s.periodsByMode) {
                    const periodsByMode = (s.modes || []).map((mode: string) => ({ mode, periods: s.periods }));
                    const { periods, ...rest } = s;
                    return { ...rest, periodsByMode };
                }
                if (!s.periodsByMode) s.periodsByMode = [];
                return s;
            });
        }
        
        // One-time migration for subjects to add category
        if (state.academicStructure?.subjects) {
             state.academicStructure.subjects = state.academicStructure.subjects.map((s: any) => {
                if (!s.category) s.category = SubjectCategory.Core;
                if (!s.electiveGroup) s.electiveGroup = '';
                return s;
            });
        }

        // One-time migration for teachers to new workload limit structure
        if (state.teachers) {
            state.teachers = state.teachers.map((t: any) => {
                if (t.livePeriods && !t.maxPeriodsByMode) {
                    const maxPeriodsByMode: { [mode: string]: number } = {};
                    if (t.livePeriods.max) maxPeriodsByMode['Live'] = t.livePeriods.max;
                    if (t.flippedPeriods.max) {
                        if (state.academicStructure.modes.includes('Flipped Morning')) maxPeriodsByMode['Flipped Morning'] = t.flippedPeriods.max;
                        if (state.academicStructure.modes.includes('Flipped Afternoon')) maxPeriodsByMode['Flipped Afternoon'] = t.flippedPeriods.max;
                    }
                    const maxLearners = t.learners?.max || 250;
                    const { livePeriods, flippedPeriods, learners, ...rest } = t;
                    t = { ...rest, maxPeriodsByMode, maxLearners };
                }
                 if (!t.maxPeriodsByMode) t.maxPeriodsByMode = {};
                 if (t.maxLearners === undefined) t.maxLearners = 250;
                 if (t.workloadComments === undefined) t.workloadComments = ''; // New field migration
                 if (t.employeeCode === undefined) t.employeeCode = '';
                 if (t.salaryInfo === undefined) t.salaryInfo = undefined;
                return t;
            });
        }
        
        // One-time migration for general settings
        if (state.generalSettings && (state.generalSettings as any).senderEmail) {
            const oldEmail = (state.generalSettings as any).senderEmail;
            state.generalSettings = {
                senderEmails: [{ id: 'default-1', email: oldEmail, isDefault: true, type: 'manual' }]
            };
        }
        if (state.generalSettings && !state.generalSettings.senderEmails) {
             state.generalSettings.senderEmails = [];
        }
        if (state.generalSettings && state.generalSettings.senderEmails.length > 0 && !state.generalSettings.senderEmails[0].type) {
             state.generalSettings.senderEmails = state.generalSettings.senderEmails.map(e => ({...e, type: 'manual'}));
        }

        // One-time migration for timetable settings
        if ((state as any).timetableSettings && !(state as any).timeGrids) {
            state.timeGrids = [{
                id: 'default-grid',
                name: 'Default School Week',
                color: TIME_GRID_COLORS[0],
                days: (state as any).timetableSettings.days,
                periods: (state as any).timetableSettings.periods,
            }];
            delete (state as any).timetableSettings;
        }
        if (state.timeGrids && state.timeGrids.length > 0 && !state.timeGrids[0].color) {
            state.timeGrids = state.timeGrids.map((tg, i) => ({ ...tg, color: TIME_GRID_COLORS[i % TIME_GRID_COLORS.length] }));
        }

        
        // One-time migration for class groups to add addToTimetable flag
        if (state.classGroups && state.classGroups.length > 0 && state.classGroups[0].addToTimetable === undefined) {
            state.classGroups = state.classGroups.map(cg => ({...cg, addToTimetable: true }));
        }

        // Migration from single generatedTimetable to timetableHistory array
        if (state.generatedTimetable && !state.timetableHistory) {
            const oldTimetable = state.generatedTimetable as any;
            const newTimetable: GeneratedTimetable = {};

            const firstClassId = Object.keys(oldTimetable)[0];
            if (firstClassId) {
                const firstDay = Object.keys(oldTimetable[firstClassId])[0];
                if (firstDay) {
                    const firstPeriod = Object.keys(oldTimetable[firstClassId][firstDay])[0];
                    if(firstPeriod) {
                        const sampleSlot = oldTimetable[firstClassId][firstDay][firstPeriod];
                         if (sampleSlot && !Array.isArray(sampleSlot)) {
                             for (const classGroupId in oldTimetable) {
                                newTimetable[classGroupId] = {};
                                for (const day in oldTimetable[classGroupId]) {
                                    newTimetable[classGroupId][day] = {};
                                    for (const periodId in oldTimetable[classGroupId][day]) {
                                        const slot = oldTimetable[classGroupId][day][periodId];
                                        newTimetable[classGroupId][day][periodId] = slot ? [slot] : null;
                                    }
                                }
                            }
                        } else {
                            Object.assign(newTimetable, oldTimetable);
                        }
                    } else {
                        Object.assign(newTimetable, oldTimetable);
                    }
                } else {
                    Object.assign(newTimetable, oldTimetable);
                }
            }
            
            state.timetableHistory = [{
                id: `gen-migrated-${Date.now()}`,
                timestamp: new Date().toISOString(),
                timetable: newTimetable,
                conflicts: [],
            }];
            delete state.generatedTimetable;
        } else if (!state.timetableHistory) {
            state.timetableHistory = [];
        }


        return state;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return null;
    }
  };

  const savedState = loadState();

  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>(savedState?.teachers || MOCK_TEACHERS);
  const [academicStructure, setAcademicStructure] = useState<AcademicStructure>(savedState?.academicStructure || MOCK_ACADEMIC_STRUCTURE);
  const [phaseStructures, setPhaseStructures] = useState<PhaseStructure[]>(savedState?.phaseStructures || MOCK_PHASE_STRUCTURES);
  const [classGroups, setClassGroups] = useState<ClassGroup[]>(savedState?.classGroups || []);
  const [allocations, setAllocations] = useState<TeacherAllocation[]>(savedState?.allocations || []);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(savedState?.leaveRequests || []);
  const [observations, setObservations] = useState<Observation[]>(savedState?.observations || []);
  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(savedState?.procurementRequests || []);
  const [monitoringTemplates, setMonitoringTemplates] = useState<MonitoringTemplate[]>(savedState?.monitoringTemplates || DEFAULT_MONITORING_TEMPLATES);
  const [parentQueries, setParentQueries] = useState<ParentQuery[]>(savedState?.parentQueries || []);
  const [allocationSettings, setAllocationSettings] = useState<AllocationSettings>(savedState?.allocationSettings || DEFAULT_ALLOCATION_SETTINGS);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(savedState?.generalSettings || DEFAULT_GENERAL_SETTINGS);
  
  // Timetable state
  const [timeGrids, setTimeGrids] = useState<TimeGrid[]>(savedState?.timeGrids || DEFAULT_TIME_GRIDS);
  const [timeConstraints, setTimeConstraints] = useState<TimeConstraint[]>(savedState?.timeConstraints || []);
  const [timetableHistory, setTimetableHistory] = useState<TimetableHistoryEntry[]>(savedState?.timetableHistory || []);

  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.getItem('theme') === 'dark') {
      return true;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const teacherWorkloads = useMemo(() => {
    const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));
    const classGroupMap = new Map(classGroups.map(g => [g.id, g]));

    const workloads = new Map<string, TeacherWorkload>();
    teachers.forEach(teacher => {
        workloads.set(teacher.id, {
            totalPeriods: 0,
            totalLearners: 0,
            totalClasses: 0,
            periodsByMode: {},
        });
    });

    const teacherClassGroupIds = new Map<string, Set<string>>();

    allocations.forEach(alloc => {
        const workload = workloads.get(alloc.teacherId);
        const subject = subjectMap.get(alloc.subjectId);
        const group = classGroupMap.get(alloc.classGroupId);

        if (workload && subject && group) {
            const periods = getSubjectPeriods(subject, group.curriculum, group.grade, group.mode);
            workload.totalPeriods += periods;
            workload.periodsByMode[group.mode] = (workload.periodsByMode[group.mode] || 0) + periods;

            if (!teacherClassGroupIds.has(alloc.teacherId)) {
                teacherClassGroupIds.set(alloc.teacherId, new Set());
            }
            teacherClassGroupIds.get(alloc.teacherId)!.add(alloc.classGroupId);
        }
    });

    teacherClassGroupIds.forEach((classGroupIds, teacherId) => {
        const workload = workloads.get(teacherId)!;
        workload.totalClasses = classGroupIds.size;
        let totalLearners = 0;
        classGroupIds.forEach(groupId => {
            const group = classGroupMap.get(groupId);
            if (group) totalLearners += group.learnerCount;
        });
        workload.totalLearners = totalLearners;
    });
    

    return workloads;
}, [teachers, allocations, academicStructure.subjects, classGroups]);


  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
        const stateToSave: Omit<AppState, 'adminUsers' | 'generatedTimetable'> = {
            teachers,
            academicStructure,
            phaseStructures,
            classGroups,
            allocations,
            leaveRequests,
            observations,
            procurementRequests,
            monitoringTemplates,
            parentQueries,
            allocationSettings,
            generalSettings,
            timeGrids,
            timeConstraints,
            timetableHistory,
        };
        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
            alert("Could not save state to localStorage: Quota exceeded. Please clear some space or reset the application data in settings if this persists.");
        } else {
            console.error("Could not save state to localStorage", err);
        }
    }
  }, [teachers, academicStructure, phaseStructures, classGroups, allocations, leaveRequests, observations, procurementRequests, monitoringTemplates, parentQueries, allocationSettings, generalSettings, timeGrids, timeConstraints, timetableHistory]);

  const handleLogout = () => {
    setCurrentUser(null);
    setActivePage('dashboard');
  };

  const handleResetState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
  };

  if (!currentUser) {
    return <LoginPage teachers={teachers} onLoginSuccess={setCurrentUser} />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard teachers={teachers} workloads={teacherWorkloads}/>;
      case 'academic-team':
        return <AcademicTeam 
                  teachers={teachers} 
                  setTeachers={setTeachers} 
                  academicStructure={academicStructure} 
                  phaseStructures={phaseStructures} 
                  workloads={teacherWorkloads}
                  allocations={allocations}
                  classGroups={classGroups}
                  leaveRequests={leaveRequests}
                  observations={observations}
                  monitoringTemplates={monitoringTemplates}
                  timeGrids={timeGrids}
                  timetableHistory={timetableHistory}
                />;
      case 'allocations':
        return <Allocations 
                  teachers={teachers} 
                  setTeachers={setTeachers}
                  classGroups={classGroups} 
                  allocations={allocations} 
                  setAllocations={setAllocations}
                  academicStructure={academicStructure}
                  phaseStructures={phaseStructures}
                  teacherWorkloads={teacherWorkloads}
                  allocationSettings={allocationSettings}
                  generalSettings={generalSettings}
                  timeGrids={timeGrids}
                  timetableHistory={timetableHistory}
                />;
      case 'timetable':
        return <Timetable 
                  timeGrids={timeGrids}
                  setTimeGrids={setTimeGrids}
                  timeConstraints={timeConstraints}
                  setTimeConstraints={setTimeConstraints}
                  timetableHistory={timetableHistory}
                  setTimetableHistory={setTimetableHistory}
                  teachers={teachers}
                  classGroups={classGroups}
                  setClassGroups={setClassGroups}
                  allocations={allocations}
                  academicStructure={academicStructure}
               />;
      case 'payroll':
        return <Payroll teachers={teachers} setTeachers={setTeachers} />;
      case 'leave':
        return <Leave teachers={teachers} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} />;
      case 'observations':
        return <Monitoring 
                    teachers={teachers} 
                    observations={observations} 
                    setObservations={setObservations}
                    academicStructure={academicStructure}
                    phaseStructures={phaseStructures}
                    monitoringTemplates={monitoringTemplates}
                    setMonitoringTemplates={setMonitoringTemplates}
                />;
      case 'procurement':
        return <Procurement teachers={teachers} procurementRequests={procurementRequests} setProcurementRequests={setProcurementRequests} />;
      case 'parents':
        return <Parents 
                 teachers={teachers}
                 queries={parentQueries}
                 setQueries={setParentQueries}
               />;
      case 'settings':
        return (
          <Settings
            teachers={teachers}
            setTeachers={setTeachers}
            academicStructure={academicStructure}
            setAcademicStructure={setAcademicStructure}
            phaseStructures={phaseStructures}
            setPhaseStructures={setPhaseStructures}
            classGroups={classGroups}
            setClassGroups={setClassGroups}
            allocationSettings={allocationSettings}
            setAllocationSettings={setAllocationSettings}
            generalSettings={generalSettings}
            setGeneralSettings={setGeneralSettings}
            currentUser={currentUser}
            onResetState={handleResetState}
          />
        );
      default:
        return <Dashboard teachers={teachers} workloads={teacherWorkloads} />;
    }
  };

  return (
    <Layout 
      activePage={activePage} 
      setActivePage={setActivePage}
      currentUser={currentUser}
      onLogout={handleLogout}
      setTeachers={setTeachers}
      isDarkMode={isDarkMode}
      setIsDarkMode={setIsDarkMode}
      academicStructure={academicStructure}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;