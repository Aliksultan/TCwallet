'use client'

import { useApp } from '@/lib/app-context'
import { useEffect, useState, useCallback } from 'react'
import { ArrowUpRight, ArrowDownLeft, RotateCcw, SlidersHorizontal, ChevronDown } from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  type: string
  activity: string | null
  reason: string | null
  created_at: string
  actor?: { display_name: string; role: string } | null
}

interface WalletData {
  balance: number
  transactions: Transaction[]
}

const TX_ICONS: Record<string, string> = {
  EARN: '🎯',
  SPENT: '🛍️',
  REMOVED: '⬇️',
  REFUND: '↩️',
  ADJUSTMENT: '⚙️',
  CORRECTION: '🔧',
}

const TX_COLORS: Record<string, string> = {
  EARN: 'var(--accent-green)',
  SPENT: 'var(--accent-red)',
  REMOVED: 'var(--accent-orange)',
  REFUND: '#A78BFA',
  ADJUSTMENT: 'var(--accent-gold)',
  CORRECTION: 'var(--accent-gold)',
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function groupByDate(transactions: Transaction[]) {
  const groups: Record<string, Transaction[]> = {}
  for (const tx of transactions) {
    const key = new Date(tx.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(tx)
  }
  return groups
}

export function WalletView() {
  const { user, t } = useApp()
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null)

  const fetchWallet = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await fetch(`/api/wallet?userId=${user.id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchWallet() }, [fetchWallet])

  const filters = [
    { key: 'ALL', label: t('wallet.filter_all') },
    { key: 'EARN', label: t('wallet.filter_earned') },
    { key: 'SPENT', label: t('wallet.filter_spent') },
    { key: 'REMOVED', label: t('wallet.filter_removed') },
    { key: 'REFUND', label: t('wallet.filter_refund') },
    { key: 'ADJUSTMENT', label: t('wallet.filter_adjustment') },
  ]

  const filteredTxs = data?.transactions.filter((tx) =>
    filter === 'ALL' ? true : tx.type === filter
  ) ?? []

  const grouped = groupByDate(filteredTxs)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <p className="page-subtitle" style={{ marginBottom: 2 }}>
          {t('common.app_name')}
        </p>
        <h1 className="page-title">{t('wallet.title')}</h1>
      </div>

      {/* Balance Card */}
      <div className="balance-card" style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.6)', marginBottom: 8, fontWeight: 500 }}>
          {t('wallet.balance_title')}
        </div>
        {loading ? (
          <div className="skeleton" style={{ height: 52, width: '60%', marginBottom: 8 }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 52, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>
              {(data?.balance ?? 0).toLocaleString()}
            </span>
            <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--accent-gold)' }}>TC</span>
          </div>
        )}
        <div style={{ fontSize: 13, color: 'rgba(240,244,255,0.45)' }}>
          @{user?.username || user?.display_name}
        </div>

        {/* Mini stats */}
        {data && !loading && (
          <div style={{ display: 'flex', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { icon: <ArrowUpRight size={14} />, label: t('wallet.filter_earned'), color: 'var(--accent-green)',
                value: data.transactions.filter(t => ['EARN','REFUND','ADJUSTMENT'].includes(t.type) && t.amount > 0).reduce((s,tx) => s + tx.amount, 0) },
              { icon: <ArrowDownLeft size={14} />, label: t('wallet.filter_spent'), color: 'var(--accent-red)',
                value: data.transactions.filter(t => ['SPENT','REMOVED'].includes(t.type)).reduce((s,tx) => s + Math.abs(tx.amount), 0) },
            ].map((stat) => (
              <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: stat.color }}>
                    {stat.value.toLocaleString()} TC
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(240,244,255,0.45)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="section-header">
        <span className="section-title">{t('wallet.history_title')}</span>
        <button className="btn-icon" onClick={fetchWallet} aria-label="Refresh">
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Filters */}
      <div className="filter-chips" style={{ marginBottom: 12 }}>
        {filters.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: 68, borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : filteredTxs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-text">{t('wallet.empty_history')}</div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '4px 0', overflow: 'hidden' }}>
          {Object.entries(grouped).map(([date, txs]) => (
            <div key={date}>
              <div style={{ padding: '10px 16px 4px', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {date}
              </div>
              {txs.map((tx, idx) => (
                <div key={tx.id}>
                  <div className="tx-row" onClick={() => setSelectedTx(tx)} role="button" tabIndex={0}>
                    <div className="tx-icon" style={{ background: `${TX_COLORS[tx.type]}18`, fontSize: 18 }}>
                      {TX_ICONS[tx.type] || '◈'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{t(`tx_types.${tx.type}`)}</span>
                        <span className={`pill pill-${tx.type.toLowerCase()}`} style={{ marginLeft: 8 }}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount} TC
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {tx.activity && <span style={{ marginRight: 6 }}>📌 {tx.activity}</span>}
                        {tx.reason && <span>{tx.reason}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {formatDate(tx.created_at)}
                      </div>
                    </div>
                    <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0, transform: 'rotate(-90deg)' }} />
                  </div>
                  {idx < txs.length - 1 && <div className="divider" style={{ margin: '0 16px' }} />}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div className="tx-icon" style={{ background: `${TX_COLORS[selectedTx.type]}18`, width: 48, height: 48, fontSize: 22 }}>
                {TX_ICONS[selectedTx.type]}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{t(`tx_types.${selectedTx.type}`)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(selectedTx.created_at)}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 28, fontWeight: 800, color: TX_COLORS[selectedTx.type] }}>
                {selectedTx.amount > 0 ? '+' : ''}{selectedTx.amount}
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent-gold)', marginLeft: 4 }}>TC</span>
              </div>
            </div>

            {[
              { label: 'ID', value: selectedTx.id.slice(0, 12) + '...' },
              { label: 'Тип', value: t(`tx_types.${selectedTx.type}`) },
              { label: 'Активность', value: selectedTx.activity || '—' },
              { label: 'Причина', value: selectedTx.reason || '—' },
              { label: 'От кого', value: selectedTx.actor?.display_name || 'System' },
              { label: 'Дата', value: formatDate(selectedTx.created_at) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}

            <button className="btn-secondary" style={{ marginTop: 20 }} onClick={() => setSelectedTx(null)}>
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
