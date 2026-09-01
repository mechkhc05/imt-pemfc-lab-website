import { NextRequest, NextResponse } from "next/server";
import { rm, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { saveActivityPhotos, validateActivityPhotos, uploadUrlToPath, UPLOADS_ROOT } from "@/lib/uploads";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 활동을 수정할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.activity.findUnique({ where: { id }, include: { photos: true } });
  if (!existing) return NextResponse.json({ error: "존재하지 않는 활동입니다." }, { status: 404 });

  const formData = await req.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const activityDate = formData.get("activityDate");
  const newPhotos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const removePhotoIds = formData.getAll("removePhotoIds").filter((v): v is string => typeof v === "string");

  if (typeof title !== "string" || typeof description !== "string" || typeof activityDate !== "string" || !title || !description || !activityDate) {
    return NextResponse.json({ error: "제목, 내용, 날짜를 모두 입력하세요." }, { status: 400 });
  }

  const photoError = validateActivityPhotos(newPhotos);
  if (photoError) return NextResponse.json({ error: photoError }, { status: 400 });

  await prisma.activity.update({
    where: { id },
    data: { title, description, activityDate: new Date(activityDate) },
  });

  const toRemove = existing.photos.filter((p) => removePhotoIds.includes(p.id));
  for (const photo of toRemove) {
    await prisma.activityPhoto.delete({ where: { id: photo.id } });
    await unlink(uploadUrlToPath(photo.url)).catch(() => {});
  }

  const remaining = existing.photos.filter((p) => !removePhotoIds.includes(p.id));
  const nextOrder = remaining.length > 0 ? Math.max(...remaining.map((p) => p.order)) + 1 : 0;
  await saveActivityPhotos(id, newPhotos, nextOrder);

  const result = await prisma.activity.findUnique({
    where: { id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(result);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 활동을 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const activity = await prisma.activity.findUnique({ where: { id } });
  if (!activity) return NextResponse.json({ error: "존재하지 않는 활동입니다." }, { status: 404 });

  await prisma.activityPhoto.deleteMany({ where: { activityId: id } });
  await prisma.activity.delete({ where: { id } });
  await rm(path.join(UPLOADS_ROOT, "activities", id), { recursive: true, force: true });

  return NextResponse.json({ ok: true });
}
