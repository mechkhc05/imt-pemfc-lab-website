# 수소에너지인력양성사업 포털

학생-기업 매칭 정보 관리, 진행 리포트 제출/검토(파일 첨부 포함), 활동·세미나 게시, 공지사항, MOU 기업/진행 프로젝트 소개를 제공하는 사업단 홈페이지 겸 관리 웹앱.

## 스택

- Next.js 16 (App Router) + TypeScript + Tailwind CSS
- Prisma + SQLite (로컬 파일 DB)
- 관리자/검토자만 로그인(아이디/비밀번호, bcryptjs 해시 + jose로 서명한 JWT 세션 쿠키). **학생은 계정이 없다** — 이름+학번으로 본인 확인 후 바로 제출하는 공개 폼(`/submit-report`) 사용.

## 처음 실행하기

```bash
npm install
cp .env.example .env
# .env의 AUTH_SECRET을 랜덤 값으로 채우기:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npx prisma migrate dev
npx prisma db seed

npm run dev
```

`http://localhost:3000` 접속 후 아래 계정으로 로그인해서 확인:

| 역할 | 아이디 | 비밀번호 |
| --- | --- | --- |
| 관리자 | `admin` | `admin1234!` |
| 검토자(교수/대학원생) | `reviewer` | `reviewer1234!` |

(비밀번호는 `.env`의 `SEED_ADMIN_PASSWORD` 등으로 바꿀 수 있음)

학생 리포트 제출은 로그인이 아니라 `/submit-report`에서 **이름 + 학번**을 입력해 확인한다(예시 데이터 기준 `prisma/seed-data.example.csv` 참고).

## 실제 학생 명단 넣기

`prisma/seed-data.example.csv`를 복사해 `prisma/seed-data.csv`로 저장하고 실제 데이터로 채운 뒤 `npx prisma db seed`를 다시 실행한다. `seed-data.csv`는 `.gitignore`에 포함되어 있어 실명이 git에 커밋되지 않는다.

CSV 컬럼: `studentName,studentId,program,companyName,projectTitle,startDate,endDate,advisorName,status`
- `studentId`: 학번 — 학생이 `/submit-report`에서 본인 확인할 때 이름과 함께 입력하는 값. 사실상 학생의 "비밀번호" 역할이므로 공개된 값(예: 전체 공개 명단)이 아닌지 확인할 것.
- `program`: `BACHELOR` | `MASTER` | `DOCTORATE`
- `status`: `ACTIVE` | `EMPLOYED` | `ADVANCED_STUDY` | `UNDECIDED` — `ACTIVE`인 매칭만 홈페이지의 "현재 진행 중인 프로젝트" 섹션에 노출됨
- 날짜는 `YYYY-MM-DD`

## 역할별 기능

- **관리자(ADMIN)**: 매칭 정보 등록, 활동·세미나/공지 등록·수정·삭제, 전체 리포트 조회/검토
- **검토자(REVIEWER, 교수·대학원생)**: 전체 리포트 조회/검토(코멘트 + 검토완료 처리)
- **학생**: 로그인 없이 `/submit-report`에서 이름+학번으로 본인 확인 → 본인 매칭 정보·제출 이력 조회, 진행 리포트 + 파일 첨부 제출
- **공개 방문자(비로그인)**: 홈(사업단 소개·MOU 기업·진행 중인 프로젝트), `/activities`(활동·세미나), `/announcements`(공지사항)를 모두 로그인 없이 열람 가능

## 업로드 파일(사진/첨부)

활동 사진, 리포트 첨부파일은 `UPLOADS_ROOT`(기본값 `public/uploads`) 아래에 저장되고, `/api/public/uploads/...` 라우트를 통해 서빙된다(정적 `/public` 서빙에 의존하지 않으므로 `UPLOADS_ROOT`를 앱 소스 트리 밖의 아무 경로로 옮겨도 동작). 호스팅 플랫폼의 영구 볼륨을 쓸 때는 `UPLOADS_ROOT`를 그 볼륨 마운트 경로로 지정하면 재배포해도 파일이 유지된다.

## 배포 (Railway)

SQLite 파일 DB + 로컬 디스크 업로드를 그대로 쓰는 구조라, 파일시스템이 매 요청마다 초기화되는 서버리스(Vercel 등)에는 그대로 못 올린다. 컨테이너가 계속 켜져 있고 영구 볼륨을 붙일 수 있는 Railway 기준 배포 절차:

1. GitHub 저장소 연결(이 저장소를 Railway 프로젝트로 import)
2. Root Directory를 `hydrogen-energy-workforce-program/portal`로 지정
3. 영구 볼륨(Volume)을 예: `/data` 경로에 마운트
4. 환경변수 설정
   - `DATABASE_URL=file:/data/portal.db`
   - `AUTH_SECRET=<랜덤 64자리 hex>`
   - `UPLOADS_ROOT=/data/uploads`
5. Build/Start 커맨드는 Next.js 기본값 사용(Nixpacks가 자동 감지): `npm run build` / `npm run start`
6. 최초 배포 후 1회, Railway 콘솔에서 `npx prisma migrate deploy`와 `npx prisma db seed` 실행(마이그레이션 적용 + 계정/매칭 초기 데이터 생성)
7. 커스텀 도메인 연결(선택) — Railway 프로젝트 Settings > Domains에서 진행

## 다음 단계 (미구현)

- 기업이 직접 열람하는 대시보드
- 알림 메일/문자
