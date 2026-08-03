import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export interface Activity {
  icon: IconDefinition;
  color: string;
  message: string;
  time: string;
}

export interface TeamMember {
  initials: string;
  name: string;
  role: string;
  color: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  totalHours: number;
  pendingInvoices: number;
}

export interface StatItem {
  icon: IconDefinition;
  key: keyof DashboardStats;
  title: string;
  description: string;
  color: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}
