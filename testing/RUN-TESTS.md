# How to Run the Irvine All-Stars Test Suite

**Last run:** 2026-03-22
**Site:** https://irvineallstars.com

---

## Quick Run (Paste into Claude Code)

Copy and paste this prompt into Claude Code to run the full test suite:

```
Run the Irvine All-Stars test suite. Execute the test script at /Users/joe/irvine-all-stars/testing/run-tests.mjs, then review the results. For any failures, investigate the root cause, fix the code, build, and deploy. Write updated results to the test report files in /Users/joe/irvine-all-stars/testing/.
```

## Manual Run

You can also run the test script directly:

```bash
cd /Users/joe/irvine-all-stars/testing
node run-tests.mjs
```

This will:
1. Check HTTP status codes on all 43 routes
2. Test all 4 API routes for proper error handling
3. Print a PASS/FAIL summary
4. Save results to `test-results.json`

## What the Tests Cover

### Automated (run-tests.mjs)
- **43 route checks** — every page returns HTTP 200 (or 404 for nonexistent pages)
- **4 API route checks** — proper error responses (400, not 500) when called without params
- Results saved to `test-results.json` for comparison between runs

### Code Review (manual via Claude Code)
For a deeper review, paste this into Claude Code:

```
Read the test plans in /Users/joe/irvine-all-stars/testing/ and do a comprehensive code review of the coach portal, admin portal, and parent portal. Check for:
- Column name mismatches between code and database
- Missing auth checks on API routes
- Missing null checks that could cause runtime errors
- State management bugs
- RLS/permission issues
Write findings to /Users/joe/irvine-all-stars/testing/10-known-issues.md
```

## Test Accounts

| Role | Email | Notes |
|------|-------|-------|
| Admin | allstars@irvinepony.com | Full admin access |
| Coach | thesupplycomp@gmail.com | 12U-Bronco head coach |
| Parent | (from tryout_registrations) | Has selected players |

## After Fixing Bugs

1. Run `npm run build` to verify no build errors
2. Deploy: `ssh root@89.116.187.214 "cd /var/www/irvineallstars && git pull origin main && npm run build && pm2 restart irvineallstars"`
3. Re-run `node testing/run-tests.mjs` to confirm fixes
4. Update `testing/10-known-issues.md` to mark fixed items
