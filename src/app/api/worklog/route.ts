import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { 
  sanitizeString, 
  sanitizeNumber, 
  sanitizeId, 
  sanitizeLimit,
  validateRequiredString,
  validateRequiredId
} from '@/lib/sanitize';
import { checkRateLimit, getRateLimitInfo } from '@/lib/rateLimit';

// Force dynamic rendering - prevents build-time database connections
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Helper function for exponential backoff retry
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const rateLimitKey = `worklog_post_${clientIp}`;
    
    if (!checkRateLimit(rateLimitKey, 5, 60000)) { // 5 requests per minute
      const rateLimitInfo = getRateLimitInfo(rateLimitKey);
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
          rateLimitInfo 
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    // Sanitize all input fields
    const userId = sanitizeId(body.userId);
    const projectId = sanitizeId(body.projectId);
    const work = sanitizeString(body.work, 200);
    const project = sanitizeString(body.project, 200);
    const thickness = sanitizeString(body.thickness, 50);
    const sector = sanitizeString(body.sector, 100);
    const level = sanitizeString(body.level, 50);
    const quantity = sanitizeNumber(body.quantity, 0, 999999);
    const unit = sanitizeString(body.unit, 20);
    const materials = sanitizeString(body.materials, 500);
    const notes = sanitizeString(body.notes, 1000);

    // Validate required fields
    try {
      validateRequiredId(userId, 'userId');
      validateRequiredId(projectId, 'projectId');
      validateRequiredString(work, 'work', 2, 200);
      validateRequiredString(project, 'project', 2, 200);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Datos inválidos' },
        { status: 400 }
      );
    }

    // Use retry logic for database operations (background operation)
    const workLog = await retryWithBackoff(async () => {
      // Validate that user exists
      const user = await prisma.user.findUnique({
        where: { id: userId! }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Validate that project exists
      const dbProject = await prisma.project.findUnique({
        where: { id: projectId! }
      });

      if (!dbProject) {
        throw new Error('Proyecto no encontrado');
      }

      // Store work document data as JSON in the notes field
      const workDocumentData = {
        work: work!,
        project: project!,
        thickness,
        sector,
        level,
        quantity,
        unit,
        materials,
        originalNotes: notes
      };

      // Create work log using existing schema
      return await prisma.workLog.create({
        data: {
          userId: userId!,
          projectId: projectId!,
          clockIn: new Date(),
          tasksCompleted: JSON.stringify([work!]), // Store work type as task
          materialsUsed: materials ? JSON.stringify([materials]) : '[]',
          photos: [],
          notes: JSON.stringify(workDocumentData), // Store all work document data as JSON
          notesEs: notes, // Store original notes in Spanish field
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    return NextResponse.json({
      id: workLog.id,
      message: 'Registro guardado exitosamente',
      data: workLog,
      workDocument: {
        work: work!,
        project: project!,
        thickness,
        sector,
        level,
        quantity,
        unit,
        materials,
        originalNotes: notes
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al guardar en base de datos', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting for GET requests
    const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
    const rateLimitKey = `worklog_get_${clientIp}`;
    
    if (!checkRateLimit(rateLimitKey, 20, 60000)) { // 20 requests per minute
      const rateLimitInfo = getRateLimitInfo(rateLimitKey);
      return NextResponse.json(
        { 
          error: 'Demasiadas solicitudes. Intente nuevamente más tarde.',
          rateLimitInfo 
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Sanitize query parameters
    const userId = sanitizeId(searchParams.get('userId'));
    const projectId = sanitizeId(searchParams.get('projectId'));
    const limit = sanitizeLimit(searchParams.get('limit'), 10, 100);

    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (projectId) {
      where.projectId = projectId;
    }

    const workLogs = await prisma.workLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            nameEs: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      workLogs,
      count: workLogs.length,
      limit
    });

  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Error al obtener registros de trabajo' },
      { status: 500 }
    );
  }
}