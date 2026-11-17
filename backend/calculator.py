import csv
import io
from decimal import Decimal
from typing import List, Dict, Any
from models import StatementRow, RowError, WorkSplit


def format_cents(cents: int) -> str:
    """Formats integer cents to standard decimal string '0.00'."""
    is_negative = cents < 0
    abs_cents = abs(cents)
    dollars = abs_cents // 100
    remainder = abs_cents % 100
    return f"{'-' if is_negative else ''}{dollars}.{remainder:02d}"


def validate_seed_splits(splits: List[WorkSplit]) -> None:
    """
    Validates that each work in splits.json has writer shares totaling exactly 100%.
    Throws ValueError if validation fails.
    """
    if not splits:
        raise ValueError("Seed splits file is empty or not an array.")

    for work in splits:
        if not work.workId:
            raise ValueError(f"Seed work is missing workId: {work}")
        if not work.writers:
            raise ValueError(f"Seed work '{work.workId}' has no writers configured.")

        total_share = sum(w.share for w in work.writers)
        # Using Decimal comparison with 0.001 tolerance
        if abs(total_share - Decimal("100.00")) > Decimal("0.001"):
            raise ValueError(
                f"Seed shares for work '{work.workId}' ({work.title}) total {total_share}%, expected exactly 100%."
            )


def calculate_splits(
    rows: List[StatementRow],
    row_errors: List[RowError],
    splits: List[WorkSplit],
) -> Dict[str, Any]:
    """
    Pure calculation function:
    Takes parsed statement rows, row errors, and seed splits,
    and produces the exact financial breakdown with zero I/O.

    Enforces:
    1. Money is exact (integer cents math / Decimal).
    2. Exact reconciliation: fileTotal = allocatedTotal + unmatchedTotal.
    3. Unmatched works appear with writer 'UNMATCHED' and empty share_percent.
    4. Largest Remainder Method (Hare-Niemeyer) for penny-perfect rounding.
    5. Duplicate work IDs are aggregated together into a consolidated work balance.
    """
    splits_map = {item.workId.strip(): item for item in splits}

    # Aggregate duplicate work IDs
    aggregated_map = {}
    total_input_lines = len(rows)
    matched_input_lines = 0

    for row in rows:
        trimmed_id = row.workId.strip()
        seed_work = splits_map.get(trimmed_id)
        is_matched = seed_work is not None

        if is_matched:
            matched_input_lines += 1

        if trimmed_id not in aggregated_map:
            aggregated_map[trimmed_id] = {
                "workId": trimmed_id,
                "title": row.title or (seed_work.title if seed_work else "Unknown Title"),
                "totalCents": row.amountCents,
                "matched": is_matched,
                "seedWork": seed_work,
                "rowCount": 1,
            }
        else:
            existing = aggregated_map[trimmed_id]
            existing["totalCents"] += row.amountCents
            if row.title and row.title.strip():
                existing["title"] = row.title.strip()
            existing["rowCount"] += 1

    file_total_cents = 0
    allocated_total_cents = 0
    unmatched_total_cents = 0

    line_breakdown = []
    writer_totals_map = {}

    for work in aggregated_map.values():
        total_work_cents = work["totalCents"]
        file_total_cents += total_work_cents

        if not work["matched"] or not work["seedWork"]:
            # Unmatched work
            unmatched_total_cents += total_work_cents
            line_breakdown.append({
                "work_id": work["workId"],
                "title": work["title"],
                "writer": "UNMATCHED",
                "share_percent": "",
                "amount": format_cents(total_work_cents),
                "status": "UNMATCHED",
            })
        else:
            # Matched work
            allocated_total_cents += total_work_cents
            seed = work["seedWork"]
            work_title = work["title"] or seed.title

            # Largest Remainder Method (Hamilton / Hare-Niemeyer Algorithm)
            # v_i = total_cents * share / 100
            computations = []
            for idx, w in enumerate(seed.writers):
                exact_cents = (Decimal(total_work_cents) * w.share) / Decimal(100)
                base_cents = int(exact_cents)
                remainder = exact_cents - Decimal(base_cents)
                computations.append({
                    "name": w.name,
                    "share": w.share,
                    "base": base_cents,
                    "remainder": remainder,
                    "index": idx,
                    "allocated": base_cents,
                })

            total_base = sum(c["base"] for c in computations)
            leftover_cents = total_work_cents - total_base

            # Sort descending by remainder; tie-break by larger share, then initial catalog index
            sorted_indices = sorted(
                range(len(computations)),
                key=lambda i: (
                    -computations[i]["remainder"],
                    -computations[i]["share"],
                    computations[i]["index"],
                ),
            )

            for i in range(leftover_cents):
                target_idx = sorted_indices[i % len(computations)]
                computations[target_idx]["allocated"] += 1

            for comp in computations:
                line_breakdown.append({
                    "work_id": work["workId"],
                    "title": work_title,
                    "writer": comp["name"],
                    "share_percent": f"{comp['share']:.2f}",
                    "amount": format_cents(comp["allocated"]),
                    "status": "MATCHED",
                })
                writer_totals_map[comp["name"]] = (
                    writer_totals_map.get(comp["name"], 0) + comp["allocated"]
                )

    # Format writer totals, sorted by amount descending (highest first)
    writer_totals_sorted = sorted(
        writer_totals_map.items(),
        key=lambda item: (-item[1], item[0]),
    )
    writer_totals = [
        {"writer": writer, "amount": format_cents(cents)}
        for writer, cents in writer_totals_sorted
    ]

    # Reconciliation assertion
    if file_total_cents != allocated_total_cents + unmatched_total_cents:
        raise AssertionError(
            f"Reconciliation check failed: fileTotal ({file_total_cents}) != allocatedTotal ({allocated_total_cents}) + unmatchedTotal ({unmatched_total_cents})"
        )

    return {
        "fileTotal": format_cents(file_total_cents),
        "allocatedTotal": format_cents(allocated_total_cents),
        "unmatchedTotal": format_cents(unmatched_total_cents),
        "lines": total_input_lines,
        "matchedLines": matched_input_lines,
        "errors": [err.model_dump() if hasattr(err, "model_dump") else err for err in row_errors],
        "writerTotals": writer_totals,
        "lineBreakdown": line_breakdown,
    }


def generate_shares_csv(breakdown: List[Dict[str, Any]]) -> str:
    """Generates the RFC 4180 shares.csv content."""
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\r\n")
    writer.writerow(["work_id", "title", "writer", "share_percent", "amount"])

    for item in breakdown:
        writer.writerow([
            item["work_id"],
            item["title"],
            item["writer"],
            item["share_percent"],
            item["amount"],
        ])

    return output.getvalue()
