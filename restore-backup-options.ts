import { prisma } from "./src/server/db/prisma";
import fs from "fs";

async function main() {
  console.log("Loading backup...");
  const backupData = JSON.parse(fs.readFileSync("./backups/db/2026/05/ava-backup-2026-05-21T21-57-49-028Z.json", "utf8")).data;
  
  const oldOptions = backupData.questionOptions || [];
  const oldAnswers = backupData.answers || [];

  console.log(`Loaded ${oldOptions.length} old options and ${oldAnswers.length} old answers.`);

  const oldOptionMap = new Map();
  for (const opt of oldOptions) {
    oldOptionMap.set(opt.id, opt);
  }

  let recoveredCount = 0;
  const updates = [];

  const answersToProcess = oldAnswers.filter((a: any) => a.isCorrect === false && a.selectedOptionId);
  console.log(`Processing ${answersToProcess.length} incorrect answers...`);

  // Load all live answers that need checking in one go
  const answerIds = answersToProcess.map((a: any) => a.id);
  const liveAnswers = await prisma.answer.findMany({
    where: { id: { in: answerIds }, selectedOptionId: null },
    include: { question: { include: { options: true } } }
  });

  console.log(`Found ${liveAnswers.length} live answers with null selectedOptionId.`);

  for (const liveAnswer of liveAnswers) {
    const oldAnswer = answersToProcess.find((a: any) => a.id === liveAnswer.id);
    const oldOption = oldOptionMap.get(oldAnswer.selectedOptionId);
    if (oldOption) {
      const newOption = liveAnswer.question.options.find((o: any) => o.label === oldOption.label);
      if (newOption) {
        updates.push(
          prisma.answer.update({
            where: { id: liveAnswer.id },
            data: { selectedOptionId: newOption.id }
          })
        );
      }
    }
  }

  console.log(`Running ${updates.length} updates...`);
  await Promise.all(updates);
  console.log(`Successfully recovered ${updates.length} missing incorrect options!`);
}

main().catch(console.error);
