import React, { useState, useEffect } from 'react';
import type { AcademicStructure, Position, Permission } from '../types';
import { PERMISSIONS_CONFIG } from '../permissions';
import { Checkbox } from './FormControls';

interface PermissionsManagerProps {
    academicStructure: AcademicStructure;
    setAcademicStructure: React.Dispatch<React.SetStateAction<AcademicStructure>>;
}

const PermissionsManager: React.FC<PermissionsManagerProps> = ({ academicStructure, setAcademicStructure }) => {
    const { positions } = academicStructure;
    const [selectedPositionId, setSelectedPositionId] = useState<string>(positions[0]?.id || '');
    
    // Local state for checkboxes to provide a responsive UI
    const [localPermissions, setLocalPermissions] = useState<Permission[]>([]);

    useEffect(() => {
        const selectedPosition = positions.find(p => p.id === selectedPositionId);
        setLocalPermissions(selectedPosition?.permissions || []);
    }, [selectedPositionId, positions]);

    const handlePermissionChange = (permissionId: Permission, isChecked: boolean) => {
        setLocalPermissions(prev => 
            isChecked ? [...prev, permissionId] : prev.filter(p => p !== permissionId)
        );
    };
    
    const handleSave = () => {
        setAcademicStructure(prev => ({
            ...prev,
            positions: prev.positions.map(p => 
                p.id === selectedPositionId ? { ...p, permissions: localPermissions } : p
            )
        }));
        alert(`Permissions for "${positions.find(p => p.id === selectedPositionId)?.name}" have been saved.`);
    };

    return (
        <div className="bg-white dark:bg-slate-800/50 p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-brand-text-dark dark:text-white">Role Permissions</h3>
            <p className="text-sm text-brand-text-light dark:text-gray-400 mt-1">
                Assign specific permissions to each position. Users will inherit the permissions of their assigned position.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center">
                <label htmlFor="position-select" className="font-semibold text-gray-700 dark:text-gray-300">Editing Permissions for:</label>
                <select
                    id="position-select"
                    value={selectedPositionId}
                    onChange={(e) => setSelectedPositionId(e.target.value)}
                    className="w-full sm:w-72 p-2.5 border rounded-md dark:bg-slate-700 dark:border-slate-600 text-base"
                >
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            <div className="mt-6 border-t dark:border-slate-700 pt-4 space-y-6 max-h-[50vh] overflow-y-auto pr-2">
                {PERMISSIONS_CONFIG.map(category => (
                    <div key={category.category}>
                        <h4 className="font-semibold text-brand-navy dark:text-gray-200 border-b dark:border-slate-600 pb-1 mb-3">{category.category}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                            {category.permissions.map(permission => (
                                <Checkbox 
                                    key={permission.id}
                                    id={permission.id}
                                    label={permission.label}
                                    checked={localPermissions.includes(permission.id)}
                                    onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 border-t dark:border-slate-700 pt-4 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={!selectedPositionId}
                    className="bg-brand-primary text-white px-6 py-2.5 rounded-md font-semibold hover:bg-rose-900 transition-colors disabled:opacity-50"
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
};

export default PermissionsManager;