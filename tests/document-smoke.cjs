/** Browser smoke using the actual synthetic persisted API response from the PostgreSQL test. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer-core');
const dir = process.env.CAREINTEL_SMOKE_ARTIFACT_DIR || '/tmp/careintel-document-smoke';
const result = JSON.parse(fs.readFileSync(`${dir}/results.json`));
const uploaded = JSON.parse(fs.readFileSync(`${dir}/upload.json`));
const trace = JSON.parse(fs.readFileSync(`${dir}/trace.json`));
const base = process.env.CAREINTEL_SMOKE_UI_URL || 'http://127.0.0.1:3100';
assert.equal(result.evidence_id, uploaded.evidence_id);
assert.equal(result.case_id, uploaded.case_id);
const otherCase = '10000000-0000-0000-0000-000000000002';
const emptyDoc = '20000000-0000-0000-0000-000000000002';
let mode = 'success', uploadCount = 0, extractionTriggered = false;
const requests = [], pollCounts = {};
let originalRequests = 0;
(async () => {
  const browser = await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,
    args:['--no-sandbox','--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage();
    await page.setViewport({width:1440,height:1050});
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('careintel_access_token_v1','synthetic-test-token');
      // Prove legacy clinical localStorage cannot populate the live queue.
      localStorage.setItem('niro_triage_patients_v1', JSON.stringify([{id:'P-1042',name:'STALE DEMO',facts:[{value:'11.8'}]}]));
    });
    await page.setRequestInterception(true);
    const interceptionErrors = [];
    page.on('request', async request => {
      try {
      const url = new URL(request.url());
      if (url.pathname === '/synthetic-original.pdf') {
        originalRequests++;
        return request.respond({status:200,contentType:'application/pdf',body:fs.readFileSync(`${dir}/fixture.pdf`)});
      }
      if (!url.pathname.startsWith('/api/v1')) return request.continue();
      const path = url.pathname.slice(7);
      const json = (value,status=200) => request.respond({status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type, X-Correlation-ID','Access-Control-Allow-Methods':'*'},body:JSON.stringify(value)});
      if (request.method() === 'OPTIONS') return json({});
      requests.push({path,method:request.method()});
      if (path === '/auth/me') return json({id:uploaded.created_by,is_active:true,roles:['doctor'],permissions:['processing:read','processing:write','evidence:read','evidence:write']});
      if (path.includes('/health')) return json({status:'ok',checks:{}});
      if (path === '/queue') return json([
        {case_id:result.case_id,status:'PENDING_REVIEW',priority_bucket:null,version:1},
        {case_id:otherCase,status:'PENDING_REVIEW',priority_bucket:null,version:1}
      ]);
      if (path.endsWith('/upload-context')) return json({case_id:result.case_id,consent_id:'30000000-0000-0000-0000-000000000003'});
      if (path === `/evidence/cases/${result.case_id}`) return json(uploadCount ? [uploaded] : []);
      if (path === `/evidence/cases/${otherCase}`) return json([{...uploaded,evidence_id:emptyDoc,case_id:otherCase,original_filename:'empty.pdf'}]);
      if (path === '/evidence/files') {
        assert.equal(request.method(),'POST');
        const data = request.postData() || await request.fetchPostData() || '';
        assert(data.includes(result.case_id));
        assert(data.includes('document'));
        assert(!data.includes('DOCUMENT'));
        uploadCount++;
        return json({...uploaded,state:mode === 'pending' ? 'STORED' : 'READY'},201);
      }
      if (path.endsWith('/download')) return json({download_url:`${base}/synthetic-original.pdf`,expires_at:'2099-01-01T00:00:00Z'});
      if (path === `/evidence/${emptyDoc}`) return json({...uploaded,evidence_id:emptyDoc,case_id:otherCase});
      if (path === `/evidence/${result.evidence_id}`) return json(uploaded);
      if (path === '/processing/trigger') {
        const payload = JSON.parse(request.postData());
        assert.equal(payload.evidence_id,result.evidence_id);
        if (payload.processor_type === 'candidate_extraction') {
          assert.equal(payload.parameters.source_processing_run_id,result.ocr_run.run_id);
          extractionTriggered = true;
        }
        const id = payload.processor_type === 'document_ocr' ? 'task-ocr' : 'task-extraction';
        pollCounts[id] = 0;
        return json({run_id:id},202);
      }
      if (path.startsWith('/tasks/')) {
        const id = path.split('/').at(-1);
        const count = pollCounts[id]++;
        return json({id,status:mode === 'failure' ? 'FAILED' : count === 0 ? 'RUNNING' : 'SUCCEEDED',case_id:result.case_id,entity_id:result.evidence_id,correlation_id:trace.correlation_id,failure_reason:mode === 'failure' ? 'TimeoutError' : null});
      }
      if (path === `/processing/documents/${emptyDoc}/results`) {
        if (mode === 'mismatch') return json(result);
        return json({...result,evidence_id:emptyDoc,case_id:otherCase,status:'NO_EXTRACTABLE_CONTENT',ocr_run:{...result.ocr_run,evidence_id:emptyDoc,status:'FAILED',failure_reason:'NO_EXTRACTABLE_CONTENT'},extraction_run:null,pages:[],candidates:[]});
      }
      if (path === `/processing/documents/${result.evidence_id}/results`) {
        if (mode === 'pending') return json({...result,status:'AWAITING_SCAN',ocr_run:null,extraction_run:null,pages:[],candidates:[]});
        if (mode === 'failure') return json({...result,status:'FAILED',ocr_run:{...result.ocr_run,status:'FAILED',failure_reason:'TimeoutError'},extraction_run:null,pages:[],candidates:[]});
        return json(extractionTriggered ? result : {...result,status:'OCR_COMPLETED',extraction_run:null,candidates:[]});
      }
      return json([]);
      } catch (error) { interceptionErrors.push(error.message); await request.respond({status:500,body:'Synthetic smoke interception failed'}); }
    });
    await page.goto(`${base}/intake/report`,{waitUntil:'networkidle0',timeout:60000});
    await page.waitForSelector('select[aria-label="Case"] option:nth-child(2)');
    const caseValue = await page.$eval('select[aria-label="Case"]', (el,id)=>Array.from(el.options).find(option=>option.textContent.includes(id)).value, result.case_id);
    await page.select('select[aria-label="Case"]',caseValue);
    await page.waitForFunction(()=>!document.querySelector('button')?.disabled);
    await new Promise(resolve=>setTimeout(resolve,200));
    let input = await page.$('input[type=file][aria-label="Upload clinical document"]');
    await input.uploadFile(`${dir}/fixture.pdf`);
    await page.waitForFunction(()=>document.body.innerText.includes('Completed with partial extraction'),{timeout:30000}).catch(async error => {
      console.error('Synthetic browser interception errors:', interceptionErrors);
      console.error('Synthetic browser failure:', await page.$$eval('[role=status], [role=alert]', els=>els.map(el=>el.textContent)), requests);
      throw error;
    });
    let text = await page.$eval('section[aria-label="Document OCR and extraction"]',el=>el.innerText);
    for (const value of ['14.5 g/dL','10570 /cmm','7.10 %','<148 pg/mL','Page 13','Reference interval: 200 - 900','Source flag: L',trace.ocr_run_id,trace.extraction_run_id,'CANDIDATE']) assert(text.includes(value),value);
    for (const fake of ['11.8','11,400','126/82','CHC VERIFIED','LAB TECH','STALE DEMO']) assert(!text.includes(fake),fake);
    assert(originalRequests > 0, 'Original stored PDF preview was requested');
    await page.screenshot({path:`${dir}/browser.png`,fullPage:true});
    const otherValue = await page.$eval('select[aria-label="Case"]', (el,id)=>Array.from(el.options).find(option=>option.textContent.includes(id)).value, otherCase);
    await page.select('select[aria-label="Case"]',otherValue);
    await page.waitForSelector(`select[aria-label="Document"] option[value="${emptyDoc}"]`);
    text = await page.$eval('section[aria-label="Document OCR and extraction"]',el=>el.innerText);
    assert(!text.includes('14.5 g/dL'));
    await page.select('select[aria-label="Document"]',emptyDoc);
    await page.waitForFunction(()=>document.body.innerText.includes('No extractable content'));
    mode = 'mismatch';
    await page.select('select[aria-label="Case"]',caseValue);
    await page.select('select[aria-label="Case"]',otherValue);
    await page.waitForSelector(`select[aria-label="Document"] option[value="${emptyDoc}"]`);
    await page.select('select[aria-label="Document"]',emptyDoc);
    await page.waitForSelector('[role=alert]');
    text = await page.$eval('section[aria-label="Document OCR and extraction"]',el=>el.innerText);
    assert(!text.includes('14.5 g/dL'));
    // Pending content scan is not represented as successful extraction.
    mode = 'pending';
    await page.select('select[aria-label="Case"]',caseValue);
    input = await page.$('input[type=file][aria-label="Upload clinical document"]');
    await input.uploadFile(`${dir}/fixture.pdf`);
    await page.waitForFunction(()=>document.body.innerText.includes('awaiting content scan'));
    text = await page.$eval('section[aria-label="Document OCR and extraction"]',el=>el.innerText);
    assert(!text.includes('14.5 g/dL'));
    mode = 'failure';
    await input.uploadFile(`${dir}/fixture.pdf`);
    await page.waitForFunction(()=>document.body.innerText.includes('Processing failed — retry available'));
    text = await page.$eval('section[aria-label="Document OCR and extraction"]',el=>el.innerText);
    assert(text.includes('TimeoutError') && !text.includes('14.5 g/dL'));
    assert(requests.some(r=>r.path === '/evidence/files'));
    assert(requests.some(r=>r.path === '/processing/trigger'));
    fs.writeFileSync(`${dir}/browser-validation.json`,JSON.stringify({passed:true,trace,checks:['original stored PDF preview','persisted values','source pages','unverified state','no fake fallback','case switch','empty OCR','identity mismatch','awaiting scan','failed OCR'],apiTransport:'synthetic persisted response replay'},null,2));
    console.log('Browser smoke: passed upload, original PDF preview, persisted values/provenance, case switch, empty, identity mismatch, scan pending, and failure states.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
