import React, { useMemo } from 'react';
import type { Teacher, Observation, MonitoringTemplate, ClassGroup } from '../types';
import { MonitoringStatus, ObservationPriority } from '../types';
import KpiCard from './KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from './Icons';

interface MonitoringDashboardProps {
    observations: Observation[];
    teachers: Teacher[];
    monitoringTemplates: MonitoringTemplate[];
    classGroups: ClassGroup[];
}

const COLORS = ['#8D1D4B', '#AD9040', '#0B2042', '#4B5563', '#F97316', '#10B981', '#6366F1', '#EC4899'];

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ observations, teachers, monitoringTemplates }) => {
    const templateMap = useMemo(() => new Map(monitoringTemplates.map(t => [t.id, t.name])), [monitoringTemplates]);
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);

    const kpiData = useMemo(() => {
        const total = observations.length;
        const open = observations.filter(o => o.status === MonitoringStatus.Open || o.status === MonitoringStatus.InProgress).length;
        const highPriority = observations.filter(o => o.priority === ObservationPriority.High && o.status !== MonitoringStatus.Resolved).length;
        return { total, open, highPriority };
    }, [observations]);
    
    const byTypeData = useMemo(() => {
        const counts = observations.reduce((acc, obs) => {
            const name = templateMap.get(obs.observationType) || obs.observationType;
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [observations, templateMap]);

    const byStatusData = useMemo(() => {
        const counts = observations.reduce((acc, obs) => {
            acc[obs.status] = (acc[obs.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [observations]);

    const byTeacherData = useMemo(() => {
        const counts = observations.reduce((acc, obs) => {
            const name = teacherMap.get(obs.teacherId) || 'Unknown';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts).map(([name, value]) => ({ name, entries: value })).sort((a,b) => b.entries - a.entries).slice(0, 10);
    }, [observations, teacherMap]);
    
    const overTimeData = useMemo(() => {
        const countsByMonth: Record<string, number> = {};
        observations.forEach(obs => {
            try {
                const month = new Date(obs.observationDate).toLocaleString('default', { month: 'short', year: '2-digit' });
                countsByMonth[month] = (countsByMonth[month] || 0) + 1;
            } catch (e) {
                console.error("Invalid date format in observation:", obs.observationDate);
            }
        });
        
        const sortedMonths = Object.keys(countsByMonth).sort((a, b) => {
            const dateA = new Date(`01 ${a.replace("'", " ")}`);
            const dateB = new Date(`01 ${b.replace("'", " ")}`);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedMonths.map(month => ({ month, entries: countsByMonth[month] }));
    }, [observations]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Total Entries" value={kpiData.total} icon={<ClockIcon />} iconBgColor="bg-sky-100 dark:bg-sky-900/50" iconTextColor="text-sky-500" />
                <KpiCard title="Open / In-Progress" value={kpiData.open} icon={<ExclamationTriangleIcon />} iconBgColor="bg-amber-100 dark:bg-amber-900/50" iconTextColor="text-amber-500" />
                <KpiCard title="High Priority Open" value={kpiData.highPriority} icon={<CheckCircleIcon />} trend="bad" iconBgColor="bg-red-100 dark:bg-red-900/50" iconTextColor="text-red-500" />
            </div>

            {observations.length === 0 ? (
                 <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No Data Available</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">There are no monitoring entries for the selected filters.</p>
                </div>
            ) : (
                <>
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                    <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Entries Over Time</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={overTimeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-200 dark:stroke-slate-700"/>
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                            <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                            <Area type="monotone" dataKey="entries" stroke="#8D1D4B" fill="#8D1D4B" fillOpacity={0.2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Entries by Teacher (Top 10)</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={byTeacherData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-200 dark:stroke-slate-700" />
                                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 10 }} />
                                <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                                <Bar dataKey="entries" fill="#0B2042" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                         <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Breakdown by Type</h3>
                             <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={byTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                        {byTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                     <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Breakdown by Status</h3>
                             <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={byStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                        {byStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                     <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                </>
            )}
        </div>
    );
};

export default MonitoringDashboard;