import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

const unassignUserSchema = z.object({
  personId: z.string()
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    const projectId = params.id;
    const body = await request.json();
    const { personId } = unassignUserSchema.parse(body);

    // Get the project to check company access
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      include: { company: true }
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Check if person has access to this project's company
    let hasAccess = false;
    
    if (session.user.role === 'SUPERUSER') {
      hasAccess = true;
    } else if (session.user.role === 'ADMIN') {
      const personTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user.id,
          companyId: project.companyId,
          status: 'ACTIVE'
        }
      });
      hasAccess = !!personTenant;
    } else if (session.user.role === 'SUPERVISOR') {
      // Supervisors can only unassign workers from projects they're assigned to
      const personProject = await prisma.personProjects.findFirst({
        where: {
          personId: session.user.id,
          projectId: projectId,
          status: 'ACTIVE'
        }
      });
      
      if (personProject) {
        // Check if the person being unassigned is a worker
        const targetPerson = await prisma.people.findUnique({
          where: { id: personId },
          select: { role: true }
        });
        hasAccess = targetPerson?.role === 'WORKER';
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Find and deactivate the PersonProjects assignment
    const personProject = await prisma.personProjects.findFirst({
      where: {
        personId: personId,
        projectId: projectId,
        status: 'ACTIVE'
      }
    });

    if (!personProject) {
      return NextResponse.json({ message: 'Person not assigned to this project' }, { status: 404 });
    }

    // Deactivate the assignment
    await prisma.personProjects.update({
      where: { id: personProject.id },
      data: {
        status: 'INACTIVE',
        endDate: new Date()
      }
    });

    return NextResponse.json({
      message: 'Person unassigned successfully'
    });

  } catch (error) {
    console.error('Error unassigning user from project:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
