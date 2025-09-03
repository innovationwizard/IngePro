# Security Architecture

## Authentication Flow
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as NextAuth
    participant D as Database
    
    
    U->>F: Login Request
    F->>A: Authenticate Credentials
    A->>D: Verify User
    D->>A: User Data
    A->>R: Store Session
    A->>F: JWT Token
    F->>U: Authenticated Session
    
    Note over U,R: Session Management
    loop Active Session
        U->>F: API Request
        F->>A: Validate Token
        A->>R: Check Session
        A->>F: Authorization
        F->>U: Protected Content
    end
```

## Authorization Matrix
```mermaid
graph TB
    subgraph "Role Hierarchy"
        A[SUPERUSER] --> B[ADMIN]
        B --> C[SUPERVISOR]
        C --> D[WORKER]
    end
    
    subgraph "Permissions"
        E[System Management] --> A
        F[Company Management] --> B
        G[Project Management] --> C
        H[Time Tracking] --> D
        I[User Management] --> B
        J[Analytics] --> C
        K[Inventory] --> C
    end
    
    subgraph "Data Access"
        L[All Data] --> A
        M[Company Data] --> B
        N[Project Data] --> C
        O[Own Data] --> D
    end
```

## Security Measures
```typescript
// Password Security
const hashedPassword = await bcrypt.hash(password, 12);

// JWT Configuration
export const authOptions: NextAuthOptions = {
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  }
};

// Rate Limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
};
```

## Data Protection
```typescript
// Input Sanitization
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
}

// SQL Injection Prevention
const user = await prisma.people.findUnique({
  where: { id: userId }, // Parameterized query
  select: { name: true, email: true }
});

// XSS Prevention
const safeContent = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
  ALLOWED_ATTR: []
});
```
