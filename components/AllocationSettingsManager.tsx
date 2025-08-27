import React from 'react';
import type { AllocationSettings, AcademicStructure } from '../types';
import { AllocationStrategy } from '../types';

interface AllocationSettingsManagerProps {
  settings: AllocationSettings;
  setSettings: React.Dispatch<React.SetStateAction<AllocationSettings>>;
  academicStructure: AcademicStructure;
}

const AllocationSettingsManager: React.FC<AllocationSettingsManagerProps> = ({ settings, setSettings, academicStructure }) => {
    
    const handleStrategyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, strategy: e.target.value as AllocationStrategy }));
    };

    const handlePrioritizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings(prev => ({ ...prev, prioritizePreferredGrades: e.target.checked }));
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Auto-Allocation Strategy</h3>
                <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">Configure the rules the "Auto-Allocate" feature will follow.</p>
            </div>
            
            <div className="space-y-4 border-t dark:border-slate-700 pt-4">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">Teacher Placement Strategy</h4>
                <div className="flex flex-col space-y-3">
                    <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <input
                            type="radio"
                            name="strategy"
                            value={AllocationStrategy.Strict}
                            checked={settings.strategy === AllocationStrategy.Strict}
                            onChange={handleStrategyChange}
                            className="h-4 w-4 mt-0.5 text-brand-primary border-gray-300 focus:ring-brand-primary"
                        />
                        <span className="text-sm dark:text-gray-300">
                            <strong>Strict:</strong> Heavily prioritizes keeping teachers in their preferred grade(s) and avoiding grade splits.
                        </span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <input
                            type="radio"
                            name="strategy"
                            value={AllocationStrategy.Balanced}
                            checked={settings.strategy === AllocationStrategy.Balanced}
                            onChange={handleStrategyChange}
                            className="h-4 w-4 mt-0.5 text-brand-primary border-gray-300 focus:ring-brand-primary"
                        />
                        <span className="text-sm dark:text-gray-300">
                             <strong>Balanced:</strong> Attempts to consolidate by grade but will split teachers if it leads to better workload balance.
                        </span>
                    </label>
                    <label className="flex items-start space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                        <input
                            type="radio"
                            name="strategy"
                            value={AllocationStrategy.Flexible}
                            checked={settings.strategy === AllocationStrategy.Flexible}
                            onChange={handleStrategyChange}
                            className="h-4 w-4 mt-0.5 text-brand-primary border-gray-300 focus:ring-brand-primary"
                        />
                        <span className="text-sm dark:text-gray-300">
                             <strong>Flexible:</strong> Prioritizes filling gaps and balancing workload, with minimal consideration for grade consolidation.
                        </span>
                    </label>
                </div>
            </div>

            <div className="space-y-2 border-t dark:border-slate-700 pt-4">
                 <h4 className="font-semibold text-gray-800 dark:text-gray-200">Teacher Preferences</h4>
                 <label className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700/50">
                    <input
                        type="checkbox"
                        checked={settings.prioritizePreferredGrades}
                        onChange={handlePrioritizeChange}
                        className="h-4 w-4 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <span className="text-sm dark:text-gray-300">
                        <strong>Prioritize Preferred Grades:</strong> Give preference to teachers who have indicated a preference for the class's grade level.
                    </span>
                </label>
            </div>
        </div>
    );
};

export default AllocationSettingsManager;