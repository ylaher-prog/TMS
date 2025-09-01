import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, BellIcon, PencilSquareIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon } from './Icons';
import type { Teacher, AcademicStructure } from '../types';
import EditProfileModal from './EditProfileModal';

interface HeaderProps {
    pageTitle: string;
    currentUser: Teacher;
    onLogout: () => void;
    setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
    isDarkMode: boolean;
    setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
    academicStructure: AcademicStructure;
    currentAcademicYear: string;
    setCurrentAcademicYear: (year: string) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { pageTitle, currentUser, onLogout, setTeachers, isDarkMode, setIsDarkMode, academicStructure, currentAcademicYear, setCurrentAcademicYear } = props;
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isEditProfileOpen, setEditProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userPositionName = useMemo(() => {
    const position = academicStructure.positions.find(p => p.id === currentUser.positionId);
    return position ? position.name : 'User';
  }, [currentUser, academicStructure]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between h-20 px-6 md:px-8 bg-transparent flex-shrink-0">
        <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-brand-text-dark dark:text-white">{pageTitle}</h2>
            <div className="relative">
                <select
                    value={currentAcademicYear}
                    onChange={(e) => setCurrentAcademicYear(e.target.value)}
                    className="bg-gray-100 dark:bg-slate-700/80 border-transparent rounded-md text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary focus:bg-white dark:focus:bg-slate-600 py-2 pl-3 pr-8 appearance-none text-brand-text-dark dark:text-gray-200"
                    aria-label="Select Academic Year"
                >
                    {(academicStructure.academicYears || []).sort().reverse().map(year => (
                        <option key={year} value={year}>{year} Academic Year</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
            </div>
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
          <button className="p-2 rounded-full hover:bg-gray-200/60 dark:hover:bg-slate-700/60">
              <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 cursor-pointer">
                <img src={currentUser.avatarUrl} alt="User Avatar" className="h-10 w-10 rounded-full" />
                <div className='hidden sm:block text-left'>
                    <p className="font-semibold text-sm text-brand-text-dark dark:text-white">{currentUser.fullName}</p>
                    <p className="text-xs text-brand-text-light dark:text-gray-400">{userPositionName}</p>
                </div>
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 z-50 border dark:border-slate-700">
                <button 
                  onClick={() => { setEditProfileOpen(true); setDropdownOpen(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <PencilSquareIcon className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
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