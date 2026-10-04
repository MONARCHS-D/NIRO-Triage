const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\f20ccd5c-1db5-4e5c-96e4-54289201fbd3\\visual_inspection';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runAll() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log('Launching Chrome with clean light-theme parameters...');
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
    // 04-05: Start directly with Patient P-1042 Workstation
    console.log('Navigating directly to patient P-1042 workstation...');
    await page.goto('http://127.0.0.1:3000/patients/P-1042', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2500));

    // 01: Topbar inspection
    console.log('Capturing 01_dashboard_topbar.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_dashboard_topbar.png'), fullPage: false });

    // 02: Open Sync Outbox Drawer
    console.log('Opening Sync Outbox Drawer...');
    const syncPill = await page.$('button[title="Open Offline Sync Outbox"]');
    if (syncPill) {
      await syncPill.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('Capturing 02_sync_outbox_drawer.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_sync_outbox_drawer.png'), fullPage: false });

      // Click "Sync all (3)"
      console.log('Clicking Sync all (3)...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find((b) => b.textContent && b.textContent.includes('Sync all'));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 2500));
      console.log('Capturing 03_sync_outbox_synced.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_sync_outbox_synced.png'), fullPage: false });

      // Close drawer
      const closeDrawerBtn = await page.$('button[title="Close outbox drawer"]');
      if (closeDrawerBtn) await closeDrawerBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // Popover technical metadata
    console.log('Opening PatientHeader details popover...');
    const detailsMenuBtn = await page.$('button[title="Record Version & Technical Details"]');
    if (detailsMenuBtn) {
      await detailsMenuBtn.click();
      await new Promise((r) => setTimeout(r, 600));
      console.log('Capturing 04_patient_header_details_popover.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_patient_header_details_popover.png'), fullPage: false });
      await detailsMenuBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    // Full 2-column clinical workstation summary
    console.log('Capturing 05_clinical_workstation_summary_2col.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_clinical_workstation_summary_2col.png'), fullPage: true });

    // Protocol Assessment evaluation
    console.log('Reviewing Protocol Assessment...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Review assessment'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    console.log('Capturing 06_protocol_evaluated.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_protocol_evaluated.png'), fullPage: false });

    // AI Draft Review Modal (Diff view)
    console.log('Opening AI Draft Review Modal (Diff)...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('View changes'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing 07_ai_draft_diff_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_ai_draft_diff_modal.png'), fullPage: false });

    // Switch to Edit Content
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Edit Content'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing 08_ai_draft_edit_modal.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_ai_draft_edit_modal.png'), fullPage: false });

    // Close modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.trim() === 'Close');
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 500));

    // Referral & Inter-facility Handoff Modal (4 steps)
    console.log('Opening Referral / Handoff Modal...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Refer / Handoff'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    console.log('Capturing 09_handoff_step1_destination.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_handoff_step1_destination.png'), fullPage: false });

    // Step 2: Urgency
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Continue'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing 10_handoff_step2_urgency.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_handoff_step2_urgency.png'), fullPage: false });

    // Step 3: Notes
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Continue'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing 11_handoff_step3_notes.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_handoff_step3_notes.png'), fullPage: false });

    // Step 4: Dispatch Tracker
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Continue'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 600));
    console.log('Capturing 12_handoff_step4_tracker.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_handoff_step4_tracker.png'), fullPage: false });

    // Send Handoff -> Dispatch sequence -> Acknowledged
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find((b) => b.textContent && b.textContent.includes('Send Handoff'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 3500));
    console.log('Capturing 13_handoff_step4_acknowledged.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_handoff_step4_acknowledged.png'), fullPage: false });

    console.log('All visual inspection captures completed successfully!');
  } catch (err) {
    console.error('Visual inspection failed:', err);
  } finally {
    await browser.close();
  }
}

runAll();
