import type { Teacher, AcademicStructure, LeaveRequest, Observation, ProcurementRequest, Subject, PhaseStructure, MonitoringTemplate, AllocationSettings, GeneralSettings, SenderEmailAccount, TimeGrid } from './types';
import { EmploymentStatus, LeaveType, RequestStatus, FormFieldType, AllocationStrategy } from './types';

// In a real app, this hash would be generated securely on the server.
// For this frontend demo, we'll use a simple scheme. 'password123'
const MOCK_PASSWORD_HASH = '12345'; 

export const MOCK_TEACHERS: Teacher[] = [
    {
        id: 'super-admin-01',
        fullName: 'Admin',
        email: 'admin@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2020-01-01',
        positionId: 'pos-super-admin',
        maxLearners: 999,
        maxPeriodsByMode: {},
        specialties: [],
        markingTasks: 0,
        slas: { messageResponse: 24, markingTurnaround: 48 },
        username: 'admin',
        passwordHash: MOCK_PASSWORD_HASH,
    }
];

export const MOCK_ACADEMIC_STRUCTURE: AcademicStructure = {
  curricula: [],
  grades: [],
  subjects: [],
  modes: [],
  academicPeriods: [],
  positions: [{ id: 'pos-super-admin', name: 'Super Admin'}],
};

export const DEFAULT_ALLOCATION_SETTINGS: AllocationSettings = {
  strategy: AllocationStrategy.Balanced,
  prioritizePreferredGrades: true,
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  senderEmails: [{ id: 'default-1', email: 'noreply@qurtubaonline.co.za', isDefault: true, type: 'manual' }],
};

export const MOCK_PHASE_STRUCTURES: PhaseStructure[] = [];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [];

export const MOCK_OBSERVATIONS: Observation[] = [];

export const MOCK_PROCUREMENT_REQUESTS: ProcurementRequest[] = [];

const defaultObservationTypes = [
    'KPA1 – Live Lesson Observation',
    'KPA2 – Moderation',
    'KPA3 – PMR',
    'Subject Specialist Meetings',
    'Educator Meetings',
    'Educator Complaints',
    'Learner Complaints',
    'Technical Issues',
    'Educator Attendance',
    'Parent Queries Resolved',
    'Support Escalations',
];

export const DEFAULT_MONITORING_TEMPLATES: MonitoringTemplate[] = defaultObservationTypes.map((type, i) => ({
    id: `default-${i+1}`,
    name: type,
    fields: [
        { id: 'details', label: 'Details / Notes', type: FormFieldType.Textarea, required: true, options: [] },
        { id: 'actionTaken', label: 'Action Taken', type: FormFieldType.Textarea, required: true, options: [] },
        { id: 'nextSteps', label: 'Next Steps', type: FormFieldType.Text, required: false, options: [] },
    ]
}));

export const TIME_GRID_COLORS = [
  '#4A90E2', // Blue
  '#50E3C2', // Teal
  '#F5A623', // Orange
  '#9013FE', // Purple
  '#BD10E0', // Magenta
  '#7ED321', // Green
];

export const DEFAULT_TIME_GRIDS: TimeGrid[] = [{
  id: 'default-grid',
  name: 'Default School Week',
  color: TIME_GRID_COLORS[0],
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  periods: [
    { id: 'p1', name: '08:00 - 08:30', startTime: '08:00', endTime: '08:30', type: 'Lesson' },
    { id: 'p2', name: '08:30 - 09:00', startTime: '08:30', endTime: '09:00', type: 'Lesson' },
    { id: 'p3', name: '09:00 - 09:30', startTime: '09:00', endTime: '09:30', type: 'Lesson' },
    { id: 'p4', name: '09:30 - 10:00', startTime: '09:30', endTime: '10:00', type: 'Lesson' },
    { id: 'p5', name: '10:00 - 10:30', startTime: '10:00', endTime: '10:30', type: 'Lesson' },
    { id: 'b1', name: 'Break', startTime: '10:30', endTime: '11:00', type: 'Break' },
    { id: 'p6', name: '11:00 - 11:30', startTime: '11:00', endTime: '11:30', type: 'Lesson' },
    { id: 'p7', name: '11:30 - 12:00', startTime: '11:30', endTime: '12:00', type: 'Lesson' },
    { id: 'p8', name: '12:00 - 12:30', startTime: '12:00', endTime: '12:30', type: 'Lesson' },
    { id: 'b2', name: 'Lunch', startTime: '12:30', endTime: '13:00', type: 'Break' },
    { id: 'p9', name: '13:00 - 13:30', startTime: '13:00', endTime: '13:30', type: 'Lesson' },
    { id: 'p10', name: '13:30 - 14:00', startTime: '13:30', endTime: '14:00', type: 'Lesson' },
    { id: 'p11', name: '14:00 - 14:30', startTime: '14:00', endTime: '14:30', type: 'Lesson' },
  ],
}];