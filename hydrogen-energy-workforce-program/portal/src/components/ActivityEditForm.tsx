"use client";

import { useState, FormEvent } from "react";
import Image from "next/image";
import { formatDate } from "@/lib/labels";

type Photo = { id: string; url: string };
type Activity = {
  id: string;
  title: string;
  description: string;
  activityDate: string | Date;
  photos: Photo[];
};

export function ActivityEditForm({
  activity,
  onCancel,
  onSaved,
}: {
  activity: Activity;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(activity.title);
  const [description, setDescription] = useState(activity.description);
  const [activityDate, setActivityDate] = useState(formatDate(activity.activityDate));
  const [newPhotos, setNewPhotos] = useState<FileList | null>(null);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleRemove(id: string) {
    setRemoveIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("activityDate", activityDate);
      for (const id of removeIds) formData.append("removePhotoIds", id);
      if (newPhotos) {
        for (const file of Array.from(newPhotos)) formData.append("photos", file);
      }

      const res = await fetch(`/api/activities/${activity.id}`, { method: "PATCH", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "수정에 실패했습니다.");
        return;
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <label className="block text-sm">
        <span className="mb-1 block font-medium">제목</span>
        <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">내용</span>
        <textarea required rows={4} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">활동 날짜</span>
        <input required type="date" className="input" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} />
      </label>

      {activity.photos.length > 0 && (
        <div>
          <span className="mb-1 block text-sm font-medium">기존 사진 (삭제할 사진 선택)</span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {activity.photos.map((p) => {
              const marked = removeIds.includes(p.id);
              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => toggleRemove(p.id)}
                  className={`relative block h-24 overflow-hidden rounded-lg border-2 ${
                    marked ? "border-red-500" : "border-transparent"
                  }`}
                >
                  <Image src={p.url} alt="" fill className={`object-cover ${marked ? "opacity-40" : ""}`} />
                  {marked && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-xs font-semibold text-white">
                      삭제됨
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <label className="block text-sm">
        <span className="mb-1 block font-medium">사진 추가</span>
        <input type="file" accept="image/*" multiple onChange={(e) => setNewPhotos(e.target.files)} className="block w-full text-sm" />
      </label>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? "저장 중..." : "저장"}
        </button>
        <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-4 py-2 text-sm dark:border-gray-700">
          취소
        </button>
      </div>
    </form>
  );
}
