import { PrismaClient } from '@prisma/client'
import { Signer } from '@aws-sdk/rds-signer'

export async function getPrismaWithIam() {
  const host = process.env.DB_HOST!            // ingepro.c3...us-east-2.rds.amazonaws.com
  const port = Number(process.env.DB_PORT || 5432)
  const region = process.env.AWS_REGION!       // us-east-2
  const username = process.env.DB_USER!        // ingerobotords
  const database = process.env.DB_NAME || 'postgres'

  const signer = new Signer({ 
    region, 
    hostname: host, 
    port, 
    username 
  })
  
  const token = await signer.getAuthToken()

  const url =
    `postgresql://${username}:${encodeURIComponent(token)}@${host}:${port}/${database}` +
    `?sslmode=require` // keep SSL on for IAM

  return new PrismaClient({ datasources: { db: { url } } })
}
