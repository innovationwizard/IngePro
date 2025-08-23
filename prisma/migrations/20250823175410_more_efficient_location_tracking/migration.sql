-- CreateTable
CREATE TABLE "public"."location_updates" (
    "id" TEXT NOT NULL,
    "person_id" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "delta_distance" DOUBLE PRECISION,
    "delta_heading" DOUBLE PRECISION,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "location_updates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "location_updates_person_id_key" ON "public"."location_updates"("person_id");

-- AddForeignKey
ALTER TABLE "public"."location_updates" ADD CONSTRAINT "location_updates_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE CASCADE ON UPDATE CASCADE;
