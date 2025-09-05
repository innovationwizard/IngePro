# Infrastructure & Deployment

## Environment Configuration
```bash
# Required environment variables
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="https://your-domain.com"

# AWS RDS Configuration
RDS_HOSTNAME="your-proxy-cluster.proxy-xxxxx.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DATABASE="ingepro"
RDS_USERNAME="your-db-user"
AWS_REGION="us-east-1"
AWS_ROLE_ARN="arn:aws:iam::account:role/your-rds-role"

# Noble IP Proxy Configuration
NOBLE_PROXY_TOKEN="your-noble-proxy-token"
```

## Database Connection Architecture

The application uses a hybrid connection approach combining:
- **Noble IP Proxy Service** - For connection routing and IP management
- **AWS RDS IAM Authentication** - For secure, token-based database access
- **TLS/SNI Verification** - Proper certificate validation against RDS Proxy hostname

### Connection Flow
1. **Lease Acquisition** - Request connection lease from Noble IP proxy service
2. **IAM Token Generation** - Generate AWS RDS IAM token for the real RDS Proxy hostname
3. **Proxy Connection** - Connect through Noble IP proxy using lease hostname/port
4. **TLS Verification** - Verify SSL certificate against RDS Proxy hostname (not proxy)

### Key Files
- `src/lib/getDbConfig.ts` - Main database configuration with Noble IP integration
- `src/lib/prisma.ts` - Prisma client configuration
- `src/app/api/test_endpoint/route.ts` - Database connectivity test endpoint

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
GET /api/test_endpoint     // Noble IP proxy + RDS IAM connectivity test
```

## Security Considerations

### Database Security
- **IAM Authentication** - No hardcoded passwords, uses AWS IAM tokens
- **TLS Encryption** - All connections encrypted in transit
- **SNI Verification** - Proper certificate validation prevents MITM attacks
- **Proxy Isolation** - Noble IP proxy provides additional network isolation

### Environment Variables
- Store sensitive values in Vercel environment variables
- Use AWS IAM roles with minimal required permissions
- Rotate Noble IP proxy tokens regularly
- Monitor connection logs for suspicious activity
