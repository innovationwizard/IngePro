#!/usr/bin/env node

/**
 * Script to assign a worker to a project and create a test worklog
 * This will help test the worker project visibility fix
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function assignWorkerToProject() {
  try {
    console.log('🔧 Setting up worker project assignment...\n')

    const workerId = 'cmex1529d0003l104pn24ys0l' // The worker from your debug output

    // 1. Check if worker exists
    const worker = await prisma.people.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true
      }
    })

    if (!worker) {
      console.log('❌ Worker not found with ID:', workerId)
      return
    }

    console.log('👷 Found worker:', worker.name, `(${worker.email})`)

    // 2. Check existing project assignments
    const existingAssignments = await prisma.personProjects.findMany({
      where: {
        personId: workerId,
        status: 'ACTIVE'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    console.log(`📋 Current project assignments: ${existingAssignments.length}`)
    existingAssignments.forEach(assignment => {
      console.log(`  - ${assignment.project.name} (${assignment.project.company.name})`)
    })

    // 3. Find available projects
    const availableProjects = await prisma.projects.findMany({
      where: {
        status: 'ACTIVE',
        companyId: worker.companyId // Only projects from worker's company
      },
      include: {
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    })

    console.log(`\n🏗️ Available projects in company: ${availableProjects.length}`)
    availableProjects.forEach(project => {
      console.log(`  - ${project.name} (ID: ${project.id})`)
    })

    if (availableProjects.length === 0) {
      console.log('❌ No projects available in worker\'s company')
      return
    }

    // 4. Assign worker to first available project if not already assigned
    const projectToAssign = availableProjects[0]
    const alreadyAssigned = existingAssignments.some(a => a.projectId === projectToAssign.id)

    if (!alreadyAssigned) {
      console.log(`\n➕ Assigning worker to project: ${projectToAssign.name}`)
      
      const assignment = await prisma.personProjects.create({
        data: {
          personId: workerId,
          projectId: projectToAssign.id,
          status: 'ACTIVE',
          startDate: new Date()
        }
      })

      console.log('✅ Assignment created:', assignment.id)
    } else {
      console.log(`\n✅ Worker already assigned to: ${projectToAssign.name}`)
    }

    // 5. Create a test worklog for the worker
    console.log(`\n📝 Creating test worklog for worker...`)
    
    const testWorklog = await prisma.workLogs.create({
      data: {
        personId: workerId,
        projectId: projectToAssign.id,
        clockIn: new Date(),
        description: 'Test worklog entry'
      }
    })

    console.log('✅ Test worklog created:', testWorklog.id)

    // 6. Verify the setup
    console.log(`\n🔍 Verification:`)
    
    const finalAssignments = await prisma.personProjects.findMany({
      where: {
        personId: workerId,
        status: 'ACTIVE'
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const finalWorklogs = await prisma.workLogs.findMany({
      where: {
        personId: workerId
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    console.log(`  - Active project assignments: ${finalAssignments.length}`)
    console.log(`  - Total worklogs: ${finalWorklogs.length}`)

    console.log('\n✅ Setup complete! The worker should now:')
    console.log('  1. See the assigned project in the project selector')
    console.log('  2. Be able to create worklogs for that project')
    console.log('  3. Have at least one existing worklog entry')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

assignWorkerToProject()
