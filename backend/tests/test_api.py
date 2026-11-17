import io
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["engine"] == "Python/FastAPI"
    assert data["seedWorksCount"] == 3


def test_api_sample_csv():
    res = client.get("/api/sample.csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "work_id,title,amount" in res.text


def test_post_statement_invalid_file_type():
    res = client.post(
        "/api/statements",
        files={"file": ("invalid.txt", io.BytesIO(b"Hello world"), "text/plain")},
    )
    assert res.status_code == 400
    assert "Only .csv files are accepted" in res.json()["detail"]


def test_post_statement_missing_headers():
    bad_csv = b"song,revenue\nSong A,10.00"
    res = client.post(
        "/api/statements",
        files={"file": ("test.csv", io.BytesIO(bad_csv), "text/csv")},
    )
    assert res.status_code == 400
    assert "Missing required column(s)" in res.json()["detail"]


def test_post_statement_success_and_downloads():
    valid_csv = (
        b"work_id,title,amount\n"
        b"MNT000001,Midnight Drive,100.00\n"
        b"MNT000002,Paper Moon,10.00\n"
        b"MNT000003,Cold Harbour,10.00\n"
        b"MNT999999,Unknown Song,5.00"
    )
    res = client.post(
        "/api/statements",
        files={"file": ("statement.csv", io.BytesIO(valid_csv), "text/csv")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["fileTotal"] == "125.00"
    assert data["allocatedTotal"] == "120.00"
    assert data["unmatchedTotal"] == "5.00"
    assert data["lines"] == 4
    assert data["matchedLines"] == 3
    assert len(data["writerTotals"]) == 4

    statement_id = data["id"]

    # GET /api/statements/{id}
    detail_res = client.get(f"/api/statements/{statement_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["lineBreakdown"]) == 8

    # GET /api/statements/{id}/shares.csv
    csv_res = client.get(f"/api/statements/{statement_id}/shares.csv")
    assert csv_res.status_code == 200
    assert "text/csv" in csv_res.headers["content-type"]
    assert "Eli Grant,33.34,3.34" in csv_res.text

    # GET Songwriter PDF statement
    pdf_res = client.get(f"/api/statements/{statement_id}/writers/Alice%20Brown/statement.pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 500

    # GET Master Summary PDF
    summary_pdf_res = client.get(f"/api/statements/{statement_id}/summary.pdf")
    assert summary_pdf_res.status_code == 200
    assert summary_pdf_res.headers["content-type"] == "application/pdf"
    assert len(summary_pdf_res.content) > 500


def test_get_statement_not_found():
    res = client.get("/api/statements/st_nonexistent")
    assert res.status_code == 404
