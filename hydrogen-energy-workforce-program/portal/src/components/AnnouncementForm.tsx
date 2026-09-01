"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function AnnouncementForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, startDate, endDate }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setTitle("");
      setBody("");
      setStartDate("");
      setEndDate("");
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        + 공지 등록
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">제목</span>
        <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">내용</span>
        <textarea required rows={3} className="input" value={body} onChange={(e) => setBody(e.target.value)} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">노출 시작일</span>
          <input required type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">노출 종료일</span>
          <input required type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </label>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "등록 중..." : "등록"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">
          취소
        </button>
      </div>
    </form>
  );
}
