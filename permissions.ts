
import type { Teacher, Position } from './types';

export type Permission = 
    // Dashboard
    | 'view:dashboard'
    | 'view:dashboard-phase-filter'
    | 'view:header-phase-filter'
    // Academic Team
    | 'view:academic-team'
    | 'view:teacher-report'
    | 'view:teacher-logins'
    | 'reset:teacher-password'
    | 'add:teacher'
    | 'edit:teacher'
    | 'delete:teacher'
    | 'import:teachers'
    | 'export:teachers'
    | 'view:organogram'
    // Allocations
    | 'view:allocations'
    | 'edit:allocations'
    | 'auto:allocations'
    | 'reset:allocations'
    // Timetable
    | 'view:timetable'
    | 'setup:timetable-grids'
    | 'setup:timetable-rules'
    | 'generate:timetable'
    | 'manage:timetable-history'
    // Tasks
    | 'view:tasks'
    | 'manage:task-boards'
    | 'manage:task-columns'
    | 'manage:task-cards'
    // Payroll
    | 'view:payroll'
    | 'import:payroll'
    // Leave
    | 'view:leave'
    | 'approve:leave'
    // Monitoring
    | 'view:monitoring'
    | 'add:monitoring-entry'
    | 'edit:monitoring-entry'
    | 'delete:monitoring-entry'
    | 'setup:monitoring'
    // Procurement
    | 'view:procurement'
    | 'approve:procurement'
    // Parents
    | 'view:parents'
    | 'add:parent-query'
    | 'edit:parent-query'
    | 'delete:parent-query'
    // Settings
    | 'view:settings'
    | 'edit:settings-base'
    | 'edit:settings-subjects'
    | 'edit:settings-classgroups'
    | 'edit:settings-phases'
    | 'edit:settings-positions'
    | 'edit:settings-permissions'
    | 'edit:settings-general'
    | 'action:reset-app'
    | 'view:audit-log';


export const PERMISSIONS_CONFIG: { category: string, permissions: {id: Permission, label: string}[] }[] = [
    {
        category: 'Dashboard',
        permissions: [
            { id: 'view:dashboard', label: 'View Dashboard' },
            { id: 'view:dashboard-phase-filter', label: 'View Dashboard Phase Filter' },
            { id: 'view:header-phase-filter', label: 'View Global Phase Filter in Header' },
        ],
    },
    {
        category: 'Academic Team',
        permissions: [
            { id: 'view:academic-team', label: 'View Academic Team Page' },
            { id: 'view:teacher-report', label: 'View Teacher Reports' },
            { id: 'view:teacher-logins', label: 'View Teacher Login Details' },
            { id: 'reset:teacher-password', label: 'Reset Teacher Passwords' },
            { id: 'add:teacher', label: 'Add New Teachers' },
            { id: 'edit:teacher', label: 'Edit Existing Teachers' },
            { id: 'delete:teacher', label: 'Delete Teachers' },
            { id: 'import:teachers', label: 'Bulk Import Teachers' },
            { id: 'export:teachers', label: 'Export Teacher Data' },
            { id: 'view:organogram', label: 'View Organogram' },
        ],
    },
    {
        category: 'Allocations',
        permissions: [
            { id: 'view:allocations', label: 'View Allocations Page' },
            { id: 'edit:allocations', label: 'Edit Allocations' },
            { id: 'auto:allocations', label: 'Run Auto-Allocation' },
            { id: 'reset:allocations', label: 'Reset Allocations' },
        ],
    },
    {
        category: 'Timetable',
        permissions: [
            { id: 'view:timetable', label: 'View Timetable Page' },
            { id: 'setup:timetable-grids', label: 'Manage Time Grids' },
            { id: 'setup:timetable-rules', label: 'Manage Timetable Rules' },
            { id: 'generate:timetable', label: 'Generate Timetables' },
            { id: 'manage:timetable-history', label: 'Manage Timetable History' },
        ]
    },
    {
        category: 'Tasks',
        permissions: [
            { id: 'view:tasks', label: 'View Tasks Page' },
            { id: 'manage:task-boards', label: 'Create & Manage Task Boards' },
            { id: 'manage:task-columns', label: 'Add/Edit/Delete Columns' },
            { id: 'manage:task-cards', label: 'Add/Edit/Delete Task Cards' },
        ]
    },
    {
        category: 'Payroll',
        permissions: [
            { id: 'view:payroll', label: 'View Payroll Page' },
            { id: 'import:payroll', label: 'Import Salary Data' },
        ],
    },
    {
        category: 'Leave',
        permissions: [
            { id: 'view:leave', label: 'View Leave Page' },
            { id: 'approve:leave', label: 'Approve/Deny Leave Requests' },
        ],
    },
    {
        category: 'Monitoring',
        permissions: [
            { id: 'view:monitoring', label: 'View Monitoring Page' },
            { id: 'add:monitoring-entry', label: 'Add Monitoring Entries' },
            { id: 'edit:monitoring-entry', label: 'Edit Monitoring Entries' },
            { id: 'delete:monitoring-entry', label: 'Delete Monitoring Entries' },
            { id: 'setup:monitoring', label: 'Setup Monitoring Templates' },
        ],
    },
    {
        category: 'Procurement',
        permissions: [
            { id: 'view:procurement', label: 'View Procurement Page' },
            { id: 'approve:procurement', label: 'Approve/Deny Procurement Requests' },
        ],
    },
    {
        category: 'Parents',
        permissions: [
            { id: 'view:parents', label: 'View Parents Page' },
            { id: 'add:parent-query', label: 'Add Parent Queries' },
            { id: 'edit:parent-query', label: 'Edit Parent Queries' },
            { id: 'delete:parent-query', label: 'Delete Parent Queries' },
        ],
    },
    {
        category: 'Settings',
        permissions: [
            { id: 'view:settings', label: 'View Settings Page' },
            { id: 'edit:settings-base', label: 'Edit Base Items (Grades, Curricula, etc.)' },
            { id: 'edit:settings-subjects', label: 'Edit Subjects' },
            { id: 'edit:settings-classgroups', label: 'Edit Class Groups' },
            { id: 'edit:settings-phases', label: 'Edit Phases & Hierarchy' },
            { id: 'edit:settings-positions', label: 'Edit Positions' },
            { id: 'edit:settings-permissions', label: 'Edit Permissions' },
            { id: 'edit:settings-general', label: 'Edit General Settings' },
            { id: 'action:reset-app', label: 'Reset All Application Data' },
            { id: 'view:audit-log', label: 'View Audit Log' },
        ],
    },
];

export const ALL_PERMISSIONS = PERMISSIONS_CONFIG.flatMap(category => category.permissions.map(p => p.id));

export const hasPermission = (userPermissions: Permission[], requiredPermission: Permission): boolean => {
    return userPermissions.includes(requiredPermission);
};

export const getUserPermissions = (user: Teacher, positions: Position[]): Permission[] => {
    if (!user) return [];
    const userPosition = positions.find(p => p.id === user.positionId);
    return userPosition?.permissions || [];
};