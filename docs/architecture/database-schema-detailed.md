# Detailed Database Schema

## Entity Relationship Diagram
```mermaid
erDiagram
    Companies ||--o{ People : employs
    Companies ||--o{ Projects : owns
    Companies ||--o{ Teams : has
    Companies ||--o{ WorkLogs : tracks
    
    People ||--o{ PersonTenants : belongs_to
    People ||--o{ PersonTeams : member_of
    People ||--o{ PersonProjects : assigned_to
    People ||--o{ WorkLogs : creates
    People ||--o{ LocationUpdates : tracks
    People ||--o{ AuditLogs : generates
    
    Projects ||--o{ ProjectTeams : uses
    Projects ||--o{ WorkLogs : contains
    Projects ||--o{ TaskProjectAssignments : manages
    Projects ||--o{ ProjectMaterials : consumes
    
    Teams ||--o{ PersonTeams : includes
    Teams ||--o{ ProjectTeams : works_on
    
    Tasks ||--o{ TaskWorkerAssignments : assigned_to
    Tasks ||--o{ TaskProgressUpdates : tracks_progress
    Tasks ||--o{ TaskProjectAssignments : belongs_to_project
    
    Materials ||--o{ MaterialConsumptions : consumed_in
    Materials ||--o{ ProjectMaterials : used_in_project
    Materials ||--o{ InventoryMovements : tracked_in
    
    Companies {
        string id PK
        string name
        string name_es
        string slug UK
        enum status
        datetime created_at
        datetime updated_at
    }
    
    People {
        string id PK
        string email UK
        string name
        string password
        enum role
        enum status
        datetime created_at
        datetime updated_at
        string company_id FK
    }
    
    Projects {
        string id PK
        string name
        string name_es
        string description
        string description_es
        string company_id FK
        enum status
        datetime created_at
        datetime updated_at
    }
    
    Teams {
        string id PK
        string name
        string name_es
        string description
        string company_id FK
        enum status
        datetime created_at
        datetime updated_at
    }
    
    Tasks {
        string id PK
        string name
        string description
        enum status
        enum priority
        datetime due_date
        datetime created_at
        datetime updated_at
    }
    
    Materials {
        string id PK
        string name
        string name_es
        string description
        string unit
        decimal unit_cost
        int min_stock_level
        int max_stock_level
        int current_stock
        datetime created_at
        datetime updated_at
    }
```

## Database Indexes
```sql
-- Performance optimization indexes
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_company_id ON people(company_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_worklogs_person_id ON work_logs(person_id);
CREATE INDEX idx_worklogs_project_id ON work_logs(project_id);
CREATE INDEX idx_location_updates_person_id ON location_updates(person_id);
CREATE INDEX idx_audit_logs_person_id ON audit_logs(person_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
```

## Data Constraints
```sql
-- Foreign key constraints
ALTER TABLE people ADD CONSTRAINT fk_people_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE projects ADD CONSTRAINT fk_projects_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

ALTER TABLE teams ADD CONSTRAINT fk_teams_company 
    FOREIGN KEY (company_id) REFERENCES companies(id);

-- Check constraints
ALTER TABLE people ADD CONSTRAINT chk_people_role 
    CHECK (role IN ('WORKER', 'SUPERVISOR', 'ADMIN', 'SUPERUSER'));

ALTER TABLE projects ADD CONSTRAINT chk_projects_status 
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED'));
```
