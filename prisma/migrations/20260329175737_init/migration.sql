-- CreateTable
CREATE TABLE `AdminUser` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AdminUser_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Discipline` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Discipline_code_key`(`code`),
    UNIQUE INDEX `Discipline_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassGroup` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `disciplineId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ClassGroup_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Tag_label_key`(`label`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Question` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `type` ENUM('MULTIPLE_CHOICE', 'SHORT_TEXT', 'LONG_TEXT', 'FILE_UPLOAD') NOT NULL,
    `title` VARCHAR(191) NULL,
    `disciplineId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `topic` VARCHAR(191) NULL,
    `difficulty` ENUM('EASY', 'MEDIUM', 'HARD') NOT NULL,
    `context` VARCHAR(191) NULL,
    `statement` VARCHAR(191) NOT NULL,
    `expectedFeedback` VARCHAR(191) NULL,
    `answerExplanation` VARCHAR(191) NULL,
    `defaultWeight` DECIMAL(65, 30) NOT NULL DEFAULT 1,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `archivedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Question_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionOption` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `isCorrect` BOOLEAN NOT NULL,
    `position` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `QuestionTag` (
    `questionId` VARCHAR(191) NOT NULL,
    `tagId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`questionId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exam` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `disciplineId` VARCHAR(191) NOT NULL,
    `targetClassGroupId` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NOT NULL,
    `startAt` DATETIME(3) NOT NULL,
    `endAt` DATETIME(3) NOT NULL,
    `timeLimitMinutes` INTEGER NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `showScoreAfterSubmit` BOOLEAN NOT NULL DEFAULT false,
    `maxAttempts` INTEGER NOT NULL DEFAULT 1,
    `randomizeQuestions` BOOLEAN NOT NULL DEFAULT false,
    `randomizeOptions` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamSection` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExamQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `position` INTEGER NOT NULL,
    `customWeight` DECIMAL(65, 30) NULL,
    `isRequired` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `ExamQuestion_examId_position_key`(`examId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PublicExamLink` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `validFrom` DATETIME(3) NULL,
    `validUntil` DATETIME(3) NULL,
    `maxUses` INTEGER NULL,
    `usedCount` INTEGER NOT NULL DEFAULT 0,
    `closedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PublicExamLink_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `examId` VARCHAR(191) NOT NULL,
    `publicLinkId` VARCHAR(191) NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `status` ENUM('STARTED', 'IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'CANCELED') NOT NULL DEFAULT 'STARTED',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `submittedAt` DATETIME(3) NULL,
    `autoScore` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `manualScore` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `finalScore` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `durationSeconds` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StudentAttempt_examId_status_idx`(`examId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StudentProfileSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `studentName` VARCHAR(191) NOT NULL,
    `classGroupName` VARCHAR(191) NOT NULL,
    `disciplineInformed` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `StudentProfileSnapshot_attemptId_key`(`attemptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Answer` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `selectedOptionId` VARCHAR(191) NULL,
    `shortTextAnswer` VARCHAR(191) NULL,
    `longTextAnswer` VARCHAR(191) NULL,
    `isCorrect` BOOLEAN NULL,
    `autoScore` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `manualScore` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `finalScore` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `confidenceLevel` INTEGER NOT NULL,
    `answeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Answer_attemptId_questionId_key`(`attemptId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AnswerAttachment` (
    `id` VARCHAR(191) NOT NULL,
    `answerId` VARCHAR(191) NOT NULL,
    `storageProvider` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `sizeBytes` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManualCorrection` (
    `id` VARCHAR(191) NOT NULL,
    `answerId` VARCHAR(191) NOT NULL,
    `reviewerId` VARCHAR(191) NOT NULL,
    `score` DECIMAL(65, 30) NOT NULL,
    `comment` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'REVIEWED', 'RETURNED') NOT NULL DEFAULT 'PENDING',
    `reviewedAt` DATETIME(3) NULL,

    UNIQUE INDEX `ManualCorrection_answerId_key`(`answerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeedbackFormResponse` (
    `id` VARCHAR(191) NOT NULL,
    `attemptId` VARCHAR(191) NOT NULL,
    `clarityScore` INTEGER NOT NULL,
    `difficultyScore` INTEGER NOT NULL,
    `timeAdequacyScore` INTEGER NOT NULL,
    `contentAlignmentScore` INTEGER NOT NULL,
    `selfAssessmentScore` INTEGER NOT NULL,
    `confusingQuestionFlag` BOOLEAN NOT NULL,
    `openComment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FeedbackFormResponse_attemptId_key`(`attemptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClassGroup` ADD CONSTRAINT `ClassGroup_disciplineId_fkey` FOREIGN KEY (`disciplineId`) REFERENCES `Discipline`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_disciplineId_fkey` FOREIGN KEY (`disciplineId`) REFERENCES `Discipline`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `AdminUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionOption` ADD CONSTRAINT `QuestionOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionTag` ADD CONSTRAINT `QuestionTag_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `QuestionTag` ADD CONSTRAINT `QuestionTag_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_disciplineId_fkey` FOREIGN KEY (`disciplineId`) REFERENCES `Discipline`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_targetClassGroupId_fkey` FOREIGN KEY (`targetClassGroupId`) REFERENCES `ClassGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exam` ADD CONSTRAINT `Exam_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `AdminUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamSection` ADD CONSTRAINT `ExamSection_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamQuestion` ADD CONSTRAINT `ExamQuestion_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamQuestion` ADD CONSTRAINT `ExamQuestion_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExamQuestion` ADD CONSTRAINT `ExamQuestion_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `ExamSection`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PublicExamLink` ADD CONSTRAINT `PublicExamLink_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentAttempt` ADD CONSTRAINT `StudentAttempt_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `Exam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentAttempt` ADD CONSTRAINT `StudentAttempt_publicLinkId_fkey` FOREIGN KEY (`publicLinkId`) REFERENCES `PublicExamLink`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StudentProfileSnapshot` ADD CONSTRAINT `StudentProfileSnapshot_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `StudentAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `StudentAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_selectedOptionId_fkey` FOREIGN KEY (`selectedOptionId`) REFERENCES `QuestionOption`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AnswerAttachment` ADD CONSTRAINT `AnswerAttachment_answerId_fkey` FOREIGN KEY (`answerId`) REFERENCES `Answer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualCorrection` ADD CONSTRAINT `ManualCorrection_answerId_fkey` FOREIGN KEY (`answerId`) REFERENCES `Answer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualCorrection` ADD CONSTRAINT `ManualCorrection_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `AdminUser`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeedbackFormResponse` ADD CONSTRAINT `FeedbackFormResponse_attemptId_fkey` FOREIGN KEY (`attemptId`) REFERENCES `StudentAttempt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
