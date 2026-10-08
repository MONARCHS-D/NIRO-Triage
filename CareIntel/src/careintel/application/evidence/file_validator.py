"""
File validator for evidence intake.
"""

import hashlib
import os
from typing import IO

try:
    import magic
except (ImportError, Exception):
    magic = None

from careintel.core.errors import FileTooLargeError, MimeMismatchError, UnsupportedFileTypeError


class FileValidator:
    """
    Validates uploaded files for Evidence intake.
    """

    def __init__(
        self,
        allowed_extensions: list[str],
        max_size_bytes: int,
    ) -> None:
        self.allowed_extensions = allowed_extensions
        self.max_size_bytes = max_size_bytes

    def _detect_mime_from_bytes(self, header: bytes) -> str | None:
        if header.startswith(b"%PDF"):
            return "application/pdf"
        if header.startswith(b"PK\x03\x04") or header.startswith(b"PK\x05\x06") or header.startswith(b"PK\x07\x08"):
            return "application/zip"
        if header.startswith(b"\xff\xd8\xff"):
            return "image/jpeg"
        if header.startswith(b"\x89PNG\r\n\x1a\n"):
            return "image/png"
        if header.startswith(b"ID3") or header.startswith(b"\xff\xfb") or header.startswith(b"\xff\xf3") or header.startswith(b"\xff\xf2"):
            return "audio/mpeg"
        if header.startswith(b"RIFF") and b"WAVE" in header[:12]:
            return "audio/wav"
        if header.startswith(b"OggS"):
            return "audio/ogg"
        if len(header) > 8 and header[4:8] == b"ftyp":
            return "audio/mp4"
        if header.startswith(b"MZ"):
            return "application/x-dosexec"
        if b"\x00" in header:
            return None
        try:
            decoded = header.decode("utf-8")
            if all(c.isprintable() or c in "\r\n\t" for c in decoded):
                return "text/plain"
        except UnicodeDecodeError:
            pass
        return None

    def validate_extension(self, filename: str) -> str:
        """
        Validate the file extension against the configured allowlist.
        Returns the sanitized filename.
        Raises UnsupportedFileTypeError if invalid.
        """
        if not filename:
            raise UnsupportedFileTypeError("Filename is missing.")

        # Basic path traversal prevention
        basename = os.path.basename(filename).replace("\x00", "")
        if not basename or basename in (".", ".."):
            raise UnsupportedFileTypeError("Invalid filename.")

        _, ext = os.path.splitext(basename)
        if ext.lower() not in self.allowed_extensions:
            raise UnsupportedFileTypeError(f"Extension '{ext}' is not supported.")
        return basename

    def validate_magic_signature(self, header_bytes: bytes) -> str:
        """
        Check the magic bytes to determine the MIME type.
        Raises MimeMismatchError if it cannot be determined.
        """
        mime_type = None
        if magic is not None:
            try:
                mime_type = magic.from_buffer(header_bytes, mime=True)
            except Exception:
                mime_type = None

        if not mime_type or mime_type == "application/octet-stream":
            mime_type = self._detect_mime_from_bytes(header_bytes)

        if not mime_type or mime_type == "application/octet-stream":
            raise MimeMismatchError("Could not determine valid MIME type from file signature.")
        return mime_type

    def validate_mime_consistency(
        self,
        *,
        filename: str,
        declared_mime: str,
        detected_mime: str,
    ) -> None:
        """Require the extension, declared MIME, and detected MIME to agree."""
        extension = os.path.splitext(filename)[1].lower()
        allowed_mimes: dict[str, frozenset[str]] = {
            ".pdf": frozenset({"application/pdf"}),
            ".docx": frozenset(
                {
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    "application/zip",
                }
            ),
            ".txt": frozenset({"text/plain"}),
            ".jpg": frozenset({"image/jpeg"}),
            ".jpeg": frozenset({"image/jpeg"}),
            ".png": frozenset({"image/png"}),
            ".mp3": frozenset({"audio/mpeg", "audio/mp3"}),
            ".wav": frozenset({"audio/wav", "audio/x-wav"}),
            ".m4a": frozenset({"audio/mp4", "video/mp4"}),
            ".ogg": frozenset({"audio/ogg", "application/ogg"}),
        }
        expected = allowed_mimes.get(extension)
        if expected is None:
            raise MimeMismatchError("No MIME policy exists for the uploaded extension.")

        declared = declared_mime.split(";", 1)[0].strip().lower()
        detected = detected_mime.split(";", 1)[0].strip().lower()
        if declared not in expected or detected not in expected:
            raise MimeMismatchError(
                "The declared type, detected content type, and filename extension do not match."
            )

    async def stream_and_validate(self, file_stream: IO[bytes]) -> tuple[str, str, int]:
        """
        Stream the file to compute SHA-256 and enforce size limits.
        Since we need the magic bytes to validate the file type, we read the first chunk,
        validate it, and then stream the rest.
        Returns a tuple of (sha256_hex, magic_mime, total_size).
        """
        hasher = hashlib.sha256()
        total_size = 0
        chunk_size = 65536

        # Read first chunk for magic bytes
        first_chunk = file_stream.read(chunk_size)
        if not first_chunk:
            raise UnsupportedFileTypeError("File is empty.")

        magic_mime = self.validate_magic_signature(first_chunk)
        hasher.update(first_chunk)
        total_size += len(first_chunk)

        if total_size > self.max_size_bytes:
            raise FileTooLargeError(
                f"File exceeds maximum allowed size of {self.max_size_bytes} bytes."
            )

        # Stream the rest
        while True:
            chunk = file_stream.read(chunk_size)
            if not chunk:
                break

            total_size += len(chunk)
            if total_size > self.max_size_bytes:
                raise FileTooLargeError(
                    f"File exceeds maximum allowed size of {self.max_size_bytes} bytes."
                )

            hasher.update(chunk)

        file_stream.seek(0)
        return hasher.hexdigest(), magic_mime, total_size
