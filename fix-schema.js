const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Inge.Pro%241%2C455.00@ingepro.c324iiw8m4j3.us-east-2.rds.amazonaws.com:5432/postgres"
    }
  }
})

async function fixSchema() {
  try {
    console.log('Connecting to database...')
    
    // Add missing columns to User table
    console.log('Adding password column to User table...')
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT`
    
    console.log('Adding status column to User table...')
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE'`
    
    console.log('Adding role column to User table...')
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'WORKER'`
    
    console.log('Adding companyId column to User table...')
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyId" TEXT`
    
    // Add missing columns to Company table
    console.log('Adding slug column to Company table...')
    await prisma.$executeRaw`ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "slug" TEXT UNIQUE`
    
    console.log('Adding nameEs column to Company table...')
    await prisma.$executeRaw`ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "nameEs" TEXT`
    
    // Add missing columns to UserTenant table
    console.log('Adding role column to UserTenant table...')
    await prisma.$executeRaw`ALTER TABLE "UserTenant" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'WORKER'`
    
    console.log('Adding status column to UserTenant table...')
    await prisma.$executeRaw`ALTER TABLE "UserTenant" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE'`
    
    console.log('Schema fixed successfully!')
    
  } catch (error) {
    console.error('Error fixing schema:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixSchema() 