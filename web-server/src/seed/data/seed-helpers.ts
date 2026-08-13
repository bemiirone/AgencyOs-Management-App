import { Connection } from 'mongoose';
import * as readline from 'readline';

const COLLECTIONS = [
  'users',
  'tenants',
  'projects',
  'tasks',
  'timeentries',
  'invoices',
  'notifications',
  'faqs',
];

export async function clearDatabase(connection: Connection, force = false): Promise<void> {
  if (!force) {
    const confirmed = await promptConfirm(
      '⚠️  This will DELETE ALL existing data. Are you sure? (yes/no): ',
    );
    if (confirmed !== 'yes') {
      console.log('❌ Database clear cancelled. Use --fresh flag to skip this prompt.\n');
      process.exit(0);
    }
  }

  console.log('🧹 Clearing existing data...');

  for (const collection of COLLECTIONS) {
    try {
      await connection.collection(collection).deleteMany({});
      console.log(`   ✓ Cleared ${collection}`);
    } catch (error) {
      console.log(`   - ${collection} does not exist yet, skipping`);
    }
  }

  console.log('✅ Database cleared\n');
}

function promptConfirm(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export function logSummary(data: Record<string, number>): void {
  console.log('\n📊 Seed Summary:');
  console.log('─'.repeat(40));
  for (const [key, count] of Object.entries(data)) {
    console.log(`   ${key}: ${count}`);
  }
  console.log('─'.repeat(40));
  console.log('✅ Seed completed successfully!\n');
}

export function logUser(email: string, password: string, role: string, tenant: string): void {
  console.log(`   👤 ${email} | ${role} | ${tenant} | Password: ${password}`);
}
