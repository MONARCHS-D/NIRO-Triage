"""Real local malware scanning. Unavailable scanners leave evidence pending."""

import asyncio
import logging
import os
import tempfile
import uuid

from careintel.infrastructure.scanner.port import ScanResult
from careintel.infrastructure.storage.port import BlobStoragePort


class ClamAvScanner:
    def __init__(self, blob: BlobStoragePort, timeout_seconds: int = 120) -> None:
        self.blob = blob
        self.timeout_seconds = timeout_seconds

    async def scan(self, evidence_id: uuid.UUID, key: str) -> ScanResult:
        fd, path = tempfile.mkstemp(prefix="careintel_scan_")
        process = None
        try:
            with os.fdopen(fd, "wb") as output:
                async for chunk in self.blob.download(key):
                    output.write(chunk)
            # No shell, no document-derived command arguments, no antivirus output
            # in logs (it may contain paths or sensitive embedded filenames).
            process = await asyncio.create_subprocess_exec(
                "clamscan",
                "--no-summary",
                "--",
                path,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL,
            )
            code = await asyncio.wait_for(process.wait(), timeout=self.timeout_seconds)
            if code == 0:
                return ScanResult.CLEAN
            if code == 1:
                return ScanResult.REJECTED
            return ScanResult.PENDING
        except (OSError, TimeoutError):
            logging.getLogger(__name__).warning(
                "Content scanner unavailable; evidence remains pending",
                extra={"document_id": str(evidence_id), "status": "AWAITING_SCAN"},
            )
            return ScanResult.PENDING
        finally:
            if process is not None and process.returncode is None:
                process.kill()
                await process.wait()
            os.remove(path)
