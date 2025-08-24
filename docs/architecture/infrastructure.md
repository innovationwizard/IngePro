# Infrastructure & Deployment

## Environment Configuration
```bash
# Required environment variables
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.com"
REDIS_URL="redis://..."
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"
```

## Database Setup
```bash
# Prisma commands
npx prisma generate          # Generate Prisma client
npx prisma db push          # Push schema to database
npx prisma migrate dev      # Create and apply migrations
npx prisma studio           # Open database GUI
```

## Deployment Commands
```bash
# Build and deploy
npm run build               # Build production version
npm run start               # Start production server
vercel --prod               # Deploy to Vercel production
```

## Monitoring & Health Checks
```typescript
// Health check endpoints
GET /api/health             // Basic health status
GET /api/system-health      // Detailed system health
GET /api/aws-rds           // Database connection status
GET /api/aws-s3            // S3 connection status
```
