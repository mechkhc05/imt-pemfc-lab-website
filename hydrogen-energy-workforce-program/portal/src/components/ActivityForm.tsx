"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ActivityForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("activityDate", activityDate);
      if (photos) {
        for (const file of Array.from(photos)) formData.append("photos", file);
      }

      const res = await fetch("/api/activities", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setTitle("");
      setDescription("");
      setActivityDate("");
      setPhotos(null);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        + 활동 등록
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">제목</span>
        <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 2026년 하계 수소에너지 세미나" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">내용</span>
        <textarea required rows={4} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">활동 날짜</span>
        <input required type="date" className="input" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">사진 (여러 장 선택 가능)</span>
        <input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} className="block w-full text-sm" />
      </label>
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
