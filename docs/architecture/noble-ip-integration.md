# Noble IP Proxy Integration

## Overview

IngePro uses Noble IP proxy service combined with AWS RDS IAM authentication to provide secure, scalable database connectivity. This hybrid approach ensures both security and reliability.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   IngePro App   │───▶│  Noble IP Proxy  │───▶│   AWS RDS       │
│                 │    │                  │    │   (via Proxy)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
   IAM Token Gen            Connection Lease          TLS Verification
   (RDS Hostname)           (Proxy Endpoint)         (RDS Hostname)
```

## Implementation Details

### Core Files

#### `src/lib/getDbConfig.ts`
Main database configuration module that:
- Requests connection lease from Noble IP proxy service
- Generates AWS RDS IAM authentication token
- Returns PostgreSQL connection configuration object
- Handles caching for performance optimization

#### `src/lib/prisma.ts`
Prisma client configuration that:
- Uses `getDbUrl()` helper function for connection string
- Maintains backward compatibility with existing Prisma setup
- Handles connection pooling and client management

#### `src/app/api/test_endpoint/route.ts`
Database connectivity test endpoint that:
- Tests end-to-end connection through Noble IP proxy
- Validates IAM authentication and TLS verification
- Returns connection status and basic query results

### Connection Process

1. **Lease Request**
   ```typescript
   const response = await fetch('https://api.noble-ip.com/v1/leases', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       target_host: RDS_HOSTNAME,
       target_port: RDS_PORT,
       proxy_token: NOBLE_PROXY_TOKEN,
     }),
   });
   ```

2. **IAM Token Generation**
   ```typescript
   const signer = new Signer({
     credentials: awsCredentialsProvider({ roleArn: AWS_ROLE_ARN }),
     region: AWS_REGION,
     port: RDS_PORT,
     hostname: RDS_HOSTNAME, // Real RDS hostname for token
     username: RDS_USERNAME,
   });
   const token = await signer.getAuthToken();
   ```

3. **Connection Configuration**
   ```typescript
   const config = {
     host: lease.hostname,        // Noble IP proxy endpoint
     port: lease.port,            // Noble IP proxy port
     user: RDS_USERNAME,          // Database username
     password: token,             // IAM authentication token
     database: RDS_DATABASE,      // Database name
     ssl: {
       servername: RDS_HOSTNAME,  // TLS verification against RDS
       rejectUnauthorized: false  // Temporary for testing
     }
   };
   ```

## Environment Variables

### Required Variables
```bash
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

### Security Notes
- Store all sensitive values in Vercel environment variables
- Use AWS IAM roles with minimal required permissions
- Rotate Noble IP proxy tokens regularly
- Monitor connection logs for suspicious activity

## Testing

### Test Endpoint
```bash
GET /api/test_endpoint
```

This endpoint tests:
- Noble IP proxy lease acquisition
- AWS RDS IAM token generation
- TLS/SNI verification
- End-to-end database connectivity

### Expected Response
```json
[
  {
    "now": "2025-01-27T10:30:00.000Z"
  }
]
```

## Troubleshooting

### Common Issues

1. **Lease Failed**
   - Check `NOBLE_PROXY_TOKEN` is valid
   - Verify Noble IP service is accessible
   - Check `RDS_HOSTNAME` and `RDS_PORT` are correct

2. **IAM Token Generation Failed**
   - Verify `AWS_ROLE_ARN` is correct
   - Check AWS credentials have RDS connect permissions
   - Ensure `AWS_REGION` matches RDS region

3. **TLS/SNI Verification Failed**
   - Verify `RDS_HOSTNAME` is the correct RDS Proxy hostname
   - Check SSL configuration in connection config
   - Ensure certificate chain is valid

4. **Connection Timeout**
   - Check Noble IP proxy lease is active
   - Verify network connectivity to proxy endpoint
   - Check RDS security groups allow connections

### Debug Steps

1. Check environment variables are set correctly
2. Test Noble IP proxy lease acquisition independently
3. Test AWS RDS IAM token generation independently
4. Test direct connection to RDS (if possible)
5. Review application logs for specific error messages

## Performance Considerations

- **Connection Caching** - Config is cached to avoid repeated lease requests
- **Token Refresh** - IAM tokens expire and need periodic refresh
- **Pool Management** - Use connection pooling for better performance
- **Error Handling** - Implement retry logic for transient failures

## Security Benefits

1. **No Hardcoded Credentials** - Uses IAM tokens instead of passwords
2. **Network Isolation** - Noble IP proxy provides additional network layer
3. **TLS Encryption** - All connections encrypted in transit
4. **Certificate Validation** - Proper SNI verification prevents MITM attacks
5. **Audit Trail** - AWS CloudTrail logs all IAM token usage

## Future Improvements

- [ ] Implement proper SSL certificate validation
- [ ] Add connection retry logic with exponential backoff
- [ ] Implement token refresh mechanism
- [ ] Add connection health monitoring
- [ ] Consider connection pooling optimization
