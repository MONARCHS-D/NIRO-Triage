"""
Consent unit tests.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock, call

import pytest

from careintel.application.auth.consent_service import ConsentService
from careintel.core.errors import ConsentError
from careintel.domain.consent.models import ConsentContext
from careintel.domain.consent.policy import ConsentPolicy
from careintel.domain.consent.purpose import ConsentPurpose
from careintel.persistence.models.consent import ConsentEventORM, ConsentORM
from careintel.persistence.repositories.consent_repo import ConsentRepository


@pytest.mark.unit
@pytest.mark.asyncio
async def test_consent_repository_flushes_parent_before_initial_event() -> None:
    session = MagicMock()
    session.flush = AsyncMock()
    consent = ConsentORM(
        id=uuid.uuid4(),
        subject_id=uuid.uuid4(),
        purpose=ConsentPurpose.DATA_PROCESSING.value,
        notice_version="1.0",
        state="REQUESTED",
    )
    event = ConsentEventORM(consent_id=consent.id, event_type="REQUESTED")

    await ConsentRepository(session).create(consent, event)

    assert session.method_calls == [
        call.add(consent),
        call.flush([consent]),
        call.add(event),
        call.flush([event]),
    ]


@pytest.mark.unit
@pytest.mark.asyncio
async def test_repeated_consent_request_reuses_existing_record() -> None:
    subject_id = uuid.uuid4()
    consent = ConsentORM(
        id=uuid.uuid4(),
        subject_id=subject_id,
        purpose=ConsentPurpose.DATA_PROCESSING.value,
        notice_version="1.0",
        state="ACTIVE",
    )
    consent_repo = AsyncMock()
    consent_repo.get_by_subject_purpose_version.return_value = consent
    audit_repo = AsyncMock()
    service = ConsentService(consent_repo, audit_repo)

    result = await service.request_consent(
        subject_id,
        ConsentPurpose.DATA_PROCESSING.value,
        "1.0",
        "retry-correlation",
    )

    assert result.id == consent.id
    assert result.state == "ACTIVE"
    consent_repo.create.assert_not_awaited()
    audit_repo.append.assert_not_awaited()


@pytest.mark.unit
@pytest.mark.asyncio
async def test_synthetic_consent_subject_gets_disabled_database_identity() -> None:
    from careintel.api.v1.consent.router import _ensure_subject_identity
    from careintel.persistence.models.user import UserORM

    session = MagicMock()
    session.get = AsyncMock(return_value=None)
    session.flush = AsyncMock()
    subject_id = uuid.uuid4()

    await _ensure_subject_identity(session, subject_id)

    subject = session.add.call_args.args[0]
    assert isinstance(subject, UserORM)
    assert subject.id == subject_id
    assert subject.email.endswith("@subjects.invalid")
    assert subject.is_active is False
    assert subject.is_verified is False
    assert subject.password_hash
    session.flush.assert_awaited_once_with()


@pytest.mark.unit
def test_consent_policy_require_active_valid() -> None:
    subject_id = uuid.uuid4()
    ctx = ConsentContext(
        id=uuid.uuid4(),
        subject_id=subject_id,
        purpose=ConsentPurpose.DATA_PROCESSING.value,
        notice_version="1.0",
        state="ACTIVE",
    )
    # Should not raise
    validated = ConsentPolicy.require_active(
        consent=ctx,
        subject_id=subject_id,
        purpose=ConsentPurpose.DATA_PROCESSING,
        required_notice_version="1.0",
    )
    assert validated == ctx


@pytest.mark.unit
def test_consent_policy_require_active_missing() -> None:
    with pytest.raises(ConsentError, match="No active consent found"):
        ConsentPolicy.require_active(
            consent=None,
            subject_id=uuid.uuid4(),
            purpose=ConsentPurpose.DATA_PROCESSING,
            required_notice_version="1.0",
        )


@pytest.mark.unit
def test_consent_policy_require_active_wrong_subject() -> None:
    ctx = ConsentContext(
        id=uuid.uuid4(),
        subject_id=uuid.uuid4(),
        purpose=ConsentPurpose.DATA_PROCESSING.value,
        notice_version="1.0",
        state="ACTIVE",
    )
    with pytest.raises(ConsentError, match="Consent subject does not match"):
        ConsentPolicy.require_active(
            consent=ctx,
            subject_id=uuid.uuid4(),
            purpose=ConsentPurpose.DATA_PROCESSING,
            required_notice_version="1.0",
        )


@pytest.mark.unit
def test_consent_policy_require_active_stale_version() -> None:
    subject_id = uuid.uuid4()
    ctx = ConsentContext(
        id=uuid.uuid4(),
        subject_id=subject_id,
        purpose=ConsentPurpose.DATA_PROCESSING.value,
        notice_version="1.0",
        state="ACTIVE",
    )
    with pytest.raises(ConsentError, match="mismatch or stale"):
        ConsentPolicy.require_active(
            consent=ctx,
            subject_id=subject_id,
            purpose=ConsentPurpose.DATA_PROCESSING,
            required_notice_version="2.0",
        )


@pytest.mark.unit
def test_consent_policy_require_active_not_active() -> None:
    subject_id = uuid.uuid4()
    ctx = ConsentContext(
        id=uuid.uuid4(),
        subject_id=subject_id,
        purpose=ConsentPurpose.DATA_PROCESSING.value,
        notice_version="1.0",
        state="WITHDRAWN",
    )
    with pytest.raises(ConsentError, match="not in ACTIVE state"):
        ConsentPolicy.require_active(
            consent=ctx,
            subject_id=subject_id,
            purpose=ConsentPurpose.DATA_PROCESSING,
            required_notice_version="1.0",
        )
