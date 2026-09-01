import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "REVIEWER") {
    return NextResponse.json({ error: "검토 권한이 없습니다." }, { status: 403 });
  }

  const { id } = await params;
  const { reviewerComment } = await req.json();

  const report = await prisma.report.update({
    where: { id },
    data: {
      reviewerComment: reviewerComment ?? null,
      status: "REVIEWED",
      reviewedById: session.sub,
      reviewedAt: new Date(),
    },
  });

  return NextResponse.json(report);
}
