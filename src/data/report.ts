import report from '../../data/latest.json';
import type { DailyDashboard } from '../types/research';

export const dailyReport = report as DailyDashboard;

export const themeName = (themeId: string) =>
  dailyReport.themes.find((theme) => theme.id === themeId)?.name ?? '未知主題';

export const newsTitle = (newsId: string) =>
  dailyReport.news.find((news) => news.id === newsId)?.title ?? '未知新聞';

export const supplyNode = (nodeId: string) =>
  dailyReport.supplyChain.find((node) => node.id === nodeId);

export const companyResearch = (companyId: string) =>
  dailyReport.companyResearch.find((company) => company.id === companyId);
