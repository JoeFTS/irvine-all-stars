# Start Project Prompt

Copy and paste this at the start of each session:

---

I'm continuing work on the Irvine All-Stars site at `/Users/joe/irvine-all-stars`.

**First, get context:**
1. Read `tasks/todo.md` for the current task list
2. Read the two most recent `tasks/session-*.md` files for recent session context
3. Read `tasks/lessons.md` for patterns to avoid

**Key project details:**
- **VPS**: `ssh root@89.116.187.214`, app at `/var/www/irvineallstars`, PM2 process `irvineallstars`
- **Deploy**: `git push`, then `ssh root@89.116.187.214 "cd /var/www/irvineallstars && git pull origin main && npm run build && pm2 restart irvineallstars"`
- **Supabase**: schema `irvine_allstars` in ProjectHub (`owuempqaheupjyslkjlg`)
- **Verification**: `npm run build` is the primary check (no test suite)
- **Scope**: 12 divisions (5U-Shetland through 14U-Pony), 30+ routes live

What's the current status and what should we work on next?
