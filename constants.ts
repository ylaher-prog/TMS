import type { Teacher, AcademicStructure, PhaseStructure, MonitoringTemplate, AllocationSettings, GeneralSettings, TimeGrid } from './types';
import { EmploymentStatus, LeaveType, RequestStatus, FormFieldType, AllocationStrategy } from './types';
import { ALL_PERMISSIONS } from './permissions';

// In a real app, this hash would be generated securely on the server.
// For this frontend demo, we'll use a simple scheme. 'password123'
const MOCK_PASSWORD_HASH = '12345'; 

export const MOCK_TEACHERS: Teacher[] = [
    {
        id: 'super-admin-01',
        fullName: 'Admin',
        email: 'admin@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user1/40/40',
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
    },
    {
        id: 'smt-01',
        fullName: 'Aisha Ahmed',
        email: 'aisha.ahmed@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user4/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2020-06-01',
        positionId: 'pos-smt',
        maxLearners: 500,
        maxPeriodsByMode: {},
        specialties: ['School Management'],
        markingTasks: 0,
        slas: { messageResponse: 24, markingTurnaround: 48 },
        username: 'aisha',
        passwordHash: MOCK_PASSWORD_HASH,
    },
    {
        id: 'phase-head-01',
        fullName: 'Fatima Khan',
        email: 'fatima.khan@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user2/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2021-05-10',
        positionId: 'pos-phase-head',
        managerId: 'smt-01',
        maxLearners: 250,
        maxPeriodsByMode: { 'Live': 15, 'Flipped Afternoon': 5 },
        specialties: ['Mathematics', 'Physics'],
        markingTasks: 5,
        slas: { messageResponse: 18, markingTurnaround: 40 },
        username: 'fatima',
        passwordHash: MOCK_PASSWORD_HASH,
    },
    {
        id: 'subject-leader-01',
        fullName: 'Ben Carter',
        email: 'ben.carter@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user5/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2022-01-15',
        positionId: 'pos-subject-leader',
        managerId: 'phase-head-01',
        maxLearners: 220,
        maxPeriodsByMode: { 'Live': 16 },
        specialties: ['Mathematics'],
        markingTasks: 8,
        slas: { messageResponse: 20, markingTurnaround: 42 },
        username: 'ben',
        passwordHash: MOCK_PASSWORD_HASH,
    },
    {
        id: 'teacher-01',
        fullName: 'John Doe',
        email: 'john.doe@qurtubaonline.co.za',
        avatarUrl: 'https://picsum.photos/seed/user3/40/40',
        employmentStatus: EmploymentStatus.Permanent,
        startDate: '2022-08-01',
        positionId: 'pos-teacher',
        managerId: 'subject-leader-01',
        maxLearners: 200,
        maxPeriodsByMode: { 'Live': 18 },
        specialties: ['English', 'History'],
        markingTasks: 10,
        slas: { messageResponse: 22, markingTurnaround: 48 },
        username: 'john',
        passwordHash: MOCK_PASSWORD_HASH,
    },
];

export const MOCK_ACADEMIC_STRUCTURE: AcademicStructure = {
  curricula: ['British', 'CAPS'],
  grades: ['4', '5', '6', '7'],
  subjects: [],
  modes: ['Flipped Afternoon', 'Flipped Morning', 'Live', 'Self-Paced'],
  academicPeriods: [],
  positions: [
      { id: 'pos-super-admin', name: 'Super Admin', permissions: ALL_PERMISSIONS },
      { id: 'pos-smt', name: 'SMT', permissions: [] },
      { id: 'pos-phase-head', name: 'Phase Head', permissions: [], reportsToId: 'pos-smt' },
      { id: 'pos-subject-leader', name: 'Subject Leader', permissions: [], reportsToId: 'pos-phase-head' },
      { id: 'pos-teacher', name: 'Teacher', permissions: [], reportsToId: 'pos-subject-leader' },
  ],
  academicYears: ['2026', '2025'],
};

export const DEFAULT_ALLOCATION_SETTINGS: AllocationSettings = {
  strategy: AllocationStrategy.Balanced,
  prioritizePreferredGrades: true,
};

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  senderEmails: [{ id: 'default-1', email: 'noreply@qurtubaonline.co.za', isDefault: true, type: 'manual' }],
};

export const MOCK_PHASE_STRUCTURES: PhaseStructure[] = [];

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

export const DEFAULT_TIME_GRIDS: TimeGrid[] = [
  {
    id: 'grid-live',
    name: 'Live',
    color: TIME_GRID_COLORS[0],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periods: [
      { id: 'p1', name: '08:00 - 08:30', startTime: '08:00', endTime: '08:30', type: 'Lesson' },
      { id: 'p2', name: '08:30 - 09:00', startTime: '08:30', endTime: '09:00', type: 'Lesson' },
      { id: 'p3', name: '09:00 - 09:30', startTime: '09:00', endTime: '09:30', type: 'Lesson' },
      { id: 'p4', name: '09:30 - 10:00', startTime: '09:30', endTime: '10:00', type: 'Lesson' },
      { id: 'b1', name: 'Break', startTime: '10:00', endTime: '10:30', type: 'Break' },
      { id: 'p5', name: '10:30 - 11:00', startTime: '10:30', endTime: '11:00', type: 'Lesson' },
      { id: 'p6', name: '11:00 - 11:30', startTime: '11:00', endTime: '11:30', type: 'Lesson' },
      { id: 'p7', name: '11:30 - 12:00', startTime: '11:30', endTime: '12:00', type: 'Lesson' },
      { id: 'b2', name: 'Lunch', startTime: '12:00', endTime: '12:30', type: 'Break' },
      { id: 'p8', name: '12:30 - 13:00', startTime: '12:30', endTime: '13:00', type: 'Lesson' },
      { id: 'p9', name: '13:00 - 13:30', startTime: '13:00', endTime: '13:30', type: 'Lesson' },
    ],
  },
  {
    id: 'grid-flipped-am',
    name: 'Flipped Morning',
    color: TIME_GRID_COLORS[1],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    periods: [
      { id: 'fm1', name: '1', startTime: '10:00', endTime: '10:30', type: 'Lesson' },
      { id: 'fm2', name: '2', startTime: '10:30', endTime: '11:00', type: 'Lesson' },
    ],
  },
  {
    id: 'grid-flipped-pm',
    name: 'Flipped Afternoon',
    color: TIME_GRID_COLORS[2],
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    periods: [
      { id: 'fp3', name: '3', startTime: '15:00', endTime: '15:30', type: 'Lesson' },
      { id: 'fp4', name: '4', startTime: '15:30', endTime: '16:00', type: 'Lesson' },
    ],
  }
];