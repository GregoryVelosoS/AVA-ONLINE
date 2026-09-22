import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.question.count({
    where: { capacity: { not: null } }
  });
  console.log("Count of questions with capacity:", count);
}

main().finally(() => prisma.$disconnect());
