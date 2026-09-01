export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "관리자",
  REVIEWER: "검토자",
};

export const PROGRAM_LABEL: Record<string, string> = {
  BACHELOR: "학사",
  MASTER: "석사",
  DOCTORATE: "박사",
};

export const MATCH_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "재학/진행중",
  EMPLOYED: "취업",
  ADVANCED_STUDY: "진학",
  UNDECIDED: "미정",
};

export const REPORT_STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "제출",
  REVIEWED: "검토완료",
};

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
