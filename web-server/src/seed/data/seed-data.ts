import { faker } from '@faker-js/faker';
import { UserRole } from '../../modules/auth/enums/user-role.enum';
import { ProjectStatus } from '../../modules/project/schemas/project.schema';
import { TaskStatus, TaskPriority } from '../../modules/project/schemas/task.schema';
import { InvoiceStatus } from '../../modules/billing/schemas/invoice.schema';

const DEFAULT_PASSWORD = 'Password123!';

export interface SeededTenant {
  id: string;
  name: string;
  slug: string;
}

export interface SeededUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
}

export interface SeededProject {
  id: string;
  name: string;
  tenantId: string;
  ownerId: string;
  status: ProjectStatus;
}

export interface SeededTask {
  id: string;
  title: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
}

export interface SeededTimeEntry {
  id: string;
  userId: string;
  taskId: string;
  projectId: string;
  isRunning: boolean;
  duration: number;
}

export interface SeededInvoice {
  id: string;
  projectId: string;
  clientId: string;
  status: InvoiceStatus;
  amount: number;
}

export function generateTenants(count: number): Array<{ name: string; slug: string }> {
  return Array.from({ length: count }, () => {
    const name = faker.company.name();
    return {
      name,
      slug: faker.helpers.slugify(name).toLowerCase().replace(/[^a-z0-9-]/g, '').substring(0, 30) || faker.string.alphanumeric(8).toLowerCase(),
    };
  });
}

export function generateUsers(tenantId: string, count: number): Array<{
  email: string;
  password: string;
  name: string;
  role: UserRole;
  tenantId: string;
}> {
  const roles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER, UserRole.MANAGER, UserRole.MEMBER, UserRole.MEMBER, UserRole.MEMBER, UserRole.CLIENT, UserRole.CLIENT];

  return Array.from({ length: count }, (_, i) => {
    const name = faker.person.fullName();
    return {
      email: faker.internet.email({ firstName: name.split(' ')[0], lastName: name.split(' ')[1] }).toLowerCase(),
      password: DEFAULT_PASSWORD,
      name,
      role: roles[i % roles.length],
      tenantId,
    };
  });
}

export function generateProjects(tenantId: string, ownerId: string, count: number): Array<{
  name: string;
  description: string;
  status: ProjectStatus;
  tenantId: string;
  ownerId: string;
  teamMemberIds: string[];
  clientId: string;
  startDate: Date;
  endDate: Date;
  budget: number;
}> {
  const statuses: ProjectStatus[] = [
    ProjectStatus.ACTIVE,
    ProjectStatus.ACTIVE,
    ProjectStatus.DRAFT,
    ProjectStatus.ON_HOLD,
  ];

  return Array.from({ length: count }, () => ({
    name: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(statuses),
    tenantId,
    ownerId,
    teamMemberIds: [],
    clientId: '',
    startDate: faker.date.past({ years: 1 }),
    endDate: faker.date.future({ years: 1 }),
    budget: parseFloat(faker.finance.amount({ min: 5000, max: 50000, dec: 0 })),
  }));
}

export function generateTasks(
  projectId: string,
  assigneeIds: string[],
  count: number,
): Array<{
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeIds: string[];
  dueDate: Date;
  order: number;
}> {
  const statuses: TaskStatus[] = [
    TaskStatus.TODO,
    TaskStatus.TODO,
    TaskStatus.IN_PROGRESS,
    TaskStatus.IN_REVIEW,
    TaskStatus.DONE,
  ];

  const priorities: TaskPriority[] = [
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
  ];

  return Array.from({ length: count }, (_, i) => ({
    title: faker.lorem.sentence(5),
    description: faker.lorem.paragraph(),
    status: faker.helpers.arrayElement(statuses),
    priority: faker.helpers.arrayElement(priorities),
    projectId,
    assigneeIds: faker.helpers.arrayElements(assigneeIds, faker.number.int({ min: 1, max: 3 })),
    dueDate: faker.date.future({ days: 30 }),
    order: i,
  }));
}

export function generateTimeEntries(
  userId: string,
  taskId: string,
  projectId: string,
  count: number,
  isRunning: boolean = false,
): Array<{
  userId: string;
  taskId: string;
  projectId: string;
  isRunning: boolean;
  startTime: Date;
  endTime: Date | null;
  duration: number;
  description: string;
  isBillable: boolean;
}> {
  return Array.from({ length: count }, () => {
    const startTime = faker.date.recent({ days: 7 });
    const duration = isRunning ? 0 : faker.number.int({ min: 900, max: 28800 });
    const endTime = isRunning ? null : new Date(startTime.getTime() + duration * 1000);

    return {
      userId,
      taskId,
      projectId,
      isRunning,
      startTime,
      endTime,
      duration,
      description: faker.lorem.sentence(),
      isBillable: faker.datatype.boolean(0.7),
    };
  });
}

export function generateInvoices(
  projectId: string,
  clientId: string,
  count: number,
): Array<{
  projectId: string;
  clientId: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  dueDate: Date;
  notes: string;
}> {
  const statuses: InvoiceStatus[] = [
    InvoiceStatus.DRAFT,
    InvoiceStatus.DRAFT,
    InvoiceStatus.SENT,
    InvoiceStatus.SENT,
    InvoiceStatus.PAID,
    InvoiceStatus.PAID,
    InvoiceStatus.OVERDUE,
  ];

  return Array.from({ length: count }, () => {
    const amount = parseFloat(faker.finance.amount({ min: 500, max: 15000, dec: 2 }));
    const taxRate = faker.number.float({ min: 0.05, max: 0.2, fractionDigits: 2 });
    const tax = parseFloat((amount * taxRate).toFixed(2));

    return {
      projectId,
      clientId,
      status: faker.helpers.arrayElement(statuses),
      amount,
      tax,
      dueDate: faker.date.future({ days: 60 }),
      notes: faker.lorem.sentence(),
    };
  });
}

export { DEFAULT_PASSWORD };
