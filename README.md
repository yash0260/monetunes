# Monetunes — Royalty Statement & Split Processing Engine

A web application designed for music publishing and royalty accounting. Users upload a royalty statement CSV, and the system automatically matches works against a seed split catalog (`splits.json`), splits earnings among songwriters with integer-cent accuracy, highlights unmatched repertoire, and exports a clean writer-share CSV (`shares.csv`).

---

## 🚀 How to Run in One or Two Commands

### Prerequisites
- **Python** 3.10+ (Python 3.12 recommended)
- **Node.js** (v18 or higher recommended; v20/v22 tested)
- **npm** (v9 or higher)

### Option A: One Command (Quick Start)
Clone or open the repository root, install dependencies, and launch:

```bash
# 1. Install dependencies for both backend (Python) and frontend (React)
npm run install:all

# 2. Start both FastAPI backend and React frontend concurrently
npm run dev
```

On Windows, you can also simply run:
```cmd
start.bat
```

- **Frontend App**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **FastAPI Interactive Docs (Swagger)**: [http://localhost:3001/docs](http://localhost:3001/docs)

---

### Option B: Running Separately

If you prefer running frontend and backend in separate terminal tabs:

**Terminal 1 (Python FastAPI Backend):**
```bash
pip install -r backend/requirements.txt
python -m uvicorn main:app --reload --port 3001 --app-dir backend
```

**Terminal 2 (React Frontend):**
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Running Unit & Integration Tests (Pytest)

The test suite covers:
- The exact rounding case (**Cold Harbour** $10.00 split)
- Unmatched works handling (**MNT999999** UNMATCHED with empty share percent)
- Bad rows reporting without fatal file crashes (missing work ID, negative amounts, non-numeric values)
- Reconciliation invariant check across multiple monetary scales
- Duplicate work IDs aggregation
- Startup seed splits validation (rejecting shares != 100%)
- Full assignment end-to-end integration and API verification
- Automated Songwriter PDF Royalty Statements & Master Summary Reports

To run all tests:
```bash
npm test
```
Or inside `backend`:
```bash
cd backend
python -m pytest
```

---

## 📐 The Rounding Rule

### Method: Largest Remainder Method (Hare-Niemeyer / Hamilton Method)

When splitting an amount of money among multiple writers based on percentage shares, exact division often results in fractional cents. For example:
- Work: **Cold Harbour** (`MNT000003`)
- Total Earned: **$10.00** (= 1,000 integer cents)
- Writers:
  - Ben Cole: `33.33%`
  - Dana Fox: `33.33%`
  - Eli Grant: `33.34%`

### Exact Step-by-Step Allocation:
1. **Convert to Integer Cents**: 
   All amounts are converted directly from input strings into integer cents (e.g. `10.00` $\to$ `1000` cents). No floating-point variables are used for monetary accumulation.
2. **Compute Base Allocation and Remainders**:
   For each writer $i$:
   $$\text{Exact Cents } E_i = \frac{\text{Total Cents} \times \text{Share}_i}{100}$$
   $$\text{Base Cents } B_i = \lfloor E_i \rfloor$$
   $$\text{Remainder } R_i = E_i - B_i$$
   - **Ben Cole**: $1000 \times 33.33 / 100 = 333.3 \text{ cents} \implies \text{Base} = 333 \text{ cents } (\$3.33), R = 0.3$
   - **Dana Fox**: $1000 \times 33.33 / 100 = 333.3 \text{ cents} \implies \text{Base} = 333 \text{ cents } (\$3.33), R = 0.3$
   - **Eli Grant**: $1000 \times 33.34 / 100 = 333.4 \text{ cents} \implies \text{Base} = 333 \text{ cents } (\$3.33), R = 0.4$
3. **Distribute Leftover Cents**:
   $$\text{Sum of Base Allocations} = 333 + 333 + 333 = 999 \text{ cents}$$
   $$\text{Leftover Cents } L = 1000 - 999 = 1 \text{ cent}$$
   The remaining $L$ cents are allocated 1 cent each to the writers with the **largest remainder $R_i$**:
   - Eli Grant has the largest remainder ($0.4 > 0.3$), receiving the additional $1\text{¢} \implies \$3.34$.
   - Ben Cole receives $\$3.33$.
   - Dana Fox receives $\$3.33$.
   - **Total allocated**: $\$3.33 + \$3.33 + \$3.34 = \$10.00$ exactly!
4. **Tie-Breaking Determinism**:
   If two writers have identical fractional remainders, ties are broken deterministically by larger registered share percentage, followed by original catalog index in `splits.json`.

---

## 🔄 The Duplicate Rule

### Decision: Aggregate (Add Together)

In music publishing statements, it is common for a single royalty statement to contain duplicate entries for the same `work_id` (e.g., separate earnings from streaming, sync licenses, radio broadcasts, or international territories).

**Implemented Rule**:
1. When multiple valid rows contain the same `work_id`, Monetunes **adds their earnings together** in exact integer cents into a consolidated work balance.
2. The latest non-empty song title provided in the statement is retained (falling back to the catalog title in `splits.json`).
3. Writer shares and largest remainder rounding are calculated on the **consolidated work total**, preventing artificial rounding drift across fragmented micropayments.
4. Total input rows processed (`lines`) and matched line counts (`matchedLines`) reflect all incoming statement rows, providing full visibility and auditable accounting.

---

## 🛡️ Reconciliation Invariant & Error Handling

- **Reconciliation Invariant**:
  $$\text{fileTotal} = \text{allocatedTotal} + \text{unmatchedTotal}$$
  This invariant is mathematically guaranteed and displayed with a visible green confirmation indicator on the dashboard.
- **Unmatched Repertoire**:
  Works not registered in `splits.json` appear in `shares.csv` with writer set to `UNMATCHED`, an empty `share_percent`, and full earnings preserved.
- **Non-Fatal Bad Rows**:
  Missing work IDs, negative values, and non-numeric amounts are recorded in an `errors` list with row numbers and explanatory guidance, while valid rows continue processing.
- **File Validation**:
  Files without valid headers (`work_id,title,amount`), malformed CSV structures, non-CSV formats, or files over 5 MB are rejected with HTTP 400 and user-friendly remediation messages.
- **Seed Validation at Startup**:
  At backend launch, `splits.json` is validated. If any registered work's writer shares do not total exactly 100%, the server halts immediately with an explicit error.

---

## 🏗️ Code Architecture

The backend strictly separates CSV parsing, pure mathematical calculation, and HTTP routing:

```
Monetunes/
├── backend/
│   ├── data/
│   │   ├── splits.json               # Seed catalog loaded at startup
│   │   └── sample_statement.csv      # Sample royalty statement
│   ├── models.py                     # Pydantic schemas & data models
│   ├── parser.py                     # CSV parsing & row validation
│   ├── calculator.py                 # PURE function for exact cent splits (Decimal)
│   ├── pdf_generator.py              # ReportLab vector PDF generator
│   ├── main.py                       # FastAPI application & production static mounting
│   ├── requirements.txt              # Python dependencies
│   └── tests/
│       ├── test_calculator.py        # Pytest calculation unit tests
│       └── test_api.py               # FastAPI TestClient integration tests
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.jsx        # Drag-and-drop file upload & sample preload
│   │   │   ├── ReconciliationBanner.jsx # Visual accounting reconciliation check
│   │   │   ├── SummaryCards.jsx      # High-level metric cards
│   │   │   ├── WriterTotalsTable.jsx # Writer totals with PDF download buttons
│   │   │   ├── LineBreakdownTable.jsx# Per-work breakdown with search & filters
│   │   │   ├── ErrorPanel.jsx        # Non-fatal row-level error reporting
│   │   │   └── SeedSplitsModal.jsx   # Live view of active seed catalog
│   │   ├── App.jsx                   # Main stateful coordinator (Upload/Result/Error)
│   │   ├── main.jsx                  # React DOM mount
│   │   └── index.css                 # Tailwind typography, theme & scrollbars
│   ├── index.html                    # Single-page HTML entry
│   ├── vite.config.js                # Vite build & proxy config
│   └── package.json                  # Frontend dependencies
├── render.yaml                       # Automated Render cloud deployment
├── package.json                      # Root orchestration scripts
└── README.md
```

---

## 🔮 What I Would Add Next

1. **Persistent Database Layer (PostgreSQL & Prisma / Supabase)**:
   - Store statement history, upload archives, and audit logs.
   - Maintain catalog versioning over time (track ownership changes and effective transfer dates).
2. **Multi-Currency & Exchange Rate Handling**:
   - Parse international royalty statements with distinct currency codes (EUR, GBP, JPY) and automatically apply ECB or central bank spot exchange rates with realized FX variance tracking.
3. **Advanced Writer Recoupment & Advances Management**:
   - Deduct unrecouped songwriter advances and admin fees prior to distribution payouts.
4. **Automated PDF Royalty Statements**:
   - Generate printable, formatted songwriter payout statements and 1099 tax summaries for each individual writer.
5. **Direct DSP & Distributor Ingestion**:
   - Direct API connectors for Spotify for Artists, Apple Music, DistroKid, TuneCore, and ASCAP/BMI statement formats.
6. **Role-Based Access Control (RBAC)**:
   - Provide multi-tenant roles for Administrators, Catalog Managers, and Songwriters with view-only writer portals.

