-- AlterTable
ALTER TABLE `Question`
    ADD COLUMN `visualSupportType` ENUM('NONE', 'ASSET', 'CODE') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `supportCode` TEXT NULL,
    ADD COLUMN `studyTopics` TEXT NULL,
    ADD COLUMN `studyLinks` TEXT NULL,
    ADD COLUMN `referencePlaylist` VARCHAR(191) NULL,
    ADD COLUMN `complementaryNotes` TEXT NULL;
