export function splitResourceText(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

export function getQuestionStudyTopics(input: {
  studyTopics?: string | null;
  subject?: string | null;
  topic?: string | null;
}) {
  const explicitTopics = splitResourceText(input.studyTopics);
  const fallbackTopics = [input.subject, input.topic].map((item) => item?.trim()).filter(Boolean) as string[];

  return uniqueValues(explicitTopics.length > 0 ? explicitTopics : fallbackTopics);
}
