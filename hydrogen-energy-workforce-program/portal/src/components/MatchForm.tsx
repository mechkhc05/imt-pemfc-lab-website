"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const initial = {
  studentName: "",
  studentId: "",
  program: "BACHELOR",
  companyName: "",
  projectTitle: "",
  startDate: "",
  endDate: "",
  advisorName: "",
  status: "ACTIVE",
};

export function MatchForm() {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function update<K extends keyof typeof initial>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "등록에 실패했습니다.");
        return;
      }
      setForm(initial);
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        + 매칭 정보 등록
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="학생 이름">
          <input required className="input" value={form.studentName} onChange={(e) => update("studentName", e.target.value)} />
        </Field>
        <Field label="학번">
          <input
            required
            className="input"
            value={form.studentId}
            onChange={(e) => update("studentId", e.target.value)}
            placeholder="학생이 리포트 제출 시 본인 확인에 사용합니다"
          />
        </Field>
        <Field label="과정">
          <select className="input" value={form.program} onChange={(e) => update("program", e.target.value)}>
            <option value="BACHELOR">학사</option>
            <option value="MASTER">석사</option>
            <option value="DOCTORATE">박사</option>
          </select>
        </Field>
        <Field label="기업명">
          <input required className="input" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
        </Field>
        <Field label="지도교수">
          <input required className="input" value={form.advisorName} onChange={(e) => update("advisorName", e.target.value)} />
        </Field>
        <Field label="시작일">
          <input required type="date" className="input" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} />
        </Field>
        <Field label="종료일">
          <input required type="date" className="input" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} />
        </Field>
        <Field label="상태">
          <select className="input" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="ACTIVE">재학/진행중</option>
            <option value="EMPLOYED">취업</option>
            <option value="ADVANCED_STUDY">진학</option>
            <option value="UNDECIDED">미정</option>
          </select>
        </Field>
      </div>
      <Field label="산학프로젝트 주제">
        <input required className="input" value={form.projectTitle} onChange={(e) => update("projectTitle", e.target.value)} />
      </Field>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
