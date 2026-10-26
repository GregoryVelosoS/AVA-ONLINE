export function isExternalAssetPath(value?: string | null) {
  return Boolean(value && /^(https?:)?\/\//i.test(value));
}

export function getQuestionSupportAssetUrl(value?: string | null) {
  if (!value) {
    return null;
  }

  if (isExternalAssetPath(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  if (value.startsWith("/api/assets/question-support/")) {
    return value;
  }

  const clean = value.replace(/^\/+/, "");
  return `/api/assets/question-support/${clean}`;
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
