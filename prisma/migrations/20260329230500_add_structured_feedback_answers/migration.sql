-- AlterTable
ALTER TABLE `FeedbackFormResponse`
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `FeedbackAnswer` (
    `id` VARCHAR(191) NOT NULL,
    `feedbackId` VARCHAR(191) NOT NULL,
    `questionKey` ENUM(
        'GENERAL_DIFFICULTY',
        'DIFFICULT_CONTENTS',
        'COMMON_DIFFICULTY_TYPE',
        'SELF_PERFORMANCE',
        'EXPLANATION_CLARITY',
        'CLASS_PACE',
        'EXERCISE_USEFULNESS',
        'SOLO_CONFIDENCE',
        'HELPFUL_CLASS_FORMATS',
        'NEEDS_REVIEW',
        'TOOL_DIFFICULTIES',
        'FINAL_COMMENT'
    ) NOT NULL,
    `answerType` ENUM('SINGLE_CHOICE', 'MULTI_SELECT', 'LINEAR_SCALE', 'OPEN_TEXT') NOT NULL,
    `valueText` TEXT NULL,
    `valueScale` INTEGER NULL,
    `selectedOptions` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `FeedbackAnswer_feedbackId_questionKey_key`(`feedbackId`, `questionKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FeedbackAnswer`
    ADD CONSTRAINT `FeedbackAnswer_feedbackId_fkey`
    FOREIGN KEY (`feedbackId`) REFERENCES `FeedbackFormResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
