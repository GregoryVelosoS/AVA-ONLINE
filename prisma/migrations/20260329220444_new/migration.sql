-- AlterTable
ALTER TABLE `feedbackanswer` MODIFY `valueText` VARCHAR(191) NULL,
    MODIFY `selectedOptions` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `feedbackformresponse` ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `issuereport` MODIFY `description` VARCHAR(191) NOT NULL,
    MODIFY `internalNotes` VARCHAR(191) NULL,
    ALTER COLUMN `updatedAt` DROP DEFAULT;

-- AlterTable
ALTER TABLE `question` MODIFY `supportCode` VARCHAR(191) NULL,
    MODIFY `studyTopics` VARCHAR(191) NULL,
    MODIFY `studyLinks` VARCHAR(191) NULL,
    MODIFY `complementaryNotes` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reportsharelink` ALTER COLUMN `updatedAt` DROP DEFAULT;
