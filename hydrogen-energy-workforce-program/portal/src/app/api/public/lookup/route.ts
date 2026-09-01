import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public, unauthenticated: a student looks themselves up by name + student ID
// (no login system for students — see README).
export async function POST(req: NextRequest) {
  const { studentName, studentId } = await req.json();
  if (!studentName || !studentId) {
    return NextResponse.json({ error: "이름과 학번을 모두 입력하세요." }, { status: 400 });
  }

  const match = await prisma.match.findFirst({
    where: { studentName: studentName.trim(), studentId: studentId.trim() },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  if (!match) {
    return NextResponse.json(
      { error: "일치하는 매칭 정보를 찾을 수 없습니다. 이름/학번을 확인하거나 담당 교수에게 문의하세요." },
      { status: 404 },
    );
  }

  const reports = await prisma.report.findMany({
    where: { matchId: match.id },
    include: { attachments: { orderBy: { order: "asc" } } },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ match, reports });
}
