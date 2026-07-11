-- AlterTable
ALTER TABLE "complaints" ADD COLUMN     "road_id" TEXT,
ADD COLUMN     "severity" TEXT;

-- CreateTable
CREATE TABLE "roads" (
    "id" TEXT NOT NULL,
    "road_id" TEXT NOT NULL,
    "road_name" TEXT NOT NULL,
    "road_code" TEXT,
    "road_type" TEXT,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "start_km" DOUBLE PRECISION,
    "end_km" DOUBLE PRECISION,
    "total_length_km" DOUBLE PRECISION,
    "tender_id" TEXT,
    "estimated_amount" DOUBLE PRECISION,
    "budget_estimate" DOUBLE PRECISION,
    "total_work_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "road_conditions" (
    "id" TEXT NOT NULL,
    "road_id" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "road_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accidents" (
    "id" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "total_accidents" INTEGER NOT NULL,
    "total_deaths" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roads_road_id_key" ON "roads"("road_id");

-- CreateIndex
CREATE UNIQUE INDEX "accidents_district_key" ON "accidents"("district");

-- AddForeignKey
ALTER TABLE "road_conditions" ADD CONSTRAINT "road_conditions_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
