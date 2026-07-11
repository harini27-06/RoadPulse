const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Sample district coordinates (central points for major districts in India)
const districtCoordinates = {
  "Visakhapatnam": { lat: 17.6869, lng: 83.2185 },
  "Kakinada": { lat: 16.9891, lng: 82.1475 },
  "Guntur": { lat: 16.5806, lng: 80.4426 },
  "Tirupati": { lat: 13.1939, lng: 79.8942 },
  "Chittoor": { lat: 13.1912, lng: 79.1076 },
  "Nellore": { lat: 14.4422, lng: 79.9865 },
  "Coimbatore": { lat: 11.0081, lng: 76.9754 },
  "Erode": { lat: 11.3411, lng: 77.7172 },
  "Salem": { lat: 11.6643, lng: 78.146 },
  "Trichy": { lat: 10.7905, lng: 78.7047 },
  "Namakkal": { lat: 11.7252, lng: 78.1656 },
  "Vellore": { lat: 12.9716, lng: 79.1409 },
  "Krishnagiri": { lat: 12.5214, lng: 78.8779 },
  "Kanchipuram": { lat: 12.8342, lng: 79.7029 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
};

// Add random offset to coordinates (to simulate different locations within district)
function addRandomOffset(lat, lng) {
  const latOffset = (Math.random() - 0.5) * 0.5; // ±0.25 degrees
  const lngOffset = (Math.random() - 0.5) * 0.5; // ±0.25 degrees
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset,
  };
}

async function addCoordinatesToComplaints() {
  try {
    console.log("🔍 Checking complaints without coordinates...");

    // Get all roads
    const roads = await prisma.road.findMany();
    console.log(`Found ${roads.length} roads`);

    // Get ALL complaints (we'll update those that need coordinates)
    const allComplaints = await prisma.complaint.findMany();
    console.log(`Found ${allComplaints.length} total complaints`);

    // Filter complaints without coordinates
    const complaintsWithoutCoords = allComplaints.filter(
      (c) => !c.latitude || !c.longitude
    );

    console.log(
      `Found ${complaintsWithoutCoords.length} complaints without coordinates`
    );

    if (complaintsWithoutCoords.length === 0) {
      console.log("✅ All complaints already have coordinates!");
      return;
    }

    // Group complaints by district
    const roadMap = new Map(roads.map((r) => [r.id, r]));

    let updated = 0;

    console.log("📍 Adding coordinates to complaints...");

    for (const complaint of complaintsWithoutCoords) {
      const road = complaint.road_id ? roadMap.get(complaint.road_id) : null;
      const district = road?.district || "Coimbatore"; // default district

      // Get coordinates for district (or use default)
      const districtCoords =
        districtCoordinates[district] ||
        districtCoordinates["Coimbatore"];

      // Add random offset so they're not all at the same point
      const coords = addRandomOffset(
        districtCoords.lat,
        districtCoords.lng
      );

      await prisma.complaint.update({
        where: { id: complaint.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
        },
      });

      updated++;

      if (updated % 100 === 0) {
        console.log(`  Updated ${updated} complaints...`);
      }
    }

    console.log(
      `\n✅ Successfully updated ${updated} complaints with coordinates!`
    );

    // Show summary
    const complaintsByRoad = await prisma.road.findMany({
      include: {
        complaints: true,
      },
    });

    const roadsWithComplaints = complaintsByRoad.filter(
      (r) => r.complaints.length > 0
    ).length;
    const totalComplaints = complaintsByRoad.reduce(
      (sum, r) => sum + r.complaints.length,
      0
    );

    console.log(`\n📊 Summary:`);
    console.log(`  Roads with complaints: ${roadsWithComplaints}`);
    console.log(`  Total complaints: ${totalComplaints}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addCoordinatesToComplaints();
