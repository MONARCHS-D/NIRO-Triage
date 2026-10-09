"""Azure Document Intelligence adapter preserving page-local source evidence."""

import asyncio
import uuid
from pathlib import Path
from typing import Any

from azure.ai.documentintelligence.aio import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

from careintel.core.errors import ValidationError
from careintel.domain.processing.processing_models import OcrPage, OcrRegion
from careintel.infrastructure.ocr.port import OcrResult, OcrTableData


class AzureDocumentIntelligenceProvider:
    def __init__(
        self,
        endpoint: str,
        key: str,
        model: str = "prebuilt-layout",
        api_version: str = "2024-11-30",
        timeout_seconds: int = 240,
    ) -> None:
        self._endpoint = endpoint
        self._credential = AzureKeyCredential(key)
        self._model = model
        self._api_version = api_version
        self._timeout_seconds = timeout_seconds

    async def process_document(self, file_path: str, run_id: str) -> OcrResult:
        # SDK accepts IO[bytes]; the original stored binary is passed unchanged.
        async with asyncio.timeout(self._timeout_seconds):
            async with DocumentIntelligenceClient(
                self._endpoint,
                self._credential,
                api_version=self._api_version,
                connection_timeout=30,
                read_timeout=60,
            ) as client:
                with Path(file_path).open("rb") as document:
                    poller = await client.begin_analyze_document(
                        self._model,
                        body=document,
                        content_type="application/octet-stream",
                    )
                    result = await poller.result()
        return self.parse_result(result, run_id)

    def parse_result(self, result: Any, run_id: str) -> OcrResult:
        run_uuid = uuid.UUID(run_id)
        pages = [
            OcrPage(
                page_id=uuid.uuid4(),
                run_id=run_uuid,
                page_number=p.page_number,
                width=p.width,
                height=p.height,
                unit=p.unit,
            )
            for p in (getattr(result, "pages", None) or [])
        ]
        page_ids = {page.page_number: page.page_id for page in pages}
        if len(page_ids) != len(pages) or any(number < 1 for number in page_ids):
            raise ValidationError("Malformed OCR page association.")
        regions: list[OcrRegion] = []
        tables = []

        def add_region(page_number: int, text: str, polygon: Any = None) -> None:
            if page_number not in page_ids:
                raise ValidationError("OCR region references an unknown page.")
            regions.append(
                OcrRegion(
                    region_id=uuid.uuid4(),
                    page_id=page_ids[page_number],
                    text=text,
                    reading_order=len(regions) + 1,
                    bounding_box=polygon,
                )
            )

        # Keep lines even when paragraph or table output is present. A missing
        # paragraph must never collapse all pages into a fabricated page 1.
        for page in getattr(result, "pages", None) or []:
            for line in getattr(page, "lines", None) or []:
                add_region(page.page_number, line.content, getattr(line, "polygon", None))
        for paragraph in getattr(result, "paragraphs", None) or []:
            bounds = getattr(paragraph, "bounding_regions", None) or []
            if len({bound.page_number for bound in bounds}) > 1:
                raise ValidationError("OCR paragraph page association is ambiguous.")
            if not bounds:
                # Preserve text only when an unambiguous single page exists.
                if len(pages) != 1:
                    raise ValidationError("OCR paragraph has no page provenance.")
                add_region(pages[0].page_number, paragraph.content)
            else:
                for bound in bounds:
                    add_region(bound.page_number, paragraph.content, bound.polygon)
        for table in getattr(result, "tables", None) or []:
            bounds = getattr(table, "bounding_regions", None) or []
            if not bounds:
                raise ValidationError("OCR table has no page provenance.")
            cells = []
            for cell in table.cells:
                cells.append(
                    {
                        "row_index": cell.row_index,
                        "column_index": cell.column_index,
                        "content": cell.content,
                        "kind": getattr(cell, "kind", None),
                        "row_span": getattr(cell, "row_span", None),
                        "column_span": getattr(cell, "column_span", None),
                        "bounding_regions": [
                            {"page_number": b.page_number, "polygon": b.polygon}
                            for b in (getattr(cell, "bounding_regions", None) or [])
                        ],
                    }
                )
            grid = [[""] * table.column_count for _ in range(table.row_count)]
            for cell in cells:
                grid[cell["row_index"]][cell["column_index"]] = str(cell["content"]).replace(
                    "\n", " "
                )
            markdown = "\n".join("| " + " | ".join(row) + " |" for row in grid)
            for bound in bounds:
                if bound.page_number not in page_ids:
                    raise ValidationError("OCR table references an unknown page.")
            # Multi-page table cells remain preserved, but the whole table is not
            # attributed to one page or used as an extraction row.
            tables.append(
                OcrTableData(
                    page_number=bounds[0].page_number,
                    row_count=table.row_count,
                    column_count=table.column_count,
                    cells=cells,
                    markdown=markdown,
                )
            )
            if len({b.page_number for b in bounds}) == 1:
                add_region(bounds[0].page_number, f"[TABLE]\n{markdown}", bounds[0].polygon)
        if not regions and getattr(result, "content", None):
            if len(pages) != 1:
                raise ValidationError("OCR content has no page provenance.")
            add_region(pages[0].page_number, result.content)
        return OcrResult(pages, regions, f"azure-di-{self._model}-{self._api_version}", tables)
