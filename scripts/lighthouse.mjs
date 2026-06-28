#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import puppeteer from "puppeteer";

const URLS = [
  { name: "landing", url: "https://uonbieventhub.co.ke/" },
  { name: "event", url: "https://uonbieventhub.co.ke/e/uon-research-week-2026" },
];

const reportsDir = path.resolve("lighthouse-reports");
await mkdir(reportsDir, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const wsEndpoint = browser.wsEndpoint();
const port = Number(new URL(wsEndpoint).port);

const summary = [];
try {
  for (const target of URLS) {
    console.log(`\n=== Auditing ${target.url} ===`);
    const runnerResult = await lighthouse(
      target.url,
      { port, output: ["json", "html"], logLevel: "error" },
      desktopConfig.default ?? desktopConfig,
    );
    const [jsonReport, htmlReport] = runnerResult.report;
    await writeFile(path.join(reportsDir, `${target.name}.report.json`), jsonReport);
    await writeFile(path.join(reportsDir, `${target.name}.report.html`), htmlReport);

    const lhr = runnerResult.lhr;
    const scores = Object.fromEntries(
      Object.entries(lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]),
    );
    const metrics = {
      FCP: lhr.audits["first-contentful-paint"]?.displayValue,
      LCP: lhr.audits["largest-contentful-paint"]?.displayValue,
      TBT: lhr.audits["total-blocking-time"]?.displayValue,
      CLS: lhr.audits["cumulative-layout-shift"]?.displayValue,
      SI: lhr.audits["speed-index"]?.displayValue,
      TTI: lhr.audits["interactive"]?.displayValue,
    };
    const opportunities = Object.values(lhr.audits)
      .filter(
        (a) =>
          a.scoreDisplayMode === "metricSavings" &&
          a.score !== null &&
          a.score < 0.9 &&
          a.details?.overallSavingsMs > 50,
      )
      .map((a) => `${a.id} (~${Math.round(a.details.overallSavingsMs)}ms)`);
    summary.push({ name: target.name, url: target.url, scores, metrics, opportunities });
  }
} finally {
  await browser.close();
}

await writeFile(path.join(reportsDir, "summary.json"), JSON.stringify(summary, null, 2));

console.log("\n=========== SUMMARY ===========");
for (const r of summary) {
  console.log(`\n${r.name}: ${r.url}`);
  console.log("  scores: ", r.scores);
  console.log("  metrics:", r.metrics);
  if (r.opportunities.length > 0) {
    console.log("  opportunities:");
    for (const o of r.opportunities) console.log("    -", o);
  }
}
console.log(`\nFull HTML + JSON reports in ${reportsDir}`);
