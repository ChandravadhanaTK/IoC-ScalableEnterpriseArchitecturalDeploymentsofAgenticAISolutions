import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin =
    await prisma.user.findUnique({
      where: {
        email: "admin@taskflow.com",
      },
    });

  if (existingAdmin) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword =
    await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@taskflow.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin created");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });