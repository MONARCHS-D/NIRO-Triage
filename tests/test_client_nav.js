const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '..', 'test_reports', 'client_nav_e2e');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function testClientSideFlow() {
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
  const logs = { consoleErrors: [], networkCalls: [], steps: [] };

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logs.consoleErrors.push({ url: page.url(), text: msg.text() });
      console.log(`[Console ERROR]`, msg.text());
    }
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (url.includes('/api/v1/')) {
      const status = res.status();
      const method = res.request().method();
      let text = '';
      try { text = await res.text(); } catch (e) {}
      logs.networkCalls.push({ method, url, status, text: text.substring(0, 200) });
      if (status >= 400) {
        console.log(`[Backend API Error ${status}] ${method} ${url}: ${text}`);
      } else {
        console.log(`[Backend API ${status}] ${method} ${url}`);
      }
    }
  });

  try {
    console.log('1. Navigating to login...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1000));

    console.log('2. Clicking nurse login...');
    const nurseBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('Sunita B.'));
    });
    if (nurseBtn && nurseBtn.click) {
      await nurseBtn.click();
    }

    console.log('3. Waiting for dashboard navigation...');
    await page.waitForFunction(() => window.location.pathname.includes('/dashboard'), { timeout: 15000 });
    console.log('Arrived at dashboard:', page.url());
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(REPORT_DIR, '01_dashboard.png') });

    // Inspect Sidebar Links
    const sidebarLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('nav a, aside a')).map((a) => ({
        text: a.innerText.trim(),
        href: a.getAttribute('href'),
      }));
    });
    console.log('Sidebar links found:', sidebarLinks);

    // 4. Click Intake link in Sidebar
    console.log('4. Clicking New Intake in sidebar...');
    const intakeLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a, a'));
      return links.find((l) => l.innerText && (l.innerText.includes('Intake') || l.getAttribute('href') === '/intake'));
    });
    if (intakeLink && intakeLink.click) {
      await intakeLink.click();
      await new Promise((r) => setTimeout(r, 2000));
      console.log('Current URL after clicking intake:', page.url());
      await page.screenshot({ path: path.join(REPORT_DIR, '02_intake_view.png') });
    }

    // Check intake form buttons and elements
    const intakeInfo = await page.evaluate(() => {
      return {
        url: window.location.pathname,
        buttons: Array.from(document.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean),
        inputs: Array.from(document.querySelectorAll('input, textarea')).map((i) => i.placeholder || i.name || i.tagName),
      };
    });
    console.log('Intake info after client nav:', intakeInfo);

    // 5. Click Queue link in Sidebar
    console.log('5. Clicking Queue in sidebar...');
    const queueLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a, a'));
      return links.find((l) => l.innerText && (l.innerText.includes('Queue') || l.getAttribute('href') === '/queue'));
    });
    if (queueLink && queueLink.click) {
      await queueLink.click();
      await new Promise((r) => setTimeout(r, 2000));
      console.log('Current URL after clicking queue:', page.url());
      await page.screenshot({ path: path.join(REPORT_DIR, '03_queue_view.png') });
    }

    // 6. Click Patients link in Sidebar
    console.log('6. Clicking Patients in sidebar...');
    const patientsLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a, a'));
      return links.find((l) => l.innerText && (l.innerText.includes('Patients') || l.getAttribute('href') === '/patients'));
    });
    if (patientsLink && patientsLink.click) {
      await patientsLink.click();
      await new Promise((r) => setTimeout(r, 2000));
      console.log('Current URL after clicking patients:', page.url());
      await page.screenshot({ path: path.join(REPORT_DIR, '04_patients_view.png') });
    }

    // 7. Click Settings link in Sidebar
    console.log('7. Clicking Settings in sidebar...');
    const settingsLink = await page.evaluateHandle(() => {
      const links = Array.from(document.querySelectorAll('nav a, aside a, a'));
      return links.find((l) => l.innerText && (l.innerText.includes('Settings') || l.getAttribute('href') === '/settings'));
    });
    if (settingsLink && settingsLink.click) {
      await settingsLink.click();
      await new Promise((r) => setTimeout(r, 2000));
      console.log('Current URL after clicking settings:', page.url());
      await page.screenshot({ path: path.join(REPORT_DIR, '05_settings_view.png') });
    }

  } catch (err) {
    console.error('Client side flow error:', err);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(REPORT_DIR, 'client_nav_report.json'), JSON.stringify(logs, null, 2));
}

testClientSideFlow().catch(console.error);
