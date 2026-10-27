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

  if (value.startsWith("/assets/question-support/")) {
    return value;
  }

  if (value.startsWith("/api/assets/question-support/")) {
    const raw = value.replace("/api/assets/question-support/", "");
    return `/assets/question-support/${raw.replace(/^\/+/, "")}`;
  }

  const clean = value.replace(/^\/+/, "");
  return `/assets/question-support/${clean}`;
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
