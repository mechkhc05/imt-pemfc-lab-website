import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";

// Configurable so a hosting platform's persistent volume (e.g. /data/uploads)
// can be mounted outside the app's source tree; defaults to public/uploads for
// local dev. Files are served through /api/public/uploads/[...path], not by
// Next's static /public handling, so this can point anywhere.
export const UPLOADS_ROOT = process.env.UPLOADS_ROOT || path.join(process.cwd(), "public", "uploads");
const UPLOADS_URL_PREFIX = "/api/public/uploads";

/** Resolves a stored attachment/photo URL back to its file on disk, rejecting anything outside UPLOADS_ROOT. */
export function uploadUrlToPath(url: string): string {
  if (!url.startsWith(`${UPLOADS_URL_PREFIX}/`)) {
    throw new Error(`Not an uploads URL: ${url}`);
  }
  const relative = url.slice(UPLOADS_URL_PREFIX.length + 1);
  const resolved = path.resolve(UPLOADS_ROOT, relative);
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) {
    throw new Error(`Path escapes uploads root: ${url}`);
  }
  return resolved;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export function validateActivityPhotos(photos: File[]): string | null {
  for (const photo of photos) {
    if (!ALLOWED_IMAGE_TYPES.includes(photo.type)) {
      return `지원하지 않는 이미지 형식입니다: ${photo.name}`;
    }
    if (photo.size > MAX_IMAGE_SIZE) {
      return `이미지 용량은 8MB를 넘을 수 없습니다: ${photo.name}`;
    }
  }
  return null;
}

export async function saveActivityPhotos(activityId: string, photos: File[], startOrder: number) {
  if (photos.length === 0) return;

  const uploadDir = path.join(UPLOADS_ROOT, "activities", activityId);
  await mkdir(uploadDir, { recursive: true });

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const ext = EXT_BY_TYPE[photo.type] ?? "";
    const filename = `${startOrder + i}-${Date.now()}-${i}${ext}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer);
    await prisma.activityPhoto.create({
      data: {
        activityId,
        url: `${UPLOADS_URL_PREFIX}/activities/${activityId}/${filename}`,
        order: startOrder + i,
      },
    });
  }
}

// Validated by extension rather than MIME type: browsers/OS report inconsistent
// (often generic or empty) MIME types for .hwp/.hwpx, which Korean users commonly attach.
export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".hwp",
  ".hwpx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".zip",
];
export const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

function extOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

export function validateReportAttachments(files: File[]): string | null {
  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(extOf(file.name))) {
      return `지원하지 않는 파일 형식입니다: ${file.name}`;
    }
    if (file.size > MAX_ATTACHMENT_SIZE) {
      return `파일 용량은 20MB를 넘을 수 없습니다: ${file.name}`;
    }
  }
  return null;
}

export async function saveReportAttachments(reportId: string, files: File[]) {
  if (files.length === 0) return;

  const uploadDir = path.join(UPLOADS_ROOT, "reports", reportId);
  await mkdir(uploadDir, { recursive: true });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = extOf(file.name);
    const storedName = `${i}-${Date.now()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, storedName), buffer);
    await prisma.reportAttachment.create({
      data: {
        reportId,
        filename: file.name,
        url: `${UPLOADS_URL_PREFIX}/reports/${reportId}/${storedName}`,
        size: file.size,
        order: i,
      },
    });
  }
}
