/**
 * Database Migration Validation: Task 1.1
 * Validates that MIGRATION_003_podcast_episodes.sql was successfully applied
 * 
 * Usage: Set DATABASE_URL environment variable, then run:
 * npx tsx test/db-migration-validation.ts
 */

import { sql } from '@/lib/db/client';

async function validateMigration() {
  console.log('🔍 Validating podcast episode migration in Neon...\n');

  // Check if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL environment variable not set.');
    console.log('\nTo run this validation:');
    console.log('1. Set DATABASE_URL in your environment');
    console.log('2. Or run: DATABASE_URL="your_neon_url" npx tsx test/db-migration-validation.ts');
    console.log('\nAlternatively, run these SQL queries directly in Neon SQL Editor:');
    console.log('');
    console.log('-- Check constraint exists:');
    console.log('SELECT conname, pg_get_constraintdef(oid) as definition');
    console.log('FROM pg_constraint WHERE conrelid = \'items\'::regclass AND conname = \'items_type_check\';');
    console.log('');
    console.log('-- Should show: CHECK ((type)::text = ANY ((ARRAY[\'book\'::character varying, \'podcast\'::character varying, \'music\'::character varying, \'podcast_episode\'::character varying])::text[]))');
    console.log('');
    console.log('✅ If the constraint includes podcast_episode, Task 1.1 is complete!');
    return;
  }

  try {
    // Test 1: Check that the constraint exists with the correct definition
    console.log('1. Checking items table constraint...');
    const constraintCheck = await sql`
      SELECT conname, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'items'::regclass 
      AND conname = 'items_type_check'
    `;
    
    if (constraintCheck.length === 0) {
      throw new Error('❌ items_type_check constraint not found!');
    }

    const constraintDef = constraintCheck[0].definition as string;
    console.log('   Constraint definition:', constraintDef);
    
    // Check if podcast_episode is included
    if (!constraintDef.includes('podcast_episode')) {
      throw new Error('❌ podcast_episode not found in constraint definition!');
    }
    
    console.log('   ✅ Constraint includes podcast_episode type');

    // Test 2: Verify we can insert a podcast_episode item (dry run - we'll rollback)
    console.log('\n2. Testing podcast_episode insertion...');
    
    // Start a transaction for testing
    const testResult = await sql`
      BEGIN;
      
      -- Try to insert a test podcast episode (this should succeed)
      INSERT INTO items (
        shelf_id, 
        type, 
        title, 
        creator, 
        order_index
      ) VALUES (
        gen_random_uuid(), 
        'podcast_episode', 
        'Test Episode', 
        'Test Podcast', 
        0
      ) RETURNING id, type;
    `;

    if (testResult.length === 0) {
      throw new Error('❌ Failed to insert test podcast_episode');
    }

    console.log('   ✅ Successfully inserted test podcast_episode');
    console.log('   Test item ID:', testResult[0].id);
    console.log('   Test item type:', testResult[0].type);

    // Rollback the test insertion
    await sql`ROLLBACK`;
    console.log('   ✅ Test transaction rolled back');

    // Test 3: Verify all existing item types still work
    console.log('\n3. Checking existing item types are still valid...');
    const existingTypes = ['book', 'podcast', 'music'];
    
    for (const type of existingTypes) {
      const typeTest = await sql`
        BEGIN;
        INSERT INTO items (
          shelf_id, 
          type, 
          title, 
          creator, 
          order_index
        ) VALUES (
          gen_random_uuid(), 
          ${type}, 
          'Test Item', 
          'Test Creator', 
          0
        ) RETURNING type;
        ROLLBACK;
      `;
      
      if (typeTest.length === 0) {
        throw new Error(`❌ Failed to insert test ${type}`);
      }
      
      console.log(`   ✅ ${type} type still works`);
    }

    // Test 4: Verify invalid types are rejected
    console.log('\n4. Testing invalid type rejection...');
    try {
      await sql`
        INSERT INTO items (
          shelf_id, 
          type, 
          title, 
          creator, 
          order_index
        ) VALUES (
          gen_random_uuid(), 
          'invalid_type', 
          'Test Item', 
          'Test Creator', 
          0
        )
      `;
      throw new Error('❌ Invalid type was accepted when it should be rejected');
    } catch (error) {
      if (error instanceof Error && error.message.includes('check constraint')) {
        console.log('   ✅ Invalid type correctly rejected by constraint');
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Migration validation PASSED! All tests successful.');
    console.log('\n✅ Task 1.1 Database Schema Migration - COMPLETED');
    console.log('   - podcast_episode type added to constraint');
    console.log('   - All existing types still work');
    console.log('   - Invalid types properly rejected');
    console.log('   - Ready to proceed to Task 1.2 (TypeScript types)');

  } catch (error) {
    console.error('\n❌ Migration validation FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateMigration()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

export { validateMigration };