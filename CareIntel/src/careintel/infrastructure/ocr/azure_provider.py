"""
Azure Document Intelligence OCR Provider.

Production OCR provider using azure-ai-documentintelligence.
Extracts pages, regions (paragraphs), and tables (when layout model is used).
"""

from __future__ import annotations

import asyncio
import uuid
from io import BytesIO

from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential

from careintel.domain.processing.processing_models import OcrPage, OcrRegion
from careintel.infrastructure.ocr.port import OcrProvider, OcrResult, OcrTableData


class AzureDocumentIntelligenceProvider(OcrProvider):
    """
    Azure Document Intelligence implementation of OcrProvider.
    """

    def __init__(self, endpoint: str, key: str, model: str = "prebuilt-layout") -> None:
        self._client = DocumentIntelligenceClient(
            endpoint=endpoint, credential=AzureKeyCredential(key)
        )
        self._model = model
        self._provider_version = f"azure-di-{model}-v1"

    def _map_analyze_result(
        self,
        result: object,
        run_uuid: uuid.UUID,
        page_offset: int = 0,
        reading_order_start: int = 1,
    ) -> tuple[list[OcrPage], list[OcrRegion], list[OcrTableData], int]:
        pages = []
        regions = []
        tables = []

        # Map pages
        if hasattr(result, "pages") and result.pages:
            for p in result.pages:
                pages.append(
                    OcrPage(
                        page_id=uuid.uuid4(),
                        run_id=run_uuid,
                        page_number=page_offset + p.page_number,
                        width=p.width,
                        height=p.height,
                        unit=p.unit,
                        confidence=None,
                    )
                )

        reading_order = reading_order_start
        page_id_map = {p.page_number: p.page_id for p in pages}

        if hasattr(result, "paragraphs") and result.paragraphs:
            for para in result.paragraphs:
                p_num = 1
                if para.bounding_regions and len(para.bounding_regions) > 0:
                    p_num = para.bounding_regions[0].page_number
                actual_page_num = page_offset + p_num

                page_id = page_id_map.get(actual_page_num, pages[0].page_id if pages else uuid.uuid4())

                bbox = None
                if para.bounding_regions and len(para.bounding_regions) > 0:
                    bbox = para.bounding_regions[0].polygon

                regions.append(
                    OcrRegion(
                        region_id=uuid.uuid4(),
                        page_id=page_id,
                        text=para.content,
                        reading_order=reading_order,
                        bounding_box=bbox,
                        confidence=None,
                    )
                )
                reading_order += 1

        if hasattr(result, "tables") and result.tables:
            for tbl in result.tables:
                p_num = 1
                if tbl.bounding_regions and len(tbl.bounding_regions) > 0:
                    p_num = tbl.bounding_regions[0].page_number
                actual_page_num = page_offset + p_num

                cells = []
                for cell in tbl.cells:
                    cells.append(
                        {
                            "row_index": cell.row_index,
                            "column_index": cell.column_index,
                            "content": cell.content,
                            "kind": cell.kind if hasattr(cell, "kind") else "content",
                        }
                    )

                md_rows = []
                for r in range(tbl.row_count):
                    row_cells = [c for c in cells if c["row_index"] == r]
                    row_cells.sort(key=lambda x: x["column_index"])
                    row_text = (
                        "| "
                        + " | ".join([c["content"].replace("\n", " ") for c in row_cells])
                        + " |"
                    )
                    md_rows.append(row_text)
                    if r == 0:
                        md_rows.append(
                            "|" + "|".join(["---" for _ in range(tbl.column_count)]) + "|"
                        )

                markdown = "\n".join(md_rows)

                tables.append(
                    OcrTableData(
                        page_number=actual_page_num,
                        row_count=tbl.row_count,
                        column_count=tbl.column_count,
                        cells=cells,
                        markdown=markdown,
                    )
                )

                page_id = page_id_map.get(actual_page_num, pages[0].page_id if pages else uuid.uuid4())
                regions.append(
                    OcrRegion(
                        region_id=uuid.uuid4(),
                        page_id=page_id,
                        text=f"[TABLE]\n{markdown}",
                        reading_order=reading_order,
                        bounding_box=None,
                        confidence=None,
                    )
                )
                reading_order += 1

        if not regions and hasattr(result, "content") and result.content:
            page_id = pages[0].page_id if pages else uuid.uuid4()
            regions.append(
                OcrRegion(
                    region_id=uuid.uuid4(),
                    page_id=page_id,
                    text=result.content,
                    reading_order=reading_order,
                    bounding_box=None,
                    confidence=None,
                )
            )
            reading_order += 1

        return pages, regions, tables, reading_order

    async def process_document(self, file_path: str, run_id: str) -> OcrResult:
        """
        Process document asynchronously using a synchronous SDK call in a thread pool.
        Supports automatic page-batching for large PDFs exceeding Azure DI size limits.
        """
        run_uuid = uuid.UUID(run_id)

        with open(file_path, "rb") as f:
            file_bytes = f.read()

        is_pdf = file_path.lower().endswith(".pdf") or file_bytes.startswith(b"%PDF")

        # If PDF exceeds 3.5MB payload limit, process in page batches using pypdf
        if is_pdf and len(file_bytes) > 3_500_000:
            from pypdf import PdfReader, PdfWriter

            reader = PdfReader(BytesIO(file_bytes))
            total_pages = len(reader.pages)
            pages_to_process = total_pages

            all_pages: list[OcrPage] = []
            all_regions: list[OcrRegion] = []
            all_tables: list[OcrTableData] = []
            curr_reading_order = 1
            batch_size = 2

            for i in range(0, pages_to_process, batch_size):
                writer = PdfWriter()
                for p_idx in range(i, min(i + batch_size, pages_to_process)):
                    writer.add_page(reader.pages[p_idx])
                buf = BytesIO()
                writer.write(buf)
                chunk_bytes = buf.getvalue()

                def _analyze_chunk() -> object:
                    poller = self._client.begin_analyze_document(
                        model_id=self._model,
                        body=BytesIO(chunk_bytes),
                        content_type="application/pdf",
                    )
                    return poller.result()

                chunk_result = await asyncio.to_thread(_analyze_chunk)
                p_list, r_list, t_list, curr_reading_order = self._map_analyze_result(
                    chunk_result, run_uuid, page_offset=i, reading_order_start=curr_reading_order
                )
                all_pages.extend(p_list)
                all_regions.extend(r_list)
                all_tables.extend(t_list)

            return OcrResult(
                pages=all_pages,
                regions=all_regions,
                tables=all_tables,
                provider_version=self._provider_version,
            )

        # Standard file <= 3.5MB
        def _analyze() -> object:
            poller = self._client.begin_analyze_document(
                model_id=self._model,
                body=BytesIO(file_bytes),
                content_type="application/octet-stream",
            )
            return poller.result()

        result = await asyncio.to_thread(_analyze)
        pages, regions, tables, _ = self._map_analyze_result(result, run_uuid, page_offset=0, reading_order_start=1)

        return OcrResult(
            pages=pages,
            regions=regions,
            tables=tables,
            provider_version=self._provider_version,
        )
