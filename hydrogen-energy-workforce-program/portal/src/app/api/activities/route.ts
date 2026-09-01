import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { saveActivityPhotos, validateActivityPhotos } from "@/lib/uploads";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const activities = await prisma.activity.findMany({
    include: { photos: { orderBy: { order: "asc" } } },
    orderBy: { activityDate: "desc" },
  });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 활동을 등록할 수 있습니다." }, { status: 403 });
  }

  const formData = await req.formData();
  const title = formData.get("title");
  const description = formData.get("description");
  const activityDate = formData.get("activityDate");
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  if (typeof title !== "string" || typeof description !== "string" || typeof activityDate !== "string" || !title || !description || !activityDate) {
    return NextResponse.json({ error: "제목, 내용, 날짜를 모두 입력하세요." }, { status: 400 });
  }

  const photoError = validateActivityPhotos(photos);
  if (photoError) return NextResponse.json({ error: photoError }, { status: 400 });

  const activity = await prisma.activity.create({
    data: {
      title,
      description,
      activityDate: new Date(activityDate),
      createdById: session.sub,
    },
  });

  await saveActivityPhotos(activity.id, photos, 0);

  const result = await prisma.activity.findUnique({
    where: { id: activity.id },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(result, { status: 201 });
}
