-- DropForeignKey
ALTER TABLE "public"."task_progress_updates" DROP CONSTRAINT "task_progress_updates_assignment_id_fkey";

-- AlterTable
ALTER TABLE "public"."task_progress_updates" ALTER COLUMN "assignment_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."task_progress_updates" ADD CONSTRAINT "task_progress_updates_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."task_worker_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
