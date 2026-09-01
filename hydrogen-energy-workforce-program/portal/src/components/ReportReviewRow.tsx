"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReportReviewRow({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReview() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewerComment: comment }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
      <textarea
        className="input flex-1"
        rows={2}
        placeholder="검토 코멘트 (선택)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <button
        onClick={handleReview}
        disabled={loading}
        className="shrink-0 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "처리 중..." : "검토 완료"}
      </button>
    </div>
  );
}
