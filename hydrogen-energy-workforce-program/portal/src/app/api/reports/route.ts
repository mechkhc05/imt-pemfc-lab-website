import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Student report submission is public and lives at /api/public/reports —
// this route is for the admin/reviewer review list only.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });

  const reports = await prisma.report.findMany({
    include: { match: { include: { company: true } }, reviewedBy: true },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json(reports);
}
