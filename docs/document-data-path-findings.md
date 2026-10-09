**CareIntel document data-path investigation — 2026-10-09**

The first incorrect boundary was the frontend file-selection handler, before any backend request. `ReportExtractStudio` ignored the uploaded binary, waited 1.2 seconds, and substituted hemoglobin `11.8`, WBC `11,400`, and blood pressure `126/82`. It initially selected a sample report and rendered a fabricated lab header, date, technician signature, and verification stamp. `ReportsView` also selected a sample document and its upload button only displayed a notice. None of those actions demonstrated OCR processing.

Additional independent failures would have prevented a real upload from working even after replacing that handler:

| Layer | Evidence and root cause | Correction |
| --- | --- | --- |
| Frontend/API contract | Multipart client uppercased modality; FastAPI's enum accepts lowercase. The integration regression reproduced HTTP 422. | Multipart sends `document`/`image`; original bytes, case, consent, authorization and correlation headers are checked. |
| Backend upload | Startup always selected `NoOpScanner`, which always returned PENDING. Uploads remained STORED, while OCR requires READY. There was no scan retry route. | Configurable ClamAV adapter, authorized scan retry, and explicit AWAITING_SCAN/QUARANTINED UI states. Missing or failing scanners never imply CLEAN. |
| Extraction/provider selection | API startup and Celery always instantiated `DemoExtractionProvider`, regardless of the selector. The configured production environment resolved extraction to demo; the production guard omitted extraction. That extractor only supported fever/date fixtures. | One shared, explicit OCR/extraction factory; production rejects demo extraction. Default source-only lab extractor recognizes supported rows, preserving exact result strings and source metadata. Unsupported selectors fail instead of falling back. |
| OCR adapter | Lines were dropped when other regions existed. Table cells lost their bounding regions/spans. Missing provenance defaulted to page 1; whole-document fallback could attribute multi-page text to page 1. | Awaited async Azure SDK with bounded timeout and explicit API version. Preserve page-local lines, paragraphs, table cells, spans and polygons; reject unknown or ambiguous page associations. |
| Processing/persistence | Empty OCR was COMPLETED; failed runs were returned unchanged by idempotency checks. Exceptions could leave partially persisted artifacts. The worker raised after marking a run FAILED, causing the durable executor to roll that failed state back. | Empty content has a truthful failure code. Lock/retry failed attempts, retain successful artifacts, and use savepoints for evidence/candidates. Commit sanitized failed runs before durable task failure/retry handling. Configuration identity includes provider/model/version/source run. |
| Backend read path | Processing APIs returned run status only; the report UI had no authorized document-results API. | Add results scoped to one evidence record and its case, with the latest OCR attempt and only the extraction linked to that attempt. Failed attempts cannot masquerade as prior successful results. |
| Provenance | Extraction could lose page/region association in the concatenated text. | Validate spans against persisted OCR, attach exact page/region IDs, retain raw source separately from normalized values, and persist source unit, interval, comparison and explicit flag in existing provenance JSON. Require CANDIDATE state. |
| Frontend state | Seeded patients and old localStorage were loaded by default; backend queue rows received invented demographics, vitals and default urgency. Workspace requests could retain another case's response. | Demo records are opt-in; live clinical state is not restored from legacy localStorage. Missing fields remain null/empty, unknown priority is GREY. Case-keyed document state and request generation guards prevent stale renders. Workspace reads no longer auto-assign reviewers after access failures. |
| Frontend authentication | Failed login/session checks could silently authorize prototype mode. | Backend authentication is required in live mode; demo login is explicit. Do not present a fixture clinician name as the authenticated reviewer. |

The report studio now uses this sequence: selected authorized registered case → existing active data-processing consent → original file upload/storage/scan → persisted async OCR task → worker → Azure adapter → OCR tables/regions → extraction from that exact run → persisted candidates → authorized document-results API → original secured document plus unverified candidate rendering. `/processing/trigger` returns an **async task ID** in its existing `run_id` field; the UI polls `/tasks/{id}` and obtains the actual processing run IDs from persisted results. Upload acceptance never implies processing completion. No clinical values are substituted on errors, timeouts, missing content or unsupported fields.

All clinical extraction remains subject to human verification. The conservative extractor currently supports hemoglobin, WBC count, HbA1c and vitamin B12 aliases and their compatible source units. Other measurements, ambiguous rows, unsupported layouts and missing units remain OCR evidence for review. It does not infer diagnoses, urgency, abnormality from reference ranges, or reviewer approval. Distinct conflicting values remain separate candidates. Duplicate representations of the same source measurement on the same page are suppressed. Decimal text and comparison symbols are retained without floating-point conversion.

The supplied pathology PDF was not found in the repository. Tests instead generate a clearly labeled 13-page synthetic PDF and mock Azure's response with the requested example values. These tests verify plumbing and source preservation, **not Azure's ability to OCR the unavailable original report**.

The final persisted synthetic trace was:

| Identifier | Value |
| --- | --- |
| Case | `f5a42d86-6005-4243-8be7-83f5cb1ae1a3` |
| Document/evidence | `cab56e54-eb5d-405f-ae78-9704c73ce778` |
| OCR run | `0181933b-234c-48a2-9dbd-5b6c88f3a4e6` |
| Extraction run | `e44dd9e5-3902-413f-a792-ce2f8723550d` |
| Correlation | `synthetic-document-trace` |
| Result | `PARTIAL`, needs human verification |

Those records were created in the configured PostgreSQL database inside a rolled-back outer transaction. External blob storage and scanner responses were mocked. The real Azure adapter received the same original PDF binary, through a mocked SDK transport. The worker handler was executed in-process with persisted task claiming/success transitions; a live broker/dispatcher was not used. Structured logs record document/case/run/task IDs, state and correlation without logging source contents or credentials.

| Validation group | Final result | Scope |
| --- | --- | --- |
| 1. OCR adapter | PASSED | Mocked Azure SDK: exact binary/API contract, pages, lines, paragraphs, cell bounds/spans, provider timeout, invalid/ambiguous page association, explicit provider selection. |
| 2. Extraction regression | PASSED | `14.5 g/dL` and `10570 /cmm` on page 1; `7.10 %` on page 5; `<148 pg/mL` on page 13. Missing/reference-only/ambiguous text is not a measurement. Comparison, unit, interval, explicit flags and provenance preserved; all candidates unverified. |
| 3. Backend integration | PASSED | PostgreSQL upload → persisted task/worker → OCR/extraction → authorized API read; correct case/document/source links, successful retry idempotency, cross-case rejection, facility denial, scan-pending recovery. Focused processor/scanner unit checks also pass. |
| 4. Frontend/API contract | PASSED | Node tests check actual FormData bytes/IDs/lowercase modality/auth/correlation/no-store, identity rejection, status labels, empty SSR rendering, and absence of fabricated report fallbacks. TypeScript and focused studio ESLint pass. |
| 5. End-to-end smoke | PASSED, mocked transport | Headless Chrome uploads the synthetic PDF and renders the actual JSON persisted/read by group 3, replayed through intercepted HTTP. Serves the stored original PDF for preview and checks values/pages/flags/intervals/unverified state, case switches, mismatched IDs, empty OCR, scan-pending and failed processing. This is a stitched smoke test, not a live Azure/Celery deployment test. |

The focused Python run passed 16 checks, the latest adapter run passed four checks, and the final PostgreSQL regression passed. Initial validation attempts failed: the uppercase upload contract reproduced a real implementation bug; test harness fixes were also needed for mocked context-manager exception propagation, task claiming, case selection by ID rather than queue position, and Chrome multipart retrieval, and the mocked original-PDF preview transport. The final checks above pass; those intermediate failures were not treated as successful evidence. The full suite was not run.

Files changed, grouped by purpose:

- `src/components/intake/ReportExtractStudio.tsx`, `src/components/views/ReportsView.tsx`, `src/app/intake/report/page.tsx`: replace sample/report timers and fake previews with the real document pipeline and original preview.
- `src/lib/documentResults.ts`, `src/lib/api/{client,config,evidence,processing,types}.ts`: document result contract, identity/status mapping, upload/scan/list/results methods, lowercase modality, upload timeout, explicit demo flag and no-store fetches.
- `src/context/{TriageContext,RoleContext,NotificationContext}.tsx`, `src/components/layout/{ShellLayout,Topbar}.tsx`, `src/app/page.tsx`: isolate clinical fixtures and legacy storage, truthful missing demographics/vitals/priority, explicit live authentication, gated seeded notifications/simulated arrivals, live role display, and session-validation-aware redirects.
- `src/components/views/{NewIntakeView,PatientWorkspaceView}.tsx`, `src/components/workspace/ExtractedDataTab.tsx`: remove fabricated intake defaults, require registered-case report upload, prevent failed live intake from becoming a successful local record, guard workspace responses, and show selected document results in the extracted-data tab.
- `src/types/triage.ts`, `src/app/queue/page.tsx`, `src/components/views/DashboardView.tsx`, `src/app/intake/voice/page.tsx`, `src/components/common/BackendHealthBadge.tsx`: nullable demographic compatibility and honest backend-unavailable messaging.
- `CareIntel/src/careintel/infrastructure/{processing_providers.py,ocr/azure_provider.py,extraction/lab_provider.py,scanner/clamav_scanner.py}`, `CareIntel/src/careintel/{main.py,core/config.py,workers/providers.py}`: shared real provider selection, bounded Azure parsing, conservative extraction and real configurable scanning.
- `CareIntel/src/careintel/application/processing/{document_processor,extraction_processor,processing_service}.py`, `CareIntel/src/careintel/persistence/repositories/processing_repo.py`, `CareIntel/src/careintel/workers/processing_tasks.py`: truthful states, source associations, atomic persistence, idempotent retry and failed-run visibility.
- `CareIntel/src/careintel/application/evidence/evidence_service.py`, `CareIntel/src/careintel/api/v1/evidence/router.py`, `CareIntel/src/careintel/api/v1/processing/{router,schemas}.py`, `CareIntel/src/careintel/domain/processing/processing_models.py`: authorized evidence list/upload context/scan retry/results routes, typed processor validation, and provenance metadata in the existing JSON storage. No migration or new database schema was required.
- `CareIntel/tests/fixtures/pathology.py`, `CareIntel/tests/unit/processing/test_document_intelligence_regression.py`, existing `test_document_processor.py` and `test_extraction_processor.py`, `CareIntel/tests/unit/evidence/test_document_scanner.py`, `CareIntel/tests/integration/test_document_data_path.py`, `tests/document-contract.cjs`, `tests/document-smoke.cjs`: the five focused validation groups.
- This report: investigation, trace, changed-file explanations, verification results and limitations.

Test/demo artifacts in `src/lib/ocrSimulator.ts`, `src/lib/syntheticData.ts`, demo providers, seeding scripts and release/provider verifiers were retained. The OCR simulator has no production component imports. Runtime/provider verifier synthetic records are script/test inputs, not document results; they were not modified or executed to fabricate release health. Existing staged setup changes and credentials were left untouched.

Operational limitations: neither `clamscan` nor `clamdscan` is installed on this machine. Real uploads therefore remain awaiting scanning until ClamAV with current virus definitions is supplied; select `CONTENT_SCANNER_PROVIDER=clamav` (the default), then use the studio's Process / retry action after scanning is available. `pending` intentionally leaves the security gate closed. No live paid Azure request was authorized or performed, so endpoint/credential presence and SDK compatibility are checked, but external service correctness/accuracy is unverified. No Docker executable or Compose workflow was available; Docker verification was not run. Existing clinical subject registration/consent must precede report upload; upload does not invent or silently capture consent for a new patient.

Azure's binary upload and async polling contract/API version were checked against the installed SDK and [Microsoft's Document Intelligence SDK documentation](https://learn.microsoft.com/python/api/overview/azure/ai-documentintelligence-readme?view=azure-python).

Reproduce the focused checks:

```bash
cd CareIntel
.venv/bin/pytest tests/unit/processing/test_document_intelligence_regression.py tests/unit/processing/test_document_processor.py tests/unit/processing/test_extraction_processor.py tests/unit/evidence/test_document_scanner.py
.venv/bin/pytest tests/integration/test_document_data_path.py
cd ..
node tests/document-contract.cjs
npx tsc --noEmit
npx eslint src/components/intake/ReportExtractStudio.tsx src/lib/documentResults.ts src/components/views/ReportsView.tsx src/app/intake/report/page.tsx
# With the local frontend running on port 3100 and group 3 artifacts present:
node tests/document-smoke.cjs
```

Synthetic JSON/trace/screenshot artifacts are in `/tmp/careintel-document-smoke/`; they contain no real patient data and are regenerated by the integration/browser checks. They are not production/release health evidence.
