const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = path.join(__dirname, '..', 'test_reports', 'e2e');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:3000';

async function testLiveIntake() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();
  const networkLogs = [];
  const consoleLogs = [];

  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`);
  });

  page.on('response', async (response) => {
    const url = response.url();
    const status = response.status();
    if (url.includes('/api/v1/')) {
      let text = '';
      try {
        text = await response.text();
      } catch (e) {}
      networkLogs.push({ url, status, body: text.substring(0, 300) });
      console.log(`[API Response] ${response.request().method()} ${url} -> ${status}: ${text.substring(0, 150)}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:3000/intake...');
    await page.goto(`${BASE_URL}/intake`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'intake_01_loaded.png') });

    // Look for patient input fields or buttons
    console.log('Looking for intake inputs and buttons...');
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Intake Page Title / Headings:');
    const headings = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1, h2, h3, button')).map((el) => `${el.tagName}: ${el.innerText.trim()}`)
    );
    console.log(headings.slice(0, 20).join('\n'));

    // Check if there's a patient selection or form
    // Check for Chief Complaint input
    const inputs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('input, textarea, select')).map((el) => ({
        tag: el.tagName,
        type: el.type,
        placeholder: el.placeholder,
        name: el.name,
        id: el.id,
      }))
    );
    console.log('Inputs found:', JSON.stringify(inputs, null, 2));

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'intake_02_inspected.png') });
  } catch (err) {
    console.error('Intake test error:', err);
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, 'intake_inspection.json'),
    JSON.stringify({ consoleLogs, networkLogs }, null, 2)
  );
}

testLiveIntake().catch(console.error);
