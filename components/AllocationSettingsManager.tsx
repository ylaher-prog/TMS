import React from 'react';
import type { AllocationSettings, AcademicStructure } from '../types';
import { AllocationStrategy } from '../types';
import { Checkbox, Radio, Fieldset } from './FormControls';

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
            
            <Fieldset legend="Teacher Placement Strategy">
                <div className="flex flex-col space-y-1">
                    <Radio
                        name="strategy"
                        value={AllocationStrategy.Strict}
                        checked={settings.strategy === AllocationStrategy.Strict}
                        onChange={handleStrategyChange}
                        label={
                            <span className="text-gray-700 dark:text-gray-300">
                                <strong>Strict:</strong> Heavily prioritizes keeping teachers in their preferred grade(s) and avoiding grade splits.
                            </span>
                        }
                    />
                     <Radio
                        name="strategy"
                        value={AllocationStrategy.Balanced}
                        checked={settings.strategy === AllocationStrategy.Balanced}
                        onChange={handleStrategyChange}
                        label={
                            <span className="text-gray-700 dark:text-gray-300">
                                <strong>Balanced:</strong> Attempts to consolidate by grade but will split teachers if it leads to better workload balance.
                            </span>
                        }
                    />
                    <Radio
                        name="strategy"
                        value={AllocationStrategy.Flexible}
                        checked={settings.strategy === AllocationStrategy.Flexible}
                        onChange={handleStrategyChange}
                        label={
                             <span className="text-gray-700 dark:text-gray-300">
                                <strong>Flexible:</strong> Prioritizes filling gaps and balancing workload, with minimal consideration for grade consolidation.
                            </span>
                        }
                    />
                </div>
            </Fieldset>

            <Fieldset legend="Teacher Preferences">
                 <Checkbox
                    checked={settings.prioritizePreferredGrades}
                    onChange={handlePrioritizeChange}
                    label={
                        <span className="text-gray-700 dark:text-gray-300">
                            <strong>Prioritize Preferred Grades:</strong> Give preference to teachers who have indicated a preference for the class's grade level.
                        </span>
                    }
                />
            </Fieldset>
        </div>
    );
};

export default AllocationSettingsManager;