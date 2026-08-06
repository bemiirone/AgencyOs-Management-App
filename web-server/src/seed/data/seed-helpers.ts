import { Connection } from 'mongoose';

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

export async function clearDatabase(connection: Connection): Promise<void> {
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
