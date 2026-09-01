import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 공지를 수정할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "존재하지 않는 공지입니다." }, { status: 404 });

  const { title, body, startDate, endDate } = await req.json();
  if (!title || !body || !startDate || !endDate) {
    return NextResponse.json({ error: "제목, 내용, 노출 기간을 모두 입력하세요." }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: { title, body, startDate: new Date(startDate), endDate: new Date(endDate) },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 공지를 삭제할 수 있습니다." }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "존재하지 않는 공지입니다." }, { status: 404 });

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
