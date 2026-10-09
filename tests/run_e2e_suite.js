const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.join(__dirname, '..', 'test_reports', 'e2e');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://127.0.0.1:8000';

async function main() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const results = {
    startedAt: new Date().toISOString(),
    frontendStatus: null,
    backendStatus: null,
    consoleErrors: [],
    consoleWarnings: [],
    failedRequests: [],
    passedSteps: [],
    failedSteps: [],
  };

  console.log('--- Step 0: Checking backend and frontend HTTP endpoints ---');
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/health/live`);
    results.backendStatus = res.status === 200 ? 'OK' : `FAIL (${res.status})`;
    console.log(`Backend /health/live: ${results.backendStatus}`);
  } catch (err) {
    results.backendStatus = `ERROR: ${err.message}`;
    console.error(`Backend /health/live failed:`, err.message);
  }

  try {
    const res = await fetch(`${BASE_URL}`);
    results.frontendStatus = res.status === 200 ? 'OK' : `FAIL (${res.status})`;
    console.log(`Frontend root: ${results.frontendStatus}`);
  } catch (err) {
    results.frontendStatus = `ERROR: ${err.message}`;
    console.error(`Frontend root failed:`, err.message);
  }

  console.log('\n--- Launching Headless Chrome via puppeteer-core ---');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,960',
    ],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  // Listen for console events
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      results.consoleErrors.push({ url: page.url(), text });
      console.log(`[Browser Console ERROR] ${text}`);
    } else if (type === 'warning') {
      results.consoleWarnings.push({ url: page.url(), text });
    }
  });

  // Listen for page errors (unhandled JS errors)
  page.on('pageerror', (err) => {
    results.consoleErrors.push({ url: page.url(), text: `PageError: ${err.message}` });
    console.error(`[Browser PageError]`, err.message);
  });

  // Listen for failed network responses
  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    if (status >= 400 && !url.includes('/favicon.ico')) {
      let body = '';
      try {
        body = await response.text();
      } catch (e) {}
      results.failedRequests.push({ url, status, body: body.substring(0, 300) });
      console.log(`[HTTP ${status}] ${url} -> ${body.substring(0, 100)}`);
    }
  });

  // Helper step function
  async function testStep(name, fn) {
    console.log(`\n▶ Testing: ${name}...`);
    try {
      await fn();
      results.passedSteps.push(name);
      console.log(`✔ PASSED: ${name}`);
    } catch (err) {
      results.failedSteps.push({ step: name, error: err.message });
      console.error(`✖ FAILED: ${name} ->`, err.message);
      try {
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `failure_${safeName}.png`) });
      } catch (e) {}
    }
  }

  try {
    // Step 1: Initial Page Load (Dashboard)
    await testStep('Initial Page Load (Dashboard)', async () => {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_dashboard.png') });
    });

    // Step 2: Login Page & Authentication Flow
    await testStep('Authentication Flow (/auth/login)', async () => {
      await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_login_page.png') });

      // Check if email and password inputs exist
      const emailInput = await page.$('input[type="email"], input[name="email"], input#email');
      const passInput = await page.$('input[type="password"], input[name="password"], input#password');

      if (emailInput && passInput) {
        // Clear and type demo doctor credentials
        await emailInput.click({ clickCount: 3 });
        await emailInput.type('doctor@example.com');
        await passInput.click({ clickCount: 3 });
        await passInput.type('demo123');

        // Find submit button
        const submitBtn = await page.evaluateHandle(() => {
          const btns = Array.from(document.querySelectorAll('button, input[type="submit"]'));
          return btns.find((b) => b.textContent && (b.textContent.includes('Sign in') || b.textContent.includes('Log in') || b.textContent.includes('Continue')));
        });
        if (submitBtn && submitBtn.click) {
          await submitBtn.click();
          await new Promise((r) => setTimeout(r, 2500));
        }
      }
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_after_login.png') });
    });

    // Step 3: Triage Review Queue (/queue)
    await testStep('Triage Review Queue (/queue)', async () => {
      await page.goto(`${BASE_URL}/queue`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_queue_view.png') });
    });

    // Step 4: Patient List (/patients)
    await testStep('Patient Directory (/patients)', async () => {
      await page.goto(`${BASE_URL}/patients`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_patients_directory.png') });
    });

    // Step 5: Patient Workstation (/patients/P-1042)
    await testStep('Patient Clinical Workstation (/patients/P-1042)', async () => {
      await page.goto(`${BASE_URL}/patients/P-1042`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2500));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_patient_workstation.png') });

      // Click "Review assessment" if present
      const reviewAssessmentBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.includes('Review assessment'));
      });
      if (reviewAssessmentBtn && reviewAssessmentBtn.click) {
        await reviewAssessmentBtn.click();
        await new Promise((r) => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_reviewed_assessment.png') });
      }

      // Click "View changes" (AI Draft modal) if present
      const viewChangesBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && b.textContent.includes('View changes'));
      });
      if (viewChangesBtn && viewChangesBtn.click) {
        await viewChangesBtn.click();
        await new Promise((r) => setTimeout(r, 1000));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_ai_diff_modal.png') });
      }
    });

    // Step 6: Manual/Text Patient Intake (/intake)
    await testStep('Manual Intake Flow (/intake)', async () => {
      await page.goto(`${BASE_URL}/intake`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_intake_screen.png') });

      // Check if consent button or modal needs to be triggered
      const consentBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent && (b.textContent.includes('Capture Consent') || b.textContent.includes('Consent')));
      });
      if (consentBtn && consentBtn.click) {
        await consentBtn.click();
        await new Promise((r) => setTimeout(r, 800));
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_consent_modal.png') });
      }

      // Check for form fields (e.g. Chief Complaint, Vitals)
      const chiefComplaintInput = await page.$('textarea, input[placeholder*="complaint"], input[name*="complaint"]');
      if (chiefComplaintInput) {
        await chiefComplaintInput.type('Persistent fever of 102F and non-productive cough for 4 days');
      }

      await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_intake_filled.png') });
    });

    // Step 7: Report Intake (/intake/report)
    await testStep('Report OCR Intake (/intake/report)', async () => {
      await page.goto(`${BASE_URL}/intake/report`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_intake_report.png') });
    });

    // Step 8: Voice Intake (/intake/voice)
    await testStep('Voice Intake Interface (/intake/voice)', async () => {
      await page.goto(`${BASE_URL}/intake/voice`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_intake_voice.png') });
    });

    // Step 9: Settings & Role Switcher (/settings)
    await testStep('Settings & Role Switcher (/settings)', async () => {
      await page.goto(`${BASE_URL}/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '14_settings.png') });
    });

  } finally {
    await browser.close();
  }

  results.completedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'e2e_results.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );

  console.log('\n======================================================');
  console.log('                 E2E TEST SUMMARY                     ');
  console.log('======================================================');
  console.log(`Passed Steps: ${results.passedSteps.length}`);
  console.log(`Failed Steps: ${results.failedSteps.length}`);
  console.log(`Console Errors: ${results.consoleErrors.length}`);
  console.log(`Failed HTTP Requests: ${results.failedRequests.length}`);
  console.log(`Report JSON: ${path.join(ARTIFACT_DIR, 'e2e_results.json')}`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
