"""Content scanning stays fail-closed when ClamAV is missing or unavailable."""

from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock
import uuid

import pytest

from careintel.infrastructure.scanner.clamav_scanner import ClamAvScanner
from careintel.infrastructure.scanner.port import ScanResult
from careintel.infrastructure.storage.fake_provider import FakeBlobProvider


@pytest.mark.parametrize(
    ("code", "expected"), [(0, ScanResult.CLEAN), (1, ScanResult.REJECTED), (2, ScanResult.PENDING)]
)
async def test_real_scanner_exit_contract_and_original_binary(monkeypatch, code, expected):
    blob = FakeBlobProvider()

    async def chunks():
        yield b"synthetic original binary"

    await blob.upload("test-only", chunks(), "application/pdf", 25)
    captured = []

    async def launch(*args, **kwargs):
        assert args[:3] == ("clamscan", "--no-summary", "--")
        path = Path(args[3])
        assert path.read_bytes() == b"synthetic original binary"
        captured.append(path)
        return SimpleNamespace(wait=AsyncMock(return_value=code), returncode=code)

    monkeypatch.setattr(
        "careintel.infrastructure.scanner.clamav_scanner.asyncio.create_subprocess_exec", launch
    )
    assert await ClamAvScanner(blob).scan(uuid.uuid4(), "test-only") == expected
    assert not captured[0].exists()


async def test_missing_scanner_keeps_content_pending(monkeypatch):
    blob = FakeBlobProvider()

    async def chunks():
        yield b"synthetic fixture"

    await blob.upload("test-only", chunks(), "application/pdf", 17)
    monkeypatch.setattr(
        "careintel.infrastructure.scanner.clamav_scanner.asyncio.create_subprocess_exec",
        AsyncMock(side_effect=FileNotFoundError()),
    )
    assert await ClamAvScanner(blob).scan(uuid.uuid4(), "test-only") == ScanResult.PENDING
