const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Monarch\\.gemini\\antigravity\\brain\\26c6d22a-f051-457d-9392-8b50f8e734ca';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function captureRolePermissionMatrix() {
  console.log('Launching Chrome to inspect Role Permission Matrix...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,1100'],
    defaultViewport: { width: 1440, height: 1100 },
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to http://localhost:3000/auth/login...');
    await page.goto('http://localhost:3000/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Fill in admin credentials and log in
    console.log('Logging in as admin@careintel.local...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    if (emailInput && passwordInput) {
      await emailInput.type('admin@careintel.local');
      await passwordInput.type('demo123');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log('Navigating to http://localhost:3000/settings...');
    await page.goto('http://localhost:3000/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Switch role to Facility Admin if needed
    console.log('Ensuring Facility Admin role is selected in Topbar...');
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      for (const sel of selects) {
        const hasAdmin = Array.from(sel.options).some(opt => opt.value === 'ADMIN');
        if (hasAdmin) {
          sel.value = 'ADMIN';
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Click 'Staff & Access' tab
    console.log('Clicking Staff & Access tab...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const staffTab = buttons.find(b => b.textContent && b.textContent.includes('Staff & Access'));
      if (staffTab) staffTab.click();
    });
    await new Promise((r) => setTimeout(r, 1500));

    // Take screenshot of Staff Directory & KPI metrics
    console.log('Capturing staff directory & KPI cards...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'step1_staff_directory_kpi_admins.png'),
      fullPage: false,
    });

    // Scroll down to the Role Permissions Matrix
    console.log('Scrolling down to Statutory Role Permissions Matrix...');
    await page.evaluate(() => {
      window.scrollBy({ top: 580, behavior: 'instant' });
    });
    await new Promise((r) => setTimeout(r, 800));

    console.log('Capturing role_permissions_matrix_admin_row.png...');
    await page.screenshot({
      path: path.join(ARTIFACT_DIR, 'role_permissions_matrix_admin_row.png'),
      fullPage: false,
    });

    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during visual capture:', err);
  } finally {
    await browser.close();
  }
}

captureRolePermissionMatrix();
