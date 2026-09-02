import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const backupPath = "d:\\Projetos SENAI\\AVA-ONLINE\\backups\\db\\2026\\09\\ava-backup-2026-09-02T22-18-58-977Z.json";
  
  console.log("Loading backup file...");
  const backupData = JSON.parse(fs.readFileSync(backupPath, "utf-8")).data;
  
  const backupAnswers = backupData.answers || [];
  const backupOptions = backupData.questionOptions || [];
  
  console.log(`Found ${backupAnswers.length} answers and ${backupOptions.length} options in backup.`);
  
  // Find answers in DB that have selectedOptionId = null but type is MULTIPLE_CHOICE
  const dbAnswersToFix = await prisma.answer.findMany({
    where: {
      selectedOptionId: null,
      question: {
        type: "MULTIPLE_CHOICE"
      }
    },
    include: {
      question: true
    }
  });
  
  console.log(`Found ${dbAnswersToFix.length} orphaned MULTIPLE_CHOICE answers in the database.`);
  
  let fixedCount = 0;
  let missingCount = 0;
  
  for (const dbAnswer of dbAnswersToFix) {
    // Find the answer in backup
    const bAnswer = backupAnswers.find((a: any) => a.id === dbAnswer.id);
    if (!bAnswer) {
      continue;
    }
    if (!bAnswer.selectedOptionId) {
      console.log(`Answer ${dbAnswer.id} has null selectedOptionId in backup.`);
      if (++missingCount >= 2) break;
      continue;
    }
    
    // Find the option in backup
    const bOption = backupOptions.find((o: any) => o.id === bAnswer.selectedOptionId);
    if (!bOption) {
      continue;
    }
    
    // Find the equivalent option in the current DB by matching questionId and label (or content)
    const currentOptions = await prisma.questionOption.findMany({
      where: {
        questionId: dbAnswer.questionId
      }
    });
    
    const matchingCurrentOption = currentOptions.find(o => o.label === bOption.label || o.content === bOption.content);
    
    if (matchingCurrentOption) {
      await prisma.answer.update({
        where: { id: dbAnswer.id },
        data: { selectedOptionId: matchingCurrentOption.id }
      });
      fixedCount++;
      console.log(`Fixed answer ${dbAnswer.id} -> new option ${matchingCurrentOption.id} (was ${bOption.label})`);
    } else {
      console.log(`Could not find matching current option for answer ${dbAnswer.id}. Backup option: [${bOption.label}] ${bOption.content}`);
      console.log(`Available current options for Q ${dbAnswer.questionId}:`, currentOptions.map(o => `[${o.label}] ${o.content}`));
      if (++missingCount >= 2) break;
    }
  }
  
  console.log(`Successfully fixed ${fixedCount} answers!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
