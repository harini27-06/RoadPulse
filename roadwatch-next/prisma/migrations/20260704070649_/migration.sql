-- DropForeignKey
ALTER TABLE "road_risk_predictions" DROP CONSTRAINT "road_risk_predictions_road_id_fkey";

-- AddForeignKey
ALTER TABLE "road_risk_predictions" ADD CONSTRAINT "road_risk_predictions_road_id_fkey" FOREIGN KEY ("road_id") REFERENCES "roads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
