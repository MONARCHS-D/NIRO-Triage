const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'test_reports', 'intake_wizard');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function testIntakeWizard() {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();
  const apiLogs = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push({ url: page.url(), text: msg.text() });
      console.log(`[Browser Console ERROR] ${msg.text()}`);
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v1/')) {
      const status = res.status();
      const method = res.request().method();
      let body = '';
      try { body = await res.text(); } catch (e) {}
      apiLogs.push({ method, url, status, body: body.substring(0, 300) });
      console.log(`[API Response] ${method} ${url} -> ${status}: ${body.substring(0, 100)}`);
    }
  });

  try {
    console.log('1. Log in via /auth/login...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    const nurseBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Sunita B.'));
    });
    if (nurseBtn && nurseBtn.click) await nurseBtn.click();
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    console.log('Logged in and at dashboard!');

    console.log('2. Navigate to /intake via sidebar link...');
    await page.evaluate(() => {
      const link = document.querySelector('a[href="/intake"]');
      if (link) link.click();
    });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(REPORT_DIR, '01_intake_step1.png') });

    // Step 1: Click "Load Clinical Demo Benchmark" or fill patient
    console.log('3. Clicking Load Clinical Demo Benchmark...');
    const benchmarkBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Load Clinical Demo Benchmark'));
    });
    if (benchmarkBtn && benchmarkBtn.click) {
      await benchmarkBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      await page.screenshot({ path: path.join(REPORT_DIR, '02_benchmark_loaded.png') });
    }

    // Check consent checkbox if needed
    console.log('4. Checking consent checkbox...');
    await page.evaluate(() => {
      const cb = document.querySelector('#patient-consent-checkbox');
      if (cb && !cb.checked) cb.click();
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.screenshot({ path: path.join(REPORT_DIR, '03_consent_checked.png') });

    // Click "Next: Select Input Mode"
    console.log('5. Clicking Next: Select Input Mode...');
    const nextBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Next: Select Input Mode'));
    });
    if (nextBtn && nextBtn.click) {
      await nextBtn.click();
    }

    // Wait for Step 2 to render
    console.log('Waiting for Step 2 (How would you like to provide information?)...');
    await page.waitForFunction(
      () => document.body.innerText.includes('How would you like to provide information?'),
      { timeout: 20000 }
    );
    console.log('Successfully transitioned to Step 2!');
    await page.screenshot({ path: path.join(REPORT_DIR, '04_step2_input_mode.png') });

    // Select "Type (Manual)"
    console.log('6. Selecting Type (Manual) channel...');
    const typeBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText && b.innerText.includes('Type (Manual)'));
    });
    if (typeBtn && typeBtn.click) {
      await typeBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Type complaint if textarea exists
    const textarea = await page.$('textarea');
    if (textarea) {
      await textarea.click({ clickCount: 3 });
      await textarea.type('Patient presents with 4-day history of high fever (102F), chills, severe headache, and joint pain. No cough or shortness of breath.');
      await new Promise((r) => setTimeout(r, 500));
    }
    await page.screenshot({ path: path.join(REPORT_DIR, '05_complaint_typed.png') });

    // Click "Next: Review Intake"
    console.log('7. Clicking Next: Review Intake...');
    const reviewBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText && b.innerText.includes('Next: Review Intake'));
    });
    if (reviewBtn && reviewBtn.click) {
      await reviewBtn.click();
    }

    // Wait for Step 3 to render
    console.log('Waiting for Step 3 (Ready for Clinical Triage Review)...');
    await page.waitForFunction(
      () => document.body.innerText.includes('Ready for Clinical Triage Review'),
      { timeout: 10000 }
    );
    console.log('Successfully transitioned to Step 3!');
    await page.screenshot({ path: path.join(REPORT_DIR, '06_step3_review.png') });

    // Click "Complete Intake & Enter Queue"
    console.log('8. Submitting final intake: Complete Intake & Enter Queue...');
    const finalSubmitBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.innerText && b.innerText.includes('Complete Intake & Enter Queue'));
    });
    if (finalSubmitBtn && finalSubmitBtn.click) {
      await finalSubmitBtn.click();
      console.log('Clicked final submit! Waiting for network submission...');
    }

    // Wait up to 25s for submission to complete (case creation + text evidence + candidate extraction + enter queue)
    await page.waitForFunction(
      () => window.location.pathname.includes('/patients/') || window.location.pathname.includes('/queue'),
      { timeout: 25000 }
    );
    console.log('Successfully completed intake submission! Navigated to:', page.url());
    await page.screenshot({ path: path.join(REPORT_DIR, '07_submitted_patient_workspace.png') });

  } catch (err) {
    console.error('Intake wizard error:', err.message);
    try {
      await page.screenshot({ path: path.join(REPORT_DIR, 'intake_error.png') });
    } catch (e) {}
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(REPORT_DIR, 'wizard_report.json'), JSON.stringify({ apiLogs, consoleErrors }, null, 2));
}

testIntakeWizard().catch(console.error);
