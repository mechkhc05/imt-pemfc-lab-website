"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/labels";
import { AnnouncementEditForm } from "./AnnouncementEditForm";

type Announcement = {
  id: string;
  title: string;
  body: string;
  startDate: string | Date;
  endDate: string | Date;
};

export function AnnouncementCard({ announcement, isAdmin }: { announcement: Announcement; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const now = new Date();
  const active = new Date(announcement.startDate) <= now && new Date(announcement.endDate) >= now;

  async function handleDelete() {
    if (!confirm("이 공지를 삭제할까요?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/announcements/${announcement.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <AnnouncementEditForm
          announcement={announcement}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{announcement.title}</p>
        <div className="flex shrink-0 items-center gap-3">
          {active && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              노출 중
            </span>
          )}
          {isAdmin && (
            <>
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                수정
              </button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400">
                삭제
              </button>
            </>
          )}
        </div>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{announcement.body}</p>
      <p className="mt-2 text-xs text-gray-400">
        {formatDate(announcement.startDate)} ~ {formatDate(announcement.endDate)}
      </p>
    </div>
  );
}
