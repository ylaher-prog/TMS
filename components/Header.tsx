


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, BellIcon, PencilSquareIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon, ChevronDownIcon } from './Icons';
// FIX: Import Notification type
import type { Teacher, AcademicStructure, Notification, Permission, PhaseStructure } from '../types';
import EditProfileModal from './EditProfileModal';
import NotificationDropdown from './NotificationDropdown';
import { hasPermission } from '../permissions';

interface HeaderProps {
    pageTitle: string;
    currentUser: Teacher;
    onLogout: () => void;
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    isDarkMode: boolean;
    setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    academicStructure: AcademicStructure;
    phaseStructures: PhaseStructure[];
    currentAcademicYear: string;
    setCurrentAcademicYear: (year: string) => void;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    permissions: Permission[];
    selectedPhaseId: string;
    setSelectedPhaseId: (phaseId: string) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { pageTitle, currentUser, onLogout, setTeachers, isDarkMode, setIsDarkMode, academicStructure, phaseStructures, currentAcademicYear, setCurrentAcademicYear, notifications, setNotifications, permissions, selectedPhaseId, setSelectedPhaseId } = props;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const [isNotificationOpen, setNotificationOpen] = useState(false);
  const [isPhaseDropdownOpen, setPhaseDropdownOpen] = useState(false);
  const [isYearDropdownOpen, setYearDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const phaseDropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);

  const userPositionName = useMemo(() => {
    const position = academicStructure.positions.find(p => p.id === currentUser.positionId);
    return position ? position.name : 'User';
  }, [currentUser, academicStructure]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
      if (phaseDropdownRef.current && !phaseDropdownRef.current.contains(event.target as Node)) {
        setPhaseDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setYearDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedPhaseName = useMemo(() => {
    if (selectedPhaseId === 'all') return 'All Phases';
    const phase = phaseStructures.find(p => p.id === selectedPhaseId);
    return phase ? phase.phase : 'All Phases';
  }, [selectedPhaseId, phaseStructures]);

  return (
    <>
      <header className="flex items-center justify-between h-20 px-6 md:px-8 bg-transparent flex-shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-brand-text-dark dark:text-white">{pageTitle}</h2>
             {hasPermission(permissions, 'view:header-phase-filter') && (
                <div className="relative" ref={phaseDropdownRef}>
                    <button
                        onClick={() => setPhaseDropdownOpen(p => !p)}
                        className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700/80 border-transparent rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600 py-2.5 px-4 text-brand-text-dark dark:text-gray-200"
                    >
                        <span>{selectedPhaseName}</span>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isPhaseDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isPhaseDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-56 origin-top-left bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border dark:border-slate-700">
                            <div className="py-1">
                                <button
                                    onClick={() => { setSelectedPhaseId('all'); setPhaseDropdownOpen(false); }}
                                    className={`text-left w-full block px-4 py-2 text-sm ${selectedPhaseId === 'all' ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-slate-700`}
                                >
                                    All Phases
                                </button>
                                {phaseStructures.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setSelectedPhaseId(p.id); setPhaseDropdownOpen(false); }}
                                        className={`text-left w-full block px-4 py-2 text-sm ${selectedPhaseId === p.id ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-slate-700`}
                                    >
                                        {p.phase}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="relative hidden md:block">
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-gray-200/50 dark:bg-slate-700/50 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-800"
            />
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-gray-200/60 dark:hover:bg-slate-700/60"
          >
            {isDarkMode ? <SunIcon className="h-6 w-6 text-yellow-400" /> : <MoonIcon className="h-6 w-6 text-gray-500" />}
          </button>
          <div className="relative" ref={notificationRef}>
            <button onClick={() => setNotificationOpen(p => !p)} className="p-2 rounded-full hover:bg-gray-200/60 dark:hover:bg-slate-700/60 relative">
                <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                        {unreadCount}
                    </span>
                )}
            </button>
             {isNotificationOpen && (
                <NotificationDropdown 
                    notifications={notifications} 
                    setNotifications={setNotifications} 
                    onClose={() => setNotificationOpen(false)}
                />
            )}
          </div>
          
           <div className="flex items-center gap-4 pl-2 border-l border-gray-200 dark:border-slate-700">
                <div className="relative" ref={yearDropdownRef}>
                    <button
                        onClick={() => setYearDropdownOpen(p => !p)}
                        className="flex items-center gap-2 text-right bg-gray-100 dark:bg-slate-700/80 border-transparent rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600 py-1.5 px-3"
                    >
                        <div>
                            <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 block leading-tight">Academic Year</span>
                            <span className="text-brand-text-dark dark:text-gray-200 font-bold block leading-tight">{currentAcademicYear}</span>
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform text-gray-500 dark:text-gray-400 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isYearDropdownOpen && (
                        <div className="absolute z-10 mt-2 w-32 right-0 origin-top-right bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border dark:border-slate-700">
                            <div className="py-1">
                                {(academicStructure.academicYears || []).sort().reverse().map(year => (
                                    <button
                                        key={year}
                                        onClick={() => { setCurrentAcademicYear(year); setYearDropdownOpen(false); }}
                                        className={`text-left w-full block px-4 py-2 text-sm ${currentAcademicYear === year ? 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'} hover:bg-gray-100 dark:hover:bg-slate-700`}
                                    >
                                        {year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 cursor-pointer">
                        <img src={currentUser.avatarUrl} alt="User Avatar" className="h-10 w-10 rounded-full" />
                    </button>
                    {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border dark:border-slate-700">
                        <div className="px-4 py-3 border-b dark:border-slate-700">
                            <p className="font-semibold text-sm text-brand-text-dark dark:text-white">{currentUser.fullName}</p>
                            <p className="text-xs text-brand-text-light dark:text-gray-400">{userPositionName}</p>
                        </div>
                        {hasPermission(permissions, 'edit:teacher') && (
                        <button 
                            onClick={() => { setEditProfileOpen(true); setDropdownOpen(false); }}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                            <PencilSquareIcon className="w-4 h-4 mr-2" />
                            Edit Profile
                        </button>
                        )}
                        <button
                        onClick={onLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
                        Logout
                        </button>
                    </div>
                    )}
                </div>
            </div>
        </div>
      </header>
      {isEditProfileOpen && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setEditProfileOpen(false)}
          currentUser={currentUser}
          setTeachers={setTeachers}
        />
      )}
    </>
  );
};

export default Header;