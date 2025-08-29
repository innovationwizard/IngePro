import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';
import { z } from 'zod';

const assignUsersSchema = z.object({
  personIds: z.array(z.string()),
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
    console.log('Assign users request:', { projectId, body });
    const { personIds, role } = assignUsersSchema.parse(body);

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
      
      console.log('Admin access check:', {
        personTenantFound: !!personTenant,
        userCompanyId: session.user.companyId,
        projectCompanyId: project.companyId,
        companyMatch: session.user.companyId === project.companyId
      });
      
      if (personTenant) {
        hasAccess = true;
      } else {
        // Fallback: check if admin has companyId that matches the project's company
        hasAccess = session.user.companyId === project.companyId;
      }
    } else if (session.user.role === 'SUPERVISOR') {
      // Supervisors can only assign workers to projects they're assigned to
      const personProject = await prisma.personProjects.findFirst({
        where: {
          personId: session.user.id,
          projectId: projectId,
          status: 'ACTIVE'
        }
      });
      hasAccess = !!personProject && role === 'WORKER';
    }

    console.log('Access check result:', { 
      userRole: session.user.role, 
      hasAccess, 
      projectCompanyId: project.companyId,
      userCompanyId: session.user.companyId,
      personTenantFound: session.user.role === 'ADMIN' ? 'checking...' : 'N/A'
    });
    
    if (!hasAccess) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Create PersonProjects entries for each person
    const personProjects = await Promise.all(
      personIds.map(async (userId) => {
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

        // Update the person's role if needed
        await prisma.people.update({
          where: { id: userId },
          data: { role: role }
        });

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
            data: { startDate: new Date() }
          });
        } else {
          // Create new assignment
          return await prisma.personProjects.create({
            data: {
              personId: userId,
              projectId: projectId,
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
      return NextResponse.json({ 
        message: 'Invalid request data',
        details: error.errors 
      }, { status: 400 });
    }
    return NextResponse.json(
      { 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
