import React from 'react';
import { DollarSign, Layers, CheckCheck, HelpCircle } from 'lucide-react';

export const SummaryCards = ({ fileTotal, allocatedTotal, unmatchedTotal, lines, matchedLines }) => {
  const cards = [
    {
      title: 'Statement Total',
      amount: `$${fileTotal}`,
      sub: `${lines} valid ${lines === 1 ? 'row' : 'rows'}`,
      icon: DollarSign,
      iconBg: 'var(--red-muted)',
      iconColor: 'var(--red)',
      valueBorder: 'rgba(232,25,44,0.2)',
      badge: 'File Total',
    },
    {
      title: 'Allocated to Writers',
      amount: `$${allocatedTotal}`,
      sub: `${matchedLines} matched ${matchedLines === 1 ? 'line' : 'lines'}`,
      icon: CheckCheck,
      iconBg: 'rgba(34,197,94,0.1)',
      iconColor: '#22c55e',
      valueBorder: 'rgba(34,197,94,0.15)',
      badge: 'Split Out',
    },
    {
      title: 'Unmatched Works',
      amount: `$${unmatchedTotal}`,
      sub: `${lines - matchedLines} unlinked ${lines - matchedLines === 1 ? 'work' : 'works'}`,
      icon: HelpCircle,
      iconBg: 'rgba(234,179,8,0.1)',
      iconColor: '#eab308',
      valueBorder: 'rgba(234,179,8,0.15)',
      badge: 'Held',
    },
    {
      title: 'Statement Lines',
      amount: `${lines}`,
      sub: `${matchedLines} matched · ${lines - matchedLines} unmatched`,
      icon: Layers,
      iconBg: 'rgba(255,255,255,0.06)',
      iconColor: 'var(--text-secondary)',
      valueBorder: 'var(--border)',
      badge: 'Line Count',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, amount, sub, icon: Icon, iconBg, iconColor, valueBorder, badge }, i) => (
        <div
          key={i}
          className="card p-5 transition-transform hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {title}
            </span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
          </div>

          <div className="flex items-end justify-between gap-2">
            <span
              className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums text-white"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {amount}
            </span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full font-semibold shrink-0 mb-0.5"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: `1px solid ${valueBorder}`,
              }}
            >
              {badge}
            </span>
          </div>

          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>
        </div>
      ))}
    </div>
  );
};
