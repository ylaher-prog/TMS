import React, { useState, useMemo, useRef } from 'react';
import Modal from './Modal';
import type { Teacher, AcademicStructure, TeacherWorkload, TeacherAllocation, ClassGroup, Subject, GeneralSettings, PhaseStructure, TimetableHistoryEntry, TimeGrid, GeneratedSlot } from '../types';
import { GoogleGenAI } from '@google/genai';
import { SparklesIcon } from './Icons';
import { FormTextarea } from './FormControls';

interface WorkloadReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    teacher: Teacher;
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    teachers: Teacher[];
    workload?: TeacherWorkload;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    allocations: TeacherAllocation[];
    classGroups: ClassGroup[];
    generalSettings: GeneralSettings;
    timeGrids: TimeGrid[];
    timetableHistory: TimetableHistoryEntry[];
}

const ReportSectionToggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void; }> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary" />
        <span>{label}</span>
    </label>
);

const WorkloadReportModal: React.FC<WorkloadReportModalProps> = (props) => {
    const { isOpen, onClose, teacher, setTeachers, teachers, workload, academicStructure, phaseStructures, allocations, classGroups, generalSettings, timeGrids, timetableHistory } = props;

    const [reportConfig, setReportConfig] = useState({
        includeReporting: true,
        includeSummary: true,
        includePeriods: true,
        includeSpecialties: true,
        includePhases: true,
        includeClasses: true,
        includeTimetable: true,
        includeComments: true,
    });
    const [comments, setComments] = useState(teacher.workloadComments || '');
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const manager = useMemo(() => teacher.managerId ? teachers.find(t => t.id === teacher.managerId) : null, [teacher, teachers]);
    const position = useMemo(() => academicStructure.positions.find(p => p.id === teacher.positionId), [teacher, academicStructure]);
    
    const assignedClasses = useMemo(() => {
        const teacherAllocations = allocations.filter(a => a.teacherId === teacher.id);
        const subjectMap = new Map(academicStructure.subjects.map(s => [s.id, s]));
        const groupMap = new Map(classGroups.map(g => [g.id, g]));

        const results: { group: ClassGroup, subject: Subject }[] = [];
        teacherAllocations.forEach(alloc => {
            const group = groupMap.get(alloc.classGroupId);
            const subject = subjectMap.get(alloc.subjectId);
            if(group && subject) results.push({ group, subject });
        });
        return results.sort((a,b) => a.group.name.localeCompare(b.group.name));
    }, [teacher, allocations, classGroups, academicStructure.subjects]);
    
    const involvedPhases = useMemo(() => {
        const phaseNames = new Set<string>();
        const gradeCurricula = new Set(assignedClasses.map(ac => `${ac.group.grade}|${ac.group.curriculum}`));
        
        gradeCurricula.forEach(gcPair => {
            const [grade, curriculum] = gcPair.split('|');
            const phase = phaseStructures.find(p => p.grades.includes(grade) && p.curricula.includes(curriculum));
            if (phase) {
                phaseNames.add(phase.phase);
            }
        });
        return Array.from(phaseNames);
    }, [assignedClasses, phaseStructures]);

    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s])), [academicStructure.subjects]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg])), [classGroups]);
    const subjectColorMap = useMemo(() => {
        const map = new Map<string, string>();
        academicStructure.subjects.forEach((subject, index) => {
            const colors = [
                'bg-sky-100 border-sky-300 text-sky-800',
                'bg-purple-100 border-purple-300 text-purple-800',
                'bg-green-100 border-green-300 text-green-800',
                'bg-yellow-100 border-yellow-300 text-yellow-800',
                'bg-pink-100 border-pink-300 text-pink-800',
                'bg-indigo-100 border-indigo-300 text-indigo-800',
            ];
            map.set(subject.id, colors[index % colors.length]);
        });
        return map;
    }, [academicStructure.subjects]);

    const { timetable, grid } = useMemo(() => {
        const activeHistoryEntry = timetableHistory.length > 0 ? timetableHistory[0] : null;
        if (!activeHistoryEntry) return { timetable: null, grid: null };
        const generatedTimetable = activeHistoryEntry.timetable;

        const teacherTimetable: Record<string, Record<string, GeneratedSlot & { classGroupName: string }>> = {};
        const firstAllocation = allocations.find(a => a.teacherId === teacher.id);
        const firstGroup = firstAllocation ? classGroupMap.get(firstAllocation.classGroupId) : null;
        const grid = firstGroup ? timeGrids.find(g => g.id === firstGroup.timeGridId) : timeGrids[0];

        if (grid) {
            grid.days.forEach(day => teacherTimetable[day] = {});

            Object.values(generatedTimetable).forEach(classSchedule => {
                Object.entries(classSchedule).forEach(([day, periods]) => {
                    Object.entries(periods).forEach(([periodId, slotsInPeriod]) => {
                        if (slotsInPeriod) {
                            const teacherSlot = slotsInPeriod.find(s => s.teacherId === teacher.id);
                            if (teacherSlot) {
                                const group = classGroupMap.get(teacherSlot.classGroupId);
                                teacherTimetable[day][periodId] = { ...teacherSlot, classGroupName: group?.name || 'Unknown' };
                            }
                        }
                    });
                });
            });
        }

        return { timetable: teacherTimetable, grid };
    }, [teacher, timetableHistory, classGroupMap, timeGrids, allocations]);


    const handlePrint = () => {
        const content = reportContentRef.current;
        if (!content) return;
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Workload Report</title>');
            printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
            printWindow.document.write('<style>body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }</style>');
            printWindow.document.write('</head><body class="font-sans">');
            printWindow.document.write(content.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            setTimeout(() => { printWindow.print(); }, 500);
        }
    };
    
    const handleEmail = () => {
        const defaultSender = generalSettings.senderEmails.find(e => e.isDefault);
        const subject = `Workload Report for ${teacher.fullName}`;
        const body = `Hi ${teacher.fullName.split(' ')[0]},\n\nPlease find your latest workload report attached.\n\n(To attach the report, please use the 'Print / Save as PDF' option and attach the downloaded file to this email).\n\nBest regards,`;

        const gmailUrl = new URL('https://mail.google.com/mail/');
        gmailUrl.searchParams.set('view', 'cm');
        gmailUrl.searchParams.set('fs', '1');
        gmailUrl.searchParams.set('to', teacher.email);
        gmailUrl.searchParams.set('su', subject);
        gmailUrl.searchParams.set('body', body);
        
        if (defaultSender) {
            gmailUrl.searchParams.set('authuser', defaultSender.email);
        }
        
        window.open(gmailUrl.toString(), '_blank', 'noopener,noreferrer');
    };
    
    const handleSaveComments = () => {
        setTeachers(prev => prev.map(t => t.id === teacher.id ? { ...t, workloadComments: comments } : t));
        alert("Comments saved successfully!");
    }

    const handleGenerateComment = async () => {
        if (!process.env.API_KEY) {
            alert("API_KEY environment variable not set. Cannot generate comment.");
            return;
        }
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const periodsByModeSummary = academicStructure.modes
                .filter(mode => mode !== 'Self-Paced' && (teacher.maxPeriodsByMode[mode] || 0) > 0)
                .map(mode => {
                    const current = workload?.periodsByMode[mode] || 0;
                    const max = teacher.maxPeriodsByMode[mode] || 'N/A';
                    return `- ${mode}: ${current} / ${max} periods`;
                }).join('\n');
            
            const totalMaxPeriods = Object.values(teacher.maxPeriodsByMode || {}).reduce((a, b) => a + b, 0);

            const prompt = `
Act as an HR analyst for an online school. Based on the following data for a teacher, write a brief, objective, and professional workload summary. The summary should be a single paragraph of 2-3 sentences.

Teacher: ${teacher.fullName}
Position: ${position?.name || 'N/A'}

Workload Data:
- Total Periods: ${workload?.totalPeriods || 0} / ${totalMaxPeriods}
- Total Learners: ${workload?.totalLearners || 0} / ${teacher.maxLearners}
- Total Unique Classes: ${workload?.totalClasses || 0}
- Periods by Mode:
${periodsByModeSummary}
- Allocated Subjects: ${[...new Set(assignedClasses.map(ac => ac.subject.name))].join(', ')}

Focus on whether the workload is balanced, high, or low by comparing current numbers to the maximums. Mention any areas that are close to capacity or over capacity. Be neutral, factual, and concise. Start the summary directly without any preamble.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setComments(response.text);

        } catch (error) {
            console.error("Error generating workload comment:", error);
            alert("Could not generate comment. Please check the console for more details.");
        } finally {
            setIsGenerating(false);
        }
    };

    const Report = (
        <div ref={reportContentRef} className="p-8 bg-white text-gray-800 space-y-6 w-full max-w-[210mm] min-h-[297mm] mx-auto shadow-lg">
            {/* Header */}
            <header className="flex justify-between items-center border-b-4 border-brand-primary pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-brand-navy">Workload Report</h1>
                    <p className="text-brand-text-light">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <h2 className="text-2xl font-bold text-brand-primary tracking-wider">SMT</h2>
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
            
            {(reportConfig.includeReporting || reportConfig.includeSpecialties || reportConfig.includePhases) && (
                <section className="grid grid-cols-3 gap-4">
                    {reportConfig.includeReporting && manager && (
                        <div>
                            <h4 className="font-bold text-md text-brand-navy border-b-2 border-gray-200 pb-1 mb-2">Reporting To</h4>
                            <p>{manager.fullName}</p>
                        </div>
                    )}
                     {reportConfig.includeSpecialties && (
                        <div>
                            <h4 className="font-bold text-md text-brand-navy border-b-2 border-gray-200 pb-1 mb-2">Specialties</h4>
                            <p className="text-sm">{teacher.specialties.join(', ')}</p>
                        </div>
                    )}
                     {reportConfig.includePhases && (
                        <div>
                            <h4 className="font-bold text-md text-brand-navy border-b-2 border-gray-200 pb-1 mb-2">Phases</h4>
                            <p className="text-sm">{involvedPhases.join(', ') || 'N/A'}</p>
                        </div>
                    )}
                </section>
            )}

            {reportConfig.includeSummary && workload && (
                <section>
                    <h4 className="font-bold text-lg text-brand-navy border-b-2 border-gray-200 pb-1 mb-3">Workload Summary</h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-brand-primary/10 p-4 rounded-lg text-center">
                            <p className="text-sm text-brand-primary font-semibold">Total Periods</p>
                            <p className="text-3xl font-bold text-brand-navy">{workload.totalPeriods} / {Object.values(teacher.maxPeriodsByMode).reduce((a,b)=>a+b, 0)}</p>
                        </div>
                         <div className="bg-brand-gold/10 p-4 rounded-lg text-center">
                            <p className="text-sm text-brand-gold font-semibold">Total Learners</p>
                            <p className="text-3xl font-bold text-brand-navy">{workload.totalLearners} / {teacher.maxLearners}</p>
                        </div>
                         <div className="bg-brand-navy/10 p-4 rounded-lg text-center">
                            <p className="text-sm text-brand-navy font-semibold">Total Classes</p>
                            <p className="text-3xl font-bold text-brand-navy">{workload.totalClasses}</p>
                        </div>
                    </div>
                </section>
            )}

            {reportConfig.includePeriods && workload && (
                 <section>
                    <h4 className="font-bold text-lg text-brand-navy border-b-2 border-gray-200 pb-1 mb-3">Periods by Mode</h4>
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">Mode</th>
                                <th className="p-2">Assigned Periods</th>
                                <th className="p-2">Hours</th>
                                <th className="p-2">Maximum Periods</th>
                                <th className="p-2">Utilisation</th>
                            </tr>
                        </thead>
                        <tbody>
                            {academicStructure.modes.map(mode => {
                                const current = workload.periodsByMode[mode] || 0;
                                const max = teacher.maxPeriodsByMode[mode] || 0;
                                const util = max > 0 ? Math.round((current / max) * 100) : 0;
                                return (
                                    <tr key={mode} className="border-b">
                                        <td className="p-2 font-semibold">{mode}</td>
                                        <td className="p-2">{current}</td>
                                        <td className="p-2">{(current / 2).toFixed(1)}</td>
                                        <td className="p-2">{max}</td>
                                        <td className="p-2">
                                            <div className="w-full bg-gray-200 rounded-full h-4">
                                                <div className={`h-4 rounded-full text-white text-xs flex items-center justify-center ${util > 100 ? 'bg-red-500' : 'bg-brand-accent'}`} style={{ width: `${Math.min(util,100)}%`}}>
                                                    {util > 15 ? `${util}%` : ''}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </section>
            )}
            
            {reportConfig.includeClasses && assignedClasses.length > 0 && (
                <section>
                    <h4 className="font-bold text-lg text-brand-navy border-b-2 border-gray-200 pb-1 mb-3">Assigned Classes</h4>
                     <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">Class Group</th>
                                <th className="p-2">Subject</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignedClasses.map(({group, subject}, index) => (
                                <tr key={`${group.id}-${subject.id}-${index}`} className="border-b">
                                    <td className="p-2 font-semibold">{group.name}</td>
                                    <td className="p-2">{subject.name}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

             {reportConfig.includeTimetable && (
                <section>
                    <h4 className="font-bold text-lg text-brand-navy border-b-2 border-gray-200 pb-1 mb-3">Generated Timetable</h4>
                    {grid && timetable ? (
                         <table className="w-full border-collapse text-xs">
                            <thead><tr className="bg-gray-100"><th className="p-1 border border-gray-300 w-24">Period</th>{grid.days.map(day => `<th class="p-1 border border-gray-300">${day}</th>`).join('')}</tr></thead>
                            <tbody>
                                {grid.periods.map(period => (
                                    <tr key={period.id}>
                                        <td className="p-1 border border-gray-300 text-center align-top">
                                            <b>{period.name}</b><br/>
                                            <span className="text-gray-500">{period.startTime}-{period.endTime}</span>
                                        </td>
                                        {grid.days.map(day => {
                                            if (period.type === 'Break') return <td key={day} className="p-1 border border-gray-300 bg-gray-100 text-center text-xs text-gray-400 rotate-180" style={{writingMode: 'vertical-rl'}}>{period.name}</td>;
                                            const slot = timetable[day]?.[period.id];
                                            const subject = slot ? subjectMap.get(slot.subjectId) : null;
                                            if (slot && subject) {
                                                return (
                                                    <td key={day} className="p-0.5 border border-gray-300 align-top h-16">
                                                        <div className={`h-full w-full rounded p-1 border-l-4 ${subjectColorMap.get(subject.id)}`}>
                                                            <p className="font-bold">{subject.name}</p>
                                                            <p className="text-xs">{slot.classGroupName}</p>
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            return <td key={day} className="p-1 border border-gray-300"></td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md">No timetable has been generated yet.</p>
                    )}
                </section>
            )}

            {reportConfig.includeComments && (
                 <section>
                    <h4 className="font-bold text-lg text-brand-navy border-b-2 border-gray-200 pb-1 mb-2">Comments</h4>
                    <p className="text-sm whitespace-pre-wrap p-2 bg-gray-50 rounded min-h-[100px]">{comments || 'No comments added.'}</p>
                </section>
            )}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Workload Report: ${teacher.fullName}`} size="xl">
            <div className="flex flex-col md:flex-row gap-4 -m-6 max-h-[calc(90vh-100px)]">
                {/* Left Panel: Settings */}
                <div className="w-full md:w-1/3 p-6 space-y-6 bg-gray-50 dark:bg-slate-800/50 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-brand-navy dark:text-gray-200 mb-2">Report Sections</h4>
                        <div className="space-y-2">
                            <ReportSectionToggle label="Reporting Structure" checked={reportConfig.includeReporting} onChange={c => setReportConfig(p => ({...p, includeReporting: c}))}/>
                            <ReportSectionToggle label="Workload Summary" checked={reportConfig.includeSummary} onChange={c => setReportConfig(p => ({...p, includeSummary: c}))}/>
                            <ReportSectionToggle label="Periods by Mode" checked={reportConfig.includePeriods} onChange={c => setReportConfig(p => ({...p, includePeriods: c}))}/>
                            <ReportSectionToggle label="Specialties" checked={reportConfig.includeSpecialties} onChange={c => setReportConfig(p => ({...p, includeSpecialties: c}))} />
                            <ReportSectionToggle label="Phases" checked={reportConfig.includePhases} onChange={c => setReportConfig(p => ({...p, includePhases: c}))} />
                            <ReportSectionToggle label="Assigned Classes" checked={reportConfig.includeClasses} onChange={c => setReportConfig(p => ({...p, includeClasses: c}))}/>
                             <ReportSectionToggle label="Generated Timetable" checked={reportConfig.includeTimetable} onChange={c => setReportConfig(p => ({...p, includeTimetable: c}))}/>
                            <ReportSectionToggle label="Comments" checked={reportConfig.includeComments} onChange={c => setReportConfig(p => ({...p, includeComments: c}))}/>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-brand-navy dark:text-gray-200 mb-2">Manual Comments</h4>
                        <FormTextarea 
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={8}
                            placeholder="Add any additional comments here or generate one with AI."
                        />
                        <div className="mt-2 flex items-center gap-2">
                            <button onClick={handleSaveComments} className="flex-1 text-sm font-semibold bg-brand-navy text-white py-1.5 rounded-md hover:bg-slate-700">
                                Save Comments
                            </button>
                            <button
                                onClick={handleGenerateComment}
                                disabled={isGenerating}
                                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-brand-accent text-white py-1.5 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-wait"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                {isGenerating ? 'Generating...' : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Preview */}
                <div className="flex-1 p-6 bg-gray-200 dark:bg-brand-navy overflow-y-auto">
                    {Report}
                </div>
            </div>
             <div className="flex justify-end gap-3 p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-md font-semibold hover:bg-gray-300 text-sm dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Close</button>
                <button type="button" onClick={handleEmail} className="bg-brand-accent text-white px-5 py-2.5 rounded-md font-semibold hover:bg-amber-700 text-sm">Email to Teacher</button>
                <button type="button" onClick={handlePrint} className="bg-brand-primary text-white px-5 py-2.5 rounded-md font-semibold hover:bg-rose-900 text-sm">Print / Save as PDF</button>
            </div>
        </Modal>
    );
};

export default WorkloadReportModal;