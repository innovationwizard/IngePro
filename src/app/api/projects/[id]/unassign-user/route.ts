import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const unassignUserSchema = z.object({
  userId: z.string()
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

    const projectId = params.id;
    const body = await request.json();
    const { userId } = unassignUserSchema.parse(body);

    // Get the project to check company access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { company: true }
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project's company
    let hasAccess = false;
    
    if (session.user.role === 'SUPERUSER') {
      hasAccess = true;
    } else if (session.user.role === 'ADMIN') {
      const userTenant = await prisma.userTenant.findFirst({
        where: {
          userId: session.user.id,
          companyId: project.companyId,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      hasAccess = !!userTenant;
    } else if (session.user.role === 'SUPERVISOR') {
      // Supervisors can only unassign workers from projects they're assigned to
      const userProject = await prisma.userProject.findFirst({
        where: {
          userId: session.user.id,
          projectId: projectId,
          role: 'SUPERVISOR',
          status: 'ACTIVE'
        }
      });
      
      if (userProject) {
        // Check if the user being unassigned is a worker
        const targetUserProject = await prisma.userProject.findFirst({
          where: {
            userId: userId,
            projectId: projectId,
            status: 'ACTIVE'
          }
        });
        hasAccess = targetUserProject?.role === 'WORKER';
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Find and deactivate the UserProject assignment
    const userProject = await prisma.userProject.findFirst({
      where: {
        userId: userId,
        projectId: projectId,
        status: 'ACTIVE'
      }
    });

    if (!userProject) {
      return NextResponse.json({ message: 'User not assigned to this project' }, { status: 404 });
    }

    // Deactivate the assignment
    await prisma.userProject.update({
      where: { id: userProject.id },
      data: {
        status: 'INACTIVE',
        endDate: new Date()
      }
    });

    return NextResponse.json({
      message: 'User unassigned successfully'
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
