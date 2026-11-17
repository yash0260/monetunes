from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class WriterShare(BaseModel):
    name: str
    share: Decimal  # e.g. Decimal("50.00") or Decimal("33.33")


class WorkSplit(BaseModel):
    workId: str
    title: str
    writers: List[WriterShare]


class StatementRow(BaseModel):
    rowIndex: int
    workId: str
    title: str
    amountCents: int
    rawAmount: str


class RowError(BaseModel):
    row: int
    reason: str
    message: str


class WriterTotal(BaseModel):
    writer: str
    amount: str


class LineBreakdownItem(BaseModel):
    work_id: str
    title: str
    writer: str
    share_percent: str
    amount: str
    status: str  # "MATCHED" | "UNMATCHED"


class StatementSummary(BaseModel):
    id: str
    fileTotal: str
    allocatedTotal: str
    unmatchedTotal: str
    lines: int
    matchedLines: int
    errors: List[RowError]
    writerTotals: List[WriterTotal]


class StatementDetail(StatementSummary):
    lineBreakdown: List[LineBreakdownItem]
    filename: Optional[str] = "statement.csv"
    createdAt: Optional[str] = None
