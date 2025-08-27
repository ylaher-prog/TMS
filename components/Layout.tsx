import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import type { Page, Teacher, AcademicStructure } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  setActivePage: (page: Page) => void;
  currentUser: Teacher;
  onLogout: () => void;
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  academicStructure: AcademicStructure;
}

const Layout: React.FC<LayoutProps> = (props) => {
  const { children, activePage, setActivePage, currentUser, onLogout, setTeachers, isDarkMode, setIsDarkMode, academicStructure } = props;
  return (
    <div className="flex h-screen bg-brand-bg dark:bg-brand-navy font-sans text-brand-text-dark dark:text-gray-300">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        currentUser={currentUser} 
        academicStructure={academicStructure}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          pageTitle={activePage.charAt(0).toUpperCase() + activePage.slice(1)} 
          currentUser={currentUser}
          onLogout={onLogout}
          setTeachers={setTeachers}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          academicStructure={academicStructure}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;