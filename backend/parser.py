import csv
import io
import re
from decimal import Decimal, InvalidOperation
from typing import Tuple, List
from models import StatementRow, RowError


class CsvValidationError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_amount_to_cents(raw_amount: str) -> int:
    """
    Safely converts a currency string to integer cents using Decimal.
    Examples:
      '100.00' -> 10000
      '10'     -> 1000
      '10.5'   -> 1050
      '0.05'   -> 5
    """
    if raw_amount is None or not raw_amount.strip():
        raise ValueError("amount is missing")

    trimmed = raw_amount.strip()

    if trimmed.startswith("-"):
        raise ValueError("amount cannot be negative")

    match = re.match(r"^(\d+)(?:\.(\d+))?$", trimmed)
    if not match:
        raise ValueError("amount is not a number")

    cents_part = match.group(2) or ""
    if len(cents_part) > 2:
        raise ValueError("amount has more than 2 decimal places")

    try:
        dec = Decimal(trimmed)
        return int(dec * 100)
    except InvalidOperation:
        raise ValueError("amount is not a number")


def parse_statement_csv(csv_content: str) -> Tuple[List[StatementRow], List[RowError], int]:
    """
    Parses CSV content into valid rows and non-fatal errors.
    Validates that the file has required headers: work_id, title, amount.
    """
    if not csv_content or not csv_content.strip():
        raise CsvValidationError("Uploaded CSV file is empty. Please upload a valid royalty statement.")

    try:
        reader = csv.reader(io.StringIO(csv_content.strip()))
        records = list(reader)
    except Exception as e:
        raise CsvValidationError(f"Failed to parse CSV file: {str(e)}")

    if not records:
        raise CsvValidationError("Uploaded CSV file contains no data rows.")

    header_row = [h.strip().lower() for h in records[0]]

    try:
        work_id_idx = header_row.index("work_id")
    except ValueError:
        work_id_idx = -1

    try:
        title_idx = header_row.index("title")
    except ValueError:
        title_idx = -1

    try:
        amount_idx = header_row.index("amount")
    except ValueError:
        amount_idx = -1

    if work_id_idx == -1 or title_idx == -1 or amount_idx == -1:
        missing = []
        if work_id_idx == -1:
            missing.append("work_id")
        if title_idx == -1:
            missing.append("title")
        if amount_idx == -1:
            missing.append("amount")
        raise CsvValidationError(
            f"Invalid CSV headers. Missing required column(s): {', '.join(missing)}. Expected columns: work_id, title, amount."
        )

    valid_rows = []
    errors = []

    # Spreadsheet data rows start at Row 2 (1-based index)
    for i in range(1, len(records)):
        row_num = i + 1
        record = records[i]

        if not any(col.strip() for col in record):
            continue

        raw_work_id = record[work_id_idx].strip() if work_id_idx < len(record) else ""
        raw_title = record[title_idx].strip() if title_idx < len(record) else ""
        raw_amount = record[amount_idx].strip() if amount_idx < len(record) else ""

        if not raw_work_id:
            errors.append(RowError(
                row=row_num,
                reason="missing work_id",
                message=f"Row {row_num}: missing work_id"
            ))
            continue

        try:
            amount_cents = parse_amount_to_cents(raw_amount)
        except ValueError as err:
            errors.append(RowError(
                row=row_num,
                reason=str(err),
                message=f"Row {row_num}: {str(err)}"
            ))
            continue

        valid_rows.append(StatementRow(
            rowIndex=row_num,
            workId=raw_work_id,
            title=raw_title,
            amountCents=amount_cents,
            rawAmount=raw_amount or "0.00"
        ))

    return valid_rows, errors, len(records) - 1
