const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dooh.com" },
    update: {},
    create: {
      email: "admin@dooh.com",
      passwordHash,
      role: "admin",
    },
  });

  console.log("✅ Admin user created:", admin.email);
  console.log("   Email: admin@dooh.com");
  console.log("   Password: admin123");
  console.log("\n⚠️  IMPORTANT: Change this password in production!\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
