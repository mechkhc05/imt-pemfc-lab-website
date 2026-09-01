import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const matches = await prisma.match.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(matches);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자만 매칭 정보를 등록할 수 있습니다." }, { status: 403 });
  }

  const body = await req.json();
  const { studentName, studentId, program, companyName, projectTitle, startDate, endDate, advisorName, status } = body;

  if (!studentName || !studentId || !program || !companyName || !projectTitle || !startDate || !endDate || !advisorName) {
    return NextResponse.json({ error: "필수 항목을 모두 입력하세요." }, { status: 400 });
  }

  const company = await prisma.company.upsert({
    where: { name: companyName },
    update: {},
    create: { name: companyName },
  });

  const match = await prisma.match.create({
    data: {
      studentName,
      studentId,
      program,
      companyId: company.id,
      projectTitle,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      advisorName,
      status: status || "ACTIVE",
    },
    include: { company: true },
  });

  return NextResponse.json(match, { status: 201 });
}
