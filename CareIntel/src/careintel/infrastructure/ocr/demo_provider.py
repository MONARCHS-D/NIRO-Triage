"""
Demo OCR Provider.
"""

from careintel.infrastructure.ocr.port import OcrProvider, OcrResult


class DemoOcrProvider(OcrProvider):
    """
    Provider placeholder used when live OCR is not configured.
    """

    async def process_document(self, file_path: str, run_id: str) -> OcrResult:
        raise RuntimeError(
            "Live OCR is not configured. Use the explicitly labeled synthetic sample or configure Azure Document Intelligence."
        )
