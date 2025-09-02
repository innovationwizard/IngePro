-- CreateTable
CREATE TABLE "public"."worklog_entries" (
    "id" TEXT NOT NULL,
    "worklog_id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "task_id" TEXT,
    "description" TEXT NOT NULL,
    "time_spent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "location_latitude" DOUBLE PRECISION,
    "location_longitude" DOUBLE PRECISION,
    "location_accuracy" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "worklog_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."worklog_material_usage" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worklog_material_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."worklog_photos" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worklog_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worklog_entries_worklog_id_idx" ON "public"."worklog_entries"("worklog_id");

-- CreateIndex
CREATE INDEX "worklog_entries_person_id_idx" ON "public"."worklog_entries"("person_id");

-- CreateIndex
CREATE INDEX "worklog_entries_project_id_idx" ON "public"."worklog_entries"("project_id");

-- CreateIndex
CREATE INDEX "worklog_entries_task_id_idx" ON "public"."worklog_entries"("task_id");

-- CreateIndex
CREATE INDEX "worklog_material_usage_entry_id_idx" ON "public"."worklog_material_usage"("entry_id");

-- CreateIndex
CREATE INDEX "worklog_material_usage_material_id_idx" ON "public"."worklog_material_usage"("material_id");

-- CreateIndex
CREATE INDEX "worklog_photos_entry_id_idx" ON "public"."worklog_photos"("entry_id");

-- AddForeignKey
ALTER TABLE "public"."worklog_entries" ADD CONSTRAINT "worklog_entries_worklog_id_fkey" FOREIGN KEY ("worklog_id") REFERENCES "public"."work_logs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worklog_entries" ADD CONSTRAINT "worklog_entries_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worklog_entries" ADD CONSTRAINT "worklog_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worklog_entries" ADD CONSTRAINT "worklog_entries_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worklog_material_usage" ADD CONSTRAINT "worklog_material_usage_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."worklog_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worklog_material_usage" ADD CONSTRAINT "worklog_material_usage_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."worklog_photos" ADD CONSTRAINT "worklog_photos_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "public"."worklog_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
