import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnnouncementPopup } from "@/components/AnnouncementPopup";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) return null;

  const [matchCount, pendingCount, announcementCount] = await Promise.all([
    prisma.match.count(),
    prisma.report.count({ where: { status: "SUBMITTED" } }),
    prisma.announcement.count(),
  ]);
  const cards: { href: string; title: string; desc: string }[] = [
    { href: "/matches", title: "전체 매칭 현황", desc: `${matchCount}건 등록됨` },
    { href: "/reports", title: "검토 대기 리포트", desc: `${pendingCount}건 대기 중` },
    { href: "/announcements", title: "공지사항 관리", desc: `${announcementCount}건 등록됨` },
  ];

  return (
    <div className="space-y-6">
      <AnnouncementPopup />
      <div>
        <h1 className="text-xl font-semibold">안녕하세요, {session.name}님</h1>
        <p className="mt-1 text-sm text-gray-500">수소에너지인력양성사업 포털입니다.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-400 dark:border-gray-800"
          >
            <p className="font-medium">{c.title}</p>
            <p className="mt-1 text-sm text-gray-500">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
