import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-providers';

// AWS configuration
const AWS_REGION = process.env.AWS_REGION!;

// Initialize the S3 client with IAM user credentials
const s3Client = new S3Client({
  credentials: fromEnv(), // This will use AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
  region: AWS_REGION,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    
    return Response.json({
      buckets: response.Buckets?.map(bucket => bucket.Name) || [],
      message: 'S3 buckets retrieved successfully'
    });
  } catch (error) {
    console.error('S3 error:', error);
    return Response.json({ error: 'Failed to retrieve S3 buckets' }, { status: 500 });
  }
}