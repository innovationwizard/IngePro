const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:Inge.Pro%241%2C455.00@ingepro.c324iiw8m4j3.us-east-2.rds.amazonaws.com:5432/postgres"
    }
  }
})

async function pushSchema() {
  try {
    console.log('Testing database connection...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Connection successful:', result)
    
    console.log('Pushing schema...')
    const { execSync } = require('child_process')
    execSync('npx prisma db push', { 
      env: { 
        ...process.env, 
        DATABASE_URL: "postgresql://postgres:Inge.Pro%241%2C455.00@ingepro.c324iiw8m4j3.us-east-2.rds.amazonaws.com:5432/postgres" 
      },
      stdio: 'inherit'
    })
    console.log('Schema pushed successfully!')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

pushSchema() 