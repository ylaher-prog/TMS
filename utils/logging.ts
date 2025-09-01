import type { TimetableHistoryEntry } from '../types';

export const formatLogDetails = (action: string, data: any): string => {
    switch (action) {
        case 'generate:timetable':
            const entry = data as TimetableHistoryEntry;
            return `Generated timetable with ${entry.conflicts.length} conflicts. Score: ${entry.objectiveScore}, Seed: ${entry.solverSeed}, Version: ${entry.solverVersion}.`;
        
        default:
            try {
                // For simple objects, stringify them.
                if (typeof data === 'object' && data !== null) {
                    return JSON.stringify(data);
                }
                // For primitive types or if stringify fails, just use the data.
                return String(data);
            } catch (e) {
                return `[Unloggable details for action: ${action}]`;
            }
    }
};
