import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, AlertOctagon, HelpCircle } from 'lucide-react';

export const ErrorPanel = ({ errors }) => {
  const [open, setOpen] = useState(true);
  if (!errors?.length) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(232,25,44,0.04)', border: '1px solid rgba(232,25,44,0.2)' }}>
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--red-muted)' }}>
            <AlertCircle className="w-4 h-4" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-white">Row Errors Detected ({errors.length})</h3>
              <span className="badge-red text-[10px]">Non-fatal</span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              These rows were skipped — valid rows were processed normally.
            </p>
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--red)' }}>
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="p-4 sm:p-5 space-y-3" style={{ borderTop: '1px solid rgba(232,25,44,0.12)' }}>
          <div className="grid gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {errors.map((err, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl text-sm" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <span className="px-2 py-0.5 rounded-lg font-mono text-xs font-bold shrink-0" style={{ background: 'var(--red-muted)', color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>
                  Row {err.row}
                </span>
                <div>
                  <p className="font-medium text-white">{err.message}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <HelpCircle className="w-3 h-3 shrink-0" />
                    {fix(err.reason)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs pt-2" style={{ borderTop: '1px solid rgba(232,25,44,0.1)', color: 'var(--text-muted)' }}>
            <AlertOctagon className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--red)', opacity: 0.6 }} />
            Correct the values in your CSV and re-upload to include skipped rows.
          </div>
        </div>
      )}
    </div>
  );
};

function fix(reason) {
  const r = (reason || '').toLowerCase();
  if (r.includes('negative'))             return 'Ensure amount is positive (e.g. 25.00, not -25.00).';
  if (r.includes('not a number'))         return 'Provide a clean numeric amount without letters or symbols.';
  if (r.includes('missing work_id'))      return 'Provide a valid work identifier in the work_id column.';
  if (r.includes('missing'))             return 'Fill in the missing amount value for this row.';
  if (r.includes('more than 2 decimal')) return 'Format amounts to standard currency precision (2 decimal places max).';
  return 'Review the formatting of this row in the CSV file.';
}
