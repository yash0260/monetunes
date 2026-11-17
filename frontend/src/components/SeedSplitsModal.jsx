import React, { useEffect, useState } from 'react';
import { X, Database, Music2, AlertCircle } from 'lucide-react';

export const SeedSplitsModal = ({ isOpen, onClose }) => {
  const [works, setWorks]   = useState([]);
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoad(true);
    fetch('/api/splits')
      .then(r => { if (!r.ok) throw new Error('Failed to load seed splits'); return r.json(); })
      .then(d => { setWorks(d); setLoad(false); })
      .catch(e => { setError(e.message); setLoad(false); });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card relative w-full max-w-2xl rounded-2xl max-h-[85vh] flex flex-col animate-fade-in-up"
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
      >
        {/* Header */}
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-muted)' }}>
              <Database className="w-4 h-4" style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Seed Catalog</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Loaded at startup from{' '}
                <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--red)' }}>splits.json</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {loading ? (
            <div className="py-12 text-center" style={{ color: 'var(--text-muted)' }}>
              <div
                className="w-8 h-8 rounded-full border-2 mx-auto mb-3 animate-spin"
                style={{ borderColor: 'rgba(232,25,44,0.2)', borderTopColor: 'var(--red)' }}
              />
              <span className="text-sm">Loading seed catalog…</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl flex items-center gap-2 text-sm" style={{ background: 'var(--red-muted)', border: '1px solid rgba(232,25,44,0.3)', color: '#ff7a85' }}>
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          ) : (
            works.map(work => {
              const total = (work.writers || []).reduce((s, w) => s + w.share, 0);
              return (
                <div key={work.workId} className="p-4 rounded-xl space-y-3" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Music2 className="w-4 h-4 shrink-0" style={{ color: 'var(--red)' }} />
                      <span className="font-semibold text-white">{work.title}</span>
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: 'var(--bg-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)' }}
                      >
                        {work.workId}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold" style={{ color: '#22c55e', fontFamily: 'var(--font-mono)' }}>
                      {total.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                    {(work.writers || []).map((w, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                        <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>{w.name}</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>{w.share.toFixed(2)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 flex justify-end" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
          <button onClick={onClose} className="btn-red px-5 py-2 rounded-xl text-xs">Close</button>
        </div>
      </div>
    </div>
  );
};
