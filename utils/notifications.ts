
import type { Notification } from '../types';

export const generateNotification = (
  userId: string,
  type: 'leaveStatus' | 'newParentQuery' | 'parentQueryUpdate' | 'slaBreach',
  data: any
): Notification => {
  let message = '';
  switch (type) {
    case 'leaveStatus':
      message = `Your leave request for ${data.startDate} to ${data.endDate} has been ${data.status}.`;
      break;
    case 'newParentQuery':
      message = `New parent query from ${data.parentName} has been assigned to you.`;
      break;
    case 'parentQueryUpdate':
      message = `The status of the query from ${data.parentName} has been updated to ${data.status}.`;
      break;
    case 'slaBreach':
      message = `SLA Breach Alert: ${data.teacherName} has the following breaches: ${data.breaches.join(', ')}.`;
      break;
    default:
      message = 'You have a new notification.';
  }

  return {
    id: `notif-${Date.now()}`,
    userId,
    type,
    data,
    timestamp: new Date().toISOString(),
    read: false,
    message,
  };
};
