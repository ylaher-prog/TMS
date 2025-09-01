import React from 'react';
import type { Teacher, TeacherWorkload, TimetableHistoryEntry, TimeGrid, AcademicStructure, LeaveRequest, Observation, ParentQuery, ClassGroup, TeacherAllocation } from '../types';
import { ArrowRightOnRectangleIcon } from './Icons';
import TeacherTimetableViewer from './TeacherTimetableViewer';
import StatusTag from './StatusTag';

interface TeacherDashboardProps {
    currentUser: Teacher;
    onLogout: () => void;
    workload?: TeacherWorkload;
    timetableHistory: TimetableHistoryEntry[];
    timeGrids: TimeGrid[];
    academicStructure: AcademicStructure & { monitoringTemplates: any[] };
    leaveRequests: LeaveRequest[];
    observations: Observation[];
    parentQueries: ParentQuery[];
    classGroups: ClassGroup[];
    allocations: TeacherAllocation[];
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = (props) => {
    const { currentUser, onLogout, workload, timetableHistory, timeGrids, academicStructure, leaveRequests, observations, parentQueries, classGroups, allocations } = props;
    
    const totalMaxPeriods = Object.values(currentUser.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);

    return (
        <div className="min-h-screen bg-brand-bg dark:bg-brand-navy font-sans text-brand-text-dark dark:text-gray-300">
            <header className="bg-white dark:bg-slate-800/50 shadow-sm p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-brand-navy dark:text-white">Welcome, {currentUser.fullName}</h1>
                    <p className="text-sm text-brand-text-light dark:text-gray-400">Your Personal Dashboard</p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary dark:bg-slate-700 dark:text-gray-200 dark:border-slate-600 dark:hover:bg-slate-600"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Logout
                </button>
            </header>

            <main className="p-6 space-y-6">
                {/* Workload KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <p className="text-sm font-medium text-brand-text-light dark:text-gray-400">Period Load</p>
                        <p className="text-3xl font-bold mt-1 text-brand-text-dark dark:text-white">{workload?.totalPeriods || 0} / {totalMaxPeriods}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <p className="text-sm font-medium text-brand-text-light dark:text-gray-400">Learner Load</p>
                        <p className="text-3xl font-bold mt-1 text-brand-text-dark dark:text-white">{workload?.totalLearners || 0} / {currentUser.maxLearners}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <p className="text-sm font-medium text-brand-text-light dark:text-gray-400">Class Load</p>
                        <p className="text-3xl font-bold mt-1 text-brand-text-dark dark:text-white">{workload?.totalClasses || 0}</p>
                    </div>
                </div>

                {/* Timetable */}
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                     <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Your Timetable</h3>
                     <TeacherTimetableViewer
                        teacher={currentUser}
                        timetableHistory={timetableHistory}
                        timeGrids={timeGrids}
                        academicStructure={academicStructure}
                        classGroups={classGroups}
                        allocations={allocations}
                     />
                </div>

                {/* Other Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Recent Monitoring</h3>
                        <ul className="space-y-3">
                            {observations.slice(0, 5).map(obs => (
                                <li key={obs.id} className="text-sm flex justify-between">
                                    <span>{academicStructure.monitoringTemplates.find(t => t.id === obs.observationType)?.name || obs.observationType} ({obs.observationDate})</span>
                                    <StatusTag status={obs.status} />
                                </li>
                            ))}
                            {observations.length === 0 && <p className="text-sm text-gray-500">No entries.</p>}
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Leave Requests</h3>
                         <ul className="space-y-3">
                            {leaveRequests.slice(0, 5).map(req => (
                                <li key={req.id} className="text-sm flex justify-between">
                                    <span>{req.leaveType}: {req.startDate} to {req.endDate}</span>
                                    <StatusTag status={req.status} />
                                </li>
                            ))}
                            {leaveRequests.length === 0 && <p className="text-sm text-gray-500">No requests.</p>}
                        </ul>
                    </div>
                    <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Parent Queries</h3>
                         <ul className="space-y-3">
                            {parentQueries.slice(0, 5).map(q => (
                                <li key={q.id} className="text-sm flex justify-between">
                                    <span className="truncate pr-2">{q.parentName} ({q.studentName})</span>
                                    <StatusTag status={q.status} />
                                </li>
                            ))}
                            {parentQueries.length === 0 && <p className="text-sm text-gray-500">No open queries.</p>}
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;
