# API Documentation

## Authentication Endpoints
```typescript
// NextAuth configuration
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Custom credentials provider
    })
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      // JWT token handling
    },
    session: ({ session, token }) => {
      // Session management
    }
  }
}
```

## Core API Routes
```typescript
// Project management
GET    /api/projects          // List projects
POST   /api/projects          // Create project
GET    /api/projects/[id]     // Get project details
PUT    /api/projects/[id]     // Update project
DELETE /api/projects/[id]     // Delete project

// Task management
GET    /api/tasks             // List tasks
POST   /api/tasks             // Create task
GET    /api/tasks/[id]        // Get task details
PUT    /api/tasks/[id]        // Update task
DELETE /api/tasks/[id]        // Delete task

// User management
GET    /api/people            // List users
POST   /api/people            // Create user
GET    /api/people/[id]       // Get user details
PUT    /api/people/[id]       // Update user
DELETE /api/people/[id]       // Delete user

// Work logging
GET    /api/worklog           // List work logs
POST   /api/worklog           // Create work log
PUT    /api/worklog/[id]      // Update work log
```

## Database Models
```typescript
// Core entities
interface People {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: PersonStatus;
  companyId?: string;
}

interface Companies {
  id: string;
  name: string;
  slug: string;
  status: CompanyStatus;
}

interface Projects {
  id: string;
  name: string;
  companyId: string;
  status: ProjectStatus;
}

interface WorkLogs {
  id: string;
  personId: string;
  projectId: string;
  clockIn: Date;
  clockOut?: Date;
  location?: string;
  tasksCompleted: any[];
  materialsUsed: any[];
}
```
