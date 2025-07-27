import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a demo company
  const company = await prisma.company.upsert({
    where: { id: 'demo-company' },
    update: {},
    create: {
      id: 'demo-company',
      name: 'Demo Construction Company',
      nameEs: 'Empresa de Construcción Demo',
    },
  })

  // Create demo users
  const worker = await prisma.user.upsert({
    where: { email: 'worker@demo.com' },
    update: {},
    create: {
      email: 'worker@demo.com',
      name: 'Juan Pérez',
      role: 'WORKER',
      companyId: company.id,
    },
  })

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@demo.com' },
    update: {},
    create: {
      email: 'supervisor@demo.com',
      name: 'María González',
      role: 'SUPERVISOR',
      companyId: company.id,
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      name: 'Carlos Rodríguez',
      role: 'ADMIN',
      companyId: company.id,
    },
  })

  // Create demo projects
  const project1 = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Downtown Office Complex',
      nameEs: 'Complejo de Oficinas Centro',
      description: 'Main building construction',
      descriptionEs: 'Construcción del edificio principal',
      companyId: company.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'demo-project-2' },
    update: {},
    create: {
      id: 'demo-project-2',
      name: 'Residential Tower A',
      nameEs: 'Torre Residencial A',
      description: 'Apartment complex phase 1',
      descriptionEs: 'Complejo de apartamentos fase 1',
      companyId: company.id,
    },
  })

  console.log('Demo data created successfully!')
  console.log('Users:')
  console.log('- Worker:', worker.email, '(password123)')
  console.log('- Supervisor:', supervisor.email, '(password123)')
  console.log('- Admin:', admin.email, '(password123)')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
