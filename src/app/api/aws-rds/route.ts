import { awsCredentialsProvider } from '@vercel/functions/oidc';
import { Signer } from '@aws-sdk/rds-signer';
import { Client } from 'pg';
 
const RDS_PORT = parseInt(process.env.RDS_PORT!);
const RDS_HOSTNAME = process.env.RDS_HOSTNAME!;
const RDS_DATABASE = process.env.RDS_DATABASE!;
const RDS_USERNAME = process.env.RDS_USERNAME!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ROLE_ARN = process.env.AWS_ROLE_ARN!;
 
// Initialize the RDS Signer
const signer = new Signer({
  // Use the Vercel AWS SDK credentials provider
  credentials: awsCredentialsProvider({
    roleArn: AWS_ROLE_ARN,
  }),
  region: AWS_REGION,
  port: RDS_PORT,
  hostname: RDS_HOSTNAME,
  username: RDS_USERNAME,
});
 
// Export the route handler
export async function GET() {
  const client = new Client({
    password: signer.getAuthToken,
    user: RDS_USERNAME,
    host: RDS_HOSTNAME,
    database: RDS_DATABASE,
    port: RDS_PORT,
  });

  try {
    await client.connect();
    const { rows } = await client.query('SELECT * FROM my_table');
    return Response.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return Response.json({ error: 'Database connection failed' }, { status: 500 });
  } finally {
    await client.end();
  }
}

// Prevent static generation
export const dynamic = 'force-dynamic';