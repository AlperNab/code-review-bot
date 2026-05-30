#!/usr/bin/env node
import { reviewCode } from "./reviewers/reviewer.js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

async function cli() {
  const args = process.argv.slice(2);
  const file = args[0];
  if (!file) { console.log("Usage: code-review <file> [--language ts] [--json]"); process.exit(0); }
  const path = resolve(file);
  if (!existsSync(path)) { console.error(`File not found: ${path}`); process.exit(1); }
  const code = readFileSync(path, "utf-8");
  const langIdx = args.indexOf("--language");
  const language = langIdx >= 0 ? args[langIdx + 1] : undefined;
  const review = await reviewCode(code, undefined, language);
  if (args.includes("--json")) { console.log(JSON.stringify(review, null, 2)); return; }

  const verdict = { approve:"✅ APPROVE", request_changes:"❌ REQUEST CHANGES", comment:"💬 COMMENT" };
  console.log(`\n${verdict[review.verdict as keyof typeof verdict] ?? review.verdict}  Score: ${review.score}/100`);
  console.log(`\n${review.summary}`);
  if (review.issues.length) {
    console.log(`\n── Issues (${review.issues.length}) ──────────────────`);
    review.issues.forEach(i => {
      const sev = {critical:"🔴",high:"🟠",medium:"🟡",low:"🔵",info:"⚪"}[i.severity] ?? "•";
      console.log(`${sev} [${i.type.toUpperCase()}] ${i.title}${i.line ? ` (line ${i.line})` : ""}`);
      console.log(`  ${i.description}`);
      console.log(`  Fix: ${i.suggestion}\n`);
    });
  }
  if (review.positives.length) { console.log("── What's good ──────────────────"); review.positives.forEach(p => console.log(`  ✓ ${p}`)); }
}
cli().catch(console.error);
