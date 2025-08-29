// Script to create test worklogs for debugging
// Run with: node scripts/create-test-worklogs.js

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestWorklogs() {
  try {
    console.log('🔍 Checking existing data...');
    
    // Get all people
    const people = await prisma.people.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('👥 People in system:', people);
    
    // Get all projects
    const projects = await prisma.projects.findMany({
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('📋 Projects in system:', projects);
    
    // Get all project assignments
    const assignments = await prisma.personProjects.findMany({
      where: { status: 'ACTIVE' },
      include: {
        person: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('🔗 Project assignments:', assignments);
    
    // Get existing worklogs
    const existingWorklogs = await prisma.workLogs.findMany({
      include: {
        person: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('⏰ Existing worklogs:', existingWorklogs.length);
    existingWorklogs.forEach(wl => {
      console.log(`  - ${wl.person.name} (${wl.person.role}) worked on ${wl.project?.name || 'No project'} from ${wl.clockIn.toISOString()} to ${wl.clockOut?.toISOString() || 'Still active'}`);
    });
    
    // Create test worklogs if none exist
    if (existingWorklogs.length === 0) {
      console.log('📝 Creating test worklogs...');
      
      const workers = people.filter(p => p.role === 'WORKER');
      const supervisors = people.filter(p => p.role === 'SUPERVISOR');
      
      if (workers.length > 0 && projects.length > 0) {
        // Create a worklog for the first worker
        const worker = workers[0];
        const project = projects[0];
        
        const worklog = await prisma.workLogs.create({
          data: {
            personId: worker.id,
            projectId: project.id,
            clockIn: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
            clockOut: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            notes: 'Test worklog entry',
            notesEs: 'Entrada de prueba',
            approved: false
          }
        });
        
        console.log('✅ Created test worklog:', worklog.id);
      }
    }
    
    // Test supervisor access logic
    if (supervisors.length > 0) {
      const supervisor = supervisors[0];
      console.log(`\n🔍 Testing supervisor access for: ${supervisor.name}`);
      
      // Get supervisor's projects
      const supervisorProjects = await prisma.personProjects.findMany({
        where: {
          personId: supervisor.id,
          status: 'ACTIVE'
        },
        select: { projectId: true }
      });
      
      console.log('📋 Supervisor projects:', supervisorProjects);
      
      if (supervisorProjects.length > 0) {
        const projectIds = supervisorProjects.map(sp => sp.projectId);
        
        // Get workers in same projects
        const workerAssignments = await prisma.personProjects.findMany({
          where: {
            projectId: { in: projectIds },
            status: 'ACTIVE'
          },
          include: {
            person: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          }
        });
        
        const workerIds = workerAssignments
          .filter(wa => wa.person.role === 'WORKER')
          .map(wa => wa.personId);
        
        workerIds.push(supervisor.id);
        
        console.log('👷 Workers supervisor can see:', workerIds);
        
        // Get worklogs for these workers
        const accessibleWorklogs = await prisma.workLogs.findMany({
          where: {
            personId: { in: workerIds }
          },
          include: {
            person: {
              select: {
                id: true,
                name: true,
                role: true
              }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        console.log('⏰ Worklogs supervisor should see:', accessibleWorklogs.length);
        accessibleWorklogs.forEach(wl => {
          console.log(`  - ${wl.person.name} (${wl.person.role}) worked on ${wl.project?.name || 'No project'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestWorklogs();
