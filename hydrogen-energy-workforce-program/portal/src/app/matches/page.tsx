import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PROGRAM_LABEL, MATCH_STATUS_LABEL, formatDate } from "@/lib/labels";
import { MatchForm } from "@/components/MatchForm";

export default async function MatchesPage() {
  const session = await getSession();
  if (!session) return null;

  const matches = await prisma.match.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">매칭 정보</h1>
        {session.role === "ADMIN" && <MatchForm />}
      </div>

      {matches.length === 0 ? (
        <p className="text-sm text-gray-500">등록된 매칭 정보가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-3 py-2">학생</th>
                <th className="px-3 py-2">학번</th>
                <th className="px-3 py-2">과정</th>
                <th className="px-3 py-2">기업</th>
                <th className="px-3 py-2">산학프로젝트 주제</th>
                <th className="px-3 py-2">참여 기간</th>
                <th className="px-3 py-2">지도교수</th>
                <th className="px-3 py-2">상태</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2">{m.studentName}</td>
                  <td className="px-3 py-2 text-gray-500">{m.studentId}</td>
                  <td className="px-3 py-2">{PROGRAM_LABEL[m.program]}</td>
                  <td className="px-3 py-2">{m.company.name}</td>
                  <td className="px-3 py-2">{m.projectTitle}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(m.startDate)} ~ {formatDate(m.endDate)}
                  </td>
                  <td className="px-3 py-2">{m.advisorName}</td>
                  <td className="px-3 py-2">{MATCH_STATUS_LABEL[m.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
