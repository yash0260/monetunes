import pytest
from decimal import Decimal
from models import WorkSplit, WriterShare, StatementRow, RowError
from calculator import calculate_splits, format_cents, generate_shares_csv, validate_seed_splits
from parser import parse_statement_csv

MOCK_SEED_SPLITS = [
    WorkSplit(
        workId="MNT000001",
        title="Midnight Drive",
        writers=[
            WriterShare(name="Alice Brown", share=Decimal("50")),
            WriterShare(name="Ben Cole", share=Decimal("50")),
        ],
    ),
    WorkSplit(
        workId="MNT000002",
        title="Paper Moon",
        writers=[
            WriterShare(name="Alice Brown", share=Decimal("70")),
            WriterShare(name="Dana Fox", share=Decimal("30")),
        ],
    ),
    WorkSplit(
        workId="MNT000003",
        title="Cold Harbour",
        writers=[
            WriterShare(name="Ben Cole", share=Decimal("33.33")),
            WriterShare(name="Dana Fox", share=Decimal("33.33")),
            WriterShare(name="Eli Grant", share=Decimal("33.34")),
        ],
    ),
]


def test_seed_validation_success():
    """Rule 7: Valid seed shares totaling 100% must pass."""
    validate_seed_splits(MOCK_SEED_SPLITS)


def test_seed_validation_failure_under():
    """Rule 7: Seed shares totaling < 100% must be rejected."""
    bad_seed = [
        WorkSplit(
            workId="BAD01",
            title="Bad",
            writers=[
                WriterShare(name="Alice", share=Decimal("40")),
                WriterShare(name="Bob", share=Decimal("50")),
            ],
        )
    ]
    with pytest.raises(ValueError, match="total 90%, expected exactly 100%"):
        validate_seed_splits(bad_seed)


def test_seed_validation_failure_over():
    """Rule 7: Seed shares totaling > 100% must be rejected."""
    bad_seed = [
        WorkSplit(
            workId="BAD02",
            title="Bad",
            writers=[
                WriterShare(name="Alice", share=Decimal("60")),
                WriterShare(name="Bob", share=Decimal("50")),
            ],
        )
    ]
    with pytest.raises(ValueError, match="total 110%, expected exactly 100%"):
        validate_seed_splits(bad_seed)


def test_rounding_case_cold_harbour():
    """Cold Harbour splits $10.00 as 3.33 / 3.33 / 3.34 (Eli Grant gets highest remainder)."""
    rows = [
        StatementRow(
            rowIndex=2,
            workId="MNT000003",
            title="Cold Harbour",
            amountCents=1000,  # $10.00
            rawAmount="10.00",
        )
    ]
    res = calculate_splits(rows, [], MOCK_SEED_SPLITS)

    assert res["fileTotal"] == "10.00"
    assert res["allocatedTotal"] == "10.00"
    assert res["unmatchedTotal"] == "0.00"

    writers = {item["writer"]: item["amount"] for item in res["lineBreakdown"]}
    assert writers["Ben Cole"] == "3.33"
    assert writers["Dana Fox"] == "3.33"
    assert writers["Eli Grant"] == "3.34"

    assert res["writerTotals"] == [
        {"writer": "Eli Grant", "amount": "3.34"},
        {"writer": "Ben Cole", "amount": "3.33"},
        {"writer": "Dana Fox", "amount": "3.33"},
    ]


def test_unmatched_works():
    """Unmatched works appear with writer 'UNMATCHED', empty share_percent, and full amount."""
    rows = [
        StatementRow(
            rowIndex=2,
            workId="MNT999999",
            title="Unknown Song",
            amountCents=500,  # $5.00
            rawAmount="5.00",
        )
    ]
    res = calculate_splits(rows, [], MOCK_SEED_SPLITS)

    assert res["fileTotal"] == "5.00"
    assert res["allocatedTotal"] == "0.00"
    assert res["unmatchedTotal"] == "5.00"
    assert res["lines"] == 1
    assert res["matchedLines"] == 0

    assert len(res["lineBreakdown"]) == 1
    item = res["lineBreakdown"][0]
    assert item["work_id"] == "MNT999999"
    assert item["writer"] == "UNMATCHED"
    assert item["share_percent"] == ""
    assert item["amount"] == "5.00"
    assert item["status"] == "UNMATCHED"


def test_reconciliation_invariant():
    """Rule 2: fileTotal = allocatedTotal + unmatchedTotal for various monetary amounts."""
    for amount in [1, 7, 100, 333, 9999, 12500, 100000]:
        rows = [
            StatementRow(rowIndex=2, workId="MNT000001", title="Midnight Drive", amountCents=amount, rawAmount=f"{amount/100:.2f}"),
            StatementRow(rowIndex=3, workId="MNT000003", title="Cold Harbour", amountCents=amount * 2, rawAmount=f"{(amount*2)/100:.2f}"),
            StatementRow(rowIndex=4, workId="UNMATCHED", title="Ghost Song", amountCents=amount, rawAmount=f"{amount/100:.2f}"),
        ]
        res = calculate_splits(rows, [], MOCK_SEED_SPLITS)
        f_cents = int(float(res["fileTotal"]) * 100)
        a_cents = int(float(res["allocatedTotal"]) * 100)
        u_cents = int(float(res["unmatchedTotal"]) * 100)
        assert f_cents == a_cents + u_cents


def test_duplicate_work_ids_aggregation():
    """Rule 6: Duplicate work IDs in one statement are aggregated together."""
    rows = [
        StatementRow(rowIndex=2, workId="MNT000001", title="Midnight Drive", amountCents=4000, rawAmount="40.00"),
        StatementRow(rowIndex=3, workId="MNT000001", title="Midnight Drive - Radio Edit", amountCents=6000, rawAmount="60.00"),
    ]
    res = calculate_splits(rows, [], MOCK_SEED_SPLITS)

    assert res["fileTotal"] == "100.00"
    assert res["allocatedTotal"] == "100.00"
    assert res["lines"] == 2
    assert res["matchedLines"] == 2
    assert res["writerTotals"] == [
        {"writer": "Alice Brown", "amount": "50.00"},
        {"writer": "Ben Cole", "amount": "50.00"},
    ]


def test_full_assignment_statement():
    """Verifies the exact assignment statement matching the image examples."""
    csv_content = (
        "work_id,title,amount\n"
        "MNT000001,Midnight Drive,100.00\n"
        "MNT000002,Paper Moon,10.00\n"
        "MNT000003,Cold Harbour,10.00\n"
        "MNT999999,Unknown Song,5.00"
    )
    rows, errors, total = parse_statement_csv(csv_content)
    assert len(errors) == 0
    assert len(rows) == 4

    res = calculate_splits(rows, errors, MOCK_SEED_SPLITS)
    assert res["fileTotal"] == "125.00"
    assert res["allocatedTotal"] == "120.00"
    assert res["unmatchedTotal"] == "5.00"
    assert res["lines"] == 4
    assert res["matchedLines"] == 3

    assert res["writerTotals"] == [
        {"writer": "Alice Brown", "amount": "57.00"},
        {"writer": "Ben Cole", "amount": "53.33"},
        {"writer": "Dana Fox", "amount": "6.33"},
        {"writer": "Eli Grant", "amount": "3.34"},
    ]

    shares_csv = generate_shares_csv(res["lineBreakdown"])
    assert "MNT000001,Midnight Drive,Alice Brown,50.00,50.00" in shares_csv
    assert "MNT000003,Cold Harbour,Eli Grant,33.34,3.34" in shares_csv
    assert "MNT999999,Unknown Song,UNMATCHED,,5.00" in shares_csv


def test_bad_rows_reporting():
    """Rule 4: Bad rows are reported, not fatal."""
    bad_csv = (
        "work_id,title,amount\n"
        "MNT000001,Midnight Drive,100.00\n"
        "MNT000002,Paper Moon,-10.00\n"
        "MNT000003,Cold Harbour,not-a-number\n"
        ",Missing Work ID,15.00\n"
        "MNT000001,Second Midnight Drive,20.00"
    )
    rows, errors, total = parse_statement_csv(bad_csv)
    assert len(errors) == 3
    assert errors[0].reason == "amount cannot be negative"
    assert errors[1].reason == "amount is not a number"
    assert errors[2].reason == "missing work_id"
    assert len(rows) == 2

    res = calculate_splits(rows, errors, MOCK_SEED_SPLITS)
    assert len(res["errors"]) == 3
    assert res["fileTotal"] == "120.00"  # 100.00 + 20.00
