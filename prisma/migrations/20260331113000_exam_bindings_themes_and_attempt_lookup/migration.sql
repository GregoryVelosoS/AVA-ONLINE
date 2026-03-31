CREATE TABLE `Theme` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Theme_code_key`(`code`),
    UNIQUE INDEX `Theme_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ExamTheme` (
    `examId` VARCHAR(191) NOT NULL,
    `themeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`examId`, `themeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `QuestionTheme` (
    `questionId` VARCHAR(191) NOT NULL,
    `themeId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`questionId`, `themeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `StudentAttempt`
    ADD COLUMN `resultLookupCode` VARCHAR(191) NULL;

UPDATE `StudentAttempt`
SET `resultLookupCode` = CONCAT('TENT-', UPPER(SUBSTRING(REPLACE(`id`, '-', ''), 1, 10)))
WHERE `resultLookupCode` IS NULL OR `resultLookupCode` = '';

ALTER TABLE `StudentAttempt`
    MODIFY `resultLookupCode` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `StudentAttempt_resultLookupCode_key` ON `StudentAttempt`(`resultLookupCode`);

ALTER TABLE `StudentProfileSnapshot`
    ADD COLUMN `classGroupId` VARCHAR(191) NULL,
    ADD COLUMN `disciplineId` VARCHAR(191) NULL,
    ADD COLUMN `attemptOrigin` VARCHAR(191) NULL,
    ADD COLUMN `contextValidationNote` TEXT NULL;

INSERT INTO `ClassGroup` (`id`, `code`, `name`, `disciplineId`, `createdAt`, `updatedAt`)
SELECT
    REPLACE(UUID(), '-', ''),
    CONCAT('AUTO-', UPPER(SUBSTRING(REPLACE(`d`.`id`, '-', ''), 1, 6))),
    CONCAT('Turma vinculada automaticamente - ', `d`.`name`),
    `d`.`id`,
    NOW(3),
    NOW(3)
FROM `Discipline` `d`
WHERE EXISTS (
    SELECT 1
    FROM `Exam` `e`
    WHERE `e`.`disciplineId` = `d`.`id`
      AND `e`.`targetClassGroupId` IS NULL
)
AND NOT EXISTS (
    SELECT 1
    FROM `ClassGroup` `cg`
    WHERE `cg`.`code` = CONCAT('AUTO-', UPPER(SUBSTRING(REPLACE(`d`.`id`, '-', ''), 1, 6)))
);

UPDATE `Exam` `e`
JOIN `Discipline` `d` ON `d`.`id` = `e`.`disciplineId`
JOIN `ClassGroup` `cg` ON `cg`.`code` = CONCAT('AUTO-', UPPER(SUBSTRING(REPLACE(`d`.`id`, '-', ''), 1, 6)))
SET `e`.`targetClassGroupId` = `cg`.`id`
WHERE `e`.`targetClassGroupId` IS NULL;

UPDATE `StudentProfileSnapshot` `s`
JOIN `StudentAttempt` `a` ON `a`.`id` = `s`.`attemptId`
JOIN `Exam` `e` ON `e`.`id` = `a`.`examId`
JOIN `ClassGroup` `cg` ON `cg`.`id` = `e`.`targetClassGroupId`
JOIN `Discipline` `d` ON `d`.`id` = `e`.`disciplineId`
SET
    `s`.`classGroupId` = `cg`.`id`,
    `s`.`classGroupName` = `cg`.`name`,
    `s`.`disciplineId` = `d`.`id`,
    `s`.`disciplineInformed` = `d`.`name`,
    `s`.`attemptOrigin` = COALESCE(`s`.`attemptOrigin`, 'LEGACY_PUBLIC');

ALTER TABLE `Exam`
    DROP FOREIGN KEY `Exam_targetClassGroupId_fkey`;

ALTER TABLE `Exam`
    MODIFY `targetClassGroupId` VARCHAR(191) NOT NULL;

ALTER TABLE `Exam`
    ADD CONSTRAINT `Exam_targetClassGroupId_fkey`
        FOREIGN KEY (`targetClassGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `ExamTheme`
    ADD CONSTRAINT `ExamTheme_examId_fkey`
        FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `ExamTheme_themeId_fkey`
        FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `QuestionTheme`
    ADD CONSTRAINT `QuestionTheme_questionId_fkey`
        FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `QuestionTheme_themeId_fkey`
        FOREIGN KEY (`themeId`) REFERENCES `Theme`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
