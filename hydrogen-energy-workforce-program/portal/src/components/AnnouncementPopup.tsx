"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/labels";

type Announcement = {
  id: string;
  title: string;
  body: string;
  startDate: string;
  endDate: string;
};

const DISMISSED_KEY = "dismissed_announcements";

export function AnnouncementPopup() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/announcements?active=1")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Announcement[]) => {
        const dismissed: string[] = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? "[]");
        const remaining = data.filter((a) => !dismissed.includes(a.id));
        if (remaining.length > 0) {
          setItems(remaining);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  function handleClose() {
    const dismissed: string[] = JSON.parse(sessionStorage.getItem(DISMISSED_KEY) ?? "[]");
    sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, ...items.map((i) => i.id)]));
    setOpen(false);
  }

  if (!open || items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold">공지사항</h2>
        <div className="mt-4 max-h-80 space-y-4 overflow-y-auto">
          {items.map((a) => (
            <div key={a.id} className="border-b border-gray-200 pb-3 last:border-none dark:border-gray-800">
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{a.body}</p>
              <p className="mt-1 text-xs text-gray-400">
                {formatDate(a.startDate)} ~ {formatDate(a.endDate)}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={handleClose}
          className="mt-4 w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          확인
        </button>
      </div>
    </div>
  );
}
