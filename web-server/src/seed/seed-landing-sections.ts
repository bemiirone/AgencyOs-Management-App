import * as dotenv from 'dotenv';
import * as path from 'path';
import { MongoClient } from 'mongodb';
import { generateLandingSections } from './data/landing-section-seed-data';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function seedLandingSections(): Promise<void> {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/agencyos';

  console.log('🌱 Seeding landing section data (safe mode - no existing data will be deleted)...\n');

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const collection = db.collection('landing-sections');

    let inserted = 0;
    let skipped = 0;
    let updated = 0;

    console.log('📦 Inserting/updating landing section entries...\n');

    const sections = generateLandingSections();

    for (const entry of sections) {
      const existing = await collection.findOne({
        section: entry.section,
        order: entry.order,
      });

      if (existing) {
        const needsUpdate =
          existing.isActive !== entry.isActive ||
          existing.icon !== entry.icon ||
          existing.title !== entry.title ||
          existing.description !== entry.description ||
          existing.name !== entry.name ||
          existing.role !== entry.role ||
          existing.rating !== entry.rating ||
          existing.question !== entry.question ||
          existing.answer !== entry.answer;

        if (needsUpdate) {
          await collection.updateOne(
            { _id: existing._id },
            { $set: { ...entry, updatedAt: new Date() } },
          );
          updated++;
          console.log(`   ↻ Updated: ${entry.section}[${entry.order}] - ${entry.title || entry.question}`);
        } else {
          skipped++;
        }
      } else {
        await collection.insertOne({
          ...entry,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        inserted++;
        console.log(`   ✓ Created: ${entry.section}[${entry.order}] - ${entry.title || entry.question}`);
      }
    }

    console.log('');
    console.log('✅ Landing section seeding complete');
    console.log(`   New entries: ${inserted}`);
    console.log(`   Updated entries: ${updated}`);
    console.log(`   Unchanged entries: ${skipped}`);
    console.log(`   Total processed: ${sections.length}`);
    console.log('');
    console.log('ℹ️  No existing entries were cleared or deleted.');
    console.log('');
  } catch (error) {
    console.error('❌ Failed to seed landing sections:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedLandingSections();
