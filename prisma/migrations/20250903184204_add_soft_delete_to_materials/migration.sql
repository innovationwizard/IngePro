-- AlterTable
ALTER TABLE "public"."materials" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN IF NOT EXISTS "deleted_by" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "materials_deleted_at_idx" ON "public"."materials"("deleted_at");

-- Update foreign key constraint for material_losses to use RESTRICT
ALTER TABLE "public"."material_losses" DROP CONSTRAINT IF EXISTS "material_losses_material_id_fkey";
ALTER TABLE "public"."material_losses" ADD CONSTRAINT "material_losses_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON UPDATE CASCADE ON DELETE RESTRICT;
