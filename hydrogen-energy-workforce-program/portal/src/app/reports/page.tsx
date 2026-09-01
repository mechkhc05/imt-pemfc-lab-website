import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { REPORT_STATUS_LABEL, formatDate } from "@/lib/labels";
import { ReportReviewRow } from "@/components/ReportReviewRow";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session) return null;

  const reports = await prisma.report.findMany({
    include: { match: { include: { company: true } }, reviewedBy: true, attachments: { orderBy: { order: "asc" } } },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">진행 리포트</h1>
        <p className="mt-1 text-sm text-gray-500">
          학생 제출은 로그인 없이{" "}
          <a href="/submit-report" className="text-blue-600 hover:underline dark:text-blue-400">
            /submit-report
          </a>
          에서 이루어집니다.
        </p>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm text-gray-500">제출된 리포트가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {r.match.studentName} ({r.match.studentId}) · {r.match.company.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(r.periodStart)} ~ {formatDate(r.periodEnd)}
                  </p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    r.status === "REVIEWED"
                      ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                  }`}
                >
                  {REPORT_STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm">{r.content}</p>
              {r.attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {r.attachments.map((a) => (
                    <li key={a.id}>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        📎 {a.filename}
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {r.status === "REVIEWED" && r.reviewerComment && (
                <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  검토자 코멘트 ({r.reviewedBy?.name}): {r.reviewerComment}
                </p>
              )}

              {r.status === "SUBMITTED" && (session.role === "ADMIN" || session.role === "REVIEWER") && (
                <ReportReviewRow reportId={r.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
