import * as dotenv from 'dotenv';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { SeedModule } from './seed.module';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { clearDatabase, logSummary, logUser } from './data/seed-helpers';
import {
  generateTenants,
  generateUsers,
  generateProjects,
  generateTasks,
  generateTimeEntries,
  generateInvoices,
  generateFaqs,
  DEFAULT_PASSWORD,
  SeededTenant,
  SeededUser,
  SeededProject,
  SeededTask,
  SeededTimeEntry,
  SeededInvoice,
} from './data/seed-data';
import { User } from '../modules/auth/schemas/user.schema';
import { Tenant } from '../modules/tenant/schemas/tenant.schema';
import { Project } from '../modules/project/schemas/project.schema';
import { Task } from '../modules/project/schemas/task.schema';
import { TimeEntry } from '../modules/time/schemas/time-entry.schema';
import { Invoice } from '../modules/billing/schemas/invoice.schema';
import { Faq } from '../modules/faq/schemas/faq.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const connection = app.get<Connection>('DATABASE_CONNECTION');

  const userModel = app.get<Model<User>>(getModelToken(User.name));
  const tenantModel = app.get<Model<Tenant>>(getModelToken(Tenant.name));
  const projectModel = app.get<Model<Project>>(getModelToken(Project.name));
  const taskModel = app.get<Model<Task>>(getModelToken(Task.name));
  const timeEntryModel = app.get<Model<TimeEntry>>(getModelToken(TimeEntry.name));
  const invoiceModel = app.get<Model<Invoice>>(getModelToken(Invoice.name));
  const faqModel = app.get<Model<Faq>>(getModelToken(Faq.name));

  const counts = {
    tenants: 0,
    users: 0,
    projects: 0,
    tasks: 0,
    timeEntries: 0,
    invoices: 0,
    faqs: 0,
  };

  try {
    console.log('🌱 Starting database seed...\n');

    await clearDatabase(connection);

    console.log('📦 Generating seed data...\n');

    const tenants = generateTenants(2);
    const seededTenants: SeededTenant[] = [];

    for (const tenantData of tenants) {
      const tenant = await tenantModel.create({
        ...tenantData,
      }) as any;
      seededTenants.push({ id: tenant._id.toString(), ...tenantData });
      counts.tenants++;
      console.log(`   ✓ Tenant: ${tenant.name} (${tenant.slug})`);
    }

    console.log('\n👥 Creating users...\n');

    const seededUsers: SeededUser[] = [];
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    for (const tenant of seededTenants) {
      const users = generateUsers(tenant.id, 8);

      for (const userData of users) {
        const user = await userModel.create({
          ...userData,
          password: hashedPassword,
        });
        seededUsers.push({ id: user._id.toString(), ...userData });
        counts.users++;
        const userRole = userData.role || 'member';
        logUser(user.email, DEFAULT_PASSWORD, userRole, tenant.name);
      }

      const adminUser = seededUsers.find((u) => u.tenantId === tenant.id && u.role === 'admin');
      const allUserIds = seededUsers.filter((u) => u.tenantId === tenant.id).map((u) => u.id);
      if (adminUser) {
        await tenantModel.findByIdAndUpdate(tenant.id, {
          ownerId: adminUser.id,
          memberIds: allUserIds,
        });
      }
    }

    console.log('\n📁 Creating projects...\n');

    const seededProjects: SeededProject[] = [];

    for (const tenant of seededTenants) {
      const tenantUsers = seededUsers.filter((u) => u.tenantId === tenant.id);
      const adminOrManager = tenantUsers.filter(
        (u) => u.role === 'admin' || u.role === 'manager',
      );
      const clients = tenantUsers.filter((u) => u.role === 'client');
      const members = tenantUsers.filter((u) => u.role === 'member');

      const owner = adminOrManager[0];
      const projects = generateProjects(tenant.id, owner.id, 4);

      for (const projectData of projects) {
        const project = await projectModel.create({
          ...projectData,
          teamMemberIds: members.map((m) => m.id),
          clientId: clients.length > 0 ? clients[0].id : '',
        });
        seededProjects.push({
          id: project._id.toString(),
          name: project.name,
          tenantId: project.tenantId,
          ownerId: project.ownerId,
          status: project.status,
        });
        counts.projects++;
        console.log(`   ✓ Project: ${project.name} [${project.status}]`);
      }
    }

    console.log('\n✅ Creating tasks...\n');

    const seededTasks: SeededTask[] = [];

    for (const project of seededProjects) {
      const tenantUsers = seededUsers.filter((u) => u.tenantId === project.tenantId);
      const memberIds = tenantUsers
        .filter((u) => u.role === 'member' || u.role === 'manager')
        .map((u) => u.id);

      const tasks = generateTasks(project.id, memberIds, 5);

      for (const taskData of tasks) {
        const task = await taskModel.create({
          ...taskData,
          tenantId: project.tenantId,
        });
        seededTasks.push({
          id: task._id.toString(),
          title: task.title,
          projectId: task.projectId,
          status: task.status,
          priority: task.priority,
          assigneeIds: task.assigneeIds,
        });
        counts.tasks++;
      }
    }

    console.log(`   ✓ Created ${counts.tasks} tasks across ${seededProjects.length} projects\n`);

    console.log('⏱️  Creating time entries...\n');

    const seededTimeEntries: SeededTimeEntry[] = [];

    for (const tenant of seededTenants) {
      const tenantUsers = seededUsers.filter((u) => u.tenantId === tenant.id);
      const tenantProjects = seededProjects.filter((p) => p.tenantId === tenant.id);
      const tenantTasks = seededTasks.filter((t) =>
        tenantProjects.some((p) => p.id === t.projectId),
      );

      for (const user of tenantUsers.filter((u) => u.role !== 'client')) {
        const userTasks = tenantTasks.filter((t) => t.assigneeIds.includes(user.id));

        if (userTasks.length > 0) {
          const randomTask = userTasks[Math.floor(Math.random() * userTasks.length)];
          const entries = generateTimeEntries(
            user.id,
            randomTask.id,
            randomTask.projectId,
            2,
          );

          for (const entryData of entries) {
            const entry = await timeEntryModel.create({
              ...entryData,
              tenantId: tenant.id,
              endTime: entryData.endTime || undefined,
            });
            seededTimeEntries.push({
              id: (entry as any)._id.toString(),
              userId: (entry as any).userId,
              taskId: (entry as any).taskId,
              projectId: (entry as any).projectId,
              isRunning: (entry as any).isRunning,
              duration: (entry as any).duration,
            });
            counts.timeEntries++;
          }
        }
      }

      const runningUser = tenantUsers.find((u) => u.role === 'member');
      if (runningUser) {
        const availableTasks = tenantTasks.filter(
          (t) => !seededTimeEntries.some((e) => e.taskId === t.id && e.isRunning),
        );

        if (availableTasks.length > 0) {
          const task = availableTasks[0];
          const runningEntries = generateTimeEntries(
            runningUser.id,
            task.id,
            task.projectId,
            2,
            true,
          );

          for (const entryData of runningEntries) {
            const entry = await timeEntryModel.create({
              ...entryData,
              tenantId: tenant.id,
              endTime: entryData.endTime || undefined,
            });
            seededTimeEntries.push({
              id: (entry as any)._id.toString(),
              userId: (entry as any).userId,
              taskId: (entry as any).taskId,
              projectId: (entry as any).projectId,
              isRunning: (entry as any).isRunning,
              duration: (entry as any).duration,
            });
            counts.timeEntries++;
          }

          console.log(`   ▶ Running timer for ${runningUser.email}`);
        }
      }
    }

    console.log('\n💰 Creating invoices...\n');

    const seededInvoices: SeededInvoice[] = [];

    for (const tenant of seededTenants) {
      const tenantProjects = seededProjects.filter((p) => p.tenantId === tenant.id);
      const clients = seededUsers.filter((u) => u.tenantId === tenant.id && u.role === 'client');

      for (const project of tenantProjects.slice(0, 2)) {
        if (clients.length > 0) {
          const client = clients[0];
          const invoices = generateInvoices(project.id, client.id, 2);

          for (const invoiceData of invoices) {
            const invoice = await invoiceModel.create({
              ...invoiceData,
              tenantId: tenant.id,
              invoiceNumber: `INV-${new Date().getFullYear()}-${String(
                counts.invoices + 1,
              ).padStart(5, '0')}`,
              total: invoiceData.amount + invoiceData.tax,
            });
            seededInvoices.push({
              id: invoice._id.toString(),
              projectId: invoice.projectId,
              clientId: invoice.clientId,
              status: invoice.status,
              amount: invoice.amount,
            });
            counts.invoices++;
            console.log(
              `   ✓ Invoice: ${invoice.invoiceNumber} | ${invoice.status} | $${invoice.total}`,
            );
          }
        }
      }
    }

    console.log('\n📚 Creating FAQ entries...\n');

    const faqs = generateFaqs();
    for (const faqData of faqs) {
      await faqModel.create(faqData);
      counts.faqs++;
      console.log(`   ✓ FAQ: ${faqData.title} (${faqData.items.length} questions)`);
    }

    logSummary(counts);

    console.log('🔐 Default password for all users: Password123!\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
