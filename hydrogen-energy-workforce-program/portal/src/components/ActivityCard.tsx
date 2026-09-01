"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/labels";
import { ActivityDeleteButton } from "./ActivityDeleteButton";
import { ActivityEditForm } from "./ActivityEditForm";

type Photo = { id: string; url: string };
type Activity = {
  id: string;
  title: string;
  description: string;
  activityDate: string | Date;
  photos: Photo[];
};

export function ActivityCard({ activity, isAdmin }: { activity: Activity; isAdmin: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <article className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <ActivityEditForm
          activity={activity}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      </article>
    );
  }

  return (
    <article className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">{formatDate(activity.activityDate)}</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{activity.title}</h2>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-3">
            <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              수정
            </button>
            <ActivityDeleteButton id={activity.id} />
          </div>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-gray-300">{activity.description}</p>
      {activity.photos.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {activity.photos.map((p) => (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="relative block h-32 overflow-hidden rounded-lg sm:h-36"
            >
              <Image src={p.url} alt={activity.title} fill className="object-cover transition hover:opacity-90" />
            </a>
          ))}
        </div>
      )}
    </article>
  );
}
