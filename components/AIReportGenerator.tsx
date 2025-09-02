import React, { useState, useMemo } from 'react';
import type { Teacher, Observation, AcademicStructure, PhaseStructure, MonitoringTemplate, ClassGroup } from '../types';
import { SparklesIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import { PrimaryButton } from './FormControls';

interface AIReportGeneratorProps {
    observations: Observation[];
    teachers: Teacher[];
    phaseStructures: PhaseStructure[];
    academicStructure: AcademicStructure;
    monitoringTemplates: MonitoringTemplate[];
    classGroups: ClassGroup[];
}

const AIReportGenerator: React.FC<AIReportGeneratorProps> = ({ observations, teachers, phaseStructures, academicStructure, monitoringTemplates, classGroups }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState('');
    const [error, setError] = useState('');
    
    const [selectedPhase, setSelectedPhase] = useState('all');
    const [selectedTeacher, setSelectedTeacher] = useState('all');
    
    const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t.fullName])), [teachers]);
    const templateMap = useMemo(() => new Map(monitoringTemplates.map(t => [t.id, t.name])), [monitoringTemplates]);
    const subjectMap = useMemo(() => new Map(academicStructure.subjects.map(s => [s.id, s.name])), [academicStructure.subjects]);
    const classGroupMap = useMemo(() => new Map(classGroups.map(cg => [cg.id, cg.name])), [classGroups]);
    const phaseNameMap = useMemo(() => new Map(phaseStructures.map(p => [p.id, p.phase])), [phaseStructures]);


    const handleGenerateReport = async () => {
        if (!process.env.API_KEY) {
            setError("API Key is not configured. Please contact your administrator.");
            return;
        }
        setIsLoading(true);
        setError('');
        setReport('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const filteredObservations = observations.filter(obs => {
                const phaseForObs = phaseStructures.find(p => p.grades.includes(obs.grade) && p.curricula.includes(obs.curriculum));
                const phaseMatch = selectedPhase === 'all' || (phaseForObs && phaseForObs.id === selectedPhase);
                const teacherMatch = selectedTeacher === 'all' || obs.teacherId === selectedTeacher;
                return phaseMatch && teacherMatch;
            });

            if (filteredObservations.length === 0) {
                setError("No data found for the selected criteria. Please broaden your filters.");
                setIsLoading(false);
                return;
            }

            const simplifiedData = filteredObservations.map(obs => ({
                template: templateMap.get(obs.observationType) || 'Unknown Type',
                teacher: teacherMap.get(obs.teacherId) || 'Unknown Teacher',
                date: obs.observationDate,
                status: obs.status,
                priority: obs.priority,
                subject: obs.subjectId ? subjectMap.get(obs.subjectId) : 'N/A',
                classGroup: obs.classGroupId ? classGroupMap.get(obs.classGroupId) : 'N/A',
                details: obs.formData,
            }));

            const dataString = JSON.stringify(simplifiedData, null, 2);
            
            const selectedPhaseName = selectedPhase === 'all' ? 'All Phases' : phaseNameMap.get(selectedPhase);
            const selectedTeacherName = selectedTeacher === 'all' ? 'All Teachers' : teacherMap.get(selectedTeacher);

            const prompt = `
You are an expert educational analyst reviewing monitoring data for a school. Your task is to provide a comprehensive, insightful, and actionable report based on the provided JSON data.

**Context:**
- The data represents various observation and monitoring entries for teachers.
- The 'details' object within each entry contains qualitative feedback and quantitative ratings from forms.
- The report is for: ${selectedPhaseName} and ${selectedTeacherName}.

**Data to Analyze:**
\`\`\`json
${dataString.substring(0, 50000)}
\`\`\`

**Instructions:**
1.  **Start with a High-Level Summary:** Provide a concise paragraph summarizing the overall state of affairs based on the data.
2.  **Identify Key Strengths:** In a bulleted list, identify 2-4 key strengths or positive trends. Use specific examples or data points from the JSON to support your conclusions (e.g., "Consistently high ratings in 'Classroom Engagement' for Teacher X").
3.  **Identify Areas for Development:** In a bulleted list, identify 2-4 areas that may require attention or improvement. Be constructive and specific. Avoid accusatory language. (e.g., "Several entries for 'Parent Communication' remain in 'Open' status for extended periods, suggesting a potential follow-up issue.").
4.  **Actionable Recommendations:** Provide a short, bulleted list of 2-3 concrete, actionable recommendations for school leadership or phase heads based on your analysis.
5.  **Format your response clearly using Markdown.** Use headings for each section (Summary, Key Strengths, Areas for Development, Actionable Recommendations).
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setReport(response.text);

        } catch (e) {
            console.error(e);
            setError("An error occurred while generating the report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                 <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">AI-Powered Insights Generator</h3>
                 <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Select criteria to generate a qualitative and quantitative analysis of monitoring data.</p>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 dark:border-slate-700">
                     <div>
                        <label className="text-sm font-medium">Phase</label>
                        <select value={selectedPhase} onChange={e => setSelectedPhase(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                           <option value="all">All Phases</option>
                           {phaseStructures.map(p => <option key={p.id} value={p.id}>{p.phase}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Teacher</label>
                         <select value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} className="w-full mt-1 p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                           <option value="all">All Teachers</option>
                           {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                         <PrimaryButton onClick={handleGenerateReport} disabled={isLoading} className="w-full !py-2.5">
                             <SparklesIcon className="w-5 h-5 mr-2" />
                             {isLoading ? 'Generating...' : 'Generate Report'}
                         </PrimaryButton>
                    </div>
                </div>
            </div>
            {isLoading && <div className="text-center p-8">Generating report, this may take a moment...</div>}
            {error && <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">{error}</div>}
            {report && (
                <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
                     <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white mb-4">Generated Report</h3>
                     <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans">
                         {report}
                     </div>
                </div>
            )}
        </div>
    );
}

export default AIReportGenerator;
