import { prisma } from "./src/server/db/prisma";
import { recomputeAttemptScore } from "./src/server/services/scoring";

async function main() {
  console.log("Fetching questions and options...");
  const objectiveQuestions = await prisma.question.findMany({
    where: { type: "MULTIPLE_CHOICE" },
    include: { options: true }
  });

  const questionMap = new Map();
  for (const q of objectiveQuestions) {
    questionMap.set(q.id, q);
  }

  console.log("Fetching all objective answers...");
  const answers = await prisma.answer.findMany({
    where: { question: { type: "MULTIPLE_CHOICE" } }
  });

  console.log(`Found ${answers.length} answers. Re-scoring...`);
  
  const updates = [];
  const attemptIds = new Set<string>();
  
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const correct = question.options.find(o => o.isCorrect);
    const isCorrect = correct?.id === answer.selectedOptionId;
    const autoScore = isCorrect ? Number(question.defaultWeight) : 0;
    const finalScore = autoScore + Number(answer.manualScore);

    if (answer.isCorrect !== isCorrect || Number(answer.autoScore) !== autoScore) {
      updates.push(prisma.answer.update({
        where: { id: answer.id },
        data: { isCorrect, autoScore, finalScore }
      }));
      attemptIds.add(answer.attemptId);
    }
  }

  console.log(`Running ${updates.length} updates...`);
  // batch into 100 max
  for (let i = 0; i < updates.length; i += 100) {
    await Promise.all(updates.slice(i, i + 100));
  }
  console.log(`Scored all ${updates.length} mismatched answers!`);

  console.log(`Re-scoring ${attemptIds.size} attempts to update their final totals...`);
  const attemptUpdates = Array.from(attemptIds).map(id => recomputeAttemptScore(id));
  for (let i = 0; i < attemptUpdates.length; i += 20) {
    await Promise.all(attemptUpdates.slice(i, i + 20));
  }
  
  console.log("Finished updating database scores!");
}

main().catch(console.error);
