import { prisma } from './src/server/db/prisma';
async function run() {
  try {
    await prisma.question.findUnique({
      where: { id: 'some-id' },
      include: {
        options: { orderBy: { position: 'asc' } },
        themes: true
      }
    });
    console.log("Success!");
  } catch (e) {
    console.error("Prisma error:", e);
  }
}
run();
