# Codebase State Backup - Before Connectivity Changes
**Date:** 2025-01-27  
**Purpose:** Restore point before attempting connectivity changes

## Git Status
- **Branch:** main (up to date with origin/main)
- **Uncommitted changes:**
  - `package-lock.json` (modified)
  - `package.json` (modified)

## Key Database Connection Files

### src/lib/getDbUrl.ts
```typescript
// Current implementation uses RDS_DATABASE environment variable
const RDS_DATABASE = process.env.RDS_DATABASE!; // Line 12
// Used in connection string construction on line 29
`@${RDS_HOSTNAME}:${RDS_PORT}/${RDS_DATABASE}?sslmode=require`;
```

**Environment Variables Used:**
- `RDS_PORT`
- `RDS_HOSTNAME` 
- `RDS_DATABASE`
- `RDS_USERNAME`
- `AWS_REGION`
- `AWS_ROLE_ARN`

**Authentication Method:**
- AWS RDS IAM authentication using `@aws-sdk/rds-signer`
- Token-based authentication with `awsCredentialsProvider`

## Project Architecture
- **Framework:** Next.js with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Deployment:** Vercel (based on vercel.json)
- **Features:** PWA, Multi-tenant, Task management, Material management

## Database Schema
- Uses Prisma migrations in `prisma/migrations/`
- Material model has soft deletes (deletedAt field)
- Task model has soft deletes
- Work log system implemented

## Key Dependencies
- Modified `package.json` and `package-lock.json` (uncommitted)

## Restore Instructions
If connectivity changes fail:
1. `git checkout -- package.json package-lock.json` (restore uncommitted changes)
2. Verify `src/lib/getDbUrl.ts` is unchanged
3. Check all environment variables are properly set
4. Test database connectivity

## Files to Monitor
- `src/lib/getDbUrl.ts` - Main database connection logic
- `src/lib/prisma.ts` - Prisma client configuration
- `middleware.ts` - Application middleware
- Environment variables in deployment platform
