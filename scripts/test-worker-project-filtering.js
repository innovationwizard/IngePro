#!/usr/bin/env node

/**
 * Test script to verify worker project filtering
 * This script will help debug the project visibility for workers
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testWorkerProjectFiltering() {
  try {
    console.log('🔍 Testing Worker Project Filtering...\n')

    // 1. Find all workers
    const workers = await prisma.people.findMany({
      where: {
        role: 'WORKER',
        status: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    console.log(`📋 Found ${workers.length} workers:`)
    workers.forEach(worker => {
      console.log(`  - ${worker.name} (${worker.email}) - ID: ${worker.id}`)
    })

    if (workers.length === 0) {
      console.log('❌ No workers found. Please create some workers first.')
      return
    }

    // 2. For each worker, check their project assignments
    for (const worker of workers) {
      console.log(`\n👷 Checking assignments for ${worker.name}:`)
      
      const assignments = await prisma.personProjects.findMany({
        where: {
          personId: worker.id,
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

      console.log(`  📊 Active project assignments: ${assignments.length}`)
      assignments.forEach(assignment => {
        console.log(`    - ${assignment.project.name} (Company: ${assignment.project.company.name})`)
      })

      // 3. Check what projects they would see with the new filtering logic
      const assignedProjectIds = assignments.map(a => a.projectId)
      
      if (assignedProjectIds.length > 0) {
        const visibleProjects = await prisma.projects.findMany({
          where: {
            id: { in: assignedProjectIds }
          },
          include: {
            company: true,
            people: {
              where: {
                status: 'ACTIVE'
              },
              include: {
                person: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        })

        console.log(`  👀 Projects visible to this worker: ${visibleProjects.length}`)
        visibleProjects.forEach(project => {
          console.log(`    - ${project.name} (Company: ${project.company.name})`)
        })
      } else {
        console.log(`  👀 Projects visible to this worker: 0 (no assignments)`)
      }
    }

    // 4. Check all projects in the system for comparison
    console.log(`\n🌍 All projects in the system:`)
    const allProjects = await prisma.projects.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        company: true,
        people: {
          where: {
            status: 'ACTIVE'
          },
          include: {
            person: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    console.log(`📊 Total active projects: ${allProjects.length}`)
    allProjects.forEach(project => {
      const assignedPeople = project.people.length
      console.log(`  - ${project.name} (Company: ${project.company.name}) - ${assignedPeople} assigned people`)
    })

    console.log('\n✅ Test completed successfully!')
    console.log('\n💡 Key points:')
    console.log('  - Workers should only see projects they are assigned to')
    console.log('  - If a worker has no assignments, they should see 0 projects')
    console.log('  - The filtering is based on PersonProjects.status = "ACTIVE"')

  } catch (error) {
    console.error('❌ Error during test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testWorkerProjectFiltering()
