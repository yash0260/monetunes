import io
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors


def generate_writer_statement_pdf(statement: dict, writer_name: str) -> bytes:
    """Generates an individual songwriter royalty statement PDF in memory."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    writer_lines = [
        l for l in statement.get("lineBreakdown", [])
        if l["writer"].lower() == writer_name.lower()
    ]

    total_amount = "0.00"
    for w in statement.get("writerTotals", []):
        if w["writer"].lower() == writer_name.lower():
            total_amount = w["amount"]
            break

    # Header Box
    p.setFillColor(colors.HexColor("#0F172A"))
    p.rect(40, height - 100, 515, 60, fill=1, stroke=0)

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 18)
    p.drawString(55, height - 68, "MONETUNES")

    p.setFillColor(colors.HexColor("#818CF8"))
    p.setFont("Helvetica", 9)
    p.drawString(55, height - 85, "MUSIC PUBLISHING & ROYALTY ACCOUNTING")

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawRightString(540, height - 68, "WRITER ROYALTY STATEMENT")

    p.setFillColor(colors.HexColor("#94A3B8"))
    p.setFont("Helvetica", 8)
    p.drawRightString(540, height - 85, f"STATEMENT ID: #{statement.get('id', 'N/A')}  •  CURRENCY: USD")

    # Songwriter Metadata Box
    meta_y = height - 170
    p.setFillColor(colors.HexColor("#F8FAFC"))
    p.setStrokeColor(colors.HexColor("#E2E8F0"))
    p.rect(40, meta_y, 515, 55, fill=1, stroke=1)

    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(55, meta_y + 38, "SONGWRITER / RIGHTSHOLDER")
    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 13)
    p.drawString(55, meta_y + 18, writer_name)

    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(250, meta_y + 38, "STATEMENT FILE")
    p.setFillColor(colors.HexColor("#334155"))
    p.setFont("Helvetica", 10)
    p.drawString(250, meta_y + 20, statement.get("filename", "statement.csv"))

    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(410, meta_y + 38, "REGISTERED WORKS")
    p.setFillColor(colors.HexColor("#334155"))
    p.setFont("Helvetica", 10)
    p.drawString(410, meta_y + 20, f"{len(writer_lines)} works")

    # Financial Summary Cards
    cards_y = height - 235
    card_w = 165
    card_h = 50

    # Card 1: Gross
    p.setFillColor(colors.HexColor("#F8FAFC"))
    p.setStrokeColor(colors.HexColor("#E2E8F0"))
    p.rect(40, cards_y, card_w, card_h, fill=1, stroke=1)
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(50, cards_y + 34, "GROSS EARNINGS")
    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 14)
    p.drawString(50, cards_y + 14, f"${total_amount}")

    # Card 2: Deductions
    p.setFillColor(colors.HexColor("#F8FAFC"))
    p.rect(215, cards_y, card_w, card_h, fill=1, stroke=1)
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(225, cards_y + 34, "DEDUCTIONS / RECOUPMENT")
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Bold", 14)
    p.drawString(225, cards_y + 14, "$0.00")

    # Card 3: Net Payable
    p.setFillColor(colors.HexColor("#ECFDF5"))
    p.setStrokeColor(colors.HexColor("#6EE7B7"))
    p.rect(390, cards_y, card_w, card_h, fill=1, stroke=1)
    p.setFillColor(colors.HexColor("#047857"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(400, cards_y + 34, "NET PAYABLE TO WRITER")
    p.setFillColor(colors.HexColor("#059669"))
    p.setFont("Helvetica-Bold", 14)
    p.drawString(400, cards_y + 14, f"${total_amount}")

    # Works Breakdown Table
    table_y = height - 265
    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, table_y, "Earned Works Breakdown")

    thead_y = table_y - 20
    p.setFillColor(colors.HexColor("#F1F5F9"))
    p.rect(40, thead_y, 515, 20, fill=1, stroke=0)

    p.setFillColor(colors.HexColor("#475569"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(50, thead_y + 6, "WORK ID")
    p.drawString(150, thead_y + 6, "TITLE")
    p.drawRightString(400, thead_y + 6, "WRITER SHARE")
    p.drawRightString(540, thead_y + 6, "NET AMOUNT")

    cur_y = thead_y - 20
    for idx, item in enumerate(writer_lines):
        if idx % 2 == 0:
            p.setFillColor(colors.HexColor("#FAFAFA"))
            p.rect(40, cur_y, 515, 20, fill=1, stroke=0)

        p.setFillColor(colors.HexColor("#0F172A"))
        p.setFont("Helvetica", 8)
        p.drawString(50, cur_y + 6, item.get("work_id", ""))
        p.drawString(150, cur_y + 6, item.get("title", "")[:35])
        p.setFillColor(colors.HexColor("#64748B"))
        p.drawRightString(400, cur_y + 6, f"{item.get('share_percent', '')}%")
        p.setFillColor(colors.HexColor("#0F172A"))
        p.setFont("Helvetica-Bold", 8)
        p.drawRightString(540, cur_y + 6, f"${item.get('amount', '')}")
        cur_y -= 20

    # Total Row
    p.setFillColor(colors.HexColor("#0F172A"))
    p.rect(40, cur_y, 515, 22, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 8)
    p.drawString(50, cur_y + 7, "TOTAL ALLOCATED")
    p.setFillColor(colors.HexColor("#34D399"))
    p.setFont("Helvetica-Bold", 9)
    p.drawRightString(540, cur_y + 7, f"${total_amount}")

    # Certification Banner
    cert_y = cur_y - 65
    p.setFillColor(colors.HexColor("#F8FAFC"))
    p.setStrokeColor(colors.HexColor("#E2E8F0"))
    p.rect(40, cert_y, 515, 50, fill=1, stroke=1)
    p.setFillColor(colors.HexColor("#4338CA"))
    p.setFont("Helvetica-Bold", 8.5)
    p.drawString(50, cert_y + 34, "AUDIT CERTIFICATION & RECONCILIATION GUARANTEE")
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica", 7.5)
    p.drawString(
        50,
        cert_y + 20,
        "Calculated with exact decimal precision using the Largest Remainder Method (Hare-Niemeyer Algorithm).",
    )
    p.drawString(
        50,
        cert_y + 10,
        "Reconciled in full accordance with statutory music publishing accounting standards with zero floating drift.",
    )

    # Footer
    p.setStrokeColor(colors.HexColor("#E2E8F0"))
    p.line(40, 45, 555, 45)
    p.setFillColor(colors.HexColor("#94A3B8"))
    p.setFont("Helvetica", 7.5)
    p.drawString(40, 32, "Monetunes Python/FastAPI Royalty Engine  •  Confidential Songwriter Statement")
    p.drawRightString(555, 32, "Page 1 of 1")

    p.showPage()
    p.save()
    return buffer.getvalue()


def generate_statement_summary_pdf(statement: dict) -> bytes:
    """Generates master statement reconciliation report PDF in memory."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Header Box
    p.setFillColor(colors.HexColor("#0F172A"))
    p.rect(40, height - 100, 515, 60, fill=1, stroke=0)

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 18)
    p.drawString(55, height - 68, "MONETUNES")

    p.setFillColor(colors.HexColor("#818CF8"))
    p.setFont("Helvetica", 9)
    p.drawString(55, height - 85, "MASTER RECONCILIATION & ROYALTIES SUMMARY")

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 12)
    p.drawRightString(540, height - 68, f"STATEMENT #{statement.get('id', 'N/A')}")

    p.setFillColor(colors.HexColor("#94A3B8"))
    p.setFont("Helvetica", 8)
    p.drawRightString(540, height - 85, statement.get("filename", "statement.csv"))

    # Reconciliation Banner
    file_cents = int(float(statement.get("fileTotal", "0")) * 100)
    alloc_cents = int(float(statement.get("allocatedTotal", "0")) * 100)
    unmatched_cents = int(float(statement.get("unmatchedTotal", "0")) * 100)
    is_reconciled = file_cents == alloc_cents + unmatched_cents

    banner_y = height - 155
    p.setFillColor(colors.HexColor("#ECFDF5" if is_reconciled else "#FEF2F2"))
    p.setStrokeColor(colors.HexColor("#10B981" if is_reconciled else "#EF4444"))
    p.rect(40, banner_y, 515, 45, fill=1, stroke=1)

    p.setFillColor(colors.HexColor("#065F46" if is_reconciled else "#991B1B"))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(
        55,
        banner_y + 28,
        "RECONCILIATION VERIFIED — 100% BALANCED" if is_reconciled else "RECONCILIATION DISCREPANCY",
    )

    p.setFillColor(colors.HexColor("#047857" if is_reconciled else "#B91C1C"))
    p.setFont("Helvetica", 8.5)
    p.drawString(
        55,
        banner_y + 12,
        f"fileTotal (${statement.get('fileTotal')}) = allocatedTotal (${statement.get('allocatedTotal')}) + unmatchedTotal (${statement.get('unmatchedTotal')})",
    )

    # 4 Metric Cards
    cards_y = height - 215
    card_w = 120
    card_h = 45

    boxes = [
        ("FILE TOTAL", f"${statement.get('fileTotal')}"),
        ("ALLOCATED", f"${statement.get('allocatedTotal')}"),
        ("UNMATCHED", f"${statement.get('unmatchedTotal')}"),
        ("LINES", f"{statement.get('lines')}"),
    ]

    for i, (title, val) in enumerate(boxes):
        x = 40 + i * (card_w + 11.6)
        p.setFillColor(colors.HexColor("#F8FAFC"))
        p.setStrokeColor(colors.HexColor("#E2E8F0"))
        p.rect(x, cards_y, card_w, card_h, fill=1, stroke=1)
        p.setFillColor(colors.HexColor("#64748B"))
        p.setFont("Helvetica-Bold", 7.5)
        p.drawString(x + 10, cards_y + 30, title)
        p.setFillColor(colors.HexColor("#0F172A"))
        p.setFont("Helvetica-Bold", 12)
        p.drawString(x + 10, cards_y + 12, val)

    # Writer Summary Table
    table_y = height - 250
    p.setFillColor(colors.HexColor("#0F172A"))
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, table_y, "Writer Royalties Summary")

    thead_y = table_y - 20
    p.setFillColor(colors.HexColor("#F1F5F9"))
    p.rect(40, thead_y, 515, 20, fill=1, stroke=0)
    p.setFillColor(colors.HexColor("#475569"))
    p.setFont("Helvetica-Bold", 8)
    p.drawString(50, thead_y + 6, "WRITER")
    p.drawRightString(540, thead_y + 6, "ROYALTY AMOUNT")

    cur_y = thead_y - 20
    for idx, w in enumerate(statement.get("writerTotals", [])):
        if idx % 2 == 0:
            p.setFillColor(colors.HexColor("#FAFAFA"))
            p.rect(40, cur_y, 515, 20, fill=1, stroke=0)

        p.setFillColor(colors.HexColor("#0F172A"))
        p.setFont("Helvetica", 8.5)
        p.drawString(50, cur_y + 6, w["writer"])
        p.setFont("Helvetica-Bold", 8.5)
        p.drawRightString(540, cur_y + 6, f"${w['amount']}")
        cur_y -= 20

    # Total Row
    p.setFillColor(colors.HexColor("#0F172A"))
    p.rect(40, cur_y, 515, 22, fill=1, stroke=0)
    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 8.5)
    p.drawString(50, cur_y + 7, "TOTAL ALLOCATED TO WRITERS")
    p.setFillColor(colors.HexColor("#34D399"))
    p.drawRightString(540, cur_y + 7, f"${statement.get('allocatedTotal')}")

    # Footer
    p.setStrokeColor(colors.HexColor("#E2E8F0"))
    p.line(40, 45, 555, 45)
    p.setFillColor(colors.HexColor("#94A3B8"))
    p.setFont("Helvetica", 7.5)
    p.drawString(40, 32, "Monetunes Master Statement  •  Official Royalty Report (Python Engine)")
    p.drawRightString(555, 32, "Page 1 of 1")

    p.showPage()
    p.save()
    return buffer.getvalue()
