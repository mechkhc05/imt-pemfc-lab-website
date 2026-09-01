import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AnnouncementForm } from "@/components/AnnouncementForm";
import { AnnouncementCard } from "@/components/AnnouncementCard";

export default async function AnnouncementsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const announcements = await prisma.announcement.findMany({ orderBy: { startDate: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">공지사항</h1>
        {isAdmin && <AnnouncementForm />}
      </div>

      {announcements.length === 0 ? (
        <p className="text-sm text-gray-500">등록된 공지가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
