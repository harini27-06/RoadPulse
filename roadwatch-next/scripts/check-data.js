const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log("📊 DATABASE ANALYSIS\n");

    // Count roads
    const totalRoads = await prisma.road.count();
    console.log(`Total roads: ${totalRoads}`);

    // Count complaints
    const totalComplaints = await prisma.complaint.count();
    console.log(`Total complaints: ${totalComplaints}`);

    // Get roads with complaints
    const roadsWithComplaints = await prisma.road.findMany({
      where: {
        complaints: {
          some: {},
        },
      },
      include: {
        complaints: {
          select: {
            id: true,
            latitude: true,
            longitude: true,
            issue_type: true,
            created_at: true,
          },
        },
      },
    });

    console.log(`\nRoads with complaints: ${roadsWithComplaints.length}`);

    if (roadsWithComplaints.length > 0) {
      console.log("\n🛣️  Roads with complaints:");
      roadsWithComplaints.forEach((road) => {
        console.log(`\n  ${road.road_name} (${road.district})`);
        console.log(`    Complaints: ${road.complaints.length}`);
        road.complaints.forEach((c) => {
          console.log(
            `      - ${c.issue_type} at (${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)})`
          );
        });
      });
    }

    // Check for complaints without road_id
    const orphanedComplaints = await prisma.complaint.findMany({
      where: {
        road_id: null,
      },
      select: {
        id: true,
        issue_type: true,
        latitude: true,
        longitude: true,
      },
    });

    if (orphanedComplaints.length > 0) {
      console.log(`\n⚠️  Complaints without road_id: ${orphanedComplaints.length}`);
      orphanedComplaints.forEach((c) => {
        console.log(
          `    - ${c.issue_type} at (${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)})`
        );
      });
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
