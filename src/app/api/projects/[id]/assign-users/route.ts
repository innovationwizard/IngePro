import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

const assignUsersSchema = z.object({
  userIds: z.array(z.string()),
  role: z.enum(['WORKER', 'SUPERVISOR'])
});

export async function POST(
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
    const { userIds, role } = assignUsersSchema.parse(body);

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
      // Supervisors can only assign workers to projects they're assigned to
      const userProject = await prisma.userProject.findFirst({
        where: {
          userId: session.user.id,
          projectId: projectId,
          role: 'SUPERVISOR',
          status: 'ACTIVE'
        }
      });
      hasAccess = !!userProject && role === 'WORKER';
    }

    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Create UserProject entries for each user
    const userProjects = await Promise.all(
      userIds.map(async (userId) => {
        // Check if user already has access to the project's company
        const userTenant = await prisma.userTenant.findFirst({
          where: {
            userId: userId,
            companyId: project.companyId,
            status: 'ACTIVE'
          }
        });

        if (!userTenant) {
          throw new Error(`User ${userId} does not have access to company ${project.companyId}`);
        }

        // Check if user is already assigned to this project
        const existingAssignment = await prisma.userProject.findFirst({
          where: {
            userId: userId,
            projectId: projectId,
            status: 'ACTIVE'
          }
        });

        if (existingAssignment) {
          // Update existing assignment
          return await prisma.userProject.update({
            where: { id: existingAssignment.id },
            data: { role, startDate: new Date() }
          });
        } else {
          // Create new assignment
          return await prisma.userProject.create({
            data: {
              userId: userId,
              projectId: projectId,
              role: role,
              startDate: new Date(),
              status: 'ACTIVE'
            }
          });
        }
      })
    );

    return NextResponse.json({
      message: 'Users assigned successfully',
      userProjects
    });

  } catch (error) {
    console.error('Error assigning users to project:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
