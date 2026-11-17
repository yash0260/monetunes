import React from 'react';
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ReconciliationBanner = ({ fileTotal, allocatedTotal, unmatchedTotal }) => {
  const fileCents      = Math.round(parseFloat(fileTotal)      * 100);
  const allocatedCents = Math.round(parseFloat(allocatedTotal) * 100);
  const unmatchedCents = Math.round(parseFloat(unmatchedTotal) * 100);
  const ok = fileCents === allocatedCents + unmatchedCents;

  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{
        background: ok ? 'rgba(34,197,94,0.05)' : 'rgba(232,25,44,0.05)',
        border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(232,25,44,0.3)'}`,
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: ok ? 'rgba(34,197,94,0.12)' : 'var(--red-muted)' }}
          >
            {ok
              ? <CheckCircle2 className="w-5 h-5" style={{ color: '#22c55e' }} />
              : <AlertTriangle className="w-5 h-5" style={{ color: 'var(--red)' }} />
            }
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-white">
                {ok ? 'Reconciliation Verified' : 'Reconciliation Discrepancy'}
              </h3>
              <span
                className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
                style={{
                  background: ok ? 'rgba(34,197,94,0.12)' : 'var(--red-muted)',
                  color: ok ? '#22c55e' : 'var(--red)',
                  border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(232,25,44,0.3)'}`,
                }}
              >
                {ok ? '100% Balanced' : 'Check Required'}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Invariant:{' '}
              <span className="font-mono font-semibold text-white" style={{ fontFamily: 'var(--font-mono)' }}>${fileTotal}</span>
              {' '}={' '}
              <span className="font-mono font-semibold" style={{ color: '#22c55e', fontFamily: 'var(--font-mono)' }}>${allocatedTotal}</span>
              {' '}+{' '}
              <span className="font-mono font-semibold" style={{ color: '#eab308', fontFamily: 'var(--font-mono)' }}>${unmatchedTotal}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium self-end sm:self-center shrink-0" style={{ color: '#22c55e', opacity: 0.8 }}>
          <ShieldCheck className="w-4 h-4" />
          Zero penny drift
        </div>
      </div>
    </div>
  );
};
