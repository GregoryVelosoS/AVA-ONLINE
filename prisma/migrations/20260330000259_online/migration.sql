-- AlterTable
ALTER TABLE `FeedbackAnswer` MODIFY `valueText` VARCHAR(191) NULL,
    MODIFY `selectedOptions` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `FeedbackFormResponse` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `IssueReport` MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `internalNotes` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Question` MODIFY `supportCode` VARCHAR(191) NULL,
    MODIFY `studyTopics` VARCHAR(191) NULL,
    MODIFY `studyLinks` VARCHAR(191) NULL,
    MODIFY `complementaryNotes` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ReportShareLink` ALTER COLUMN `updatedAt` DROP DEFAULT;
