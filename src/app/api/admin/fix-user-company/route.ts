import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPERVISOR'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const prisma = await getPrisma();
    
    // Check if user has a companyId but no PersonTenants record
    if (session.user.companyId) {
      const existingPersonTenant = await prisma.personTenants.findFirst({
        where: {
          personId: session.user.id,
          companyId: session.user.companyId,
          status: 'ACTIVE'
        }
      });

      if (!existingPersonTenant) {
        // Create the missing PersonTenants record
        await prisma.personTenants.create({
          data: {
            personId: session.user.id,
            companyId: session.user.companyId,
            startDate: new Date(),
            status: 'ACTIVE'
          }
        });

        return NextResponse.json({
          message: 'PersonTenants record created successfully',
          companyId: session.user.companyId,
          userRole: session.user.role
        });
      } else {
        return NextResponse.json({
          message: 'PersonTenants record already exists',
          companyId: session.user.companyId,
          userRole: session.user.role
        });
      }
    } else {
      return NextResponse.json({
        message: 'User has no companyId',
        error: 'User needs to be associated with a company',
        userRole: session.user.role
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error fixing user company association:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
