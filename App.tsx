
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
import TeacherDashboard from './components/TeacherDashboard';
import Tasks from './components/Tasks';

// FIX: Import Notification type
import type { Page, Teacher, AcademicStructure, ClassGroup, TeacherAllocation, LeaveRequest, Observation, ProcurementRequest, TeacherWorkload, PhaseStructure, Subject, MonitoringTemplate, ParentQuery, AllocationSettings, GeneralSettings, TimeGrid, TimeConstraint, TimetableHistoryEntry, GeneratedTimetable, Permission, AuditLog, TaskBoard, Notification } from './types';
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
  MOCK_TASK_BOARDS,
} from './constants';
import { getUserPermissions, hasPermission } from './permissions';
import { getSubjectPeriods } from './utils';
import { generateNotification } from './utils/notifications';

const LOCAL_STORAGE_KEY = 'smt_app_data';

interface AppState {
  // teachers are now loaded from the database
  teachers?: Teacher[];
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
  auditLog: AuditLog[];
  taskBoards?: TaskBoard[];
  notifications?: Notification[];
  currentAcademicYear?: string;
  generatedTimetable?: any; // For migration
}

const App: React.FC = () => {
  const loadState = (): Omit<AppState, 'teachers'> | null => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) return null;
        
        let state: AppState = JSON.parse(serializedState);
        const defaultYear = new Date().getFullYear().toString();
        
        // --- DATA MIGRATIONS ---

        // Migration for academic years
        if (!state.academicStructure.academicYears || state.academicStructure.academicYears.length === 0) {
            state.academicStructure.academicYears = [defaultYear];
        }

        // Migration for year-specific data
        const addYearField = (item: any) => {
            if (item.academicYear) return item;
             // Try to infer from class group for linked items
            if (item.classGroupId && state.classGroups) {
                const group = state.classGroups.find(cg => cg.id === item.classGroupId);
                if (group && group.academicYear) {
                    return { ...item, academicYear: group.academicYear };
                }
            }
            return { ...item, academicYear: defaultYear };
        };
        
        if (state.classGroups) state.classGroups = state.classGroups.map(item => ({...item, academicYear: item.academicYear || defaultYear}));
        if (state.allocations) state.allocations = state.allocations.map(addYearField);
        if (state.leaveRequests) state.leaveRequests = state.leaveRequests.map(item => ({...item, academicYear: item.academicYear || defaultYear}));
        if (state.observations) state.observations = state.observations.map(item => ({...item, academicYear: item.academicYear || defaultYear}));
        if (state.procurementRequests) state.procurementRequests = state.procurementRequests.map(item => ({...item, academicYear: item.academicYear || defaultYear}));
        if (state.parentQueries) state.parentQueries = state.parentQueries.map(item => ({...item, academicYear: item.academicYear || defaultYear}));
        if (state.timeConstraints) state.timeConstraints = state.timeConstraints.map(addYearField);
        if (state.timetableHistory) state.timetableHistory = state.timetableHistory.map(item => ({...item, academicYear: item.academicYear || defaultYear}));
        if (!state.auditLog) state.auditLog = [];
        if (!state.taskBoards) state.taskBoards = MOCK_TASK_BOARDS;
        if (!state.notifications) state.notifications = [];

        // Teacher-related migrations are now obsolete as teacher data is in the database.
        
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
                academicYear: defaultYear,
            }];
            delete state.generatedTimetable;
        } else if (!state.timetableHistory) {
            state.timetableHistory = [];
        }

        // Remove teachers from the loaded state, as they are now managed from DB
        delete state.teachers;

        return state;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return null;
    }
  };

  const savedState = loadState();

  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
  const [auditLog, setAuditLog] = useState<AuditLog[]>(savedState?.auditLog || []);
  const [taskBoards, setTaskBoards] = useState<TaskBoard[]>(savedState?.taskBoards || MOCK_TASK_BOARDS);
  const [notifications, setNotifications] = useState<Notification[]>(savedState?.notifications || []);

  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>(() => {
    const savedYear = savedState?.currentAcademicYear;
    const years = savedState?.academicStructure?.academicYears || MOCK_ACADEMIC_STRUCTURE.academicYears;
    if (savedYear && years.includes(savedYear)) {
      return savedYear;
    }
    // Default to the latest year available
    return years.sort().reverse()[0] || new Date().getFullYear().toString();
  });

  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [currentUserPermissions, setCurrentUserPermissions] = useState<Permission[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState('all');


  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (localStorage.getItem('theme') === 'dark') {
      return true;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Fetch teachers from the database on initial load
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch('/api/teachers');
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const data: Teacher[] = await response.json();
        setTeachers(data);
      } catch (error) {
        console.error("Failed to fetch teachers from database, falling back to mock data.", error);
        // Fallback to mock data if the API call fails
        setTeachers(MOCK_TEACHERS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // --- Scoped Data By User Role & Academic Year ---
  const scopedData = useMemo(() => {
    // 1. Filter everything by the selected academic year first
    let yearClassGroups = classGroups.filter(cg => cg.academicYear === currentAcademicYear);
    const yearLeaveRequests = leaveRequests.filter(lr => lr.academicYear === currentAcademicYear);
    const yearObservations = observations.filter(o => o.academicYear === currentAcademicYear);
    const yearProcurementRequests = procurementRequests.filter(pr => pr.academicYear === currentAcademicYear);
    const yearParentQueries = parentQueries.filter(pq => pq.academicYear === currentAcademicYear);
    const yearTimeConstraints = timeConstraints.filter(tc => tc.academicYear === currentAcademicYear);
    const yearTimetableHistory = timetableHistory.filter(th => th.academicYear === currentAcademicYear);
    
    // 2. Filter by the selected global phase
    if (selectedPhaseId !== 'all') {
        const phase = phaseStructures.find(p => p.id === selectedPhaseId);
        if (phase) {
            const phaseGradeCurricula = new Set<string>();
            phase.grades.forEach(g => {
                phase.curricula.forEach(c => {
                    phaseGradeCurricula.add(`${g}|${c}`);
                });
            });
            yearClassGroups = yearClassGroups.filter(cg => phaseGradeCurricula.has(`${cg.grade}|${cg.curriculum}`));
        }
    }
    
    const yearAllocations = allocations.filter(a => yearClassGroups.some(cg => cg.id === a.classGroupId));

    if (!currentUser) {
        return { visibleTeachers: [], classGroups: [], allocations: [], leaveRequests: [], observations: [], procurementRequests: [], parentQueries: [], timeConstraints: [], timetableHistory: [] };
    }
    
    const userPosition = academicStructure.positions.find(p => p.id === currentUser.positionId);
    if (userPosition?.name === 'Super Admin') {
        return { visibleTeachers: teachers, classGroups: yearClassGroups, allocations: yearAllocations, leaveRequests: yearLeaveRequests, observations: yearObservations, procurementRequests: yearProcurementRequests, parentQueries: yearParentQueries, timeConstraints: yearTimeConstraints, timetableHistory: yearTimetableHistory };
    }

    // 3. Determine the set of teacher IDs the current user is allowed to see
    const visibleTeacherIds = new Set<string>();
    
    // A teacher can always see themself
    visibleTeacherIds.add(currentUser.id);

    // If the user is a manager, find all their direct and indirect reports
    const reportsMap = new Map<string, string[]>();
    teachers.forEach(t => {
        if (t.managerId) {
            if (!reportsMap.has(t.managerId)) reportsMap.set(t.managerId, []);
            reportsMap.get(t.managerId)!.push(t.id);
        }
    });

    const getAllSubordinates = (managerId: string) => {
        const subordinates = new Set<string>();
        const queue = [managerId];
        while (queue.length > 0) {
            const currentManagerId = queue.shift()!;
            const reports = reportsMap.get(currentManagerId) || [];
            reports.forEach(reportId => {
                subordinates.add(reportId);
                queue.push(reportId);
            });
        }
        return subordinates;
    };
    getAllSubordinates(currentUser.id).forEach(id => visibleTeacherIds.add(id));

    // If the user is a Phase Head, find all teachers in their phase(s)
    if (userPosition?.name === 'Phase Head') {
        const managedPhases = phaseStructures.filter(p => p.phaseHeadId === currentUser.id);
        if (managedPhases.length > 0) {
            const managedGradeCurricula = new Set<string>();
            managedPhases.forEach(p => {
                p.grades.forEach(g => {
                    p.curricula.forEach(c => {
                        managedGradeCurricula.add(`${g}|${c}`);
                    });
                });
            });

            const phaseClassGroups = yearClassGroups.filter(cg => managedGradeCurricula.has(`${cg.grade}|${cg.curriculum}`));
            const phaseClassGroupIds = new Set(phaseClassGroups.map(cg => cg.id));
            const phaseAllocations = yearAllocations.filter(a => phaseClassGroupIds.has(a.classGroupId));
            phaseAllocations.forEach(a => visibleTeacherIds.add(a.teacherId));
        }
    }

    // 4. Filter all data based on the visibleTeacherIds
    const visibleTeachers = teachers.filter(t => visibleTeacherIds.has(t.id));
    const scopedAllocations = yearAllocations.filter(a => visibleTeacherIds.has(a.teacherId));
    const visibleClassGroupIds = new Set(scopedAllocations.map(a => a.classGroupId));
    const scopedClassGroups = yearClassGroups.filter(cg => visibleClassGroupIds.has(cg.id));
    const scopedLeaveRequests = yearLeaveRequests.filter(lr => visibleTeacherIds.has(lr.teacherId));
    const scopedObservations = yearObservations.filter(o => visibleTeacherIds.has(o.teacherId));
    const scopedProcurementRequests = yearProcurementRequests.filter(pr => visibleTeacherIds.has(pr.requesterId));
    const scopedParentQueries = yearParentQueries.filter(pq => visibleTeacherIds.has(pq.teacherId));

    return {
        visibleTeachers,
        classGroups: scopedClassGroups,
        allocations: scopedAllocations,
        leaveRequests: scopedLeaveRequests,
        observations: scopedObservations,
        procurementRequests: scopedProcurementRequests,
        parentQueries: scopedParentQueries,
        timeConstraints: yearTimeConstraints, // Constraints are global for the year
        timetableHistory: yearTimetableHistory,
    };
  }, [currentUser, currentAcademicYear, selectedPhaseId, teachers, classGroups, allocations, leaveRequests, observations, procurementRequests, parentQueries, timeConstraints, timetableHistory, academicStructure, phaseStructures]);


  const teacherWorkloads = useMemo(() => {
    const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));
    const classGroupMap = new Map(scopedData.classGroups.map(g => [g.id, g]));

    const workloads = new Map<string, TeacherWorkload>();
    scopedData.visibleTeachers.forEach(teacher => {
        workloads.set(teacher.id, {
            totalPeriods: 0,
            totalLearners: 0,
            totalClasses: 0,
            periodsByMode: {},
        });
    });

    const teacherClassGroupIds = new Map<string, Set<string>>();

    scopedData.allocations.forEach(alloc => {
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
}, [scopedData.visibleTeachers, scopedData.allocations, academicStructure.subjects, scopedData.classGroups]);


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
        const stateToSave: Omit<AppState, 'teachers'> = {
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
            auditLog,
            taskBoards,
            notifications,
            currentAcademicYear,
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
  }, [academicStructure, phaseStructures, classGroups, allocations, leaveRequests, observations, procurementRequests, monitoringTemplates, parentQueries, allocationSettings, generalSettings, timeGrids, timeConstraints, timetableHistory, auditLog, taskBoards, notifications, currentAcademicYear]);

  const logAction = (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.fullName,
      action,
      details,
    };
    setAuditLog(prev => [newLog, ...prev].slice(0, 500)); // Keep last 500 logs
  };

  const sendNotification = (userId: string, type: 'leaveStatus' | 'newParentQuery' | 'parentQueryUpdate' | 'slaBreach', data: any) => {
      const teacher = teachers.find(t => t.id === userId);
      if (!teacher) return;
      
      const newNotification = generateNotification(userId, type, data);
      setNotifications(prev => [newNotification, ...prev]);
  };

  const handleLoginSuccess = (user: Teacher) => {
    setCurrentUser(user);
    setCurrentUserPermissions(getUserPermissions(user, academicStructure.positions));
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserPermissions([]);
    setActivePage('dashboard');
  };

  const handleResetState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    window.location.reload();
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-bg dark:bg-brand-navy">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-brand-navy dark:text-white tracking-wider">SMT</h1>
                <p className="mt-2 text-brand-text-light dark:text-gray-400">Loading Application Data...</p>
            </div>
        </div>
    );
  }

  if (!currentUser) {
    return <LoginPage teachers={teachers} onLoginSuccess={handleLoginSuccess} />;
  }

  const userPosition = academicStructure.positions.find(p => p.id === currentUser.positionId);

  if (userPosition?.name === 'Teacher') {
    return (
      <TeacherDashboard 
          currentUser={currentUser}
          onLogout={handleLogout}
          workload={teacherWorkloads.get(currentUser.id)}
          timetableHistory={scopedData.timetableHistory}
          timeGrids={timeGrids}
          academicStructure={{...academicStructure, monitoringTemplates}}
          leaveRequests={scopedData.leaveRequests}
          observations={scopedData.observations}
          parentQueries={scopedData.parentQueries}
          classGroups={scopedData.classGroups}
          allocations={scopedData.allocations}
      />
    )
  }
  
  const pagePermissions: Record<Page, Permission> = {
      'dashboard': 'view:dashboard',
      'academic-team': 'view:academic-team',
      'allocations': 'view:allocations',
      'timetable': 'view:timetable',
      'payroll': 'view:payroll',
      'leave': 'view:leave',
      'observations': 'view:monitoring',
      'procurement': 'view:procurement',
      'parents': 'view:parents',
      'settings': 'view:settings',
      'tasks': 'view:tasks',
  };

  const canViewActivePage = hasPermission(currentUserPermissions, pagePermissions[activePage]);

  const renderContent = () => {
    if (!canViewActivePage) {
        return (
            <div className="text-center p-12 bg-white dark:bg-slate-800/50 rounded-lg shadow-sm">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Access Denied</h2>
                <p className="mt-2 text-brand-text-light dark:text-gray-400">You do not have permission to view this page. Please contact an administrator.</p>
            </div>
        )
    }
    
    switch (activePage) {
      case 'dashboard':
        return <Dashboard 
                  teachers={scopedData.visibleTeachers} 
                  workloads={teacherWorkloads}
                  phaseStructures={phaseStructures}
                  permissions={currentUserPermissions}
                  sendNotification={sendNotification}
                  allocations={scopedData.allocations}
                  classGroups={scopedData.classGroups}
                />;
      case 'academic-team':
        return <AcademicTeam 
                  teachers={scopedData.visibleTeachers} 
                  setTeachers={setTeachers} 
                  academicStructure={academicStructure} 
                  phaseStructures={phaseStructures} 
                  workloads={teacherWorkloads}
                  allocations={scopedData.allocations}
                  classGroups={scopedData.classGroups}
                  leaveRequests={scopedData.leaveRequests}
                  observations={scopedData.observations}
                  monitoringTemplates={monitoringTemplates}
                  timeGrids={timeGrids}
                  timetableHistory={scopedData.timetableHistory}
                  permissions={currentUserPermissions}
// FIX: Pass currentUser prop to AcademicTeam
                  currentUser={currentUser}
                  logAction={logAction}
                />;
      case 'allocations':
        return <Allocations 
                  teachers={scopedData.visibleTeachers} 
                  setTeachers={setTeachers}
                  classGroups={scopedData.classGroups} 
                  allocations={scopedData.allocations} 
                  setAllocations={setAllocations}
                  academicStructure={academicStructure}
                  phaseStructures={phaseStructures}
                  teacherWorkloads={teacherWorkloads}
                  allocationSettings={allocationSettings}
                  generalSettings={generalSettings}
                  timeGrids={timeGrids}
                  timetableHistory={scopedData.timetableHistory}
                  permissions={currentUserPermissions}
                  logAction={logAction}
                />;
      case 'timetable':
        return <Timetable 
                  timeGrids={timeGrids}
                  setTimeGrids={setTimeGrids}
                  timeConstraints={scopedData.timeConstraints}
                  setTimeConstraints={setTimeConstraints}
                  timetableHistory={scopedData.timetableHistory}
                  setTimetableHistory={setTimetableHistory}
                  teachers={scopedData.visibleTeachers}
                  classGroups={scopedData.classGroups}
                  setClassGroups={setClassGroups}
                  allocations={scopedData.allocations}
                  academicStructure={academicStructure}
                  currentAcademicYear={currentAcademicYear}
                  permissions={currentUserPermissions}
                  logAction={logAction}
               />;
      case 'tasks':
        return <Tasks 
                  boards={taskBoards}
                  setBoards={setTaskBoards}
                  allTeachers={teachers}
                  currentUser={currentUser}
                  permissions={currentUserPermissions}
                />;
      case 'payroll':
        return <Payroll teachers={scopedData.visibleTeachers} setTeachers={setTeachers} permissions={currentUserPermissions} logAction={logAction} />;
      case 'leave':
        return <Leave 
                  teachers={scopedData.visibleTeachers} 
                  leaveRequests={scopedData.leaveRequests} 
                  setLeaveRequests={setLeaveRequests} 
                  currentAcademicYear={currentAcademicYear} 
                  permissions={currentUserPermissions} 
                  sendNotification={sendNotification}
                  logAction={logAction}
                />;
      case 'observations':
        return <Monitoring 
                    teachers={scopedData.visibleTeachers} 
                    observations={scopedData.observations} 
                    setObservations={setObservations}
                    academicStructure={academicStructure}
                    phaseStructures={phaseStructures}
                    monitoringTemplates={monitoringTemplates}
                    setMonitoringTemplates={setMonitoringTemplates}
                    currentAcademicYear={currentAcademicYear}
                    permissions={currentUserPermissions}
                    classGroups={scopedData.classGroups}
                    allocations={scopedData.allocations}
                    logAction={logAction}
                />;
      case 'procurement':
        return <Procurement teachers={scopedData.visibleTeachers} procurementRequests={scopedData.procurementRequests} setProcurementRequests={setProcurementRequests} currentAcademicYear={currentAcademicYear} permissions={currentUserPermissions} logAction={logAction} />;
      case 'parents':
        return <Parents 
                 teachers={scopedData.visibleTeachers}
                 queries={scopedData.parentQueries}
                 setQueries={setParentQueries}
                 currentAcademicYear={currentAcademicYear}
                 permissions={currentUserPermissions}
                 sendNotification={sendNotification}
                 logAction={logAction}
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
            currentAcademicYear={currentAcademicYear}
            permissions={currentUserPermissions}
            auditLog={auditLog}
            logAction={logAction}
          />
        );
      default:
        return <Dashboard 
                  teachers={scopedData.visibleTeachers} 
                  workloads={teacherWorkloads}
                  phaseStructures={phaseStructures}
                  permissions={currentUserPermissions}
                  sendNotification={sendNotification}
                  allocations={scopedData.allocations}
                  classGroups={scopedData.classGroups}
                />;
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
      currentAcademicYear={currentAcademicYear}
      setCurrentAcademicYear={setCurrentAcademicYear}
      permissions={currentUserPermissions}
      notifications={notifications}
      setNotifications={setNotifications}
      selectedPhaseId={selectedPhaseId}
      setSelectedPhaseId={setSelectedPhaseId}
      phaseStructures={phaseStructures}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
