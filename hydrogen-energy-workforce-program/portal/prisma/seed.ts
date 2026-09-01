import { PrismaClient, Program, MatchStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

const PROGRAM_MAP: Record<string, Program> = {
  BACHELOR: "BACHELOR",
  MASTER: "MASTER",
  DOCTORATE: "DOCTORATE",
};

const STATUS_MAP: Record<string, MatchStatus> = {
  ACTIVE: "ACTIVE",
  EMPLOYED: "EMPLOYED",
  ADVANCED_STUDY: "ADVANCED_STUDY",
  UNDECIDED: "UNDECIDED",
};

type Row = {
  studentName: string;
  studentId: string;
  program: string;
  companyName: string;
  projectTitle: string;
  startDate: string;
  endDate: string;
  advisorName: string;
  status: string;
};

// Minimal CSV parser: supports double-quoted fields containing commas.
function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    header.forEach((key, i) => {
      row[key] = values[i] ?? "";
    });
    return row as unknown as Row;
  });
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function upsertUser(username: string, name: string, role: "ADMIN" | "REVIEWER", password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { username },
    update: {},
    create: { username, name, role, passwordHash },
  });
}

async function main() {
  const dataPath = path.join(__dirname, "seed-data.csv");
  const examplePath = path.join(__dirname, "seed-data.example.csv");
  const csvPath = fs.existsSync(dataPath) ? dataPath : examplePath;
  console.log(`Seeding matches from: ${csvPath}`);
  const rows = parseCsv(fs.readFileSync(csvPath, "utf-8"));

  const admin = await upsertUser("admin", "관리자", "ADMIN", process.env.SEED_ADMIN_PASSWORD ?? "admin1234!");
  await upsertUser("reviewer", "검토자(교수/대학원생)", "REVIEWER", process.env.SEED_REVIEWER_PASSWORD ?? "reviewer1234!");

  for (const row of rows) {
    const company = await prisma.company.upsert({
      where: { name: row.companyName },
      update: {},
      create: { name: row.companyName },
    });

    await prisma.match.create({
      data: {
        studentName: row.studentName,
        studentId: row.studentId,
        program: PROGRAM_MAP[row.program] ?? "BACHELOR",
        companyId: company.id,
        projectTitle: row.projectTitle,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        advisorName: row.advisorName,
        status: STATUS_MAP[row.status] ?? "ACTIVE",
      },
    });
  }

  console.log("Seed complete.");
  console.log(`Admin login: admin / ${process.env.SEED_ADMIN_PASSWORD ?? "admin1234!"}`);
  console.log(`Reviewer login: reviewer / ${process.env.SEED_REVIEWER_PASSWORD ?? "reviewer1234!"}`);
  console.log(`학생은 로그인 없이 이름+학번으로 /submit-report 에서 리포트를 제출합니다. (예: ${rows[0]?.studentName} / ${rows[0]?.studentId})`);
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
