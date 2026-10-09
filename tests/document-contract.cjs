const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = function(module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2022}
  }).outputText, filename);
};
const {assertDocumentIdentity, documentStatusLabel} = require('../src/lib/documentResults.ts');
const result = {
  evidence_id:'document-a', case_id:'case-a', status:'PARTIAL',
  ocr_run:{evidence_id:'document-a'}, extraction_run:{evidence_id:'document-a'},
  candidates:[{provenance:[{evidence_id:'document-a'}]}], pages:[], needs_human_verification:true
};
assertDocumentIdentity(result, 'case-a', 'document-a');
assert.throws(() => assertDocumentIdentity(result, 'case-b', 'document-a'));
assert.throws(() => assertDocumentIdentity({...result, extraction_run:{evidence_id:'document-b'}}, 'case-a', 'document-a'));
for (const status of ['RUNNING','PARTIAL','NO_SUPPORTED_FIELDS','NO_EXTRACTABLE_CONTENT','FAILED','DEMO_UNVERIFIED']) {
  const label = documentStatusLabel({...result,status});
  assert(label && !label.includes('successfully'));
}
const load = Module._load;
Module._load = function(request, parent, main) {
  if (request.endsWith('/context/TriageContext')) return {useTriage: () => ({selectedPatient:null,patients:[],setSelectedPatientId(){}})};
  return load.apply(this, arguments);
};
const {ReportExtractStudio} = require('../src/components/intake/ReportExtractStudio.tsx');
const html = renderToStaticMarkup(React.createElement(ReportExtractStudio));
assert(html.includes('No structured fields available'));
assert(html.includes('active data-processing consent'));
for (const fake of ['11.8','11,400','126/82','CHC VERIFIED','LAB TECH','Information extracted successfully']) assert(!html.includes(fake), fake);
assert(!fs.readFileSync('src/components/intake/ReportExtractStudio.tsx','utf8').includes('ocrSimulator'));
assert(!fs.readFileSync('src/components/views/ReportsView.tsx','utf8').includes('SAMPLE_REPORTS'));
console.log('Frontend/API contract: passed identity, status, empty render, and fabricated fallback checks.');
(async () => {
  const {evidenceApi} = require('../src/lib/api/evidence.ts');
  const {processingApi} = require('../src/lib/api/processing.ts');
  const {AUTH_TOKEN_STORAGE_KEY} = require('../src/lib/api/config.ts');
  global.window = {};
  global.localStorage = {getItem:key=>key===AUTH_TOKEN_STORAGE_KEY?'synthetic-contract-token':null};
  let captured;
  global.fetch = async (url, options) => {
    captured = {url, options};
    return new Response(JSON.stringify({evidence_id:'document-a',case_id:'case-a',state:'STORED'}),{status:201,headers:{'Content-Type':'application/json'}});
  };
  const file = new File(['%PDF-1.4 synthetic only'],'synthetic.pdf',{type:'application/pdf'});
  await evidenceApi.uploadFileEvidence({caseId:'case-a',consentId:'consent-a',modality:'DOCUMENT',file});
  assert.equal(captured.options.body.get('case_id'),'case-a');
  assert.equal(captured.options.body.get('consent_id'),'consent-a');
  assert.equal(captured.options.body.get('modality'),'document');
  assert.equal(await captured.options.body.get('file').text(),await file.text());
  assert.equal(captured.options.headers.get('Authorization'),'Bearer synthetic-contract-token');
  assert(captured.options.headers.has('X-Correlation-ID'));
  assert.equal(captured.options.cache,'no-store');
  assert(!captured.options.headers.has('Content-Type')); // Browser owns multipart boundary.
  await processingApi.getDocumentResults('document-a');
  assert(captured.url.endsWith('/processing/documents/document-a/results'));
  console.log('API client contract: passed binary, IDs, lowercase modality, auth, correlation, and no-store checks.');
})().catch(error=>{console.error(error);process.exitCode=1;});
