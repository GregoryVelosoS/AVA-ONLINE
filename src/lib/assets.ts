export function isExternalAssetPath(value?: string | null) {
  return Boolean(value && /^(https?:)?\/\//i.test(value));
}

export function getQuestionSupportAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (isExternalAssetPath(value)) {
    return value;
  }

  return `/api/assets/question-support/${value}`;
}

export function getIssueReportScreenshotUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (isExternalAssetPath(value)) {
    return value;
  }

  return `/api/assets/issue-reports/${value}`;
}
