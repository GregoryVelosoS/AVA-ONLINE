ALTER TABLE `Question`
    MODIFY `context` TEXT NULL,
    MODIFY `statement` TEXT NOT NULL,
    MODIFY `supportCode` TEXT NULL,
    MODIFY `expectedFeedback` TEXT NULL,
    MODIFY `answerExplanation` TEXT NULL,
    MODIFY `studyTopics` TEXT NULL,
    MODIFY `studyLinks` TEXT NULL,
    MODIFY `referencePlaylist` TEXT NULL,
    MODIFY `complementaryNotes` TEXT NULL;

ALTER TABLE `QuestionOption`
    MODIFY `content` TEXT NOT NULL;
