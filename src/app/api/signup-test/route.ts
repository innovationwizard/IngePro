// src/app/api/signup-test/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Signup test started');
    
    const body = await request.json();
    console.log('Body parsed:', body);
    
    const { companyName, companySlug, adminName, adminEmail, adminPassword } = body;
    
    // Basic validation
    if (!companyName || !companySlug || !adminName || !adminEmail || !adminPassword) {
      console.log('Validation failed');
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }
    
    console.log('Validation passed');
    
    // Mock successful response
    return NextResponse.json({
      message: 'Prueba exitosa - datos recibidos correctamente',
      data: {
        companyName,
        companySlug,
        adminName,
        adminEmail,
        timestamp: new Date().toISOString()
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Signup test error:', error);
    return NextResponse.json({
      error: 'Error en prueba de signup',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'signup-test-healthy',
    timestamp: new Date().toISOString()
  });
}