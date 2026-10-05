const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\f20ccd5c-1db5-4e5c-96e4-54289201fbd3\\visual_inspection';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureDrawer() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--window-size=1440,960',
      '--disable-features=ForcedColors,AutoDarkMode,WebContentsForceDark',
      '--disable-high-contrast-mode',
      '--high-contrast-mode=0',
      '--force-high-contrast=0',
    ],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();
  try {
    console.log('Navigating to /patients/P-1042...');
    await page.goto('http://127.0.0.1:3000/patients/P-1042', { waitUntil: 'domcontentloaded', timeout: 30000 });

    console.log('Waiting for React hydration on /patients/P-1042...');
    await page.waitForFunction(() => {
      const btn = document.querySelector('button[title="Open Offline Sync Outbox"]');
      return btn && Object.keys(btn).some((k) => k.startsWith('__reactProps'));
    }, { timeout: 30000 });
    console.log('React is HYDRATED!');

    console.log('Clicking Sync Outbox pill in Topbar...');
    const syncPill = await page.$('button[title="Open Offline Sync Outbox"]');
    await syncPill.click();
    await new Promise((r) => setTimeout(r, 1200));

    console.log('Capturing 02_sync_outbox_drawer.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_sync_outbox_drawer.png'), fullPage: false });

    console.log('Clicking "Sync all" button inside drawer...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Sync all'));
      if (btn) btn.click();
    });

    await new Promise((r) => setTimeout(r, 2500));
    console.log('Capturing 03_sync_outbox_synced.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_sync_outbox_synced.png'), fullPage: false });

    console.log('Sync Outbox drawer screenshots captured successfully in clean light theme!');
  } catch (err) {
    console.error('Error capturing drawer:', err);
  } finally {
    await browser.close();
  }
}

captureDrawer();
