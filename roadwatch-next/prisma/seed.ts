import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

const prisma = new PrismaClient();

async function seedRoads() {
  const roads: any[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "datasets", "Road Datasets - Sheet1 (1).csv")
    )
      .pipe(csv())
      .on("data", (row) => roads.push(row))
      .on("end", async () => {
        console.log(`Found ${roads.length} roads`);

        for (const row of roads) {
          try {
            await prisma.road.create({
              data: {
                road_id: String(row.Road_ID),
                road_name: row.Road_Name,
                road_code: row.Road_Code || null,
                road_type: row.Road_Type || null,
                district: row.District,
                state: row.State,
                last_maintenance_date: row["Last Maintenance Date"] || null,
                start_km: Number(row.Start_Km) || null,
                end_km: Number(row.End_Km) || null,
                total_length_km: Number(row.Total_Length_Km) || null,
                tender_id: row.Tender_ID || null,
                estimated_amount: Number(row["Estimated Amount (in Crores)"]) || null,
                budget_estimate: Number(row["Budget Estimate (in Crores)"]) || null,
                total_work_value: Number(row["Total Work Value"]) || null,
              },
            });
          } catch (err) {
            console.log("Skipping duplicate:", row.Road_ID);
          }
        }

        resolve();
      })
      .on("error", reject);
  });
}

async function seedAccidents() {
  const accidents: any[] = [];

  await prisma.accident.deleteMany();

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(
      path.join(__dirname, "datasets", "Accidents - Sheet1 (1) (1).csv")
    )
      .pipe(csv())
      .on("data", (row) => accidents.push(row))
      .on("end", async () => {
        console.log(`Found ${accidents.length} accident rows`);

        for (const row of accidents) {
          await prisma.accident.upsert({
            where: { district: row.Districts.trim() },
            update: {
              total_accidents: Number(row["Total Accidents"]),
              total_deaths: Number(row["Total Deaths"]),
              executive_engineer: row["Executive Engineer"]?.trim() || null,
            },
            create: {
              district: row.Districts.trim(),
              total_accidents: Number(row["Total Accidents"]),
              total_deaths: Number(row["Total Deaths"]),
              executive_engineer: row["Executive Engineer"]?.trim() || null,
            },
          });
        }

        resolve();
      })
      .on("error", reject);
  });
}

async function main() {
  console.log("Seeding database...");

  await seedRoads();

  await seedAccidents();

  console.log("Database seeded successfully!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });