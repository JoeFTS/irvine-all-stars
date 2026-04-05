// scripts/tournament-discovery/ecosystem.config.cjs
// PM2 ecosystem config for tournament discovery cron job.
// Deploy on Mac Mini: pm2 start ecosystem.config.cjs

module.exports = {
  apps: [
    {
      name: "tournament-discovery",
      script: "./discover.mjs",
      cwd: __dirname,
      cron_restart: "0 2 * * *", // Run nightly at 2am
      autorestart: false, // One-shot script, don't restart on exit
      watch: false,
      env: {
        SUPABASE_URL: "https://owuempqaheupjyslkjlg.supabase.co",
        // Set these via environment or pm2 set on Mac Mini:
        // SUPABASE_SERVICE_ROLE_KEY: "...",
        // RESEND_API_KEY: "...",
        // ADMIN_EMAIL: "...",
        FIRECRAWL_URL: "http://localhost:3002",
        SITE_URL: "https://irvineallstars.com",
      },
    },
  ],
};
