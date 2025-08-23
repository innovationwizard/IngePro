-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('WORKER', 'SUPERVISOR', 'ADMIN', 'SUPERUSER');

-- CreateEnum
CREATE TYPE "public"."PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."CompanyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL');

-- CreateEnum
CREATE TYPE "public"."TeamStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PersonTenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."PersonTeamStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."PersonProjectStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."TaskCategoryStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OBSTACLE_PERMIT', 'OBSTACLE_DECISION', 'OBSTACLE_INSPECTION', 'OBSTACLE_MATERIALS', 'OBSTACLE_EQUIPMENT', 'OBSTACLE_WEATHER', 'OBSTACLE_OTHER');

-- CreateEnum
CREATE TYPE "public"."ValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."MaterialStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DISCONTINUED');

-- CreateEnum
CREATE TYPE "public"."InventoryMovementType" AS ENUM ('PURCHASE', 'SALE', 'TRANSFER', 'ADJUSTMENT', 'LOSS', 'RETURN');

-- CreateEnum
CREATE TYPE "public"."ReorderRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'ORDERED', 'RECEIVED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."people" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'WORKER',
    "status" "public"."PersonStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "company_id" TEXT,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_es" TEXT,
    "slug" TEXT NOT NULL,
    "status" "public"."CompanyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_es" TEXT,
    "description" TEXT,
    "company_id" TEXT NOT NULL,
    "status" "public"."TeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_es" TEXT,
    "description" TEXT,
    "description_es" TEXT,
    "company_id" TEXT NOT NULL,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."person_tenants" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "status" "public"."PersonTenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "person_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."person_teams" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "status" "public"."PersonTeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "person_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."person_projects" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "start_date" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMPTZ(6),
    "status" "public"."PersonProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "person_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_teams" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_logs" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "clock_in" TIMESTAMPTZ(6) NOT NULL,
    "clock_out" TIMESTAMPTZ(6),
    "location" TEXT,
    "tasks_completed" JSONB NOT NULL,
    "materials_used" JSONB NOT NULL,
    "photos" TEXT[],
    "notes" TEXT,
    "notes_es" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "company_id" TEXT,

    CONSTRAINT "work_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_es" TEXT,
    "description" TEXT,
    "status" "public"."TaskCategoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" TEXT NOT NULL,
    "progress_unit" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_progress_updates" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "amount_completed" DOUBLE PRECISION NOT NULL,
    "additional_attributes" TEXT,
    "status" "public"."TaskStatus" NOT NULL,
    "photos" TEXT[],
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "validation_status" "public"."ValidationStatus" NOT NULL DEFAULT 'PENDING',
    "validation_comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_progress_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."materials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_es" TEXT,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "min_stock_level" DOUBLE PRECISION,
    "max_stock_level" DOUBLE PRECISION,
    "current_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "public"."MaterialStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_project_assignments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_project_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_worker_assignments" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "task_worker_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_materials" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."material_consumptions" (
    "id" TEXT NOT NULL,
    "task_progress_update_id" TEXT,
    "material_id" TEXT NOT NULL,
    "project_id" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CONSUMPTION',
    "notes" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."material_losses" (
    "id" TEXT NOT NULL,
    "task_progress_update_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_losses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."inventory_movements" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "type" "public"."InventoryMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit_cost" DECIMAL(12,2),
    "total_cost" DECIMAL(14,2),
    "reference" TEXT,
    "notes" TEXT,
    "recorded_by" TEXT,
    "recorded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reorder_requests" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "requested_quantity" DOUBLE PRECISION NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_by" TEXT,
    "approved_at" TIMESTAMPTZ(6),
    "rejected_by" TEXT,
    "rejected_at" TIMESTAMPTZ(6),
    "rejection_reason" TEXT,
    "order_number" TEXT,
    "ordered_at" TIMESTAMPTZ(6),
    "received_at" TIMESTAMPTZ(6),
    "status" "public"."ReorderRequestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reorder_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_email_key" ON "public"."people"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "public"."companies"("slug");

-- CreateIndex
CREATE INDEX "person_tenants_person_id_idx" ON "public"."person_tenants"("person_id");

-- CreateIndex
CREATE INDEX "person_tenants_company_id_idx" ON "public"."person_tenants"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_tenants_person_id_company_id_start_date_key" ON "public"."person_tenants"("person_id", "company_id", "start_date");

-- CreateIndex
CREATE INDEX "person_teams_person_id_idx" ON "public"."person_teams"("person_id");

-- CreateIndex
CREATE INDEX "person_teams_team_id_idx" ON "public"."person_teams"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_teams_person_id_team_id_start_date_key" ON "public"."person_teams"("person_id", "team_id", "start_date");

-- CreateIndex
CREATE INDEX "person_projects_person_id_idx" ON "public"."person_projects"("person_id");

-- CreateIndex
CREATE INDEX "person_projects_project_id_idx" ON "public"."person_projects"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_projects_person_id_project_id_start_date_key" ON "public"."person_projects"("person_id", "project_id", "start_date");

-- CreateIndex
CREATE INDEX "project_teams_project_id_idx" ON "public"."project_teams"("project_id");

-- CreateIndex
CREATE INDEX "project_teams_team_id_idx" ON "public"."project_teams"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_teams_project_id_team_id_key" ON "public"."project_teams"("project_id", "team_id");

-- CreateIndex
CREATE INDEX "work_logs_person_id_idx" ON "public"."work_logs"("person_id");

-- CreateIndex
CREATE INDEX "work_logs_project_id_idx" ON "public"."work_logs"("project_id");

-- CreateIndex
CREATE INDEX "work_logs_company_id_idx" ON "public"."work_logs"("company_id");

-- CreateIndex
CREATE INDEX "task_progress_updates_task_id_idx" ON "public"."task_progress_updates"("task_id");

-- CreateIndex
CREATE INDEX "task_progress_updates_project_id_idx" ON "public"."task_progress_updates"("project_id");

-- CreateIndex
CREATE INDEX "task_progress_updates_worker_id_idx" ON "public"."task_progress_updates"("worker_id");

-- CreateIndex
CREATE INDEX "task_progress_updates_assignment_id_idx" ON "public"."task_progress_updates"("assignment_id");

-- CreateIndex
CREATE INDEX "task_project_assignments_task_id_idx" ON "public"."task_project_assignments"("task_id");

-- CreateIndex
CREATE INDEX "task_project_assignments_project_id_idx" ON "public"."task_project_assignments"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_project_assignments_task_id_project_id_key" ON "public"."task_project_assignments"("task_id", "project_id");

-- CreateIndex
CREATE INDEX "task_worker_assignments_task_id_idx" ON "public"."task_worker_assignments"("task_id");

-- CreateIndex
CREATE INDEX "task_worker_assignments_project_id_idx" ON "public"."task_worker_assignments"("project_id");

-- CreateIndex
CREATE INDEX "task_worker_assignments_worker_id_idx" ON "public"."task_worker_assignments"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "task_worker_assignments_task_id_project_id_worker_id_key" ON "public"."task_worker_assignments"("task_id", "project_id", "worker_id");

-- CreateIndex
CREATE INDEX "project_materials_project_id_idx" ON "public"."project_materials"("project_id");

-- CreateIndex
CREATE INDEX "project_materials_material_id_idx" ON "public"."project_materials"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_materials_project_id_material_id_key" ON "public"."project_materials"("project_id", "material_id");

-- CreateIndex
CREATE INDEX "material_consumptions_material_id_idx" ON "public"."material_consumptions"("material_id");

-- CreateIndex
CREATE INDEX "material_consumptions_project_id_idx" ON "public"."material_consumptions"("project_id");

-- CreateIndex
CREATE INDEX "material_consumptions_task_progress_update_id_idx" ON "public"."material_consumptions"("task_progress_update_id");

-- CreateIndex
CREATE INDEX "material_losses_material_id_idx" ON "public"."material_losses"("material_id");

-- CreateIndex
CREATE INDEX "material_losses_task_progress_update_id_idx" ON "public"."material_losses"("task_progress_update_id");

-- AddForeignKey
ALTER TABLE "public"."people" ADD CONSTRAINT "people_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."teams" ADD CONSTRAINT "teams_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."person_tenants" ADD CONSTRAINT "person_tenants_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."person_tenants" ADD CONSTRAINT "person_tenants_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."person_teams" ADD CONSTRAINT "person_teams_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."person_teams" ADD CONSTRAINT "person_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."person_projects" ADD CONSTRAINT "person_projects_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."person_projects" ADD CONSTRAINT "person_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_teams" ADD CONSTRAINT "project_teams_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_teams" ADD CONSTRAINT "project_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_logs" ADD CONSTRAINT "work_logs_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_logs" ADD CONSTRAINT "work_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_logs" ADD CONSTRAINT "work_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_progress_updates" ADD CONSTRAINT "task_progress_updates_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_progress_updates" ADD CONSTRAINT "task_progress_updates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_progress_updates" ADD CONSTRAINT "task_progress_updates_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_progress_updates" ADD CONSTRAINT "task_progress_updates_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."task_worker_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_project_assignments" ADD CONSTRAINT "task_project_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_project_assignments" ADD CONSTRAINT "task_project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_worker_assignments" ADD CONSTRAINT "task_worker_assignments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_worker_assignments" ADD CONSTRAINT "task_worker_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_worker_assignments" ADD CONSTRAINT "task_worker_assignments_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_materials" ADD CONSTRAINT "project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_materials" ADD CONSTRAINT "project_materials_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_consumptions" ADD CONSTRAINT "material_consumptions_task_progress_update_id_fkey" FOREIGN KEY ("task_progress_update_id") REFERENCES "public"."task_progress_updates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_consumptions" ADD CONSTRAINT "material_consumptions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_consumptions" ADD CONSTRAINT "material_consumptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_losses" ADD CONSTRAINT "material_losses_task_progress_update_id_fkey" FOREIGN KEY ("task_progress_update_id") REFERENCES "public"."task_progress_updates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_losses" ADD CONSTRAINT "material_losses_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."inventory_movements" ADD CONSTRAINT "inventory_movements_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reorder_requests" ADD CONSTRAINT "reorder_requests_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
