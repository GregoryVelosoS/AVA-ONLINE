-- AlterTable
ALTER TABLE `IssueReport` MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `internalNotes` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `ReportShareLink` ALTER COLUMN `updatedAt` DROP DEFAULT;
