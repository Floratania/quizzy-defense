import {
    IconDeviceDesktopAnalytics,
    IconPencilStar,
    IconSchool,
    IconBook,
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
    { icon: IconSchool, label: 'Класи', to: '/admin/classes' },
    { icon: IconBook, label: 'Довідка', to: '/admin/help/formatting' },
];
