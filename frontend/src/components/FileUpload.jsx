import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Download, AlertCircle, Loader2, CheckCircle, Sparkles, Info, X, ArrowRight } from 'lucide-react';

export const FileUpload = ({ onUpload, isLoading, serverError, onClearError }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState(null);
  const fileInputRef = useRef(null);

  const validate = (file) => {
    onClearError(); setLocalError(null);
    if (!file.name.toLowerCase().endsWith('.csv')) { setLocalError('Invalid file type: .csv only.'); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    if (file.size > 5 * 1024 * 1024) { setLocalError('File exceeds 5 MB limit.'); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; return; }
    setSelectedFile(file);
  };

  const handleDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
  const handleDrop      = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); if (e.dataTransfer.files?.length) validate(e.dataTransfer.files[0]); };
  const handleInput     = (e) => { if (e.target.files?.length) validate(e.target.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setLocalError('Please select a CSV file first.'); return; }
    try { await onUpload(selectedFile); }
    catch { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const loadSample = () => {
    onClearError(); setLocalError(null);
    const csv = `work_id,title,amount\nMNT000001,Midnight Drive,100.00\nMNT000002,Paper Moon,10.00\nMNT000003,Cold Harbour,10.00\nMNT999999,Unknown Song,5.00`;
    setSelectedFile(new File([new Blob([csv], { type: 'text/csv' })], 'sample_statement.csv', { type: 'text/csv' }));
  };

  const clear = () => { setSelectedFile(null); setLocalError(null); onClearError(); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const activeError = serverError || localError;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Error */}
      {activeError && (
        <div
          className="rounded-2xl p-4 flex items-start justify-between gap-3 animate-fade-in-up"
          style={{ background: 'rgba(232,25,44,0.06)', border: '1px solid rgba(232,25,44,0.3)' }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" style={{ color: 'var(--red)' }} />
            <div>
              <h4 className="font-semibold text-sm text-white">Upload Rejected</h4>
              <p className="text-xs mt-0.5" style={{ color: '#ff7a85' }}>{activeError}</p>
              <p className="text-xs mt-1 flex items-start gap-1" style={{ color: 'var(--text-muted)' }}>
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                Required CSV columns: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>work_id, title, amount</code>
              </p>
            </div>
          </div>
          <button onClick={() => { setLocalError(null); onClearError(); }} style={{ color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Card */}
      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl p-10 sm:p-14 text-center cursor-pointer border-2 border-dashed transition-all ${isDragOver ? 'animate-pulse-red' : ''}`}
            style={{
              borderColor: isDragOver ? 'var(--red)' : selectedFile ? '#22c55e55' : 'var(--border-mid)',
              background: isDragOver ? 'rgba(232,25,44,0.04)' : selectedFile ? 'rgba(34,197,94,0.03)' : 'var(--bg-elevated)',
              transform: isDragOver ? 'scale(1.01)' : 'scale(1)',
            }}
          >
            <input type="file" ref={fileInputRef} onChange={handleInput} accept=".csv" className="hidden" />

            <div className="flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all"
                style={{
                  background: selectedFile ? 'rgba(34,197,94,0.12)' : isDragOver ? 'var(--red-muted)' : 'var(--bg-muted)',
                  transform: isDragOver ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {selectedFile
                  ? <CheckCircle className="w-8 h-8" style={{ color: '#22c55e' }} />
                  : <UploadCloud className="w-8 h-8" style={{ color: isDragOver ? 'var(--red)' : 'var(--text-secondary)' }} />
                }
              </div>

              {selectedFile ? (
                <div>
                  <p className="font-semibold text-base" style={{ color: '#22c55e' }}>File Ready</p>
                  <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {selectedFile.name} · {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click to choose a different file</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-base text-white">
                    Drop your royalty CSV here, or{' '}
                    <span style={{ color: 'var(--red)', textDecoration: 'underline', textDecorationColor: 'rgba(232,25,44,0.4)' }}>browse</span>
                  </p>
                  <p className="text-xs mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Required columns: <span className="font-mono font-medium text-white" style={{ fontFamily: 'var(--font-mono)' }}>work_id, title, amount</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Max 5 MB · .csv only</p>
                </div>
              )}
            </div>
          </div>

          {/* File info row */}
          {selectedFile && (
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl animate-fade-in-up"
              style={{ background: 'var(--bg-elevated)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <div className="flex items-center gap-2 text-xs truncate">
                <FileText className="w-4 h-4 shrink-0" style={{ color: '#22c55e' }} />
                <span className="font-mono font-medium text-white truncate" style={{ fontFamily: 'var(--font-mono)' }}>{selectedFile.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>{(selectedFile.size / 1024).toFixed(1)} KB</span>
              </div>
              <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="submit" disabled={isLoading || !selectedFile} className="btn-red flex-1 py-3 px-6 rounded-xl text-sm">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Processing…</span></>
              ) : (
                <><UploadCloud className="w-4 h-4" /><span>Upload &amp; Calculate Splits</span>{selectedFile && <ArrowRight className="w-4 h-4" />}</>
              )}
            </button>

            <button
              type="button"
              onClick={loadSample}
              disabled={isLoading}
              className="btn-ghost px-5 py-3 rounded-xl text-sm"
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--red)' }} />
              <span>Load Sample CSV</span>
            </button>
          </div>
        </form>

        {/* Footer */}
        <div
          className="mt-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <span>Need a template? Download the official sample:</span>
          <a
            href="/api/sample.csv"
            download="statement.csv"
            className="inline-flex items-center gap-1.5 font-medium transition-colors"
            style={{ color: 'var(--red)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red-hover)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--red)'}
          >
            <Download className="w-3.5 h-3.5" />
            Download sample.csv
          </a>
        </div>
      </div>
    </div>
  );
};
