# AI 股票研究儀表板

一個 mobile-first 的 AI 股票研究 dashboard MVP。前端只讀取結構化 JSON 研究結果，不連接券商、不下單、不保證預測。

## 功能

- Traditional Chinese UI 與研究內容
- Dashboard、News、Themes、Supply Chain Explorer、Beneficiary Finder、Company Research、Watchlist、Idea Pipeline
- MVP 使用 `data/latest.json`、`data/mockReport.json`、`data/reports/YYYY-MM-DD.json`
- GitHub Actions 每天產生 mock daily report
- Netlify 可直接部署

## 安裝

```bash
npm install
```

## 本機開發

```bash
npm run dev
```

開啟 Vite 顯示的 localhost URL。

## 建置

```bash
npm run build
```

## 產生每日報告

```bash
npm run generate
```

這會讀取 `data/mockReport.json`，更新：

- `data/latest.json`
- `data/reports/YYYY-MM-DD.json`

## GitHub Actions 每日更新

`.github/workflows/daily-report.yml` 使用 cron `0 23 * * *`，等於台灣時間每天早上 7:00。Workflow 會 checkout repo、安裝依賴、執行 `npm run automation:once`，並把產生的 JSON commit 回 GitHub。Netlify 若已連接 GitHub `main` branch，push 後會自動 rebuild。

目前 `scripts/runOneTimeResearchAutomation.ts` 是一次性研究自動化範例，已輸出真實新聞格式的 dashboard JSON。要變成每天真正抓新聞與 AI 分析，需要把資料擷取邏輯接到新聞、AI 與財務資料 API，並在 GitHub repo 設定 Secrets：

- `NEWS_API_KEY`
- `OPENAI_API_KEY`
- `FINANCIAL_DATA_API_KEY`

建議每日流程：

1. 抓取 25-35 則候選新聞。
2. 只保留 10-15 則最重要項目。
3. 區分 fresh catalyst、recent context、background thesis、stale。
4. 產生 themes、supply chain layers、beneficiaries、company research、watchlist、idea pipeline。
5. 寫入 `data/latest.json` 與 `data/reports/YYYY-MM-DD.json`。
6. GitHub Actions commit 並 push，Netlify 自動更新。

## Netlify 部署

1. 將 repo 推到 GitHub。
2. 在 Netlify 新增 site，連接 GitHub repo。
3. Build command 使用 `npm run build`。
4. Publish directory 使用 `dist`。
5. `netlify.toml` 已包含 SPA redirect，重新整理深層路由也會正常。

GitHub Actions commit 新的 report 後，Netlify 會因 GitHub push 自動 rebuild。

## 未來接入真實 AI / 新聞 / 財務 API

保留前端只讀 JSON 的架構。建議把資料擷取與 AI 分析放在 `scripts/generateDailyReport.ts` 或獨立 pipeline：

- 讀取新聞 API、財報 API、股價 API
- 用 AI 轉成 `src/types/research.ts` 定義的結構
- 寫入 `data/reports/YYYY-MM-DD.json`
- 覆蓋 `data/latest.json`

前端不需要知道資料從哪裡來，只要 JSON schema 穩定即可。
