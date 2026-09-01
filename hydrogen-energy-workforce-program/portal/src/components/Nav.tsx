import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/labels";
import { LogoutButton } from "./LogoutButton";

const PUBLIC_LINKS = [
  { href: "/", label: "사업단 소개" },
  { href: "/activities", label: "활동·세미나" },
  { href: "/announcements", label: "공지사항" },
  { href: "/submit-report", label: "리포트 제출" },
];

const STAFF_LINKS = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/matches", label: "매칭 정보" },
  { href: "/reports", label: "진행 리포트" },
  { href: "/activities", label: "활동·세미나" },
  { href: "/announcements", label: "공지사항" },
];

export async function Nav() {
  const session = await getSession();

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-black/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              H2
            </span>
            <span className="hidden sm:inline">수소에너지인력양성사업단</span>
          </Link>
          <nav className="flex gap-4 text-sm">
            {(session ? STAFF_LINKS : PUBLIC_LINKS).map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {session ? (
            <>
              <span className="hidden text-gray-500 sm:inline">
                {session.name} ({ROLE_LABEL[session.role]})
              </span>
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded border border-gray-300 px-3 py-1.5 text-gray-600 hover:border-gray-400 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:text-white"
            >
              담당자 로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
