// prisma/seed.ts
// Fix the missing slug field and other required fields

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create demo company with all required fields
  const demoCompany = await prisma.companies.upsert({
    where: { id: 'demo-company' },
    update: {},
    create: {
      id: 'demo-company',
      name: 'Demo Construction Company',
      nameEs: 'Empresa de Construcción Demo',
      slug: 'demo-company', // Add required slug field
      status: 'ACTIVE', // Add required status field
    },
  });

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create demo users with all required fields
  const demoUsers = [
    {
      id: 'demo-worker',
      email: 'worker@demo.com',
      name: 'Juan Pérez',
      password: hashedPassword,
      role: 'WORKER' as const,
      status: 'ACTIVE' as const,
      companyId: demoCompany.id,
    },
    {
      id: 'demo-supervisor',
      email: 'supervisor@demo.com',
      name: 'María González',
      password: hashedPassword,
      role: 'SUPERVISOR' as const,
      status: 'ACTIVE' as const,
      companyId: demoCompany.id,
    },
    {
      id: 'demo-admin',
      email: 'admin@demo.com',
      name: 'Carlos Rodríguez',
      password: hashedPassword,
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      companyId: demoCompany.id,
    },
    {
      id: 'demo-superuser',
      email: 'superuser@demo.com',
      name: 'Ana Superuser',
      password: hashedPassword,
      role: 'SUPERUSER' as const,
      status: 'ACTIVE' as const,
      companyId: demoCompany.id,
    },
  ];

  for (const userData of demoUsers) {
    await prisma.people.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    });
  }

  // Create demo projects
  const demoProjects = [
    {
      id: 'demo-project-1',
      name: 'Downtown Office Complex',
      nameEs: 'Complejo de Oficinas Centro',
      description: 'Modern office building construction',
      descriptionEs: 'Construcción de edificio de oficinas moderno',
      status: 'ACTIVE' as const,
      companyId: demoCompany.id,
    },
    {
      id: 'demo-project-2',
      name: 'Residential Tower A',
      nameEs: 'Torre Residencial A',
      description: 'High-rise residential construction',
      descriptionEs: 'Construcción de torre residencial',
      status: 'ACTIVE' as const,
      companyId: demoCompany.id,
    },
  ];

  for (const projectData of demoProjects) {
    await prisma.projects.upsert({
      where: { id: projectData.id },
      update: {},
      create: projectData,
    });
  }

  console.log('✅ Seed data created successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });