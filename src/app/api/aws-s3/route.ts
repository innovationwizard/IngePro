import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { awsCredentialsProvider } from '@vercel/functions/oidc';

// AWS configuration
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;

// Initialize the S3 client with OIDC credentials
const s3Client = new S3Client({
  region: AWS_REGION,
  // Use the Vercel AWS SDK credentials provider for OIDC
  credentials: awsCredentialsProvider({
    roleArn: AWS_ROLE_ARN,
  }),
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