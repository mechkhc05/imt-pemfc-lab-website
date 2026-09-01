import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveReportAttachments, validateReportAttachments } from "@/lib/uploads";

// Public, unauthenticated report submission. Re-verifies studentName+studentId
// server-side on every call rather than trusting a matchId from the client,
// so a student can only ever submit against their own match.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const studentName = formData.get("studentName");
  const studentId = formData.get("studentId");
  const periodStart = formData.get("periodStart");
  const periodEnd = formData.get("periodEnd");
  const content = formData.get("content");
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

  if (typeof studentName !== "string" || typeof studentId !== "string" || !studentName || !studentId) {
    return NextResponse.json({ error: "이름과 학번을 모두 입력하세요." }, { status: 400 });
  }
  if (typeof periodStart !== "string" || typeof periodEnd !== "string" || typeof content !== "string" || !periodStart || !periodEnd || !content) {
    return NextResponse.json({ error: "기간과 내용을 모두 입력하세요." }, { status: 400 });
  }

  const attachmentError = validateReportAttachments(files);
  if (attachmentError) return NextResponse.json({ error: attachmentError }, { status: 400 });

  const match = await prisma.match.findFirst({
    where: { studentName: studentName.trim(), studentId: studentId.trim() },
    orderBy: { createdAt: "desc" },
  });
  if (!match) {
    return NextResponse.json(
      { error: "일치하는 매칭 정보를 찾을 수 없습니다. 이름/학번을 확인하거나 담당 교수에게 문의하세요." },
      { status: 404 },
    );
  }

  const report = await prisma.report.create({
    data: {
      matchId: match.id,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      content,
    },
  });

  await saveReportAttachments(report.id, files);

  const result = await prisma.report.findUnique({
    where: { id: report.id },
    include: { attachments: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(result, { status: 201 });
}
