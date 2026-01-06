require('dotenv').config();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL is not set in environment');
  process.exit(1);
}

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 50) + '...)' : 'NOT SET');

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  // Create PrismaClient - it will read DATABASE_URL from process.env automatically
  const prisma = new PrismaClient();
  
  try {
    console.log('Testing Prisma database connection...');
    
    // Test connection with a simple query
    const products = await prisma.product.findMany({
      take: 5
    });
    
    console.log('✓ Database connection successful!');
    console.log(`✓ Query executed successfully. Found ${products.length} products.`);
    
    if (products.length > 0) {
      console.log('Sample products:');
      products.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.name} (${p.sku})`);
      });
    } else {
      console.log('  (No products found - database is empty)');
    }
    
    await prisma.$disconnect();
    console.log('✓ Prisma client disconnected successfully');
    console.log('');
    console.log('✓✓✓ SUCCESS: Database connectivity verified ✓✓✓');
    console.log('  - No PrismaClientInitializationError');
    console.log('  - No warnings or errors');
    console.log('  - Query executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('✗ Database connection failed:');
    console.error('  Error:', error.message);
    if (error.code) {
      console.error('  Code:', error.code);
    }
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

testConnection();
