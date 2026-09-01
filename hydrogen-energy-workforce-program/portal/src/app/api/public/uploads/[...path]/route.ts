import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { UPLOADS_ROOT } from "@/lib/uploads";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".hwp": "application/x-hwp",
  ".hwpx": "application/haansofthwp",
  ".zip": "application/zip",
};

export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;

  // Reject traversal attempts before touching the filesystem.
  if (segments.some((s) => s === ".." || s.includes("/") || s.includes("\\"))) {
    return NextResponse.json({ error: "잘못된 경로입니다." }, { status: 400 });
  }

  const resolved = path.resolve(UPLOADS_ROOT, ...segments);
  if (!resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) {
    return NextResponse.json({ error: "잘못된 경로입니다." }, { status: 400 });
  }

  try {
    const info = await stat(resolved);
    if (!info.isFile()) throw new Error("not a file");
    const buffer = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
  }
}
