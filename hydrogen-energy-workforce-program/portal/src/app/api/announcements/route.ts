import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const activeOnly = req.nextUrl.searchParams.get("active") === "1";
  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: activeOnly ? { startDate: { lte: now }, endDate: { gte: now } } : {},
    orderBy: { startDate: "desc" },
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 공지를 등록할 수 있습니다." }, { status: 403 });
  }

  const { title, body, startDate, endDate } = await req.json();
  if (!title || !body || !startDate || !endDate) {
    return NextResponse.json({ error: "제목, 내용, 노출 기간을 모두 입력하세요." }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      body,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdById: session.sub,
    },
  });

  return NextResponse.json(announcement, { status: 201 });
}
