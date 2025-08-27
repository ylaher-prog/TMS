import React from 'react';

interface StatusTagProps {
  status: string;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const colorClasses: { [key: string]: string } = {
    // RequestStatus
    'Pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Approved': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Denied': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    // MonitoringStatus
    'Open': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    'In-Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
    'Resolved': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    'Escalated': 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  };

  const color = colorClasses[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
      {status}
    </span>
  );
};

export default StatusTag;