import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const BUSINESS_CONTENT = [
  {
    title: "학과간 연계 인력양성단 구성",
    desc: "화학공학·기계자동차·미래자동차공학이 함께 만드는 융합형 교육 체계",
  },
  {
    title: "현장 실무형 비교과과정 개발",
    desc: "현장적응력과 실무능력을 강화하는 비교과 커리큘럼 설계·운영",
  },
  {
    title: "우수 학생연구원 확보·지원",
    desc: "잠재력 있는 학생연구원을 발굴하고 성장할 수 있도록 지원",
  },
  {
    title: "기업–학교 산학프로젝트 연계",
    desc: "실제 기업 과제를 함께 수행하며 현장 문제 해결 경험을 축적",
  },
  {
    title: "충남수소클러스터 취업 연계",
    desc: "클러스터 내 기업 산학장학생 배출 및 학생연구원 취업으로 연결",
  },
];

const DEPARTMENTS = [
  { name: "화학공학부", desc: "수소 생산 · 저장 공정" },
  { name: "기계자동차공학부", desc: "수소 저장/운송 시스템" },
  { name: "미래자동차공학과", desc: "수소 활용 · 연료전지" },
];

const MOU_COMPANIES = [
  "넥스플러스",
  "㈜SAC",
  "에스티에스 엔지니어링",
  "얼라이언스 스토어",
  "동서기공",
  "대한솔루션",
  "노루알앤씨",
  "수경화학",
];

const STATS = [
  { label: "사업 목적", value: "수소산업경쟁력 강화", sub: "혁신 인재 양성 및 고도화 인력양성" },
  { label: "사업 기간", value: "2023 – 2027", sub: "5개년 계속사업, 진행중" },
  { label: "지원 대상", value: "충남 수소클러스터", sub: "지역혁신융복합단지 입주 특화기업(KSIC)" },
];

export default async function Home() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const activeMatches = await prisma.match.findMany({
    where: { status: "ACTIVE" },
    include: { company: true },
    orderBy: { startDate: "asc" },
  });

  const projects = Array.from(
    activeMatches
      .reduce((map, m) => {
        const key = `${m.companyId}::${m.projectTitle}`;
        const existing = map.get(key);
        if (existing) {
          existing.students.push(m.studentName);
        } else {
          map.set(key, {
            projectTitle: m.projectTitle,
            companyName: m.company.name,
            students: [m.studentName],
          });
        }
        return map;
      }, new Map<string, { projectTitle: string; companyName: string; students: string[] }>())
      .values(),
  );

  return (
    <div className="space-y-20 pb-16">
      {/* Hero — full-bleed gradient */}
      <section
        className="relative overflow-hidden px-4 pb-24 pt-20 text-white"
        style={{
          marginLeft: "calc(-50vw + 50%)",
          marginRight: "calc(-50vw + 50%)",
          width: "100vw",
          background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 45%, #0891b2 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 35%), radial-gradient(circle at 80% 0%, white 0, transparent 30%)",
          }}
        />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium tracking-wide text-cyan-200">
            국립공주대학교 · 수소에너지인력양성사업단
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            수소산업 현장을 이끄는
            <br className="hidden sm:block" /> 실무형 인재를 키웁니다
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-cyan-50/90">
            기업과 함께하는 산학프로젝트로 현장 문제를 직접 경험하고,
            충남수소클러스터의 다음 세대 연구원으로 성장합니다.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/submit-report"
              className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm hover:bg-cyan-50"
            >
              진행 리포트 제출하기
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-white/40 px-6 py-3 text-sm font-medium text-white hover:bg-white/10"
            >
              담당자 로그인
            </Link>
          </div>
        </div>

        {/* Stats card row, overlapping the hero's bottom edge */}
        <div className="relative mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-white p-5 text-left shadow-lg shadow-blue-950/10 dark:bg-gray-900"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                {s.label}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 사업내용 */}
      <section className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">사업 내용</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">5대 핵심 추진 과제</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {BUSINESS_CONTENT.map((item, i) => (
            <div
              key={item.title}
              className="flex gap-4 rounded-xl border border-gray-200 p-5 dark:border-gray-800"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                {i + 1}
              </span>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 참여 학과 */}
      <section className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">참여 학과</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">수소 밸류체인 전 과정을 아우르는 학과 연계</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <div
              key={d.name}
              className="rounded-xl border border-gray-200 p-6 text-center dark:border-gray-800"
            >
              <p className="font-semibold text-gray-900 dark:text-white">{d.name}</p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{d.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          수소 생산 · 수소 저장/운송 · 수소 활용 분야의 참여 교수진이 학생 지도와 산학프로젝트 자문을 함께합니다.
        </p>
      </section>

      {/* 계약랩 운영 MOU 기업 */}
      <section className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">계약랩 운영</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">MOU 체결 기업</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOU_COMPANIES.map((name) => (
            <div
              key={name}
              className="rounded-lg border border-gray-200 px-4 py-4 text-center text-sm font-medium text-gray-700 dark:border-gray-800 dark:text-gray-200"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      {/* 진행 중인 산학프로젝트 */}
      <section className="mx-auto max-w-5xl space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">산학프로젝트</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">현재 진행 중인 프로젝트</h2>
        </div>
        {projects.length === 0 ? (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">진행 중인 프로젝트가 없습니다.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <div
                key={`${p.companyName}::${p.projectTitle}`}
                className="flex flex-col justify-between rounded-xl border border-gray-200 p-5 dark:border-gray-800"
              >
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{p.companyName}</p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">{p.projectTitle}</p>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">참여 학생: {p.students.join(", ")}</p>
                </div>
                <Link
                  href="/submit-report"
                  className="mt-4 self-start text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  리포트 제출하러 가기 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 리포트 제출 안내 */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-8 text-center dark:border-blue-950 dark:bg-blue-950/20 sm:flex-row sm:text-left">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">참여 학생 진행 리포트 제출</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              별도 계정 없이 이름과 학번만으로 본인 확인 후 바로 제출할 수 있습니다.
            </p>
          </div>
          <Link
            href="/submit-report"
            className="shrink-0 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            리포트 제출하러 가기 →
          </Link>
        </div>
      </section>

      {/* 문의처 */}
      <section className="mx-auto max-w-5xl px-4">
        <div className="rounded-xl border border-gray-200 p-6 text-sm dark:border-gray-800">
          <h2 className="font-semibold">문의처</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            국립공주대학교 수소에너지인력양성사업단 · 김현철 교수
            <br />
            충남 천안시 서북구 천안대로 1223-24, 7공학관 205호
            <br />
            Tel. 041-521-9273 · E-mail. khc@kongju.ac.kr
          </p>
        </div>
      </section>
    </div>
  );
}
