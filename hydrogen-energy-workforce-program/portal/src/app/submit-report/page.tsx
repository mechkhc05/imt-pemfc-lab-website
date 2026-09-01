"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { REPORT_STATUS_LABEL, formatDate } from "@/lib/labels";

type Match = {
  id: string;
  studentName: string;
  studentId: string;
  projectTitle: string;
  company: { name: string };
  startDate: string;
  endDate: string;
};

type Attachment = { id: string; filename: string; url: string; size: number };

type Report = {
  id: string;
  periodStart: string;
  periodEnd: string;
  content: string;
  status: "SUBMITTED" | "REVIEWED";
  reviewerComment: string | null;
  attachments: Attachment[];
};

export default function SubmitReportPage() {
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [match, setMatch] = useState<Match | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  async function handleLookup(e: FormEvent) {
    e.preventDefault();
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch("/api/public/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, studentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error ?? "확인에 실패했습니다.");
        return;
      }
      setMatch(data.match);
      setReports(data.reports);
    } finally {
      setLookupLoading(false);
    }
  }

  if (!match) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <form
          onSubmit={handleLookup}
          className="w-full max-w-sm space-y-4 rounded-lg border border-gray-200 p-8 dark:border-gray-800"
        >
          <div>
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              ← 사업단 소개로
            </Link>
            <h1 className="mt-2 text-xl font-semibold">진행 리포트 제출</h1>
            <p className="mt-1 text-sm text-gray-500">
              별도 로그인 없이 이름과 학번으로 본인 확인 후 제출합니다.
            </p>
          </div>

          {lookupError && (
            <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {lookupError}
            </p>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="studentName">
              이름
            </label>
            <input
              id="studentName"
              className="input"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium" htmlFor="studentId">
              학번
            </label>
            <input
              id="studentId"
              className="input"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={lookupLoading}
            className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {lookupLoading ? "확인 중..." : "확인"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {match.studentName}님의 진행 리포트
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {match.company.name} · {match.projectTitle}
          </p>
        </div>
        <button
          onClick={() => {
            setMatch(null);
            setReports([]);
            setStudentName("");
            setStudentId("");
          }}
          className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          다른 학생으로 확인
        </button>
      </div>

      <NewReportForm
        studentName={match.studentName}
        studentId={match.studentId}
        onSubmitted={(r) => setReports((prev) => [r, ...prev])}
      />

      <div className="space-y-4">
        <h2 className="font-medium">제출 이력</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">아직 제출한 리포트가 없습니다.</p>
        ) : (
          reports.map((r) => (
            <div key={r.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-gray-500">
                  {formatDate(r.periodStart)} ~ {formatDate(r.periodEnd)}
                </p>
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
                        📎 {a.filename} ({formatFileSize(a.size)})
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              {r.status === "REVIEWED" && r.reviewerComment && (
                <p className="mt-2 rounded bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-gray-900 dark:text-gray-300">
                  검토자 코멘트: {r.reviewerComment}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewReportForm({
  studentName,
  studentId,
  onSubmitted,
}: {
  studentName: string;
  studentId: string;
  onSubmitted: (r: Report) => void;
}) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("studentName", studentName);
      formData.set("studentId", studentId);
      formData.set("periodStart", periodStart);
      formData.set("periodEnd", periodEnd);
      formData.set("content", content);
      if (files) {
        for (const file of Array.from(files)) formData.append("files", file);
      }

      const res = await fetch("/api/public/reports", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제출에 실패했습니다.");
        return;
      }
      onSubmitted(data);
      setPeriodStart("");
      setPeriodEnd("");
      setContent("");
      setFiles(null);
      setFileInputKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <h2 className="font-medium">새 진행 리포트 제출</h2>
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">기간 시작</span>
          <input required type="date" className="input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">기간 종료</span>
          <input required type="date" className="input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">진행 내용</span>
        <textarea
          required
          rows={4}
          className="input"
          placeholder="이번 기간 동안 수행한 산학프로젝트 진행 내용을 간단히 작성하세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">첨부파일 (선택, 여러 개 가능)</span>
        <input
          key={fileInputKey}
          type="file"
          multiple
          onChange={(e) => setFiles(e.target.files)}
          className="block w-full text-sm"
        />
        <span className="mt-1 block text-xs text-gray-400">
          pdf, hwp/hwpx, word/excel/ppt, 이미지, zip · 파일당 20MB 이하
        </span>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "제출 중..." : "제출"}
      </button>
    </form>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
