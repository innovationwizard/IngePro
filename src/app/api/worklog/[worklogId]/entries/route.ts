import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/prisma'

export const runtime = 'nodejs'

// POST - Add a new worklog entry
export async function POST(
  request: NextRequest,
  { params }: { params: { worklogId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { worklogId } = params
    const body = await request.json()
    
    const prisma = await getPrisma()

    // Verify the worklog exists and belongs to the user
    const worklog = await prisma.workLogs.findUnique({
      where: { id: worklogId },
      include: {
        person: true,
        project: true
      }
    })

    if (!worklog) {
      return NextResponse.json({ error: 'Worklog not found' }, { status: 404 })
    }

    // Only the worklog owner can add entries
    if (worklog.personId !== session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the worklog is still active (not clocked out)
    if (worklog.clockOut) {
      return NextResponse.json({ 
        error: 'Cannot add entries to a completed worklog. Please clock in again.' 
      }, { status: 400 })
    }

    // Validate required fields
    if (!body.description || body.description.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Description is required' 
      }, { status: 400 })
    }

    // Create the worklog entry
    const entry = await prisma.worklogEntries.create({
      data: {
        worklogId: worklogId,
        taskId: body.taskId || null,
        description: body.description.trim(),
        timeSpent: body.timeSpent || 0,
        notes: body.notes || '',
        locationLatitude: body.location?.latitude || null,
        locationLongitude: body.location?.longitude || null,
        locationAccuracy: body.location?.accuracy || null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // Add materials used if any
    if (body.materialsUsed && body.materialsUsed.length > 0) {
      const materialEntries = body.materialsUsed.map((material: any) => ({
        entryId: entry.id,
        materialId: material.materialId,
        quantity: material.quantity,
        unit: material.unit,
        createdAt: new Date()
      }))

      await prisma.worklogMaterialUsage.createMany({
        data: materialEntries
      })

      // Update material stock
      for (const material of body.materialsUsed) {
        await prisma.materials.update({
          where: { id: material.materialId },
          data: {
            currentStock: {
              decrement: material.quantity
            }
          }
        })
      }
    }

    // Add photos if any
    if (body.photos && body.photos.length > 0) {
      const photoEntries = body.photos.map((photo: any) => ({
        entryId: entry.id,
        url: photo.url,
        caption: photo.caption || '',
        timestamp: new Date(photo.timestamp),
        createdAt: new Date()
      }))

      await prisma.worklogPhotos.createMany({
        data: photoEntries
      })
    }

    // If a task is associated, update task progress
    if (body.taskId) {
      // Check if there's an existing task progress update
      const existingProgress = await prisma.taskProgressUpdates.findFirst({
        where: {
          taskId: body.taskId,
          projectId: worklog.projectId,
          workerId: session.user.id,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)) // Today
          }
        }
      })

      if (existingProgress) {
        // Update existing progress
        await prisma.taskProgressUpdates.update({
          where: { id: existingProgress.id },
          data: {
            amountCompleted: existingProgress.amountCompleted + (body.timeSpent || 0),
            updatedAt: new Date()
          }
        })
      } else {
        // Create new progress update
        await prisma.taskProgressUpdates.create({
          data: {
            taskId: body.taskId,
            projectId: worklog.projectId,
            workerId: session.user.id,
            amountCompleted: body.timeSpent || 0,
            status: 'IN_PROGRESS',
            validationStatus: 'PENDING',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
      }
    }

    // Update the main worklog with new information
    await prisma.workLogs.update({
      where: { id: worklogId },
      data: {
        notes: worklog.notes 
          ? `${worklog.notes}\n\n--- ${new Date().toLocaleString()} ---\n${body.description}`
          : body.description,
        notesEs: worklog.notesEs 
          ? `${worklog.notesEs}\n\n--- ${new Date().toLocaleString()} ---\n${body.description}`
          : body.description,
        updatedAt: new Date()
      }
    })

    // Return the created entry with all related data
    const createdEntry = await prisma.worklogEntries.findUnique({
      where: { id: entry.id },
      include: {
        task: true,
        materialUsage: {
          include: {
            material: true
          }
        },
        photos: true
      }
    })

    return NextResponse.json({
      success: true,
      entry: createdEntry,
      message: 'Worklog entry created successfully'
    })

  } catch (error) {
    console.error('Error creating worklog entry:', error)
    return NextResponse.json(
      { error: 'Failed to create worklog entry' },
      { status: 500 }
    )
  }
}

// GET - Get all entries for a worklog
export async function GET(
  request: NextRequest,
  { params }: { params: { worklogId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { worklogId } = params
    const prisma = await getPrisma()

    // Verify the worklog exists and user has access
    const worklog = await prisma.workLogs.findUnique({
      where: { id: worklogId },
      include: {
        person: true,
        project: true
      }
    })

    if (!worklog) {
      return NextResponse.json({ error: 'Worklog not found' }, { status: 404 })
    }

    // Check access permissions
    if (session.user?.role === 'WORKER' && worklog.personId !== session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user?.role === 'SUPERVISOR') {
      // Supervisor can see entries from workers they supervise on the same projects
      const supervisorProjects = await prisma.personProjects.findMany({
        where: {
          personId: session.user?.id,
          status: 'ACTIVE'
        },
        select: { projectId: true }
      })

      const projectIds = supervisorProjects.map(sp => sp.projectId)
      if (!projectIds.includes(worklog.projectId!)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    if (session.user?.role === 'ADMIN') {
      // Admin can see entries from their companies
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user?.id,
          companyId: worklog.project?.companyId,
          status: 'ACTIVE'
        }
      })

      if (!personTenant) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Get all entries for this worklog
    const entries = await prisma.worklogEntries.findMany({
      where: { worklogId },
      include: {
        task: true,
        materialUsage: {
          include: {
            material: true
          }
        },
        photos: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      entries,
      count: entries.length
    })

  } catch (error) {
    console.error('Error fetching worklog entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch worklog entries' },
      { status: 500 }
    )
  }
}
