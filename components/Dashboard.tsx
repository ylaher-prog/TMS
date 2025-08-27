import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import KpiCard from './KpiCard';
import type { Teacher, TeacherWorkload } from '../types';
import { EmploymentStatus } from '../types';
import { UserGroupIcon, ClockIcon, ExclamationTriangleIcon, CheckCircleIcon } from './Icons';

interface DashboardProps {
    teachers: Teacher[];
    workloads: Map<string, TeacherWorkload>;
}

const Dashboard: React.FC<DashboardProps> = ({ teachers, workloads }) => {
    const kpiData = useMemo(() => {
        const totalTeachers = teachers.length;
        const onLeave = teachers.filter(t => t.employmentStatus === EmploymentStatus.OnLeave).length;
        const activeTeachers = totalTeachers - onLeave;
        
        let totalLearners = 0;
        let overloaded = 0;

        teachers.forEach(t => {
            const workload = workloads.get(t.id);
            if(workload) {
                totalLearners += workload.totalLearners;
                const totalMaxPeriods = Object.values(t.maxPeriodsByMode || {}).reduce((sum, p) => sum + p, 0);
                const periodUtil = totalMaxPeriods > 0 ? workload.totalPeriods / totalMaxPeriods : 0;
                const learnerUtil = t.maxLearners > 0 ? workload.totalLearners / t.maxLearners : 0;
                if (periodUtil > 1 || learnerUtil > 1) {
                    overloaded++;
                }
            }
        });
        
        const slaBreaches = teachers.filter(t => 
            t.slas.markingTurnaround > 72 || t.slas.messageResponse > 24
        ).length;

        return { activeTeachers, totalLearners, overloaded, slaBreaches };
    }, [teachers, workloads]);

    const workloadData = useMemo(() => teachers
        .filter(t => t.employmentStatus !== EmploymentStatus.OnLeave)
        .map(t => {
            const workload = workloads.get(t.id);
            return {
                name: t.fullName.split(' ')[0],
                'Periods': workload?.totalPeriods || 0,
                'Learners': workload?.totalLearners || 0,
            }
        })
    , [teachers, workloads]);
    
    const statusData = useMemo(() => {
        const counts = teachers.reduce((acc, teacher) => {
            acc[teacher.employmentStatus] = (acc[teacher.employmentStatus] || 0) + 1;
            return acc;
        }, {} as Record<EmploymentStatus, number>);

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [teachers]);

    const COLORS = ['#8D1D4B', '#AD9040', '#0B2042', '#4B5563', '#F97316'];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Active Teachers" value={kpiData.activeTeachers} icon={<UserGroupIcon />} iconBgColor="bg-sky-100 dark:bg-sky-900/50" iconTextColor="text-sky-500 dark:text-sky-400" />
                <KpiCard title="Total Learners" value={kpiData.totalLearners.toLocaleString()} icon={<ClockIcon />} iconBgColor="bg-indigo-100 dark:bg-indigo-900/50" iconTextColor="text-indigo-500 dark:text-indigo-400" />
                <KpiCard title="Overloaded Staff" value={kpiData.overloaded} icon={<ExclamationTriangleIcon />} trend="bad" iconBgColor="bg-amber-100 dark:bg-amber-900/50" iconTextColor="text-amber-500 dark:text-amber-400" />
                <KpiCard title="SLA Breaches" value={kpiData.slaBreaches} icon={<CheckCircleIcon />} trend="bad" iconBgColor="bg-red-100 dark:bg-red-900/50" iconTextColor="text-red-500 dark:text-red-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Teacher Workload Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={workloadData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8D1D4B" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                            <YAxis yAxisId="right" orientation="right" stroke="#AD9040" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} className="dark:text-gray-400" />
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                }} 
                                wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600"
                            />
                            <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                            <Bar yAxisId="left" dataKey="Periods" fill="#8D1D4B" radius={[4, 4, 0, 0]} />
                            <Bar yAxisId="right" dataKey="Learners" fill="#AD9040" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Employment Status</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            >
                                {statusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Tooltip formatter={(value, name) => [value, name]} wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                             <Legend wrapperStyle={{paddingTop: "20px"}} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;