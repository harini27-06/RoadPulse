const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Calculate distance between two points (Haversine formula)
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

async function matchComplaintsToRoads() {
  try {
    console.log("🔗 Matching complaints to nearest roads...\n");

    // Get all complaints without road_id
    const orphanedComplaints = await prisma.complaint.findMany({
      where: {
        road_id: null,
      },
    });

    console.log(`Found ${orphanedComplaints.length} orphaned complaints\n`);

    // Get all roads (we need to fetch all to find nearest)
    const roads = await prisma.road.findMany();
    console.log(`Checking against ${roads.length} roads...\n`);

    let matched = 0;
    let skipped = 0;

    for (const complaint of orphanedComplaints) {
      // Find nearest road
      let nearestRoad = null;
      let minDistance = Infinity;

      for (const road of roads) {
        // Skip if no coordinates
        if (!road.latitude || !road.longitude) continue;

        const distance = haversineDistance(
          complaint.latitude,
          complaint.longitude,
          road.latitude,
          road.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          nearestRoad = road;
        }
      }

      if (nearestRoad && minDistance < 5) {
        // Only match if within 5km
        await prisma.complaint.update({
          where: { id: complaint.id },
          data: { road_id: nearestRoad.id },
        });

        console.log(`✅ Matched "${complaint.issue_type}" to "${nearestRoad.road_name}" (${minDistance.toFixed(2)} km away)`);
        matched++;
      } else {
        console.log(`⚠️  Could not match "${complaint.issue_type}" - nearest road is ${minDistance.toFixed(2)} km away`);
        skipped++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`  ✅ Matched: ${matched}`);
    console.log(`  ⚠️  Skipped: ${skipped}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

matchComplaintsToRoads();
