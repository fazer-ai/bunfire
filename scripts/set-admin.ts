#!/usr/bin/env bun

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: bun scripts/set-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) {
    const password =
      crypto.randomUUID().replace(/-/g, "") +
      crypto.randomUUID().replace(/-/g, "").toUpperCase();
    const passwordHash = await Bun.password.hash(password, {
      algorithm: "bcrypt",
      cost: 10,
    });

    await prisma.user.create({
      data: { email, passwordHash, role: "ADMIN" },
    });

    console.log(`User created and set as admin.`);
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    return;
  }

  if (user.role === "ADMIN") {
    console.log(`User ${email} is already an admin.`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });

  console.log(`Successfully set ${email} as admin.`);
}

main()
  .catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
