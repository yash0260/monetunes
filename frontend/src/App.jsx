import React, { useState } from 'react';
import {
  Music2,
  Download,
  RotateCcw,
  Database,
  FileSpreadsheet,
  FileText,
  Zap,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { FileUpload } from './components/FileUpload.jsx';
import { SummaryCards } from './components/SummaryCards.jsx';
import { ReconciliationBanner } from './components/ReconciliationBanner.jsx';
import { WriterTotalsTable } from './components/WriterTotalsTable.jsx';
import { LineBreakdownTable } from './components/LineBreakdownTable.jsx';
import { ErrorPanel } from './components/ErrorPanel.jsx';
import { SeedSplitsModal } from './components/SeedSplitsModal.jsx';

export const App = () => {
  const [viewState, setViewState] = useState('UPLOAD');
  const [statementData, setStatementData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const handleUpload = async (file) => {
    setIsLoading(true);
    setServerError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/statements', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { const msg = data.error || 'Server rejected the file.'; setServerError(msg); throw new Error(msg); }
      const full = await fetch(`/api/statements/${data.id}`);
      if (!full.ok) throw new Error('Failed to retrieve breakdown.');
      setStatementData(await full.json());
      setViewState('RESULT');
    } catch (err) {
      if (!serverError) setServerError(err.message || 'Network error.');
      throw err;
    } finally { setIsLoading(false); }
  };

  const handleReset = () => { setViewState('UPLOAD'); setStatementData(null); setServerError(null); };
  const handleDownloadCsv = () => { if (statementData?.id) window.location.href = `/api/statements/${statementData.id}/shares.csv`; };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="spot-red" style={{ top: '-200px', left: '-150px' }} />
        <div className="spot-red" style={{ bottom: '-200px', right: '-150px', opacity: 0.6 }} />
        <div className="bg-dots absolute inset-0" />
      </div>

      {/* ── NAV ── */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(13,13,13,0.9)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleReset}
            className="flex items-center gap-3 group"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
              style={{ background: 'var(--red)' }}
            >
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">Monetunes</span>
                <span className="badge-red hidden sm:inline">Royalty Engine</span>
              </div>
              <p className="text-[11px] hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                Python FastAPI · Exact Cent Splits
              </p>
            </div>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSeedModalOpen(true)}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              <Database className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
              <span>Seed Catalog</span>
            </button>

            {viewState === 'RESULT' && (
              <button onClick={handleReset} className="btn-ghost px-3 py-1.5 text-xs">
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Statement</span>
                <span className="sm:hidden">Reset</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">

        {viewState === 'UPLOAD' ? (
          <div className="space-y-14">
            {/* Hero */}
            <div className="text-center space-y-6 max-w-2xl mx-auto">
              <div className="badge-red inline-block">
                ZERO PENNY DRIFT · LARGEST REMAINDER ALLOCATION
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] text-white">
                Royalty splits,{' '}
                <span style={{ color: 'var(--red)' }}>exact.</span>
              </h1>

              <p className="text-base sm:text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Upload a royalty statement CSV to calculate exact writer payouts
                based on registered work shares — to the cent, every time.
              </p>
            </div>

            {/* Upload widget */}
            <FileUpload
              onUpload={handleUpload}
              isLoading={isLoading}
              serverError={serverError}
              onClearError={() => setServerError(null)}
            />

            {/* Feature trio */}
            <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { icon: Zap,         title: 'Penny-Perfect Math',    desc: 'Python Decimal + Hare-Niemeyer algorithm. Statement totals always reconcile to zero drift.' },
                { icon: ShieldCheck, title: 'Unmatched Protection',  desc: 'Unrecognized Work IDs are flagged and preserved — no silent money loss.' },
                { icon: TrendingUp,  title: 'Non-Fatal Errors',      desc: 'Malformed rows are isolated and reported while the rest processes cleanly.' },
              ].map(({ icon: Icon, title, desc }, i) => (
                <div key={i} className="card p-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: 'var(--red-muted)' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: 'var(--red)' }} />
                  </div>
                  <h4 className="font-semibold text-sm text-white mb-1">{title}</h4>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

        ) : (
          statementData && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Result header */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-mid)' }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-mono text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ background: 'var(--red-muted)', color: 'var(--red)', border: '1px solid rgba(232,25,44,0.3)', fontFamily: 'var(--font-mono)' }}
                    >
                      Statement #{statementData.id}
                    </span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      {statementData.filename || 'statement.csv'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Calculation Results &amp; Payout Summary
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={handleDownloadCsv} className="btn-red px-4 py-2.5 text-sm rounded-xl">
                    <Download className="w-4 h-4" />
                    shares.csv
                  </button>
                  <a
                    href={`/api/statements/${statementData.id}/summary.pdf`}
                    download={`Statement_${statementData.id}_Master_Summary.pdf`}
                    className="btn-ghost px-4 py-2.5 text-sm rounded-xl"
                    style={{ textDecoration: 'none' }}
                  >
                    <FileText className="w-4 h-4" />
                    Summary PDF
                  </a>
                  <button onClick={handleReset} className="btn-ghost px-3 py-2.5 text-sm rounded-xl">
                    <RotateCcw className="w-3.5 h-3.5" />
                    New Statement
                  </button>
                </div>
              </div>

              <ReconciliationBanner
                fileTotal={statementData.fileTotal}
                allocatedTotal={statementData.allocatedTotal}
                unmatchedTotal={statementData.unmatchedTotal}
              />
              <SummaryCards
                fileTotal={statementData.fileTotal}
                allocatedTotal={statementData.allocatedTotal}
                unmatchedTotal={statementData.unmatchedTotal}
                lines={statementData.lines}
                matchedLines={statementData.matchedLines}
              />
              <ErrorPanel errors={statementData.errors} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <WriterTotalsTable
                    statementId={statementData.id}
                    writerTotals={statementData.writerTotals}
                    allocatedTotal={statementData.allocatedTotal}
                  />
                </div>
                <div className="lg:col-span-2">
                  <LineBreakdownTable
                    lines={statementData.lineBreakdown || []}
                    fileTotal={statementData.fileTotal}
                  />
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer
        className="relative z-10 py-6 mt-auto"
        style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'var(--red)' }}>
              <Music2 className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-white">Monetunes Royalty Engine</span>
            <span style={{ color: 'var(--text-muted)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>Integer Cent Precision</span>
          </div>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
            <span>Python FastAPI · Pydantic · Decimal</span>
            <span>·</span>
            <span>Hare-Niemeyer Rounding</span>
          </div>
        </div>
      </footer>

      <SeedSplitsModal isOpen={isSeedModalOpen} onClose={() => setIsSeedModalOpen(false)} />
    </div>
  );
};

export default App;
