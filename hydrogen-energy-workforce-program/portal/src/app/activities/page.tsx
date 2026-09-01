import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActivityForm } from "@/components/ActivityForm";
import { ActivityCard } from "@/components/ActivityCard";

export default async function ActivitiesPage() {
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const activities = await prisma.activity.findMany({
    include: { photos: { orderBy: { order: "asc" } } },
    orderBy: { activityDate: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">활동 · 세미나</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            수소에너지인력양성사업단에서 진행한 세미나 및 학생 활동 소식입니다.
          </p>
        </div>
        {isAdmin && <ActivityForm />}
      </div>

      {activities.length === 0 ? (
        <p className="text-sm text-gray-500">등록된 활동이 없습니다.</p>
      ) : (
        <div className="space-y-8">
          {activities.map((a) => (
            <ActivityCard key={a.id} activity={a} isAdmin={isAdmin} />
          ))}
        </div>
      )}
    </div>
  );
}
