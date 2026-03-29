-- AlterTable
ALTER TABLE `Exam`
    ADD COLUMN `publicCode` VARCHAR(191) NOT NULL DEFAULT '';

-- CreateTable
CREATE TABLE `ReportShareLink` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReportShareLink_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IssueReport` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('SUGGESTION', 'BUG', 'QUESTION') NOT NULL,
    `status` ENUM('NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED') NOT NULL DEFAULT 'NEW',
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `sourcePath` VARCHAR(191) NOT NULL,
    `sourceUrl` VARCHAR(191) NULL,
    `contextLabel` VARCHAR(191) NULL,
    `screenshotPath` VARCHAR(191) NULL,
    `screenshotName` VARCHAR(191) NULL,
    `screenshotMime` VARCHAR(191) NULL,
    `adminUserId` VARCHAR(191) NULL,
    `examId` VARCHAR(191) NULL,
    `attemptId` VARCHAR(191) NULL,
    `internalNotes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Backfill publicCode with current ids until admin edits them
UPDATE `Exam`
SET `publicCode` = UPPER(SUBSTRING(REPLACE(`id`, '-', ''), 1, 8))
WHERE `publicCode` = '' OR `publicCode` IS NULL;

ALTER TABLE `Exam`
    MODIFY `publicCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Exam_publicCode_key` ON `Exam`(`publicCode`);

-- AddForeignKey
ALTER TABLE `ReportShareLink`
    ADD CONSTRAINT `ReportShareLink_examId_fkey`
    FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReportShareLink`
    ADD CONSTRAINT `ReportShareLink_createdBy_fkey`
    FOREIGN KEY (`createdBy`) REFERENCES `AdminUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueReport`
    ADD CONSTRAINT `IssueReport_adminUserId_fkey`
    FOREIGN KEY (`adminUserId`) REFERENCES `AdminUser`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueReport`
    ADD CONSTRAINT `IssueReport_examId_fkey`
    FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueReport`
    ADD CONSTRAINT `IssueReport_attemptId_fkey`
    FOREIGN KEY (`attemptId`) REFERENCES `StudentAttempt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
