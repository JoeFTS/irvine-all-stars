// Screenshot capture script for PDF guides
// Run via Playwright MCP browser_run_code

async (page) => {
  const base = 'https://irvineallstars.com';
  const dir = '/Users/joe/irvine-all-stars/docs/assets/screenshots';

  // Helper: login
  async function login(email, password) {
    await page.goto(`${base}/auth/login`);
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
  }

  // Helper: screenshot
  async function shot(name, fullPage = true) {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage });
  }

  // Helper: viewport-only screenshot
  async function vshot(name) {
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
  }

  // Helper: sign out
  async function signOut() {
    try {
      await page.click('button:has-text("Sign Out")');
      await page.waitForTimeout(1000);
    } catch(e) {}
  }

  // ===== PUBLIC PAGES =====
  await page.goto(base);
  await page.waitForTimeout(2000);
  await shot('public/homepage');

  await page.goto(`${base}/auth/login`);
  await page.waitForTimeout(1500);
  await shot('public/login');

  await page.goto(`${base}/apply/player`);
  await page.waitForTimeout(1500);
  await shot('public/registration-step1');

  // ===== PARENT PORTAL =====
  await login('testparent@irvineallstars.com', 'TestParent2026!');

  // Dashboard
  await page.goto(`${base}/portal`);
  await page.waitForTimeout(2000);
  await shot('parent/dashboard');
  await vshot('parent/dashboard-hero');

  // Scroll to registration section
  await page.evaluate(() => {
    const el = document.querySelector('h2');
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
  await page.waitForTimeout(500);
  await vshot('parent/dashboard-registration');

  // Scroll to compliance section
  await page.evaluate(() => {
    const els = document.querySelectorAll('h2');
    for (const el of els) {
      if (el.textContent.includes('Tournament Readiness')) {
        el.scrollIntoView({ behavior: 'instant' });
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await vshot('parent/dashboard-compliance');

  // Scroll to announcements
  await page.evaluate(() => {
    const els = document.querySelectorAll('h2');
    for (const el of els) {
      if (el.textContent.includes('Announcements')) {
        el.scrollIntoView({ behavior: 'instant' });
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await vshot('parent/dashboard-announcements');

  // Scroll to links
  await page.evaluate(() => {
    const els = document.querySelectorAll('h2');
    for (const el of els) {
      if (el.textContent.includes('Important Links')) {
        el.scrollIntoView({ behavior: 'instant' });
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await vshot('parent/dashboard-links');

  // Registration form
  await page.goto(`${base}/apply/player`);
  await page.waitForTimeout(1500);
  await vshot('parent/reg-step1');

  // Click add second parent
  try {
    await page.click('button:has-text("Add a second parent")');
    await page.waitForTimeout(500);
    await vshot('parent/reg-second-parent');
  } catch(e) {}

  // Tournaments
  await page.goto(`${base}/portal/tournaments`);
  await page.waitForTimeout(2000);
  await shot('parent/tournaments');

  // Documents
  await page.goto(`${base}/portal/documents`);
  await page.waitForTimeout(1500);
  await shot('parent/documents');

  // Contract
  await page.goto(`${base}/portal/contract`);
  await page.waitForTimeout(1500);
  await shot('parent/contract');

  // Help
  await page.goto(`${base}/portal/help`);
  await page.waitForTimeout(1500);
  await shot('parent/help');

  await signOut();

  // ===== COACH PORTAL =====
  await login('thesupplycomp@gmail.com', 'Sandbag!Jeeringly7!Emporium');

  // Dashboard
  await page.goto(`${base}/coach`);
  await page.waitForTimeout(2000);
  await shot('coach/dashboard');
  await vshot('coach/dashboard-top');

  // Scroll to action items
  await page.evaluate(() => {
    const els = document.querySelectorAll('h3');
    for (const el of els) {
      if (el.textContent.includes('Action Items')) {
        el.scrollIntoView({ behavior: 'instant' });
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await vshot('coach/dashboard-actions');

  // Scroll to quick links
  await page.evaluate(() => {
    const els = document.querySelectorAll('h3');
    for (const el of els) {
      if (el.textContent.includes('Quick Links')) {
        el.scrollIntoView({ behavior: 'instant' });
        break;
      }
    }
  });
  await page.waitForTimeout(500);
  await vshot('coach/dashboard-quicklinks');

  // Roster
  await page.goto(`${base}/coach/roster`);
  await page.waitForTimeout(2000);
  await shot('coach/roster');

  // Tryouts
  await page.goto(`${base}/coach/tryouts`);
  await page.waitForTimeout(2000);
  await shot('coach/tryouts');

  // Scores
  await page.goto(`${base}/coach/scores`);
  await page.waitForTimeout(2000);
  await shot('coach/scores');

  // Checklist
  await page.goto(`${base}/coach/checklist`);
  await page.waitForTimeout(2000);
  await shot('coach/checklist');

  // Pitching log
  await page.goto(`${base}/coach/pitching-log`);
  await page.waitForTimeout(2000);
  await shot('coach/pitching-log');

  // Certifications
  await page.goto(`${base}/coach/certifications`);
  await page.waitForTimeout(2000);
  await shot('coach/certifications');

  // Tournament rules
  await page.goto(`${base}/coach/tournament-rules`);
  await page.waitForTimeout(2000);
  await shot('coach/tournament-rules');

  // Tournaments
  await page.goto(`${base}/coach/tournaments`);
  await page.waitForTimeout(2000);
  await shot('coach/tournaments');

  // Contracts
  await page.goto(`${base}/coach/contracts`);
  await page.waitForTimeout(2000);
  await shot('coach/contracts');

  // Updates
  await page.goto(`${base}/coach/updates`);
  await page.waitForTimeout(2000);
  await shot('coach/updates');

  // Help
  await page.goto(`${base}/coach/help`);
  await page.waitForTimeout(2000);
  await shot('coach/help');

  await signOut();

  // ===== ADMIN PORTAL =====
  await login('testadmin@irvineallstars.com', 'TestAdmin2026!');

  // Dashboard
  await page.goto(`${base}/admin`);
  await page.waitForTimeout(2000);
  await shot('admin/dashboard');
  await vshot('admin/dashboard-top');

  // Tryouts
  await page.goto(`${base}/admin/tryouts`);
  await page.waitForTimeout(2000);
  await shot('admin/tryouts');

  // Click on a player to expand
  try {
    await page.click('button:has-text("Tommy Johnson")');
    await page.waitForTimeout(1000);
    await shot('admin/tryouts-expanded');
  } catch(e) {}

  // Applications
  await page.goto(`${base}/admin/applications`);
  await page.waitForTimeout(2000);
  await shot('admin/applications');

  // Scores
  await page.goto(`${base}/admin/scores`);
  await page.waitForTimeout(2000);
  await shot('admin/scores');

  // Announcements
  await page.goto(`${base}/admin/announcements`);
  await page.waitForTimeout(2000);
  await shot('admin/announcements');

  // Tournaments
  await page.goto(`${base}/admin/tournaments`);
  await page.waitForTimeout(2000);
  await shot('admin/tournaments');

  // Teams
  await page.goto(`${base}/admin/teams`);
  await page.waitForTimeout(2000);
  await shot('admin/teams');

  // Invites
  await page.goto(`${base}/admin/invites`);
  await page.waitForTimeout(2000);
  await shot('admin/invites');

  // Documents
  await page.goto(`${base}/admin/documents`);
  await page.waitForTimeout(2000);
  await shot('admin/documents');

  // Compliance
  await page.goto(`${base}/admin/compliance`);
  await page.waitForTimeout(2000);
  await shot('admin/compliance');

  // Help
  await page.goto(`${base}/admin/help`);
  await page.waitForTimeout(2000);
  await shot('admin/help');

  await signOut();

  return 'All screenshots captured!';
}
