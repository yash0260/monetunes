import os
import sys
import glob

# Ensure backend/vendor is at the top of sys.path (for Render container persistence)
vendor_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "vendor")
if os.path.isdir(vendor_dir) and vendor_dir not in sys.path:
    sys.path.insert(0, vendor_dir)

# Ensure user-installed site-packages (e.g. /opt/render/.local/lib/python*/site-packages on Render) are in sys.path
for pattern in [
    os.path.expanduser("~/.local/lib/python*/site-packages"),
    "/opt/render/.local/lib/python*/site-packages",
]:
    for match in glob.glob(pattern):
        if os.path.isdir(match) and match not in sys.path:
            sys.path.insert(0, match)

# Ensure backend directory is in sys.path for local module imports (models, calculator, etc.)
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Dict, Any
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from models import WorkSplit, WriterShare, StatementSummary, StatementDetail
from calculator import calculate_splits, generate_shares_csv, validate_seed_splits
from parser import parse_statement_csv, CsvValidationError
from pdf_generator import generate_writer_statement_pdf, generate_statement_summary_pdf

BASE_DIR = Path(__file__).resolve().parent
SEED_FILE_PATH = os.getenv("SPLITS_PATH", str(BASE_DIR / "data" / "splits.json"))

print(f"[Monetunes FastAPI] Loading seed splits from: {SEED_FILE_PATH}")

if not os.path.exists(SEED_FILE_PATH):
    raise RuntimeError(f"Seed file not found at: {SEED_FILE_PATH}")

with open(SEED_FILE_PATH, "r", encoding="utf-8") as f:
    raw_seed = json.load(f)

seed_splits = [
    WorkSplit(
        workId=item["workId"],
        title=item["title"],
        writers=[
            WriterShare(name=w["name"], share=Decimal(str(w["share"])))
            for w in item["writers"]
        ],
    )
    for item in raw_seed
]

# Rule 7: Seed shares that do not total 100 are reported at startup, never silently paid
try:
    validate_seed_splits(seed_splits)
    print(f"[Monetunes FastAPI] Seed splits successfully validated ({len(seed_splits)} works loaded).")
except Exception as e:
    print(f"[FATAL] Seed validation error: {e}")
    raise RuntimeError(f"Seed validation error: {e}")

app = FastAPI(
    title="Monetunes Royalty Processing Engine",
    description="Python FastAPI backend for royalty statement calculations using exact Decimal arithmetic.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for statements
statements_store: Dict[str, Dict[str, Any]] = {}
statement_counter = 1


@app.get("/api/health")
def get_health():
    return {
        "status": "ok",
        "engine": "Python/FastAPI",
        "seedWorksCount": len(seed_splits),
        "storedStatementsCount": len(statements_store),
    }


@app.get("/api/splits")
def get_splits():
    return [
        {
            "workId": s.workId,
            "title": s.title,
            "writers": [{"name": w.name, "share": float(w.share)} for w in s.writers],
        }
        for s in seed_splits
    ]


@app.get("/api/sample.csv")
def get_sample_csv():
    sample_content = (
        "work_id,title,amount\r\n"
        "MNT000001,Midnight Drive,100.00\r\n"
        "MNT000002,Paper Moon,10.00\r\n"
        "MNT000003,Cold Harbour,10.00\r\n"
        "MNT999999,Unknown Song,5.00\r\n"
    )
    return Response(
        content=sample_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="statement.csv"'},
    )


@app.post("/api/statements", status_code=201, response_model=StatementSummary)
async def upload_statement(file: UploadFile = File(...)):
    global statement_counter

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Validate file extension
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only .csv files are accepted.",
        )

    # Validate file size (max 5 MB)
    content_bytes = await file.read()
    if len(content_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds 5 MB. Please upload a smaller file under 5 MB.",
        )

    try:
        csv_text = content_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode file content as UTF-8 CSV.",
        )

    try:
        valid_rows, row_errors, total_lines = parse_statement_csv(csv_text)
    except CsvValidationError as e:
        raise HTTPException(status_code=400, detail=e.message)

    try:
        calculation = calculate_splits(valid_rows, row_errors, seed_splits)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")

    statement_id = f"st_{statement_counter:02d}"
    statement_counter += 1

    record = {
        "id": statement_id,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "filename": file.filename,
        **calculation,
    }
    statements_store[statement_id] = record

    return StatementSummary(
        id=record["id"],
        fileTotal=record["fileTotal"],
        allocatedTotal=record["allocatedTotal"],
        unmatchedTotal=record["unmatchedTotal"],
        lines=record["lines"],
        matchedLines=record["matchedLines"],
        errors=record["errors"],
        writerTotals=record["writerTotals"],
    )


@app.get("/api/statements/{statement_id}", response_model=StatementDetail)
def get_statement(statement_id: str):
    record = statements_store.get(statement_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Statement with id '{statement_id}' not found.")
    return StatementDetail(**record)


@app.get("/api/statements/{statement_id}/shares.csv")
def download_shares_csv(statement_id: str):
    record = statements_store.get(statement_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Statement with id '{statement_id}' not found.")

    csv_content = generate_shares_csv(record["lineBreakdown"])
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="shares.csv"'},
    )


@app.get("/api/statements/{statement_id}/writers/{writer_name}/statement.pdf")
def download_writer_statement_pdf(statement_id: str, writer_name: str):
    record = statements_store.get(statement_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Statement with id '{statement_id}' not found.")

    writer_exists = any(
        w["writer"].lower() == writer_name.lower()
        for w in record.get("writerTotals", [])
    )
    if not writer_exists:
        raise HTTPException(
            status_code=404,
            detail=f"Writer '{writer_name}' not found in statement '{statement_id}'.",
        )

    pdf_bytes = generate_writer_statement_pdf(record, writer_name)
    safe_filename = "".join(c if c.isalnum() or c in "_-" else "_" for c in writer_name)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}_Royalty_Statement.pdf"'},
    )


@app.get("/api/statements/{statement_id}/summary.pdf")
def download_statement_summary_pdf(statement_id: str):
    record = statements_store.get(statement_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Statement with id '{statement_id}' not found.")

    pdf_bytes = generate_statement_summary_pdf(record)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="Statement_{statement_id}_Summary.pdf"'},
    )


# Production: Serve React Frontend if frontend/dist exists
candidate_dist_paths = [
    os.getenv("FRONTEND_DIST"),
    str(BASE_DIR.parent / "frontend" / "dist"),
    str(Path.cwd() / "frontend" / "dist"),
]

resolved_dist = next((p for p in candidate_dist_paths if p and os.path.exists(p)), None)

if resolved_dist:
    print(f"[Monetunes FastAPI] Mounting static frontend build from: {resolved_dist}")
    app.mount("/assets", StaticFiles(directory=os.path.join(resolved_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        file_path = os.path.join(resolved_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(resolved_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3001))
    print(f"[Monetunes FastAPI] Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
