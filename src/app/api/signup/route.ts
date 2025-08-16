// src/app/api/signup/route.ts

import { NextResponse } from 'next/server';
import { RDS } from '@aws-sdk/client-rds'; // Explicit import
import { Signer } from '@aws-sdk/rds-signer';
import { config } from 'dotenv';

config();

const DATABASE_URL = process.env.DATABASE_URL!;
const url = new URL(DATABASE_URL);

const RDS_HOSTNAME = url.hostname;
const RDS_PORT = parseInt(url.port || '5432', 10);
const RDS_USERNAME = url.username;
const AWS_REGION = 'us-east-2';

const rdsClient = new RDS({ region: AWS_REGION });

export async function POST(request: Request) {
  try {
    const signer = new Signer({
      hostname: RDS_HOSTNAME,
      port: RDS_PORT,
      username: RDS_USERNAME,
      region: AWS_REGION,
    });
    
    const token = await signer.getAuthToken();
    
    // Example: Use with Prisma or return for testing
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error('Signup token error:', error);
    return NextResponse.json({ error: 'Error al crear cuenta' }, { status: 500 });
  }
}