import React, { useMemo } from 'react';
import type { Teacher, AcademicStructure, Position } from '../types';

interface OrganogramManagerProps {
    teachers: Teacher[];
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    academicStructure: AcademicStructure;
}

const OrganogramManager: React.FC<OrganogramManagerProps> = ({ teachers, setTeachers, academicStructure }) => {
    const { positions } = academicStructure;

    const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);

    const handleManagerChange = (teacherId: string, managerId: string) => {
        setTeachers(prevTeachers => 
            prevTeachers.map(t => 
                t.id === teacherId 
                    ? { ...t, managerId: managerId === 'none' ? undefined : managerId } 
                    : t
            )
        );
    };
    
    const getPotentialManagers = (teacher: Teacher): Teacher[] => {
        const position = positionMap.get(teacher.positionId);
        if (!position || !position.reportsToId) return [];
        
        const managerPositionId = position.reportsToId;
        return teachers.filter(t => t.positionId === managerPositionId);
    }

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Organogram & Reporting Structure</h3>
                <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">
                    Define the reporting hierarchy for your teaching staff. For each teacher, select their direct manager from the dropdown. The list of potential managers is determined by the "Positions & Hierarchy" setup.
                </p>
            </div>
            
             <div className="overflow-x-auto max-h-[70vh]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                    <thead className="bg-gray-50 dark:bg-slate-700/50 sticky top-0 z-10">
                        <tr>
                            <th className="sticky left-0 bg-gray-50 dark:bg-slate-700/50 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-64">Teacher</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">Position</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">Reports To (Manager)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-slate-700">
                        {teachers.map(teacher => {
                            const potentialManagers = getPotentialManagers(teacher);
                            return (
                                <tr key={teacher.id}>
                                    <td className="sticky left-0 bg-white dark:bg-slate-800 px-4 py-3 whitespace-nowrap border-r dark:border-slate-700">
                                         <div className="flex items-center">
                                            <img className="h-10 w-10 rounded-full" src={teacher.avatarUrl} alt="" />
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate" title={teacher.fullName}>{teacher.fullName}</div>
                                                <div className="text-sm text-brand-text-light dark:text-gray-400 truncate">{teacher.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-300">
                                        {positionMap.get(teacher.positionId)?.name || 'N/A'}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <select
                                            value={teacher.managerId || 'none'}
                                            onChange={(e) => handleManagerChange(teacher.id, e.target.value)}
                                            className="w-full bg-gray-100 dark:bg-slate-700 border-transparent rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600 py-2 px-3"
                                            disabled={potentialManagers.length === 0}
                                        >
                                            <option value="none">-- Select Manager --</option>
                                            {potentialManagers
                                                .filter(m => m.id !== teacher.id)
                                                .map(manager => (
                                                <option key={manager.id} value={manager.id}>
                                                    {manager.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {teachers.length === 0 && (
                    <div className="text-center py-10 text-brand-text-light dark:text-gray-400">
                        No teachers found. Please add teachers in the 'Teachers' section or via the 'Teacher Tools' tab.
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganogramManager;