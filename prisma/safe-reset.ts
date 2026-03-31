import { spawnSync } from "child_process";
import { createSystemBackup } from "../src/server/services/system-backup";
import { prisma } from "../src/server/db/prisma";

function runCommand(command: string, args: string[]) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    shell: false,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  const shouldSeed = process.argv.includes("--seed");
  const backupOnly = process.argv.includes("--backup-only");

  try {
    const backup = await createSystemBackup({
      reason: backupOnly ? "manual-backup-script" : shouldSeed ? "pre-safe-reset-script-with-seed" : "pre-safe-reset-script"
    });

    console.log(`Backup criado em ${backup.relativePath}`);
  } finally {
    await prisma.$disconnect();
  }

  if (backupOnly) {
    return;
  }

  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
  runCommand(npxCommand, ["prisma", "migrate", "reset", "--force", "--skip-seed"]);

  if (shouldSeed) {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    runCommand(npmCommand, ["run", "prisma:seed"]);
  }
}

void main();
