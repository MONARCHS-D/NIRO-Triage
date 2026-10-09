"""
Processing API Schemas.
"""

import datetime
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from careintel.domain.processing.processing_status import ProcessingStatus
from careintel.domain.processing.processor_type import ProcessorType


class TriggerProcessingRequest(BaseModel):
    """Request schema to trigger a processing run."""

    evidence_id: uuid.UUID
    processor_type: ProcessorType
    parameters: dict[str, Any] = Field(default_factory=dict)


class TriggerProcessingResponse(BaseModel):
    """Response schema when processing is triggered."""

    run_id: uuid.UUID
    message: str = "Processing triggered successfully."

    model_config = ConfigDict(from_attributes=True)


class ProcessingRunResponse(BaseModel):
    """Persisted processing state and provider metadata."""

    model_config = ConfigDict(from_attributes=True)

    run_id: uuid.UUID
    evidence_id: uuid.UUID
    processor_type: ProcessorType
    provider: str
    status: ProcessingStatus
    config_version: str
    started_at: datetime.datetime | None
    completed_at: datetime.datetime | None
    failure_reason: str | None


class DocumentResultsResponse(BaseModel):
    """Actual persisted source evidence and unverified extraction, scoped to a document."""

    evidence_id: uuid.UUID
    case_id: uuid.UUID
    status: str
    ocr_run: ProcessingRunResponse | None = None
    extraction_run: ProcessingRunResponse | None = None
    pages: list[dict[str, Any]] = Field(default_factory=list)
    candidates: list[dict[str, Any]] = Field(default_factory=list)
    needs_human_verification: bool = True
