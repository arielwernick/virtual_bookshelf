// Test script for database connection
import 'dotenv/config';
import { testConnection } from './client';

async function main() {
  console.log('Testing database connection...');
  const isConnected = await testConnection();
  
  if (isConnected) {
    console.log('✅ Database connection successful!');
    process.exit(0);
  } else {
    console.error('❌ Database connection failed!');
    process.exit(1);
  }
}

main();
