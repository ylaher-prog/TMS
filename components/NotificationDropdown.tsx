import React from 'react';
import type { Notification } from '../types';
import { XMarkIcon } from './Icons';

interface NotificationDropdownProps {
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ notifications, setNotifications, onClose }) => {
    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };
    
    const handleMarkAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    return (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg border dark:border-slate-700 z-50 flex flex-col max-h-96">
            <div className="flex justify-between items-center p-3 border-b dark:border-slate-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
            {notifications.length > 0 ? (
                <>
                    <div className="flex-grow overflow-y-auto">
                        {notifications.map(n => (
                            <div
                                key={n.id}
                                onClick={() => !n.read && handleMarkAsRead(n.id)}
                                className={`p-3 border-b dark:border-slate-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 ${!n.read ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}
                            >
                                <div className="flex items-start gap-3">
                                    {!n.read && <div className="w-2 h-2 rounded-full bg-sky-500 mt-1.5 flex-shrink-0"></div>}
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(n.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-2 border-t dark:border-slate-700">
                        <button onClick={handleMarkAllAsRead} className="w-full text-center text-sm font-medium text-brand-primary hover:underline">
                            Mark all as read
                        </button>
                    </div>
                </>
            ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-10">You're all caught up!</p>
            )}
        </div>
    );
};

export default NotificationDropdown;
