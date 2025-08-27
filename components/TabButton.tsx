import React from 'react';

interface TabButtonProps {
  tabId: string;
  label: string;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tabId, label, activeTab, setActiveTab }) => {
  const isActive = activeTab === tabId;
  return (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${isActive
          ? 'bg-brand-primary text-white shadow'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700'}`
      }
    >
      {label}
    </button>
  );
};

export default TabButton;
