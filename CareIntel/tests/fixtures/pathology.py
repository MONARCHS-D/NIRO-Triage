"""Synthetic development fixture, not a copy of a supplied patient report."""

from types import SimpleNamespace as Obj

ROWS = {
    1: ["Hemoglobin | 14.5 | g/dL | 13.0 - 17.0", "WBC count | 10570 | /cmm | 4000 - 11000"],
    5: ["HbA1c | 7.10 | % | 4.0 - 5.6 | H"],
    13: ["Vitamin B12 | <148 | pg/mL | 200 - 900 | L"],
}


def azure_response():
    pages = []
    tables = []
    paragraphs = []
    for number in range(1, 14):
        rows = ROWS.get(number, ["Synthetic fixture — no measurement on this page"])
        polygon = [1.0, 1.0, 7.0, 1.0, 7.0, 2.0, 1.0, 2.0]
        bound = Obj(page_number=number, polygon=polygon)
        pages.append(
            Obj(
                page_number=number,
                width=8.5,
                height=11.0,
                unit="inch",
                lines=[Obj(content=row, polygon=polygon) for row in rows],
            )
        )
        paragraphs.extend(Obj(content=row, bounding_regions=[bound]) for row in rows)
        if number in ROWS:
            cells = []
            for row_index, row in enumerate(rows):
                for column, content in enumerate(row.split(" | ")):
                    cells.append(
                        Obj(
                            row_index=row_index,
                            column_index=column,
                            content=content,
                            kind="content",
                            row_span=1,
                            column_span=1,
                            bounding_regions=[bound],
                        )
                    )
            tables.append(
                Obj(
                    row_count=len(rows),
                    column_count=max(len(r.split(" | ")) for r in rows),
                    cells=cells,
                    bounding_regions=[bound],
                )
            )
    return Obj(pages=pages, paragraphs=paragraphs, tables=tables, content=None)


def synthetic_pdf():
    """Generate a valid, selectable-text 13-page PDF without external services."""
    objects = [
        b"",
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    children = []
    for number in range(1, 14):
        page_id = len(objects)
        content_id = page_id + 1
        children.append(f"{page_id} 0 R")
        objects.append(
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >>".encode()
        )
        lines = [f"SYNTHETIC DEVELOPMENT FIXTURE - PAGE {number}"] + ROWS.get(
            number, ["No measurement"]
        )
        stream = (
            b"BT /F1 12 Tf 50 740 Td "
            + b" ".join(b"(" + line.encode() + b") Tj 0 -24 Td" for line in lines)
            + b" ET"
        )
        objects.append(f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
    objects[2] = f"<< /Type /Pages /Kids [{' '.join(children)}] /Count 13 >>".encode()
    data = b"%PDF-1.4\n"
    offsets = [0]
    for index, obj in enumerate(objects[1:], 1):
        offsets.append(len(data))
        data += f"{index} 0 obj\n".encode() + obj + b"\nendobj\n"
    xref = len(data)
    data += f"xref\n0 {len(objects)}\n0000000000 65535 f \n".encode()
    data += b"".join(f"{offset:010d} 00000 n \n".encode() for offset in offsets[1:])
    return (
        data
        + f"trailer\n<< /Size {len(objects)} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
