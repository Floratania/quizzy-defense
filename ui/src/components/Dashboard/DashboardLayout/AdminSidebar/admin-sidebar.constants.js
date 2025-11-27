import {
    IconDeviceDesktopAnalytics,
    IconPencilStar,
} from '@tabler/icons-react';

export const ADMIN_SIDEBAR_LINKS = [
  {
    icon: IconPencilStar,
    label: 'Quizzes',
    to: '/admin/quizzes'
  },
    {
        icon: IconDeviceDesktopAnalytics,
        label: 'Reports',
        to: '/admin/reports'
    },
];
