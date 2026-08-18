import { describe, it, expect } from 'vitest';
import { computeStats, buildActivities, mapTeamMembers } from './dashboard.transformers';
import { faPlus, faTasks, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

const icons = { project: faPlus, task: faTasks, invoice: faFileInvoiceDollar };

describe('computeStats', () => {
  it('should return zero stats for empty arrays', () => {
    const result = computeStats([], [], [], []);
    expect(result).toEqual({
      totalProjects: 0,
      activeTasks: 0,
      totalHours: 0,
      pendingInvoices: 0,
    });
  });

  it('should count only active tasks (todo + in_progress)', () => {
    const tasks = [
      { status: 'todo' },
      { status: 'in_progress' },
      { status: 'in_review' },
      { status: 'done' },
    ] as any[];

    const result = computeStats([], tasks, [], []);
    expect(result.activeTasks).toBe(2);
  });

  it('should convert minutes to hours with 1 decimal', () => {
    const timeEntries = [
      { duration: 90 },
      { duration: 45 },
      { duration: 15 },
    ] as any[];

    const result = computeStats([], [], timeEntries, []);
    expect(result.totalHours).toBe(2.5);
  });

  it('should count only draft and sent invoices', () => {
    const invoices = [
      { status: 'draft' },
      { status: 'sent' },
      { status: 'paid' },
      { status: 'overdue' },
    ] as any[];

    const result = computeStats([], [], [], invoices);
    expect(result.pendingInvoices).toBe(2);
  });
});

describe('buildActivities', () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  it('should create activities from projects and tasks', () => {
    const projects = [{ name: 'Alpha', createdAt: now }];
    const tasks = [{ title: 'Fix bug', createdAt: now }];

    const result = buildActivities(projects as any, tasks as any, [], icons);
    expect(result).toHaveLength(2);
    expect(result[0].message).toContain('Alpha');
    expect(result[1].message).toContain('Fix bug');
  });

  it('should sort activities by most recent first', () => {
    const projects = [
      { name: 'Old', createdAt: twoDaysAgo },
      { name: 'Recent', createdAt: oneHourAgo },
    ];
    const tasks: any[] = [];

    const result = buildActivities(projects as any, tasks, [], icons);
    expect(result[0].message).toContain('Recent');
    expect(result[1].message).toContain('Old');
  });

  it('should limit to 6 activities', () => {
    const projects = Array.from({ length: 4 }, (_, i) => ({
      name: `Project ${i}`,
      createdAt: new Date(now.getTime() - i * 1000),
    }));
    const tasks = Array.from({ length: 4 }, (_, i) => ({
      title: `Task ${i}`,
      createdAt: new Date(now.getTime() - i * 1000),
    }));

    const result = buildActivities(projects as any, tasks as any, [], icons);
    expect(result).toHaveLength(6);
  });

  it('should display "Just now" for recent items', () => {
    const projects = [{ name: 'New', createdAt: now }];
    const result = buildActivities(projects as any, [], [], icons);
    expect(result[0].time).toBe('Just now');
  });

  it('should display hours for items less than a day old', () => {
    const projects = [{ name: 'Recent', createdAt: oneHourAgo }];
    const result = buildActivities(projects as any, [], [], icons);
    expect(result[0].time).toBe('1h ago');
  });

  it('should display days for older items', () => {
    const projects = [{ name: 'Old', createdAt: twoDaysAgo }];
    const result = buildActivities(projects as any, [], [], icons);
    expect(result[0].time).toBe('2d ago');
  });

  it('should include invoice activities', () => {
    const invoices = [
      { invoiceNumber: 'INV-2026-00001', createdAt: now, updatedAt: now },
    ];
    const result = buildActivities([], [], invoices as any, icons);
    expect(result).toHaveLength(1);
    expect(result[0].message).toContain('INV-2026-00001');
    expect(result[0].label).toBe('Created');
  });

  it('should show Updated label when createdAt differs from updatedAt', () => {
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const invoices = [
      { invoiceNumber: 'INV-2026-00002', createdAt: now, updatedAt: oneHourLater },
    ];
    const result = buildActivities([], [], invoices as any, icons);
    expect(result[0].label).toBe('Updated');
  });

  it('should show Created label when createdAt is missing but updatedAt exists', () => {
    const invoices = [
      { invoiceNumber: 'INV-2026-00003', updatedAt: oneHourAgo },
    ];
    const result = buildActivities([], [], invoices as any, icons);
    expect(result[0].label).toBe('Created');
  });
});

describe('mapTeamMembers', () => {
  const colors = ['bg-primary', 'bg-secondary'];

  it('should filter out inactive users', () => {
    const users = [
      { name: 'Active', role: 'dev', isActive: true },
      { name: 'Inactive', role: 'dev', isActive: false },
    ] as any[];

    const result = mapTeamMembers(users, colors);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Active');
  });

  it('should generate correct initials', () => {
    const users = [{ name: 'John Doe', role: 'dev', isActive: true }] as any[];
    const result = mapTeamMembers(users, colors);
    expect(result[0].initials).toBe('JD');
  });

  it('should cycle colors when users exceed palette', () => {
    const users = [
      { name: 'User 1', role: 'dev', isActive: true },
      { name: 'User 2', role: 'dev', isActive: true },
      { name: 'User 3', role: 'dev', isActive: true },
    ] as any[];

    const result = mapTeamMembers(users, colors);
    expect(result[0].color).toBe('bg-primary');
    expect(result[1].color).toBe('bg-secondary');
    expect(result[2].color).toBe('bg-primary');
  });
});
