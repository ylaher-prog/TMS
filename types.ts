import type { Permission } from './permissions';

export type { Permission };

export enum EmploymentStatus {
  Probation = 'Probation',
  Permanent = 'Permanent',
  Contract = 'Contract',
  OnLeave = 'On Leave',
  Exited = 'Exited',
}

export interface Position {
  id: string;
  name: string;
  reportsToId?: string;
  permissions: Permission[];
}

export interface SalaryInfo {
    employeeCode: string;
    salary: number;
    medicalAllowance: number;
    tax: number;
    uifDeduction: number;
    medicalAidDeduction: number;
    vitalityDeduction: number;
    uifContribution: number;
    sdlContribution: number;
    providentFundContribution: number;
    totalEarnings: number;
    totalDeductions: number;

    nettPay: number;
    totalCompanyContributions: number;
    salaryCost: number;
}


export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  employeeCode?: string;
  avatarUrl: string;
  employmentStatus: EmploymentStatus;
  startDate: string;
  positionId: string;
  managerId?: string; // Teacher ID of the manager
  preferredGrades?: string[];
  maxLearners: number;
  maxPeriodsByMode: { [mode: string]: number };
  specialties: string[]; // Subject names
  markingTasks: number;
  slas: {
    messageResponse: number; // in hours
    markingTurnaround: number; // in hours
  };
  workloadComments?: string;
  salaryInfo?: SalaryInfo;
  username?: string;
  passwordHash?: string;
}

export type Page = 'dashboard' | 'academic-team' | 'allocations' | 'leave' | 'observations' | 'procurement' | 'settings' | 'parents' | 'payroll' | 'timetable' | 'tasks';

export enum SubjectCategory {
  Core = 'Core',
  Elective = 'Elective',
}

export interface Subject {
    id: string;
    name: string;
    grades: string[];
    modes: string[];
    curricula: string[];
    periodsByMode: Array<{mode: string, periods: number}>;
    periodOverrides?: Array<{curriculum: string; grade: string; mode: string; periods: number}>
    category: SubjectCategory;
    electiveGroup?: string;
}

export enum AllocationStrategy {
  Strict = 'strict', // Heavily prioritizes grade consolidation & preferences
  Balanced = 'balanced', // Balances consolidation with workload
  Flexible = 'flexible', // Prioritizes workload balance above all
}

export interface AllocationSettings {
  strategy: AllocationStrategy;
  prioritizePreferredGrades: boolean;
}

export interface SenderEmailAccount {
  id: string;
  email: string;
  isDefault: boolean;
  type: 'manual' | 'google';
}

export interface GeneralSettings {
  senderEmails: SenderEmailAccount[];
}

export interface AcademicStructure {
  curricula: string[];
  grades: string[];
  subjects: Subject[];
  modes: string[];
  academicPeriods: string[];
  positions: Position[];
  academicYears: string[];
}

export interface PhaseStructure {
  id: string;
  phase: string;
  grades: string[];
  curricula: string[];
  phaseHeadId: string;
}

export interface ClassGroup {
    id: string;
    name: string;
    curriculum: string;
    grade: string;
    mode: string;
    learnerCount: number;
    subjectIds: string[];
    academicYear: string;
    timeGridId?: string;
    addToTimetable?: boolean;
}


export enum AllocationRole {
  Lead = 'Lead',
  CoTeacher = 'Co-Teacher',
  Substitute = 'Substitute',
}

export type ClassMode = 'Live' | 'Flipped' | 'Self-Paced';

export interface TeacherAllocation {
    id: string;
    teacherId: string;
    classGroupId: string;
    subjectId: string;
    role: AllocationRole;
}

export enum LeaveType {
    Annual = 'Annual',
    Sick = 'Sick',
    Maternity = 'Maternity',
    Unpaid = 'Unpaid',
}

export enum RequestStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Denied = 'Denied',
}

export interface LeaveRequest {
    id: string;
    teacherId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    status: RequestStatus;
    reason: string;
    academicYear: string;
}

// New Monitoring & Observations Types
export type ObservationType = string;

export enum MonitoringStatus {
    Open = 'Open',
    InProgress = 'In-Progress',
    Resolved = 'Resolved',
    Escalated = 'Escalated',
}

export enum ObservationPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface Observation {
    id: string;
    observationType: ObservationType; // Now holds the ID of the MonitoringTemplate
    teacherId: string;
    phase: string;
    grade: string;
    curriculum: string;
    phaseHeadId: string;
    observationDate: string;
    status: MonitoringStatus;
    priority: ObservationPriority;
    formData: Record<string, any>; // Stores data from the dynamic form
    followUpDate?: string;
    academicYear: string;
    classGroupId?: string;
    subjectId?: string;
}


export interface ProcurementRequest {
    id:string;
    requesterId: string; // teacherId
    itemDescription: string;
    category: string;
    amount: number;
    requestDate: string;
    status: RequestStatus;
    academicYear: string;
}

export interface TeacherWorkload {
  totalPeriods: number;
  totalLearners: number;
  totalClasses: number;
  periodsByMode: { [mode: string]: number };
}

// Monitoring Setup Types
export enum FormFieldType {
    Text = 'Text',
    Textarea = 'Textarea',
    Select = 'Select',
    Rating = 'Rating (1-5)',
    Checkbox = 'Checkbox',
    Date = 'Date',
    Number = 'Number',
    FileUpload = 'File Upload',
}

export interface FormField {
    id: string;
    label: string;
    type: FormFieldType;
    options?: string[];
    required: boolean;
    placeholder?: string;
}

export interface MonitoringTemplate {
    id: string; // Stable ID
    name: ObservationType; // Editable name/type shown to user
    fields: FormField[];
    phaseId?: string; // Optional: Link to a specific phase
}

export enum ParentQueryCategory {
    Academic = 'Academic',
    Behavioral = 'Behavioral',
    Administrative = 'Administrative',
    Technical = 'Technical',
    Other = 'Other',
}

export interface ParentQuery {
  id: string;
  parentName: string;
  parentEmail: string;
  studentName: string;
  teacherId: string;
  queryDetails: string;
  category: ParentQueryCategory;
  status: MonitoringStatus;
  creationDate: string;
  resolutionNotes?: string;
  academicYear: string;
}

// Timetabling
export interface TimetablePeriod {
  id: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  type: 'Lesson' | 'Break';
}

export interface TimeGrid {
  id: string;
  name: string;
  days: string[];
  periods: TimetablePeriod[];
  color: string;
}

export interface LessonDefinition {
    id: string; // for UI key management
    count: number; // e.g. '3' lessons
    duration: number; // e.g. '2' periods long (a double period)
}

export type TimeConstraint =
    | {
        id: string;
        type: 'not-available';
        targetType: 'teacher';
        targetId: string;
        day: string;
        periodId: string;
        academicYear: string;
      }
    | {
        id:string;
        type: 'teacher-max-periods-day';
        teacherId: string;
        maxPeriods: number;
        academicYear: string;
      }
    | {
        id: string;
        type: 'teacher-max-consecutive';
        teacherId: string;
        maxPeriods: number;
        academicYear: string;
      }
    | {
        id: string;
        type: 'subject-rule';
        subjectId: string;
        classGroupId: string;
        academicYear: string;
        rules: {
            lessonDefinitions: LessonDefinition[];
            minDaysApart: number;
            maxPeriodsPerDay?: number | null;
            maxConsecutive?: number | null;
            mustBeEveryDay?: boolean;
            preferredTime?: 'any' | 'morning' | 'afternoon';
        }
      };


export interface GeneratedSlot {
  id: string; // combination of group-subject-teacher
  classGroupId: string;
  subjectId: string;
  teacherId: string;
}

// Storing the generated timetable by class group ID for easy lookup
export type GeneratedTimetable = Record<string, Record<string, Record<string, GeneratedSlot[] | null>>>; // { [classGroupId]: { [day]: { [periodId]: GeneratedSlot[] } } }

export interface Conflict {
  id: string;
  type: 'Teacher Double-Booked' | 'Placement Failure' | 'Constraint Violation';
  message: string;
  details: {
    teacherId?: string;
    teacherName?: string;
    classGroupId?: string;
    classGroupName?: string;
    subjectId?: string;
    subjectName?: string;
    day?: string;
    periodId?: string;
    periodName?: string;
    conflictingClassGroupId?: string;
    conflictingClassGroupName?: string;
    conflictingSubjectId?: string;
    conflictingSubjectName?: string;
  };
}


export interface TimetableHistoryEntry {
  id: string;
  timestamp: string;
  timetable: GeneratedTimetable;
  conflicts: Conflict[];
  academicYear: string;
  objectiveScore?: number;
  solverSeed?: string;
  solverVersion?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

// Tasks Module
export interface TaskCard {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    assignedToId?: string;
}

export interface TaskColumn {
    id: string;
    title: string;
    cardIds: string[];
}

export interface TaskBoard {
    id: string;
    title: string;
    memberIds: string[];
    columns: TaskColumn[];
    tasks: TaskCard[];
}

// FIX: Add and export Notification type
export interface Notification {
  id: string;
  userId: string;
  type: 'leaveStatus' | 'newParentQuery' | 'parentQueryUpdate' | 'slaBreach';
  data: any;
  timestamp: string;
  read: boolean;
  message: string;
}