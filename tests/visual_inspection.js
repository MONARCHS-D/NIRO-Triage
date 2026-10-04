const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\f20ccd5c-1db5-4e5c-96e4-54289201fbd3\\visual_inspection';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function runVisualInspection() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }

  console.log('Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960 },
  });

  const page = await browser.newPage();

  try {
    console.log('Navigating to http://127.0.0.1:3000...');
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    // 1. Dashboard & Topbar with Sync Pill
    console.log('Capturing 01_dashboard_topbar.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_dashboard_topbar.png'), fullPage: false });

    // 2. Open Sync Outbox Drawer
    console.log('Opening Sync Outbox Drawer...');
    const syncPill = await page.$('button[title="Open Offline Sync Outbox"]');
    if (syncPill) {
      await syncPill.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('Capturing 02_sync_outbox_drawer.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_sync_outbox_drawer.png'), fullPage: false });

      // Click "Sync all (3)"
      const syncAllBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find((b) => b.textContent && b.textContent.includes('Sync all'));
      });
      if (syncAllBtn && syncAllBtn.click) {
        await syncAllBtn.click();
        await new Promise((r) => setTimeout(r, 2500));
        console.log('Capturing 03_sync_outbox_synced.png...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_sync_outbox_synced.png'), fullPage: false });
      }

      // Close drawer
      const closeBtn = await page.$('button[title="Close outbox drawer"]');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log('Navigating directly to patient P-1042 workspace at /patients/P-1042...');
    await page.goto('http://127.0.0.1:3000/patients/P-1042', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Details popover menu in PatientHeader
    console.log('Testing Details popover menu...');
    const detailsMenuBtn = await page.$('button[title="Record Version & Technical Details"]');
    if (detailsMenuBtn) {
      await detailsMenuBtn.click();
      await new Promise((r) => setTimeout(r, 500));
      console.log('Capturing 04_patient_header_details_popover.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_patient_header_details_popover.png'), fullPage: false });
      // Close details menu
      await detailsMenuBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    // 5. Full 2-column clinical workstation summary
    console.log('Capturing 05_clinical_workstation_summary_2col.png...');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_clinical_workstation_summary_2col.png'), fullPage: true });

    // 6. Protocol Assessment evaluate
    console.log('Testing Protocol Assessment evaluation...');
    const evaluateBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('Review assessment'));
    });
    if (evaluateBtn && evaluateBtn.click) {
      await evaluateBtn.click();
      await new Promise((r) => setTimeout(r, 1000));
      console.log('Capturing 06_protocol_evaluated.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_protocol_evaluated.png'), fullPage: false });
    }

    // 7. Open AI Draft Review Modal
    console.log('Opening AI Draft Review Modal...');
    const viewChangesBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('View changes'));
    });
    if (viewChangesBtn && viewChangesBtn.click) {
      await viewChangesBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('Capturing 07_ai_draft_diff_modal.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_ai_draft_diff_modal.png'), fullPage: false });

      // Click "Edit Content" view
      const editViewBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find((b) => b.textContent && b.textContent.includes('Edit Content'));
      });
      if (editViewBtn && editViewBtn.click) {
        await editViewBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        console.log('Capturing 08_ai_draft_edit_modal.png...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_ai_draft_edit_modal.png'), fullPage: false });
      }

      // Close modal
      const closeDraftModalBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find((b) => b.textContent && b.textContent.trim() === 'Close');
      });
      if (closeDraftModalBtn && closeDraftModalBtn.click) await closeDraftModalBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // 8. Open Referral / Handoff Modal
    console.log('Opening Referral / Handoff Modal...');
    const handoffBtn = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find((b) => b.textContent && b.textContent.includes('Refer / Handoff'));
    });
    if (handoffBtn && handoffBtn.click) {
      await handoffBtn.click();
      await new Promise((r) => setTimeout(r, 800));
      console.log('Capturing 09_handoff_step1_destination.png...');
      await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_handoff_step1_destination.png'), fullPage: false });

      // Click Continue to Step 2 (Urgency)
      const continueBtn = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find((b) => b.textContent && b.textContent.includes('Continue'));
      });
      if (continueBtn && continueBtn.click) {
        await continueBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        console.log('Capturing 10_handoff_step2_urgency.png...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '10_handoff_step2_urgency.png'), fullPage: false });

        // Continue to Step 3 (Notes)
        await continueBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        console.log('Capturing 11_handoff_step3_notes.png...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '11_handoff_step3_notes.png'), fullPage: false });

        // Continue to Step 4 (Dispatch Tracker)
        await continueBtn.click();
        await new Promise((r) => setTimeout(r, 600));
        console.log('Capturing 12_handoff_step4_tracker.png...');
        await page.screenshot({ path: path.join(ARTIFACT_DIR, '12_handoff_step4_tracker.png'), fullPage: false });

        // Click "Send Handoff"
        const sendHandoffBtn = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find((b) => b.textContent && b.textContent.includes('Send Handoff'));
        });
        if (sendHandoffBtn && sendHandoffBtn.click) {
          await sendHandoffBtn.click();
          await new Promise((r) => setTimeout(r, 3000));
          console.log('Capturing 13_handoff_step4_acknowledged.png...');
          await page.screenshot({ path: path.join(ARTIFACT_DIR, '13_handoff_step4_acknowledged.png'), fullPage: false });
        }
      }
    }

    console.log('Visual inspection completed successfully!');
  } catch (err) {
    console.error('Visual inspection encountered error:', err);
  } finally {
    await browser.close();
  }
}

runVisualInspection();
