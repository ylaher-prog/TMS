import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import type { Teacher, AcademicStructure, Position } from '../types';
import { EmploymentStatus } from '../types';
import { CheckCircleIcon } from './Icons';

interface AddEditTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  existingTeacher?: Teacher | null;
  academicStructure: AcademicStructure;
  teachers: Teacher[];
}

const FormLabel: React.FC<{ htmlFor?: string, children: React.ReactNode}> = ({ htmlFor, children }) => (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{children}</label>
)

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input {...props} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:text-gray-200" />
)

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="mt-1 block w-full border-gray-300 dark:border-slate-600 rounded-md shadow-sm p-2.5 focus:ring-brand-primary focus:border-brand-primary sm:text-base bg-transparent dark:bg-slate-800 dark:text-gray-200" />
)

const AddEditTeacherModal: React.FC<AddEditTeacherModalProps> = ({ isOpen, onClose, setTeachers, existingTeacher, academicStructure, teachers }) => {
    
    const { subjects, positions, grades, modes } = academicStructure;
    const [accountCreated, setAccountCreated] = useState<{username: string, password: string} | null>(null);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        employeeCode: '',
        employmentStatus: EmploymentStatus.Probation,
        startDate: new Date().toISOString().split('T')[0],
        positionId: positions[0]?.id || '',
        managerId: '',
        specialties: [] as string[],
        preferredGrades: [] as string[],
        maxLearners: '250',
        maxPeriodsByMode: {} as { [mode: string]: string },
    });
    const [errors, setErrors] = useState<Partial<typeof formData>>({});
    
    useEffect(() => {
        setAccountCreated(null);
        const initialPeriods = modes.reduce((acc, mode) => {
            acc[mode] = '0';
            return acc;
        }, {} as {[key: string]: string});

        if (existingTeacher) {
            const existingPeriods = { ...initialPeriods };
             for (const mode in existingTeacher.maxPeriodsByMode) {
                if (existingTeacher.maxPeriodsByMode.hasOwnProperty(mode)) {
                    existingPeriods[mode] = String(existingTeacher.maxPeriodsByMode[mode]);
                }
            }
            setFormData({
                fullName: existingTeacher.fullName,
                email: existingTeacher.email,
                employeeCode: existingTeacher.employeeCode || '',
                employmentStatus: existingTeacher.employmentStatus,
                startDate: existingTeacher.startDate,
                positionId: existingTeacher.positionId,
                managerId: existingTeacher.managerId || '',
                specialties: existingTeacher.specialties,
                preferredGrades: existingTeacher.preferredGrades || [],
                maxLearners: String(existingTeacher.maxLearners),
                maxPeriodsByMode: existingPeriods,
            });
        } else {
             setFormData({
                fullName: '',
                email: '',
                employeeCode: '',
                employmentStatus: EmploymentStatus.Probation,
                startDate: new Date().toISOString().split('T')[0],
                positionId: positions[0]?.id || '',
                managerId: '',
                specialties: [],
                preferredGrades: [],
                maxLearners: '250',
                maxPeriodsByMode: modes.reduce((acc, mode) => {
                    acc[mode] = mode === 'Live' ? '18' : '5';
                    return acc;
                }, {} as {[key: string]: string}),
            });
        }
    }, [existingTeacher, isOpen, positions, modes]);

    const positionMap = useMemo(() => new Map(positions.map(p => [p.id, p])), [positions]);

    const potentialManagers = useMemo(() => {
        const teacherPosition = positionMap.get(formData.positionId);
        if (!teacherPosition || !teacherPosition.reportsToId) return [];
        
        const managerPositionId = teacherPosition.reportsToId;
        return teachers.filter(t => t.positionId === managerPositionId && t.id !== existingTeacher?.id);
    }, [formData.positionId, teachers, positionMap, existingTeacher]);


    const handleSpecialtyChange = (subjectName: string) => {
        setFormData(prev => {
            const newSpecialties = prev.specialties.includes(subjectName)
                ? prev.specialties.filter(s => s !== subjectName)
                : [...prev.specialties, subjectName];
            return { ...prev, specialties: newSpecialties };
        });
    };
    
    const handlePreferredGradeChange = (grade: string) => {
        setFormData(prev => {
            const newGrades = prev.preferredGrades.includes(grade)
                ? prev.preferredGrades.filter(g => g !== grade)
                : [...prev.preferredGrades, grade];
            return { ...prev, preferredGrades: newGrades };
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePeriodModeChange = (mode: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            maxPeriodsByMode: {
                ...prev.maxPeriodsByMode,
                [mode]: value,
            }
        }));
    }
    
    const validate = () => {
        const newErrors: Partial<typeof formData> = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Full name is required.";
        if (!formData.email.trim()) newErrors.email = "Email is required.";
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
        if (!formData.startDate) newErrors.startDate = "Start date is required.";
        if (!formData.positionId) newErrors.positionId = "Position is required.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const numericPeriods = Object.entries(formData.maxPeriodsByMode).reduce((acc, [mode, val]) => {
            acc[mode] = Number(val) || 0;
            return acc;
        }, {} as {[key: string]: number});
        
        const teacherData: Omit<Teacher, 'id' | 'avatarUrl' | 'markingTasks' | 'slas'> = {
            fullName: formData.fullName,
            email: formData.email,
            employeeCode: formData.employeeCode,
            employmentStatus: formData.employmentStatus,
            startDate: formData.startDate,
            positionId: formData.positionId,
            managerId: formData.managerId || undefined,
            specialties: formData.specialties,
            preferredGrades: formData.preferredGrades,
            maxLearners: Number(formData.maxLearners),
            maxPeriodsByMode: numericPeriods,
        };

        if (existingTeacher) {
            setTeachers(prev => prev.map(t => t.id === existingTeacher.id ? { 
                ...t, 
                ...teacherData,
            } : t));
            onClose();
        } else {
            // New teacher creation with user account
            const username = formData.email.split('@')[0].toLowerCase();
            const tempPassword = Math.random().toString(36).slice(-8);
            // In a real app, this hash would be generated on the server.
            const passwordHash = '12345'; // For 'password123'

            const finalNewTeacher: Teacher = {
                 id: `t${Date.now()}`,
                 avatarUrl: `https://picsum.photos/seed/t${Date.now()}/100/100`,
                 ...teacherData,
                 username,
                 passwordHash,
                 markingTasks: 0,
                 slas: { messageResponse: 0, markingTurnaround: 0 },
            };
            setTeachers(prev => [...prev, finalNewTeacher]);
            setAccountCreated({ username, password: 'password123' }); // Using static password for demo
        }
    };
    
    const renderSuccessScreen = () => (
        <div className="text-center p-4">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Staff Account Created!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">The user account for {formData.fullName} has been successfully created. Please share these credentials securely.</p>
            <div className="mt-6 space-y-3 text-left bg-gray-100 dark:bg-slate-700 p-4 rounded-lg">
                 <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">USERNAME</span>
                    <p className="font-mono text-lg text-gray-800 dark:text-gray-200 tracking-wider">{accountCreated?.username}</p>
                 </div>
                 <div>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">TEMPORARY PASSWORD</span>
                    <p className="font-mono text-lg text-gray-800 dark:text-gray-200 tracking-wider">{accountCreated?.password}</p>
                 </div>
            </div>
             <div className="flex justify-end gap-4 pt-6">
                <button type="button" onClick={onClose} className="bg-brand-primary text-white px-6 py-2 rounded-md font-semibold hover:bg-rose-900">Done</button>
            </div>
        </div>
    );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={accountCreated ? "Account Created" : (existingTeacher ? "Edit Staff Member" : "Add New Staff Member")} size="lg">
      {accountCreated ? renderSuccessScreen() : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FormLabel htmlFor="fullName">Full Name</FormLabel>
                    <FormInput type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                </div>
                <div>
                    <FormLabel htmlFor="email">Email Address</FormLabel>
                    <FormInput type="email" name="email" id="email" value={formData.email} onChange={handleChange} />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FormLabel htmlFor="employmentStatus">Employment Status</FormLabel>
                    <FormSelect name="employmentStatus" id="employmentStatus" value={formData.employmentStatus} onChange={handleChange}>
                        {Object.values(EmploymentStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </FormSelect>
                </div>
                 <div>
                    <FormLabel htmlFor="employeeCode">Employee Code</FormLabel>
                    <FormInput type="text" name="employeeCode" id="employeeCode" value={formData.employeeCode} onChange={handleChange} />
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FormLabel htmlFor="positionId">Position</FormLabel>
                    <FormSelect name="positionId" id="positionId" value={formData.positionId} onChange={handleChange}>
                         {positions.length === 0 ? <option disabled>No positions defined</option> : positions.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                         ))}
                    </FormSelect>
                     {errors.positionId && <p className="text-red-500 text-xs mt-1">{errors.positionId}</p>}
                </div>
                <div>
                     <FormLabel htmlFor="managerId">Reports To (Manager)</FormLabel>
                     <FormSelect name="managerId" id="managerId" value={formData.managerId} onChange={handleChange} disabled={potentialManagers.length === 0}>
                        <option value="">-- No Manager --</option>
                        {potentialManagers.map(manager => (
                            <option key={manager.id} value={manager.id}>{manager.fullName}</option>
                        ))}
                     </FormSelect>
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <FormLabel htmlFor="startDate">Start Date</FormLabel>
                    <FormInput type="date" name="startDate" id="startDate" value={formData.startDate} onChange={handleChange} />
                     {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
                </div>
                <div>
                    <FormLabel htmlFor="maxLearners">Max Learners</FormLabel>
                    <FormInput type="number" name="maxLearners" id="maxLearners" value={formData.maxLearners} onChange={handleChange} />
                </div>
            </div>

            <div>
                <FormLabel>Max Periods By Mode</FormLabel>
                <div className="mt-2 p-3 grid grid-cols-2 sm:grid-cols-3 gap-4 border border-gray-300 dark:border-slate-600 rounded-md">
                    {modes.map(mode => (
                        <div key={mode}>
                            <label htmlFor={`max-periods-${mode}`} className="block text-xs font-medium text-gray-500 dark:text-gray-400">{mode}</label>
                            <FormInput 
                                type="number" 
                                id={`max-periods-${mode}`}
                                value={formData.maxPeriodsByMode[mode] || ''}
                                onChange={(e) => handlePeriodModeChange(mode, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>
            
            <div>
                <FormLabel>Specialties</FormLabel>
                <div className="mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded-md max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {subjects.map(subject => (
                            <label key={subject.id} className="flex items-center space-x-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.specialties.includes(subject.name)}
                                    onChange={() => handleSpecialtyChange(subject.name)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700"
                                />
                                <span className="dark:text-gray-300">{subject.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
            <div>
                <FormLabel>Preferred Grades</FormLabel>
                <div className="mt-2 p-3 border border-gray-300 dark:border-slate-600 rounded-md max-h-40 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {grades.map(grade => (
                            <label key={grade} className="flex items-center space-x-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.preferredGrades.includes(grade)}
                                    onChange={() => handlePreferredGradeChange(grade)}
                                    className="h-4 w-4 rounded border-gray-300 dark:border-slate-500 text-brand-primary focus:ring-brand-primary bg-transparent dark:bg-slate-700"
                                />
                                <span className="dark:text-gray-300">{grade}</span>
                            </label>
                        ))}
                    </div>
                    {grades.length === 0 && <p className="text-xs text-center text-gray-400">No grades defined in settings.</p>}
                </div>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-semibold hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500">Cancel</button>
                <button type="submit" className="bg-brand-primary text-white px-4 py-2 rounded-md font-semibold hover:bg-rose-900">{existingTeacher ? "Save Changes" : "Create Staff & User Account"}</button>
            </div>
          </form>
      )}
    </Modal>
  );
};

export default AddEditTeacherModal;