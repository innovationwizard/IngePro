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
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });
      hasAccess = !!personTenant;
    } else if (session.user.role === 'SUPERVISOR') {
      // Supervisors can only assign workers to projects they're assigned to
      const personProject = await prisma.personProjects.findFirst({
        where: {
          personId: session.user.id,
          projectId: projectId,
          role: 'SUPERVISOR',
          status: 'ACTIVE'
        }
      });
      hasAccess = !!personProject && role === 'WORKER';
    }

    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Create PersonProjects entries for each person
    const personProjects = await Promise.all(
      userIds.map(async (userId) => {
        // Check if person already has access to the project's company
        const personTenant = await prisma.personTenants.findFirst({
          where: {
            personId: userId,
            companyId: project.companyId,
            status: 'ACTIVE'
          }
        });

        if (!personTenant) {
          throw new Error(`Person ${userId} does not have access to company ${project.companyId}`);
        }

        // Check if person is already assigned to this project
        const existingAssignment = await prisma.personProjects.findFirst({
          where: {
            personId: userId,
            projectId: projectId,
            status: 'ACTIVE'
          }
        });

        if (existingAssignment) {
          // Update existing assignment
          return await prisma.personProjects.update({
            where: { id: existingAssignment.id },
            data: { role, startDate: new Date() }
          });
        } else {
          // Create new assignment
          return await prisma.personProjects.create({
            data: {
              personId: userId,
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
      message: 'People assigned successfully',
      personProjects
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
