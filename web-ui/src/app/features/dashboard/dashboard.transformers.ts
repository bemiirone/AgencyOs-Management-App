import { Project } from '../../shared/models/project.model';
import { Task } from '../../shared/models/task.model';
import { TimeEntry } from '../../shared/models/time-entry.model';
import { Invoice } from '../../shared/models/invoice.model';
import { Activity, TeamMember, DashboardStats, User } from './dashboard.models';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import type { ApexOptions } from 'apexcharts';

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
  invoices: Invoice[],
  icons: { project: IconDefinition; task: IconDefinition; invoice: IconDefinition }
): Activity[] {
  const projectActivities = projects.slice(0, 3).map((p) => {
    const date = resolveDate(p.createdAt, p.updatedAt);
    const label = resolveLabel(p.createdAt, p.updatedAt);
    return {
      icon: icons.project,
      color: 'bg-primary' as const,
      message: `Project "${p.name}"`,
      label,
      time: timeAgo(date),
      timestamp: toTimestamp(date),
    };
  });

  const taskActivities = tasks.slice(0, 3).map((t) => {
    const date = resolveDate(t.createdAt, t.updatedAt);
    const label = resolveLabel(t.createdAt, t.updatedAt);
    return {
      icon: icons.task,
      color: 'bg-secondary' as const,
      message: `Task "${t.title}"`,
      label,
      time: timeAgo(date),
      timestamp: toTimestamp(date),
    };
  });

  const invoiceActivities = invoices.slice(0, 3).map((inv) => {
    const date = resolveDate(inv.createdAt, inv.updatedAt);
    const label = resolveLabel(inv.createdAt, inv.updatedAt);
    return {
      icon: icons.invoice,
      color: 'bg-info' as const,
      message: `Invoice "${inv.invoiceNumber}"`,
      label,
      time: timeAgo(date),
      timestamp: toTimestamp(date),
    };
  });

  return [...projectActivities, ...taskActivities, ...invoiceActivities]
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
  const ts = toTimestamp(date);
  if (isNaN(ts)) return 'Unknown';

  const diffMs = Date.now() - ts;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  return `${diffDays}d ago`;
}

function toTimestamp(date: string | Date): number {
  if (!date) return NaN;
  const ts = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return ts;
}

function resolveDate(
  createdAt: string | Date | undefined,
  updatedAt: string | Date | undefined
): string | Date {
  return createdAt || updatedAt || '';
}

function resolveLabel(
  createdAt: string | Date | undefined,
  updatedAt: string | Date | undefined
): 'Created' | 'Updated' {
  if (!createdAt) return 'Created';
  if (!updatedAt) return 'Created';
  if (new Date(createdAt).getTime() === new Date(updatedAt).getTime()) return 'Created';
  return 'Updated';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function buildProjectStatusChart(projects: Project[]): ApexOptions {
  const statusCounts: Record<string, number> = {
    active: 0,
    completed: 0,
    on_hold: 0,
    archived: 0,
    draft: 0,
  };

  projects.forEach((p) => {
    if (statusCounts[p.status] !== undefined) {
      statusCounts[p.status]++;
    }
  });

  const filteredLabels = Object.keys(statusCounts).filter(
    (key) => statusCounts[key] > 0
  );
  const filteredData = filteredLabels.map((key) => statusCounts[key]);

  const statusLabels: Record<string, string> = {
    active: 'Active',
    completed: 'Completed',
    on_hold: 'On Hold',
    archived: 'Archived',
    draft: 'Draft',
  };

  return {
    series: filteredData,
    chart: {
      type: 'donut',
      height: 300,
      toolbar: { show: false },
    },
    labels: filteredLabels.map((key) => statusLabels[key]),
    colors: ['#570df8', '#00b5b7', '#f9a825', '#9e9e9e', '#78909c'],
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#a0a0a0',
      },
      markers: {
        size: 10,
      },
      fontSize: '12px',
      fontWeight: 400,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { show: false },
        },
      },
    ],
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: true },
            value: { show: true, fontSize: '20px', fontWeight: 600 },
            total: {
              show: true,
              label: 'Total',
              formatter: (w: any) => w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
            },
          },
        },
      },
    },
  };
}

export function buildTaskStatusChart(tasks: Task[]): ApexOptions {
  const statusCounts: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    done: 0,
  };

  tasks.forEach((t) => {
    if (statusCounts[t.status] !== undefined) {
      statusCounts[t.status]++;
    }
  });

  const statusLabels: Record<string, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    in_review: 'In Review',
    done: 'Done',
  };

  return {
    series: [
      {
        name: 'Tasks',
        data: Object.values(statusCounts),
      },
    ],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
      },
    },
    colors: ['#78909c', '#f9a825', '#00b5b7', '#570df8'],
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#a0a0a0',
      },
      markers: {
        size: 10,
      },
      fontSize: '12px',
      fontWeight: 400,
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent'],
    },
    xaxis: {
      categories: Object.keys(statusCounts).map((key) => statusLabels[key]),
      labels: {
        style: {
          colors: '#a0a0a0',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      tickAmount: 1,
      labels: {
        style: {
          colors: '#a0a0a0',
          fontSize: '12px',
        },
      },
    },
    grid: {
      borderColor: '#e0e0e0',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} tasks`,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
        },
      },
    ],
  };
}

