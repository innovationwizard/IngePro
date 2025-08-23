-- DropForeignKey
ALTER TABLE "public"."tasks" DROP CONSTRAINT "tasks_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."tasks" ALTER COLUMN "category_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."task_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
