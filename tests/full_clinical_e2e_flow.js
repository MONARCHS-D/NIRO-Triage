const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'test_reports', 'clinical_e2e');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function runClinicalE2E() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const report = {
    startedAt: new Date().toISOString(),
    steps: [],
    networkRequests: [],
    backendErrors: [],
    frontendErrors: [],
  };

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      report.frontendErrors.push({ url: page.url(), text });
      console.log(`[Frontend Console ERROR] ${text}`);
    } else if (msg.type() === 'warn') {
      console.log(`[Frontend Console WARN] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    report.frontendErrors.push({ url: page.url(), text: `Unhandled Exception: ${err.message}` });
    console.error(`[Frontend PageError]`, err.message);
  });

  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    const method = response.request().method();
    if (url.includes('/api/v1/')) {
      let body = '';
      try {
        body = await response.text();
      } catch (e) {}

      report.networkRequests.push({ method, url, status, bodyLength: body.length });

      if (status >= 400) {
        report.backendErrors.push({ method, url, status, body });
        console.log(`[Backend HTTP Error ${status}] ${method} ${url}: ${body}`);
      } else {
        console.log(`[Backend API ${status}] ${method} ${url}`);
      }
    }
  });

  async function step(name, action) {
    console.log(`\n========================================`);
    console.log(`STEP: ${name}`);
    console.log(`========================================`);
    try {
      await action();
      report.steps.push({ name, status: 'PASSED' });
      console.log(`✔ ${name} PASSED`);
    } catch (err) {
      report.steps.push({ name, status: 'FAILED', error: err.message });
      console.error(`✖ ${name} FAILED:`, err.message);
      const safe = name.replace(/[^a-zA-Z0-9_-]/g, '_');
      await page.screenshot({ path: path.join(REPORT_DIR, `fail_${safe}.png`) });
    }
  }

  try {
    // 1. Visit Login Page & Log in as Nurse
    await step('1. Log in as Triage Nurse (Sunita B.)', async () => {
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(REPORT_DIR, '01_login_view.png') });

      // Click "Sign in as Sunita B. (Triage Nurse)" button
      const nurseBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.includes('Sunita B.'));
      });

      if (nurseBtn && nurseBtn.click) {
        console.log('Clicking Sunita B. login button...');
        await nurseBtn.click();
      }

      // Wait for URL to transition to /dashboard or wait for auth response
      console.log('Waiting for login request and transition to dashboard...');
      await page.waitForFunction(
        () => window.location.pathname.includes('/dashboard'),
        { timeout: 15000 }
      );
      console.log('Successfully navigated to dashboard after login!');
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(REPORT_DIR, '02_logged_in_dashboard.png') });
    });

    // 2. Navigate to New Intake (/intake)
    await step('2. Navigate to Manual Patient Intake (/intake)', async () => {
      await page.goto(`${BASE_URL}/intake`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(REPORT_DIR, '03_intake_form.png') });
    });

    // 3. Inspect Intake Page Elements
    await step('3. Inspect Intake Elements & Patient Intake Form', async () => {
      const pageInfo = await page.evaluate(() => {
        return {
          pathname: window.location.pathname,
          buttons: Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean),
          inputs: Array.from(document.querySelectorAll('input, textarea')).map((i) => ({
            tag: i.tagName,
            placeholder: i.placeholder,
            type: i.type,
          })),
        };
      });
      console.log('Current URL Path:', pageInfo.pathname);
      console.log('Intake Buttons:', pageInfo.buttons);
      console.log('Intake Inputs:', pageInfo.inputs);

      // Verify we are actually on /intake and NOT redirected to login
      if (pageInfo.pathname.includes('/auth/login')) {
        throw new Error('Unexpectedly redirected to /auth/login - session lost');
      }

      await page.screenshot({ path: path.join(REPORT_DIR, '04_intake_verified.png') });
    });

    // 4. Verify Triage Queue (/queue)
    await step('4. Verify Triage Queue (/queue)', async () => {
      await page.goto(`${BASE_URL}/queue`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(REPORT_DIR, '05_triage_queue.png') });

      const pageInfo = await page.evaluate(() => {
        return {
          pathname: window.location.pathname,
          queueRows: document.querySelectorAll('tr, [data-testid="queue-item"]').length,
          buttons: Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean),
        };
      });
      console.log('Queue View Path:', pageInfo.pathname);
      console.log('Queue Rows:', pageInfo.queueRows);
      console.log('Queue Buttons:', pageInfo.buttons.slice(0, 10));

      if (pageInfo.pathname.includes('/auth/login')) {
        throw new Error('Redirected to /auth/login on queue view');
      }
    });

    // 5. Open Clinical Workstation (/patients/P-1042)
    await step('5. Test Clinical Workstation Drawer & AI Diff Modal', async () => {
      await page.goto(`${BASE_URL}/patients/P-1042`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({ path: path.join(REPORT_DIR, '06_patient_workspace.png') });

      // Click "Review assessment"
      const reviewBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.innerText && b.innerText.includes('Review assessment'));
      });
      if (reviewBtn && reviewBtn.click) {
        await reviewBtn.click();
        await new Promise((r) => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(REPORT_DIR, '07_assessment_reviewed.png') });
      }

      // Click "View changes" for AI draft diff
      const viewChangesBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.innerText && b.innerText.includes('View changes'));
      });
      if (viewChangesBtn && viewChangesBtn.click) {
        await viewChangesBtn.click();
        await new Promise((r) => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(REPORT_DIR, '08_ai_diff_modal.png') });

        // Close modal
        const closeBtn = await page.$('button[title*="Close"], button[aria-label*="Close"]');
        if (closeBtn) await closeBtn.click();
        await new Promise((r) => setTimeout(r, 500));
      }
    });

    // 6. Test Report OCR Upload View (/intake/report)
    await step('6. Test Report OCR Studio (/intake/report)', async () => {
      await page.goto(`${BASE_URL}/intake/report`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(REPORT_DIR, '09_report_ocr_studio.png') });
      const currentPath = await page.evaluate(() => window.location.pathname);
      console.log('Report OCR Studio Path:', currentPath);
    });

    // 7. Test Voice Intake View (/intake/voice)
    await step('7. Test Voice Intake Studio (/intake/voice)', async () => {
      await page.goto(`${BASE_URL}/intake/voice`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(REPORT_DIR, '10_voice_intake_studio.png') });
      const currentPath = await page.evaluate(() => window.location.pathname);
      console.log('Voice Intake Studio Path:', currentPath);
    });

    // 8. Test Settings View (/settings)
    await step('8. Test Settings View (/settings)', async () => {
      await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(REPORT_DIR, '11_settings_view.png') });
      const currentPath = await page.evaluate(() => window.location.pathname);
      console.log('Settings Path:', currentPath);
    });

  } finally {
    await browser.close();
  }

  report.completedAt = new Date().toISOString();
  fs.writeFileSync(path.join(REPORT_DIR, 'clinical_e2e_report.json'), JSON.stringify(report, null, 2));

  console.log('\n========================================');
  console.log('       CLINICAL E2E SUMMARY            ');
  console.log('========================================');
  console.log(`Total Steps: ${report.steps.length}`);
  console.log(`Passed: ${report.steps.filter((s) => s.status === 'PASSED').length}`);
  console.log(`Failed: ${report.steps.filter((s) => s.status === 'FAILED').length}`);
  console.log(`Backend Errors (HTTP 4xx/5xx): ${report.backendErrors.length}`);
  console.log(`Frontend Console Errors: ${report.frontendErrors.length}`);
  console.log('========================================\n');
}

runClinicalE2E().catch(console.error);
