import React, { useState, useEffect, useMemo } from 'react';
import type { Page, Teacher, AcademicStructure } from '../types';
import { ChartPieIcon, UsersIcon, ClipboardDocumentListIcon, CalendarDaysIcon, EyeIcon, ShoppingCartIcon, Cog6ToothIcon, ChatBubbleLeftRightIcon, CurrencyDollarIcon, TableCellsIcon, BriefcaseIcon, ClipboardDocumentCheckIcon } from './Icons';
import type { Permission } from '../permissions';
import { hasPermission } from '../permissions';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUser: Teacher;
  academicStructure: AcademicStructure;
  permissions: Permission[];
}

const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  isSubmenu?: boolean;
}> = ({ icon, label, isActive, onClick, disabled = false, isSubmenu = false }) => {
  const baseClasses = `flex items-center w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${isSubmenu ? 'pl-11' : ''}`;
  const activeClasses = "bg-brand-primary text-white shadow-md";
  const inactiveClasses = "text-gray-300 hover:bg-slate-700 hover:text-white";
  const disabledClasses = "text-gray-500 cursor-not-allowed";

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      className={`${baseClasses} ${disabled ? disabledClasses : isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className={isSubmenu ? '' : 'ml-3'}>{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, currentUser, academicStructure, permissions }) => {
  const isHrSubmenuActive = activePage === 'payroll' || activePage === 'leave';
  const [isHrOpen, setIsHrOpen] = useState(isHrSubmenuActive);

  const positionMap = useMemo(() => new Map(academicStructure.positions.map(p => [p.id, p.name])), [academicStructure.positions]);
  const userPositionName = positionMap.get(currentUser.positionId) || 'User';

  useEffect(() => {
    if (isHrSubmenuActive) {
      setIsHrOpen(true);
    }
  }, [activePage, isHrSubmenuActive]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <ChartPieIcon />, permission: 'view:dashboard' },
    { id: 'academic-team', label: 'Academic Team', icon: <UsersIcon />, permission: 'view:academic-team' },
    { id: 'allocations', label: 'Allocations', icon: <ClipboardDocumentListIcon />, permission: 'view:allocations' },
    { id: 'timetable', label: 'Timetable', icon: <TableCellsIcon />, permission: 'view:timetable' },
    { id: 'tasks', label: 'Tasks', icon: <ClipboardDocumentCheckIcon />, permission: 'view:tasks' },
  ];
  
  const hrNavItems = [
    { id: 'payroll', label: 'Payroll', icon: <CurrencyDollarIcon />, permission: 'view:payroll' },
    { id: 'leave', label: 'Leave', icon: <CalendarDaysIcon />, permission: 'view:leave' },
  ];

  const otherNavItems = [
    { id: 'observations', label: 'Monitoring', icon: <EyeIcon />, permission: 'view:monitoring' },
    { id: 'procurement', label: 'Procurement', icon: <ShoppingCartIcon />, permission: 'view:procurement' },
    { id: 'parents', label: 'Parents', icon: <ChatBubbleLeftRightIcon />, permission: 'view:parents' },
  ];

  const canViewHr = hrNavItems.some(item => hasPermission(permissions, item.permission as Permission));

  return (
    <div className="w-64 bg-brand-navy border-r border-slate-700 flex flex-col flex-shrink-0">
      <div className="flex items-center justify-center h-20 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white tracking-wider">SMT</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map(item => (
          hasPermission(permissions, item.permission as Permission) &&
          <NavLink
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.id}
            onClick={() => setActivePage(item.id as Page)}
          />
        ))}

        {/* HR Collapsible Menu */}
        {canViewHr && (
          <div>
            <button
              onClick={() => setIsHrOpen(!isHrOpen)}
              className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-gray-300 hover:bg-slate-700 hover:text-white ${isHrSubmenuActive ? 'bg-slate-700 text-white' : ''}`}
            >
              <div className="flex items-center">
                <BriefcaseIcon />
                <span className="ml-3">HR</span>
              </div>
              <svg className={`w-4 h-4 transition-transform ${isHrOpen ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
            {isHrOpen && (
              <div className="mt-1 space-y-1">
                {hrNavItems.map(item => (
                  hasPermission(permissions, item.permission as Permission) &&
                  <NavLink
                    key={item.id}
                    icon={item.icon}
                    label={item.label}
                    isActive={activePage === item.id}
                    onClick={() => setActivePage(item.id as Page)}
                    isSubmenu={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {otherNavItems.map(item => (
           hasPermission(permissions, item.permission as Permission) &&
           <NavLink
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activePage === item.id}
            onClick={() => setActivePage(item.id as Page)}
          />
        ))}

        {hasPermission(permissions, 'view:settings') && (
          <div className="pt-4 border-t border-slate-700">
              <NavLink
                icon={<Cog6ToothIcon />}
                label="Settings"
                isActive={activePage === 'settings'}
                onClick={() => setActivePage('settings' as Page)}
                disabled={false}
              />
          </div>
        )}
      </nav>
      
      <div className="px-4 py-5 border-t border-slate-700">
          <div className="flex items-center">
              <img className="h-10 w-10 rounded-full" src={currentUser.avatarUrl} alt="User avatar" />
              <div className="ml-3">
                  <p className="text-sm font-semibold text-white">Welcome, {currentUser.fullName}!</p>
                  <p className="text-xs text-gray-400">{userPositionName}</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;