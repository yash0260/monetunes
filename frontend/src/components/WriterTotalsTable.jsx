import React from 'react';
import { Users, Award, FileText } from 'lucide-react';

export const WriterTotalsTable = ({ statementId, writerTotals, allocatedTotal }) => {
  const totalNum = parseFloat(allocatedTotal) || 0;

  return (
    <div className="card h-full flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--red-muted)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Writer Royalty Totals</h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Highest to lowest</p>
          </div>
        </div>
        <span className="badge-mono">{writerTotals.length} {writerTotals.length === 1 ? 'Writer' : 'Writers'}</span>
      </div>

      {/* Table */}
      {writerTotals.length === 0 ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No writer royalties allocated.</div>
      ) : (
        <div className="w-full overflow-x-auto custom-scrollbar flex-1">
          <table className="w-full text-left border-collapse text-sm min-w-[360px]">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Writer', 'Pool %', 'Amount', 'PDF'].map((h, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={`py-3 px-3 text-xs font-semibold uppercase tracking-widest ${i === 2 || i === 3 ? 'text-right' : i === 4 ? 'text-center w-20' : i === 0 ? 'text-center w-10' : ''}`}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {writerTotals.map((item, idx) => {
                const pct = totalNum > 0 ? ((parseFloat(item.amount) / totalNum) * 100).toFixed(1) : '0.0';
                const pdfUrl = `/api/statements/${statementId}/writers/${encodeURIComponent(item.writer)}/statement.pdf`;
                const isTop = idx === 0;
                return (
                  <tr key={item.writer} className="row-hover" style={{ borderBottom: '1px solid rgba(42,42,42,0.6)' }}>
                    <td className="py-3 px-3 text-center text-xs font-mono" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {isTop ? <Award className="w-4 h-4 inline" style={{ color: 'var(--red)' }} /> : idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-white truncate max-w-[100px] sm:max-w-none">{item.writer}</span>
                        {isTop && <span className="badge-red text-[10px] px-1.5 py-0 shrink-0">#1</span>}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-xs tabular-nums" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pct}%</td>
                    <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-white" style={{ fontFamily: 'var(--font-mono)' }}>${item.amount}</td>
                    <td className="py-3 px-3 text-center">
                      <a
                        href={pdfUrl}
                        download={`${item.writer.replace(/\s+/g, '_')}_Statement.pdf`}
                        className="btn-ghost inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        style={{ textDecoration: 'none' }}
                      >
                        <FileText className="w-3 h-3" style={{ color: 'var(--red)' }} />
                        PDF
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-mid)', background: 'var(--bg-elevated)' }}>
                <td colSpan={2} className="py-3 px-3 text-xs uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>Total Allocated</td>
                <td className="py-3 px-3 text-right font-mono text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>100.0%</td>
                <td className="py-3 px-3 text-right font-mono font-black tabular-nums text-base" style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)' }}>${allocatedTotal}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
