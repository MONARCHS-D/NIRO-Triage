"""
Consent API router.
"""

import secrets
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from careintel.api.deps import CurrentUserDep, DbSessionDep, require_permission
from careintel.api.v1.consent.schemas import ConsentRequest, ConsentResponse
from careintel.application.auth.consent_service import ConsentService
from careintel.application.auth.password_hasher import PasswordHasher
from careintel.core.correlation import get_correlation_id
from careintel.domain.auth.permissions import Permission
from careintel.persistence.models.user import UserORM
from careintel.persistence.repositories.audit_repo import AuditRepository
from careintel.persistence.repositories.consent_repo import ConsentRepository

router = APIRouter(prefix="/consent", tags=["consent"])


async def _ensure_subject_identity(session: AsyncSession, subject_id: uuid.UUID) -> None:
    """Create a disabled pseudonymous user row for a synthetic patient subject.

    The existing database schema requires consent subjects to reference users.id,
    while case subjects are independently generated synthetic UUIDs. Keep the
    schema unchanged by representing those subjects as non-login user rows.
    """
    if await session.get(UserORM, subject_id):
        return

    random_password = secrets.token_urlsafe(48)
    session.add(
        UserORM(
            id=subject_id,
            email=f"synthetic-subject-{subject_id.hex}@subjects.invalid",
            display_name=f"Synthetic patient subject {subject_id.hex[:8]}",
            password_hash=PasswordHasher().hash(random_password),
            is_active=False,
            is_verified=False,
        )
    )
    await session.flush()


def get_consent_service(session: DbSessionDep) -> ConsentService:
    return ConsentService(
        consent_repo=ConsentRepository(session),
        audit_repo=AuditRepository(session),
    )


@router.post(
    "/request",
    response_model=ConsentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a consent request",
    dependencies=[require_permission(Permission.CONSENT_WRITE)],
)
async def request_consent(
    request: ConsentRequest,
    consent_service: Annotated[ConsentService, Depends(get_consent_service)],
    session: DbSessionDep,
) -> ConsentResponse:
    """Record that consent was requested from a user."""
    await _ensure_subject_identity(session, request.subject_id)
    ctx = await consent_service.request_consent(
        subject_id=request.subject_id,
        purpose=request.purpose,
        notice_version=request.notice_version,
        correlation_id=get_correlation_id(),
    )
    return ConsentResponse.model_validate(ctx)


@router.post(
    "/{consent_id}/capture",
    response_model=ConsentResponse,
    status_code=status.HTTP_200_OK,
    summary="Capture an accepted consent request",
    dependencies=[require_permission(Permission.CONSENT_WRITE)],
)
async def capture_consent(
    consent_id: uuid.UUID,
    current_user: CurrentUserDep,
    consent_service: Annotated[ConsentService, Depends(get_consent_service)],
) -> ConsentResponse:
    """Record that a requested consent was accepted."""
    ctx = await consent_service.capture_consent(
        consent_id=consent_id,
        actor=current_user,
        correlation_id=get_correlation_id(),
    )
    return ConsentResponse.model_validate(ctx)


@router.delete(
    "/{consent_id}",
    response_model=ConsentResponse,
    status_code=status.HTTP_200_OK,
    summary="Withdraw an active consent",
    dependencies=[require_permission(Permission.CONSENT_WRITE)],
)
async def withdraw_consent(
    consent_id: uuid.UUID,
    current_user: CurrentUserDep,
    consent_service: Annotated[ConsentService, Depends(get_consent_service)],
) -> ConsentResponse:
    """Withdraw a previously granted consent."""
    ctx = await consent_service.withdraw_consent(
        consent_id=consent_id,
        actor=current_user,
        correlation_id=get_correlation_id(),
    )
    return ConsentResponse.model_validate(ctx)
