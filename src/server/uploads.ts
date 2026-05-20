import {
  BlobAccessError,
  BlobClientTokenExpiredError,
  BlobContentTypeNotAllowedError,
  BlobFileTooLargeError,
  BlobPathnameMismatchError,
  BlobServiceNotAvailable,
  BlobServiceRateLimited,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  del,
  put
} from "@vercel/blob";
import { randomUUID } from "crypto";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import path from "path";

const uploadRoot = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "./uploads");
const questionSupportDir = path.join(uploadRoot, "question-support");
const issueReportsDir = path.join(uploadRoot, "issue-reports");
const blobToken = normalizeEnvToken(process.env.BLOB_READ_WRITE_TOKEN);
const isVercelRuntime = process.env.VERCEL === "1";

export class BlobUploadFailure extends Error {
  constructor(
    public readonly code: string,
    public readonly detail: string
  ) {
    super("BLOB_UPLOAD_FAILED");
  }
}

function normalizeEnvToken(value?: string) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/^["'](.+)["']$/, "$1");
}

function sanitizeFileNamePart(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "");
}

function getExtension(fileName: string) {
  const ext = path.extname(fileName);
  return ext ? ext.slice(0, 12) : "";
}

function isBlobStorageEnabled() {
  return Boolean(blobToken);
}

export function getUploadStorageDiagnostics() {
  return {
    hasBlobToken: isBlobStorageEnabled(),
    isVercelRuntime,
    mode: isBlobStorageEnabled() ? "blob" : "local"
  };
}

function assertWritableStorage() {
  if (isVercelRuntime && !isBlobStorageEnabled()) {
    throw new Error("MISSING_BLOB_STORAGE");
  }
}

function getBlobUploadErrorCode(error: unknown) {
  if (error instanceof BlobAccessError) {
    return "blob_access_denied";
  }

  if (error instanceof BlobStoreNotFoundError) {
    return "blob_store_not_found";
  }

  if (error instanceof BlobStoreSuspendedError) {
    return "blob_store_suspended";
  }

  if (error instanceof BlobFileTooLargeError) {
    return "blob_file_too_large";
  }

  if (error instanceof BlobContentTypeNotAllowedError) {
    return "blob_content_type_not_allowed";
  }

  if (error instanceof BlobPathnameMismatchError) {
    return "blob_pathname_mismatch";
  }

  if (error instanceof BlobClientTokenExpiredError) {
    return "blob_client_token_expired";
  }

  if (error instanceof BlobServiceNotAvailable) {
    return "blob_service_not_available";
  }

  if (error instanceof BlobServiceRateLimited) {
    return "blob_rate_limited";
  }

  return "blob_unknown_error";
}

function getSafeErrorDetail(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);

  if (!blobToken) {
    return detail;
  }

  return detail.replaceAll(blobToken, "[redacted]");
}

export function isExternalAssetPath(value?: string | null) {
  return Boolean(value && /^(https?:)?\/\//i.test(value));
}

export function isManagedBlobUrl(value?: string | null) {
  return Boolean(value && /vercel-storage\.com/i.test(value));
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

export async function ensureUploadDirectories() {
  if (isBlobStorageEnabled()) {
    return;
  }

  await mkdir(questionSupportDir, { recursive: true });
  await mkdir(issueReportsDir, { recursive: true });
}

async function uploadToBlob(input: {
  folder: "question-support" | "issue-reports";
  prefix: string;
  data: Uint8Array;
  originalName: string;
  mimeType: string;
}) {
  const extension = sanitizeFileNamePart(getExtension(input.originalName));
  const blobPath = `${input.folder}/${input.prefix}-${randomUUID()}${extension}`;

  try {
    const blob = await put(blobPath, Buffer.from(input.data), {
      access: "public",
      addRandomSuffix: false,
      contentType: input.mimeType,
      token: blobToken
    });

    return blob.url;
  } catch (error) {
    const errorCode = getBlobUploadErrorCode(error);
    const errorDetail = getSafeErrorDetail(error);

    console.error("Vercel Blob upload failed", {
      folder: input.folder,
      prefix: input.prefix,
      mimeType: input.mimeType,
      hasBlobToken: Boolean(blobToken),
      isVercelRuntime,
      errorCode,
      error: errorDetail
    });

    throw new BlobUploadFailure(errorCode, errorDetail);
  }
}

export async function saveQuestionSupportAsset(input: {
  data: Uint8Array;
  originalName: string;
  mimeType: string;
  kind: "image" | "file";
}) {
  if (isBlobStorageEnabled()) {
    return uploadToBlob({
      folder: "question-support",
      prefix: input.kind,
      data: input.data,
      originalName: input.originalName,
      mimeType: input.mimeType
    });
  }

  assertWritableStorage();
  await ensureUploadDirectories();

  const extension = sanitizeFileNamePart(getExtension(input.originalName));
  const fileName = `${input.kind}-${randomUUID()}${extension}`;
  const target = path.join(questionSupportDir, fileName);

  await writeFile(target, input.data);

  return fileName;
}

export async function readQuestionSupportAsset(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("INVALID_ASSET_PATH");
  }

  const target = path.join(questionSupportDir, safeName);
  return readFile(target);
}

export async function deleteManagedQuestionSupportAsset(fileName?: string | null) {
  if (!fileName) {
    return;
  }

  if (isManagedBlobUrl(fileName)) {
    await del(fileName, { token: blobToken });
    return;
  }

  if (isExternalAssetPath(fileName)) {
    return;
  }

  const safeName = path.basename(fileName);
  if (safeName !== fileName) {
    return;
  }

  const target = path.join(questionSupportDir, safeName);
  await rm(target, { force: true });
}

export async function saveIssueReportScreenshot(input: {
  data: Uint8Array;
  originalName: string;
  mimeType: string;
}) {
  if (isBlobStorageEnabled()) {
    return uploadToBlob({
      folder: "issue-reports",
      prefix: "issue",
      data: input.data,
      originalName: input.originalName,
      mimeType: input.mimeType
    });
  }

  assertWritableStorage();
  await ensureUploadDirectories();

  const extension = sanitizeFileNamePart(getExtension(input.originalName));
  const fileName = `issue-${randomUUID()}${extension}`;
  const target = path.join(issueReportsDir, fileName);

  await writeFile(target, input.data);

  return fileName;
}

export async function readIssueReportScreenshot(fileName: string) {
  const safeName = path.basename(fileName);

  if (safeName !== fileName) {
    throw new Error("INVALID_ASSET_PATH");
  }

  const target = path.join(issueReportsDir, safeName);
  return readFile(target);
}

export async function deleteManagedIssueReportScreenshot(fileName?: string | null) {
  if (!fileName) {
    return;
  }

  if (isManagedBlobUrl(fileName)) {
    await del(fileName, { token: blobToken });
    return;
  }

  if (isExternalAssetPath(fileName)) {
    return;
  }

  const safeName = path.basename(fileName);
  if (safeName !== fileName) {
    return;
  }

  const target = path.join(issueReportsDir, safeName);
  await rm(target, { force: true });
}
