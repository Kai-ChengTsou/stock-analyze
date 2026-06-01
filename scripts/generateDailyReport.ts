import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { DailyDashboard } from '../src/types/research';

const root = process.cwd();
const dataDir = path.join(root, 'data');
const reportsDir = path.join(dataDir, 'reports');
const mockPath = path.join(dataDir, 'mockReport.json');
const latestPath = path.join(dataDir, 'latest.json');

function taiwanDateParts(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    generatedAt: `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}+08:00`,
  };
}

async function main() {
  const raw = await readFile(mockPath, 'utf8');
  const report = JSON.parse(raw) as DailyDashboard;
  const { date, generatedAt } = taiwanDateParts();
  const todaysReport: DailyDashboard = {
    ...report,
    date,
    generatedAt,
    news: report.news.map((item) => ({ ...item, date })),
    watchlist: report.watchlist.map((item) => ({
      ...item,
      lastUpdatedTime: `${date} 07:30`,
    })),
  };

  const json = `${JSON.stringify(todaysReport, null, 2)}\n`;
  await mkdir(reportsDir, { recursive: true });
  await writeFile(path.join(reportsDir, `${date}.json`), json, 'utf8');
  await writeFile(latestPath, json, 'utf8');
  console.log(`Generated daily report for ${date}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
