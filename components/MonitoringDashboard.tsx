import React, { useMemo } from 'react';
import type { Teacher, Observation, MonitoringTemplate } from '../types';
import { MonitoringStatus, ObservationPriority } from '../types';
import KpiCard from './KpiCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from './Icons';

interface MonitoringDashboardProps {
    observations: Observation[];
    teachers: Teacher[];
    monitoringTemplates: MonitoringTemplate[];
}

const COLORS = ['#8D1D4B', '#AD9040', '#0B2042', '#4B5563', '#F97316', '#10B981', '#6366F1', '#EC4899'];

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ observations, monitoringTemplates }) => {
    const templateMap = useMemo(() => new Map(monitoringTemplates.map(t => [t.id, t.name])), [monitoringTemplates]);

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
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">There are no monitoring entries for the selected phase.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Entries by Type</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={byTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 120, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-gray-200 dark:stroke-slate-700" />
                                <XAxis type="number" tick={{ fontSize: 12, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10, fill: 'rgb(107 114 128)', fillOpacity: 0.9 }} />
                                <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                                <Bar dataKey="value" fill="#8D1D4B" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Entries by Status</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={byStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                    {byStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                 <Tooltip wrapperClassName="dark:!bg-slate-700/80 dark:!border-slate-600" />
                                 <Legend wrapperStyle={{paddingTop: "20px"}} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonitoringDashboard;