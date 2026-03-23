#!/usr/bin/env node

/**
 * Irvine All-Stars — Automated Test Suite
 * Run: node testing/run-tests.mjs
 */

const BASE = "https://irvineallstars.com";

const ROUTES = [
  // Public pages
  { path: "/", expect: 200 },
  { path: "/faq", expect: 200 },
  { path: "/timeline", expect: 200 },
  { path: "/tryouts", expect: 200 },
  { path: "/coaches", expect: 200 },
  { path: "/updates", expect: 200 },
  { path: "/apply/player", expect: 200 },
  { path: "/apply/coach", expect: 200 },
  { path: "/auth/login", expect: 200 },
  { path: "/auth/signup", expect: 200 },
  { path: "/documents/parent-info", expect: 200 },
  { path: "/documents/evaluation-rubric", expect: 200 },
  { path: "/documents/code-of-conduct", expect: 200 },
  { path: "/sitemap.xml", expect: 200 },
  { path: "/robots.txt", expect: 200 },
  // Parent portal
  { path: "/portal", expect: 200 },
  { path: "/portal/confirm", expect: 200 },
  { path: "/portal/contract", expect: 200 },
  { path: "/portal/documents", expect: 200 },
  { path: "/portal/medical-release", expect: 200 },
  // Coach portal
  { path: "/coach", expect: 200 },
  { path: "/coach/checklist", expect: 200 },
  { path: "/coach/pitching-log", expect: 200 },
  { path: "/coach/certifications", expect: 200 },
  { path: "/coach/roster", expect: 200 },
  { path: "/coach/contracts", expect: 200 },
  { path: "/coach/tournament-rules", expect: 200 },
  { path: "/coach/updates", expect: 200 },
  // Admin portal
  { path: "/admin", expect: 200 },
  { path: "/admin/applications", expect: 200 },
  { path: "/admin/scores", expect: 200 },
  { path: "/admin/announcements", expect: 200 },
  { path: "/admin/teams", expect: 200 },
  { path: "/admin/tryouts", expect: 200 },
  { path: "/admin/invites", expect: 200 },
  { path: "/admin/documents", expect: 200 },
  { path: "/admin/compliance", expect: 200 },
  // Evaluator
  { path: "/evaluate", expect: 200 },
  { path: "/evaluate/score", expect: 200 },
  { path: "/evaluate/summary", expect: 200 },
  // Viewers
  { path: "/contract-view", expect: 200 },
  { path: "/medical-view", expect: 200 },
  // 404
  { path: "/nonexistent-page-xyz", expect: 404 },
];

const API_TESTS = [
  { path: "/api/medical-release-sheet", method: "GET", expectStatus: 401, desc: "requires auth" },
  { path: "/api/score-sheet", method: "GET", expectStatus: 401, desc: "requires auth" },
  {
    path: "/api/send-selection",
    method: "POST",
    body: "{}",
    expectStatus: 401,
    desc: "requires admin auth",
  },
  {
    path: "/api/send-confirmation",
    method: "POST",
    body: "{}",
    expectStatus: 400,
    desc: "no auth required (public)",
  },
];

async function runTests() {
  const timestamp = new Date().toISOString();
  console.log(`\n  Irvine All-Stars Test Suite`);
  console.log(`  ${timestamp}\n`);
  console.log("=".repeat(60));

  // Route tests
  console.log("\n  ROUTE TESTS\n");
  let routePass = 0;
  let routeFail = 0;
  const routeResults = [];

  for (const route of ROUTES) {
    try {
      const res = await fetch(BASE + route.path, { redirect: "manual" });
      const pass = res.status === route.expect;
      const icon = pass ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
      console.log(`  ${icon} [${res.status}] ${route.path}`);
      routeResults.push({
        path: route.path,
        expected: route.expect,
        actual: res.status,
        pass,
      });
      if (pass) routePass++;
      else routeFail++;
    } catch (e) {
      console.log(`  \x1b[31mFAIL\x1b[0m [ERR] ${route.path} — ${e.message}`);
      routeResults.push({
        path: route.path,
        expected: route.expect,
        actual: "ERR",
        pass: false,
      });
      routeFail++;
    }
  }

  // API tests
  console.log("\n  API TESTS\n");
  let apiPass = 0;
  let apiFail = 0;
  const apiResults = [];

  for (const api of API_TESTS) {
    try {
      const opts = { method: api.method };
      if (api.method === "POST") {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = api.body;
      }
      const res = await fetch(BASE + api.path, opts);
      const pass = res.status === api.expectStatus;
      const noServerError = res.status < 500;
      const icon =
        pass && noServerError
          ? "\x1b[32mPASS\x1b[0m"
          : "\x1b[31mFAIL\x1b[0m";
      const body = await res.text();
      const snippet = body.substring(0, 80);
      console.log(
        `  ${icon} [${res.status}] ${api.method} ${api.path}`
      );
      console.log(`        ${snippet}`);
      apiResults.push({
        path: api.path,
        method: api.method,
        expected: api.expectStatus,
        actual: res.status,
        pass: pass && noServerError,
      });
      if (pass && noServerError) apiPass++;
      else apiFail++;
    } catch (e) {
      console.log(
        `  \x1b[31mFAIL\x1b[0m [ERR] ${api.method} ${api.path} — ${e.message}`
      );
      apiResults.push({
        path: api.path,
        method: api.method,
        expected: api.expectStatus,
        actual: "ERR",
        pass: false,
      });
      apiFail++;
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log(`\n  SUMMARY`);
  console.log(`  Routes: ${routePass}/${ROUTES.length} passed`);
  console.log(`  APIs:   ${apiPass}/${API_TESTS.length} passed`);
  console.log(
    `  Total:  ${routePass + apiPass}/${ROUTES.length + API_TESTS.length} passed`
  );
  if (routeFail + apiFail > 0) {
    console.log(`\n  \x1b[31m${routeFail + apiFail} FAILURES\x1b[0m`);
  } else {
    console.log(`\n  \x1b[32mALL TESTS PASSED\x1b[0m`);
  }
  console.log();

  // Save results
  const results = {
    timestamp,
    routes: { pass: routePass, fail: routeFail, total: ROUTES.length, results: routeResults },
    apis: { pass: apiPass, fail: apiFail, total: API_TESTS.length, results: apiResults },
  };

  const fs = await import("fs");
  const path = await import("path");
  const outPath = path.join(
    path.dirname(new URL(import.meta.url).pathname),
    "test-results.json"
  );
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`  Results saved to ${outPath}\n`);
}

runTests();
