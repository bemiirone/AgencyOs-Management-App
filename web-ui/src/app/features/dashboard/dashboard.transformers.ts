import { Project } from '../../shared/models/project.model';
import { Task } from '../../shared/models/task.model';
import { TimeEntry } from '../../shared/models/time-entry.model';
import { Invoice } from '../../shared/models/invoice.model';
import { Activity, TeamMember, DashboardStats, User } from './dashboard.models';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

export function computeStats(
  projects: Project[],
  tasks: Task[],
  timeEntries: TimeEntry[],
  invoices: Invoice[]
): DashboardStats {
  const activeTasks = tasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'todo'
  ).length;

  const totalMinutes = timeEntries.reduce(
    (sum, e) => sum + (e.duration || 0),
    0
  );

  const pendingInvoices = invoices.filter(
    (i) => i.status === 'draft' || i.status === 'sent'
  ).length;

  return {
    totalProjects: projects.length,
    activeTasks,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    pendingInvoices,
  };
}

export function buildActivities(
  projects: Project[],
  tasks: Task[],
  icons: { project: IconDefinition; task: IconDefinition }
): Activity[] {
  const projectActivities = projects.slice(0, 3).map((p) => ({
    icon: icons.project,
    color: 'bg-primary' as const,
    message: `Project "${p.name}" created`,
    time: timeAgo(p.createdAt),
    timestamp: toTimestamp(p.createdAt),
  }));

  const taskActivities = tasks.slice(0, 3).map((t) => ({
    icon: icons.task,
    color: 'bg-secondary' as const,
    message: `Task "${t.title}" created`,
    time: timeAgo(t.createdAt),
    timestamp: toTimestamp(t.createdAt),
  }));

  return [...projectActivities, ...taskActivities]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6)
    .map(({ timestamp: _ts, ...activity }) => activity);
}

export function mapTeamMembers(
  users: User[],
  colors: string[]
): TeamMember[] {
  return users
    .filter((u) => u.isActive)
    .map((u, i) => ({
      initials: getInitials(u.name),
      name: u.name,
      role: u.role,
      color: colors[i % colors.length],
    }));
}

function timeAgo(date: string | Date): string {
  const diffMs = Date.now() - toTimestamp(date);
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function toTimestamp(date: string | Date): number {
  return date instanceof Date ? date.getTime() : new Date(date).getTime();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
