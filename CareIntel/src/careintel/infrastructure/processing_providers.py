"""Shared explicit OCR/extraction selection for HTTP and worker processes."""

from careintel.core.config import Settings
from careintel.infrastructure.extraction.demo_provider import DemoExtractionProvider
from careintel.infrastructure.extraction.lab_provider import LabExtractionProvider
from careintel.infrastructure.extraction.port import ExtractionProvider
from careintel.infrastructure.ocr.demo_provider import DemoOcrProvider
from careintel.infrastructure.ocr.port import OcrProvider


def build_ocr_provider(settings: Settings) -> OcrProvider:
    if settings.ocr_provider == "azure_document_intelligence":
        if (
            not settings.azure_document_intelligence_endpoint
            or not settings.azure_document_intelligence_key
        ):
            raise ValueError("Azure OCR configuration is incomplete.")
        from careintel.infrastructure.ocr.azure_provider import AzureDocumentIntelligenceProvider

        return AzureDocumentIntelligenceProvider(
            endpoint=settings.azure_document_intelligence_endpoint,
            key=settings.azure_document_intelligence_key.get_secret_value(),
            model=settings.azure_di_model,
            api_version=settings.azure_di_api_version,
            timeout_seconds=settings.ocr_timeout_seconds,
        )
    if settings.ocr_provider == "demo" and not settings.is_production:
        return DemoOcrProvider()
    raise ValueError("Unsupported OCR provider; no demo fallback is permitted.")


def build_extraction_provider(settings: Settings) -> ExtractionProvider:
    if settings.extraction_provider == "lab_rules":
        return LabExtractionProvider()
    if settings.extraction_provider == "demo" and not settings.is_production:
        return DemoExtractionProvider()
    raise ValueError("Unsupported extraction provider; no demo fallback is permitted.")
