-- CreateTable RoadRiskPrediction
CREATE TABLE "road_risk_predictions" (
    "id" TEXT NOT NULL,
    "road_id" TEXT NOT NULL,
    "risk_percentage" INTEGER NOT NULL,
    "urgency" TEXT NOT NULL,
    "confidence" INTEGER NOT NULL,
    "breakdown" TEXT NOT NULL,
    "factors" TEXT NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "road_risk_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "road_risk_predictions_road_id_key" ON "road_risk_predictions"("road_id");

-- AddForeignKey
ALTER TABLE "road_risk_predictions" ADD CONSTRAINT "road_risk_predictions_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("id") ON DELETE CASCADE;
