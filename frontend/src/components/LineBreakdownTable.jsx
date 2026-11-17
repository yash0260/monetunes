import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, Search, HelpCircle, X } from 'lucide-react';

export const LineBreakdownTable = ({ lines, fileTotal }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const unmatched = (lines || []).filter(l => l.status === 'UNMATCHED').length;
  const matched   = (lines || []).length - unmatched;

  const rows = useMemo(() => (lines || []).filter(item => {
    if (filter !== 'ALL' && item.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.work_id.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.writer.toLowerCase().includes(q);
  }), [lines, search, filter]);

  const filters = [
    { id: 'ALL',       label: `All (${(lines||[]).length})`,  activeBg: 'var(--bg-muted)', activeColor: '#fff',           activeBorder: 'var(--border-mid)' },
    { id: 'MATCHED',   label: `Matched (${matched})`,          activeBg: 'rgba(34,197,94,0.1)', activeColor: '#22c55e',  activeBorder: 'rgba(34,197,94,0.3)' },
    { id: 'UNMATCHED', label: `Unmatched (${unmatched})`,      activeBg: 'rgba(234,179,8,0.1)', activeColor: '#eab308',  activeBorder: 'rgba(234,179,8,0.3)' },
  ];

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 space-y-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <FileSpreadsheet className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-white">Statement Line Breakdown</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Exact writer share per work</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {filters.map(({ id, label, activeBg, activeColor, activeBorder }) => {
              const on = filter === id;
              return (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: on ? activeBg : 'transparent',
                    color: on ? activeColor : 'var(--text-muted)',
                    border: `1px solid ${on ? activeBorder : 'transparent'}`,
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Work ID, title, or writer…"
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl transition-all"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: '#fff', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'rgba(232,25,44,0.5)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="p-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No lines match your filter.</div>
      ) : (
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse text-sm min-w-[520px]">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['Work ID', 'Title', 'Writer', 'Share %', 'Amount'].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-widest ${i >= 3 ? 'text-right' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((item, idx) => {
                const isU = item.status === 'UNMATCHED';
                return (
                  <tr
                    key={`${item.work_id}-${item.writer}-${idx}`}
                    className="row-hover"
                    style={{ borderBottom: '1px solid rgba(42,42,42,0.5)', background: isU ? 'rgba(234,179,8,0.02)' : 'transparent' }}
                  >
                    <td className="py-3 px-4 text-xs font-semibold" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{item.work_id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white">{item.title}</span>
                        {isU && (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(234,179,8,0.1)', color: '#eab308', border: '1px solid rgba(234,179,8,0.25)' }}
                          >
                            <HelpCircle className="w-3 h-3" /> Unmatched
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isU ? (
                        <span className="text-xs px-2 py-0.5 rounded-lg font-mono" style={{ background: 'rgba(234,179,8,0.08)', color: '#eab308', fontFamily: 'var(--font-mono)' }}>UNMATCHED</span>
                      ) : (
                        <span className="font-medium text-white">{item.writer}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-xs tabular-nums" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {item.share_percent ? `${item.share_percent}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums" style={{ color: isU ? '#eab308' : '#fff', fontFamily: 'var(--font-mono)' }}>
                      ${item.amount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-mid)', background: 'var(--bg-elevated)' }}>
                <td colSpan={3} className="py-3 px-4 text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Total File Earnings</td>
                <td className="py-3 px-4 text-right font-mono text-xs" style={{ color: 'var(--text-muted)' }}>—</td>
                <td className="py-3 px-4 text-right font-mono font-black tabular-nums text-base" style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>${fileTotal}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
