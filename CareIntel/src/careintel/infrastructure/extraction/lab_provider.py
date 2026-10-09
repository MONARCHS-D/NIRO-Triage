"""Conservative, source-only lab row extraction. No clinical inference or defaults.

Only supported analytes followed by an explicit result and unit are accepted.
Reference intervals are never searched for results. Unrecognized/ambiguous rows
remain available as OCR evidence for human review.
"""

import re
import uuid
from typing import ClassVar

from careintel.domain.processing.processing_models import CandidateField, ExtractionProvenance
from careintel.infrastructure.extraction.port import ExtractionResult


class LabExtractionProvider:
    version = "lab-rows-v1"
    # These are aliases and compatible source units, never expected measurements.
    fields: ClassVar[dict[str, tuple[str, str]]] = {
        "hemoglobin": (r"(?:ha?emoglobin|hgb|hb)", r"g/d[lL]"),
        "wbc_count": (
            r"(?:wbc(?:\s+count)?|total\s+(?:leu[kc]ocyte|white\s+blood\s+cell)\s+count)",
            r"(?:/?cmm|/µ[lL]|/u[lL]|cells/µ[lL]|cells/u[lL])",
        ),
        "hba1c": (r"(?:hba1c|glyc(?:osylated|ated)\s+ha?emoglobin)", r"%"),
        "vitamin_b12": (r"(?:vitamin\s*b[- ]?12|b[- ]?12)", r"pg/m[lL]"),
    }

    async def extract_candidates(
        self, text: str, run_id: str, evidence_id: uuid.UUID
    ) -> ExtractionResult:
        candidates = []
        offset = 0
        for line in text.splitlines(keepends=True):
            for name, (alias, unit) in self.fields.items():
                # Anchor the test name to the row. Never scan arbitrary numbers.
                match = re.match(
                    rf"^\s*\|?\s*{alias}\s*[:|]?\s*"
                    rf"(?P<result>(?:[<>≤≥]=?\s*|less\s+than\s+)?"
                    rf"\d+(?:,\d{{3}})*(?:\.\d+)?)\s*\|?\s*(?P<unit>{unit})"
                    rf"(?=$|\s|\|)(?P<tail>[^\r\n]*)",
                    line,
                    re.IGNORECASE,
                )
                if match is None:
                    continue
                raw = line.rstrip("\r\n")
                value = f"{match['result']} {match['unit']}"
                tail_cells = [cell.strip() for cell in match["tail"].strip().strip("|").split("|")]
                flag = next(
                    (
                        cell
                        for cell in tail_cells
                        if cell.upper()
                        in {"H", "L", "HH", "LL", "HIGH", "LOW", "ABNORMAL", "NORMAL"}
                    ),
                    None,
                )
                interval = next(
                    (
                        cell
                        for cell in tail_cells
                        if re.fullmatch(
                            r"[<>≤≥]?\s*\d+(?:\.\d+)?\s*(?:[-\u2013]\s*\d+(?:\.\d+)?)?(?:\s*[^|\d]+)?",
                            cell,
                        )
                    ),
                    None,
                )
                operator = re.match(r"([<>≤≥]=?|less\s+than)", match["result"], re.IGNORECASE)
                candidates.append(
                    CandidateField(
                        candidate_id=uuid.uuid4(),
                        run_id=uuid.UUID(run_id),
                        field_type=f"lab_{name}",
                        value=value,
                        normalized_value=value,
                        confidence=None,
                        status="CANDIDATE",
                        provenance=[
                            ExtractionProvenance(
                                evidence_id=evidence_id,
                                span_start=offset,
                                span_end=offset + len(raw),
                                raw_source_text=raw,
                                source_unit=match["unit"],
                                reference_interval=interval,
                                source_flag=flag,
                                comparison=operator.group(0) if operator else None,
                            )
                        ],
                    )
                )
            offset += len(line)
        return ExtractionResult(candidates, self.version)
