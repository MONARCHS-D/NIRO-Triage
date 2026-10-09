"""PostgreSQL upload/worker/API regression with mocked external services."""

import json
import uuid
from pathlib import Path
from types import SimpleNamespace as Obj
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from careintel.api.deps import _db_session_provider, _settings_provider, get_current_user
from careintel.application.workflow.task_service import AsyncTaskService
from careintel.core.database import build_engine
from careintel.domain.auth.models import UserContext
from careintel.domain.auth.permissions import Permission
from careintel.infrastructure.extraction.lab_provider import LabExtractionProvider
from careintel.infrastructure.ocr.azure_provider import AzureDocumentIntelligenceProvider
from careintel.infrastructure.scanner.port import ScanResult
from careintel.infrastructure.storage.fake_provider import FakeBlobProvider
from careintel.main import create_app
from careintel.persistence.models.case import CaseORM
from careintel.persistence.models.consent import ConsentORM
from careintel.persistence.models.evidence import EvidenceORM
from careintel.persistence.models.processing import ProcessingRunORM
from careintel.persistence.models.user import UserORM
from careintel.persistence.repositories.task_repo import AsyncTaskRepository
from careintel.workers.processing_tasks import _handle_processing
from tests.fixtures.pathology import azure_response, synthetic_pdf

pytestmark = pytest.mark.integration


async def test_upload_worker_persistence_authorized_document_read(settings, monkeypatch, caplog):
    engine = build_engine(settings)
    connection = await engine.connect()
    outer = await connection.begin()
    session = async_sessionmaker(
        bind=connection,
        class_=AsyncSession,
        expire_on_commit=False,
        join_transaction_mode="create_savepoint",
    )()
    actor_id, subject_id, facility_id, case_id, other_id, consent_id = [
        uuid.uuid4() for _ in range(6)
    ]
    permissions = {p.value for p in Permission}
    actor = UserContext(
        id=actor_id,
        is_active=True,
        roles={"doctor"},
        permissions=permissions,
        role_facilities={"doctor": facility_id},
    )
    actor_ref = [actor]
    caplog.set_level("INFO", logger="careintel")
    try:
        session.add_all(
            [
                UserORM(
                    id=id,
                    email=f"synthetic-doc-{id}@example.invalid",
                    display_name="Synthetic test only",
                    password_hash="not-a-credential",
                    is_active=True,
                )
                for id in [actor_id, subject_id]
            ]
        )
        await session.flush()
        session.add(
            ConsentORM(
                id=consent_id,
                subject_id=subject_id,
                purpose="data_processing",
                notice_version="1.0",
                state="ACTIVE",
            )
        )
        session.add_all(
            [
                CaseORM(
                    id=id,
                    synthetic_subject_id=subject_id,
                    facility_id=facility_id,
                    state="CREATED",
                    opened_by=actor_id,
                    version=1,
                )
                for id in [case_id, other_id]
            ]
        )
        await session.flush()
        blob, scanner = FakeBlobProvider(), AsyncMock()
        scanner.scan.return_value = ScanResult.CLEAN
        sdk_client = AsyncMock()
        inputs = []

        async def begin(model, **kwargs):
            inputs.append(kwargs["body"].read())
            return Obj(result=AsyncMock(return_value=azure_response()))

        sdk_client.begin_analyze_document.side_effect = begin
        sdk = MagicMock()
        sdk.return_value.__aenter__ = AsyncMock(return_value=sdk_client)
        sdk.return_value.__aexit__ = AsyncMock(return_value=False)
        monkeypatch.setattr(
            "careintel.infrastructure.ocr.azure_provider.DocumentIntelligenceClient", sdk
        )
        ocr = AzureDocumentIntelligenceProvider("https://synthetic.invalid", "synthetic-key")
        providers = Obj(
            blob=blob,
            ocr=ocr,
            extraction=LabExtractionProvider(),
            speech=AsyncMock(),
            language=AsyncMock(),
            translation=AsyncMock(),
        )
        monkeypatch.setattr(
            "careintel.workers.services.get_worker_providers", AsyncMock(return_value=providers)
        )
        settings.ocr_provider, settings.extraction_provider = (
            "azure_document_intelligence",
            "lab_rules",
        )
        app = create_app()
        for key, value in {
            "blob_provider": blob,
            "content_scanner": scanner,
            "ocr_provider": ocr,
            "speech_provider": providers.speech,
            "language_provider": providers.language,
            "translation_provider": providers.translation,
            "extraction_provider": providers.extraction,
        }.items():
            setattr(app.state, key, value)

        async def db():
            yield session
            await session.flush()

        app.dependency_overrides[_db_session_provider] = db
        app.dependency_overrides[_settings_provider] = lambda: settings
        app.dependency_overrides[get_current_user] = lambda: actor_ref[0]
        correlation = "synthetic-document-trace"
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as api:
            context = await api.get(f"/api/v1/evidence/cases/{case_id}/upload-context")
            assert context.status_code == 200
            assert context.json() == {"case_id": str(case_id), "consent_id": str(consent_id)}

            async def upload(target, data=synthetic_pdf()):
                return await api.post(
                    "/api/v1/evidence/files",
                    data={
                        "case_id": str(target),
                        "consent_id": str(consent_id),
                        "modality": "document",
                    },
                    files={"file": ("synthetic-pathology.pdf", data, "application/pdf")},
                    headers={"X-Correlation-ID": correlation},
                )

            response = await upload(case_id)
            assert response.status_code == 201, response.text
            uploaded = response.json()
            evidence_id = uuid.UUID(uploaded["evidence_id"])
            assert uploaded["case_id"] == str(case_id) and uploaded["state"] == "READY"
            evidence = await session.get(EvidenceORM, evidence_id)
            assert evidence.case_id == case_id and evidence.sha256_checksum
            assert (
                b"".join([c async for c in blob.download(evidence.storage_key)]) == synthetic_pdf()
            )

            async def run_step(kind, params=None):
                response = await api.post(
                    "/api/v1/processing/trigger",
                    json={
                        "evidence_id": str(evidence_id),
                        "processor_type": kind,
                        "parameters": params or {},
                    },
                    headers={"X-Correlation-ID": correlation},
                )
                assert response.status_code == 202, response.text
                task_id = uuid.UUID(response.json()["run_id"])
                tasks = AsyncTaskService(AsyncTaskRepository(session))
                task = await tasks.claim_for_execution(task_id)
                assert task.entity_id == evidence_id and task.case_id == case_id
                result = await _handle_processing(session, task, actor)
                await tasks.record_success(task_id, result)
                state = await api.get(f"/api/v1/tasks/{task_id}")
                assert state.json()["status"] == "SUCCEEDED", state.text
                return result["processing_run_id"]

            ocr_id = await run_step("document_ocr")
            ext_id = await run_step("candidate_extraction", {"source_processing_run_id": ocr_id})
            await session.flush()
            response = await api.get(f"/api/v1/processing/documents/{evidence_id}/results")
            assert response.status_code == 200, response.text
            result = response.json()
            assert result["case_id"] == str(case_id) and result["evidence_id"] == str(evidence_id)
            assert result["status"] == "PARTIAL" and result["needs_human_verification"]
            assert (
                result["ocr_run"]["run_id"] == ocr_id
                and result["extraction_run"]["run_id"] == ext_id
            )
            candidates = {c["field_type"]: c for c in result["candidates"]}
            assert len(candidates) == len(result["candidates"]) == 4
            for name, value, page in [
                ("hemoglobin", "14.5 g/dL", 1),
                ("wbc_count", "10570 /cmm", 1),
                ("hba1c", "7.10 %", 5),
                ("vitamin_b12", "<148 pg/mL", 13),
            ]:
                candidate = candidates[f"lab_{name}"]
                assert candidate["value"] == value and candidate["status"] == "CANDIDATE"
                provenance = candidate["provenance"][0]
                assert provenance["evidence_id"] == str(evidence_id)
                assert provenance["page_number"] == page and provenance["region_id"]
            b12 = candidates["lab_vitamin_b12"]["provenance"][0]
            assert b12["comparison"] == "<" and b12["source_flag"] == "L"
            assert b12["source_unit"] == "pg/mL" and b12["reference_interval"] == "200 - 900"
            assert inputs == [synthetic_pdf()]
            assert await run_step("document_ocr") == ocr_id
            assert (
                await run_step("candidate_extraction", {"source_processing_run_id": ocr_id})
                == ext_id
            )
            assert len(inputs) == 1
            assert (
                await session.scalar(
                    select(func.count())
                    .select_from(ProcessingRunORM)
                    .where(ProcessingRunORM.evidence_id == evidence_id)
                )
                == 2
            )
            second = await upload(other_id)
            assert second.status_code == 201
            second_id = second.json()["evidence_id"]
            wrong = await api.post(
                "/api/v1/processing/execute",
                json={
                    "evidence_id": second_id,
                    "processor_type": "candidate_extraction",
                    "parameters": {"source_processing_run_id": ocr_id},
                },
            )
            assert wrong.status_code == 422
            second_result = await api.get(f"/api/v1/processing/documents/{second_id}/results")
            assert second_result.json()["candidates"] == []
            actor_ref[0] = UserContext(
                id=actor_id,
                is_active=True,
                roles={"doctor"},
                permissions=permissions,
                role_facilities={"doctor": uuid.uuid4()},
            )
            forbidden = await api.get(f"/api/v1/processing/documents/{evidence_id}/results")
            assert forbidden.status_code in {403, 404}
            actor_ref[0] = actor
            scanner.scan.return_value = ScanResult.PENDING
            pending = await upload(other_id, synthetic_pdf() + b"\n%pending")
            assert pending.status_code == 201 and pending.json()["state"] == "STORED"
            pending_id = pending.json()["evidence_id"]
            waiting = await api.get(f"/api/v1/processing/documents/{pending_id}/results")
            assert waiting.json()["status"] == "AWAITING_SCAN"
            scanner.scan.return_value = ScanResult.CLEAN
            rescanned = await api.post(f"/api/v1/evidence/{pending_id}/scan")
            assert rescanned.json()["state"] == "READY", rescanned.text
            artifact = Path("/tmp/careintel-document-smoke")
            artifact.mkdir(exist_ok=True)
            (artifact / "results.json").write_text(json.dumps(result))
            (artifact / "upload.json").write_text(json.dumps(uploaded))
            (artifact / "fixture.pdf").write_bytes(synthetic_pdf())
            (artifact / "trace.json").write_text(
                json.dumps(
                    {
                        "case_id": str(case_id),
                        "document_id": str(evidence_id),
                        "ocr_run_id": ocr_id,
                        "extraction_run_id": ext_id,
                        "correlation_id": correlation,
                        "status": result["status"],
                    }
                )
            )
            assert not any(
                "14.5" in r.getMessage() or "synthetic-key" in r.getMessage()
                for r in caplog.records
            )
    finally:
        await session.close()
        if outer.is_active:
            await outer.rollback()
        await connection.close()
        await engine.dispose()
