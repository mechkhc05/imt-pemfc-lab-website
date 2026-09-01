"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActivityDeleteButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("이 활동을 삭제할까요? 등록된 사진도 함께 삭제됩니다.")) return;
    setLoading(true);
    try {
      await fetch(`/api/activities/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
    >
      삭제
    </button>
  );
}
