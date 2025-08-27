import React, { useMemo } from 'react';
import Modal from './Modal';
import type { Teacher, AcademicStructure, TeacherWorkload, ClassGroup, LeaveRequest, Observation, MonitoringTemplate, PhaseStructure, TeacherAllocation, TimeGrid, TimetableHistoryEntry } from '../types';

interface TeacherReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher;
    teachers: Teacher[];
    workload?: TeacherWorkload;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    leaveRequests: LeaveRequest[];
    observations: Observation[];
    monitoringTemplates: MonitoringTemplate[];
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
}

const ReportSection: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section>
        <h4 className="font-bold text-lg text-brand-navy border-b-2 border-gray-200 pb-1 mb-3">{title}</h4>
        {children}
    </section>
);

const InfoPair: React.FC<{label: string, value: string | React.ReactNode}> = ({label, value}) => (
    <div>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-800">{value}</p>
    </div>
);

const TeacherReportModal: React.FC<TeacherReportModalProps> = (props) => {
    const { isOpen, onClose, teacher, teachers, workload, academicStructure, phaseStructures, allocations, classGroups, leaveRequests, observations, monitoringTemplates } = props;

    const manager = useMemo(() => teacher.managerId ? teachers.find(t => t.id === teacher.managerId) : null, [teacher, teachers]);
    const position = useMemo(() => academicStructure.positions.find(p => p.id === teacher.positionId), [teacher, academicStructure]);
    
    const teacherAllocations = useMemo(() => {
        const classGroupMap = new Map(classGroups.map(cg => [cg.id, cg]));
        const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));
        return allocations
            .filter(a => a.teacherId === teacher.id)
            .map(a => ({
                ...a,
                classGroup: classGroupMap.get(a.classGroupId),
                subject: subjectMap.get(a.subjectId)
            }))
            .filter(a => a.classGroup && a.subject);
    }, [teacher.id, allocations, classGroups, academicStructure.subjects]);

    const teacherLeave = useMemo(() => leaveRequests.filter(l => l.teacherId === teacher.id), [teacher.id, leaveRequests]);
    const teacherObservations = useMemo(() => observations.filter(o => o.teacherId === teacher.id), [teacher.id, observations]);

    const formatCurrency = (amount: number | undefined) => {
        if (amount === undefined) return 'N/A';
        return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Comprehensive Report: ${teacher.fullName}`} size="xl">
            <div className="bg-gray-100 dark:bg-brand-navy p-4 -m-6 max-h-[calc(90vh-100px)] overflow-y-auto">
                <div className="p-8 bg-white text-gray-800 space-y-6 w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-lg rounded-sm">
                    {/* Header */}
                    <header className="flex justify-between items-center border-b-4 border-brand-primary pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-navy">Comprehensive Teacher Report</h1>
                            <p className="text-brand-text-light">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        <h2 className="text-2xl font-bold text-brand-primary tracking-wider">QTMS</h2>
                    </header>
                    
                    {/* Teacher Info */}
                    <section className="flex items-center space-x-6 p-4 bg-gray-50 rounded-lg">
                        <img src={teacher.avatarUrl} alt={teacher.fullName} className="w-24 h-24 rounded-full" />
                        <div>
                            <h3 className="text-2xl font-bold text-brand-navy">{teacher.fullName}</h3>
                            <p className="text-brand-text-light">{position?.name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{teacher.email}</p>
                        </div>
                    </section>
                    
                    <ReportSection title="Employment Details">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <InfoPair label="Status" value={teacher.employmentStatus} />
                            <InfoPair label="Start Date" value={teacher.startDate} />
                            <InfoPair label="Employee Code" value={teacher.employeeCode || 'N/A'} />
                            <InfoPair label="Reports To" value={manager?.fullName || 'N/A'} />
                        </div>
                    </ReportSection>

                    {teacher.salaryInfo && (
                        <ReportSection title="Salary Information">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InfoPair label="Total Earnings" value={formatCurrency(teacher.salaryInfo.totalEarnings)} />
                                <InfoPair label="Total Deductions" value={formatCurrency(teacher.salaryInfo.totalDeductions)} />
                                <InfoPair label="Nett Pay" value={<span className="font-bold text-green-700">{formatCurrency(teacher.salaryInfo.nettPay)}</span>} />
                                <InfoPair label="Total Cost To Company" value={<span className="font-bold">{formatCurrency(teacher.salaryInfo.salaryCost)}</span>} />
                            </div>
                        </ReportSection>
                    )}

                    {workload && (
                        <ReportSection title="Workload Summary">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-brand-primary/10 p-4 rounded-lg text-center"><p className="text-sm text-brand-primary font-semibold">Total Periods</p><p className="text-3xl font-bold text-brand-navy">{workload.totalPeriods}</p></div>
                                <div className="bg-brand-gold/10 p-4 rounded-lg text-center"><p className="text-sm text-brand-gold font-semibold">Total Learners</p><p className="text-3xl font-bold text-brand-navy">{workload.totalLearners}</p></div>
                                <div className="bg-brand-navy/10 p-4 rounded-lg text-center"><p className="text-sm text-brand-navy font-semibold">Total Classes</p><p className="text-3xl font-bold text-brand-navy">{workload.totalClasses}</p></div>
                            </div>
                        </ReportSection>
                    )}
                    
                    <ReportSection title="Allocations">
                        {teacherAllocations.length > 0 ? (
                             <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100"><tr><th className="p-2">Class Group</th><th className="p-2">Subject</th><th className="p-2">Grade</th><th className="p-2">Curriculum</th></tr></thead>
                                <tbody>{teacherAllocations.map(a => <tr key={a.id} className="border-b"><td className="p-2 font-semibold">{a.classGroup?.name}</td><td className="p-2">{a.subject?.name}</td><td className="p-2">{a.classGroup?.grade}</td><td className="p-2">{a.classGroup?.curriculum}</td></tr>)}</tbody>
                            </table>
                        ) : <p className="text-sm text-gray-500">No allocations found.</p>}
                    </ReportSection>

                    <ReportSection title="Leave History">
                         {teacherLeave.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100"><tr><th className="p-2">Type</th><th className="p-2">Start Date</th><th className="p-2">End Date</th><th className="p-2">Status</th></tr></thead>
                                <tbody>{teacherLeave.map(l => <tr key={l.id} className="border-b"><td className="p-2 font-semibold">{l.leaveType}</td><td className="p-2">{l.startDate}</td><td className="p-2">{l.endDate}</td><td className="p-2">{l.status}</td></tr>)}</tbody>
                            </table>
                        ) : <p className="text-sm text-gray-500">No leave requests found.</p>}
                    </ReportSection>

                    <ReportSection title="Monitoring History">
                        {teacherObservations.length > 0 ? (
                             <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100"><tr><th className="p-2">Type</th><th className="p-2">Date</th><th className="p-2">Priority</th><th className="p-2">Status</th></tr></thead>
                                <tbody>{teacherObservations.map(o => <tr key={o.id} className="border-b"><td className="p-2 font-semibold">{monitoringTemplates.find(mt => mt.id === o.observationType)?.name || o.observationType}</td><td className="p-2">{o.observationDate}</td><td className="p-2">{o.priority}</td><td className="p-2">{o.status}</td></tr>)}</tbody>
                            </table>
                        ) : <p className="text-sm text-gray-500">No monitoring entries found.</p>}
                    </ReportSection>

                </div>
            </div>
        </Modal>
    );
};

export default TeacherReportModal;