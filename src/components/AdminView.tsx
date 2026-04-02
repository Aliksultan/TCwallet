'use client'

import { useApp } from '@/lib/app-context'
import { useState, useEffect, useCallback } from 'react'
import { Search, ChevronRight } from 'lucide-react'
import { ManagerView } from './ManagerView'
import { OrganiserView } from './OrganiserView'

interface Analytics {
  totalUsers: number
  tcIssued: number
  tcSpent: number
  tcRefunded: number
  tcRemoved: number
  activityBreakdown: Record<string, number>
  orderStats: Record<string, number>
}

interface UserRow { id: string; display_name: string; username: string | null; role: string; balance: number }

const ROLES = ['MEMBER', 'ORGANISER', 'MANAGER', 'SUPER_ADMIN']

export function AdminView() {
  const { user, t } = useApp()
  const [tab, setTab] = useState<'dashboard' | 'users' | 'orders' | 'market' | 'issue'>('dashboard')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [orders, setOrders] = useState<Array<{id:string; status:string; created_at:string; user:{display_name:string}; product:{name:string; price:number}}>>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [userTxs, setUserTxs] = useState<Array<{id:string; amount:number; type:string; reason:string|null; created_at:string}>>([])
  const [userBalance, setUserBalance] = useState(0)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success'|'error' } | null>(null)
  const [userTxLoading, setUserTxLoading] = useState(false)

  const showToast = (msg: string, type: 'success'|'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch('/api/admin/analytics')
    if (res.ok) { const d = await res.json(); setAnalytics(d) }
  }, [])

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`/api/users?search=${search}`)
    if (res.ok) { const d = await res.json(); setUsers(d.users) }
  }, [search])

  const fetchOrders = useCallback(async () => {
    const res = await fetch('/api/orders?all=true')
    if (res.ok) { const d = await res.json(); setOrders(d.orders) }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchAnalytics(), fetchUsers(), fetchOrders()]).finally(() => setLoading(false))
  }, [fetchAnalytics, fetchUsers, fetchOrders])

  const openUser = async (u: UserRow) => {
    setSelectedUser(u)
    setUserTxLoading(true)
    const res = await fetch(`/api/users?id=${u.id}`)
    if (res.ok) { const d = await res.json(); setUserTxs(d.transactions); setUserBalance(d.balance) }
    setUserTxLoading(false)
  }

  const handleRoleChange = async (userId: string, role: string) => {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) { showToast('Роль обновлена', 'success'); fetchUsers() }
    else showToast(t('errors.generic'), 'error')
  }

  const handleAdjust = async () => {
    if (!selectedUser || !user) return
    const numAmount = parseInt(adjustAmount)
    if (!numAmount) return
    setAdjusting(true)
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: selectedUser.id,
        actor_id: user.id,
        amount: numAmount,
        type: 'CORRECTION',
        reason: adjustReason || 'Admin correction',
      }),
    })
    const json = await res.json()
    if (res.ok) {
      showToast('Баланс скорректирован', 'success')
      setUserBalance(json.newBalance)
      setAdjustAmount(''); setAdjustReason('')
      openUser(selectedUser)
    } else {
      showToast(json.error || t('errors.generic'), 'error')
    }
    setAdjusting(false)
  }

  const ROLE_COLORS: Record<string,string> = { MEMBER:'pill-earn', ORGANISER:'pill-adjustment', MANAGER:'pill-accepted', SUPER_ADMIN:'pill-completed' }

  const topActivities = analytics
    ? Object.entries(analytics.activityBreakdown).sort((a,b) => b[1]-a[1]).slice(0,5)
    : []

  return (
    <div className="page">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type==='success'?'✅':'❌'} {toast.msg}</div>}

      <h1 className="page-title">{t('admin.title')}</h1>
      <p className="page-subtitle" style={{ marginBottom: 16 }}>{t('common.app_name')}</p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {[
          ['dashboard', '📊 Панель'],
          ['users', '👥 Люди'],
          ['market', '🛍️ Маркет'],
          ['issue', '💸 Выдача'],
          ['orders', '📦 Заказы']
        ].map(([key, label]) => (
          <button key={key} className={`chip ${tab===key?'active':''}`} style={{ flexShrink: 0 }} onClick={() => setTab(key as typeof tab)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : tab === 'dashboard' ? (
        /* ── Analytics Dashboard ── */
        <>
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            {[
              { label: t('admin.stats_users'), value: analytics?.totalUsers ?? 0, color: 'var(--accent-primary)' },
              { label: t('admin.stats_tc_issued'), value: `${analytics?.tcIssued ?? 0} TC`, color: 'var(--accent-green)' },
              { label: t('admin.stats_tc_spent'), value: `${analytics?.tcSpent ?? 0} TC`, color: 'var(--accent-red)' },
              { label: t('admin.stats_tc_refunded'), value: `${analytics?.tcRefunded ?? 0} TC`, color: '#A78BFA' },
              { label: t('admin.stats_orders_pending'), value: analytics?.orderStats?.PENDING ?? 0, color: 'var(--accent-orange)' },
              { label: 'Завершено', value: analytics?.orderStats?.COMPLETED ?? 0, color: 'var(--accent-green)' },
            ].map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {topActivities.length > 0 && (
            <>
              <div className="section-title" style={{ marginBottom: 12 }}>Топ активности по TC</div>
              <div className="glass-card" style={{ padding: '4px 0', marginBottom: 16 }}>
                {topActivities.map(([activity, amount], idx) => (
                  <div key={activity}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', alignItems: 'center' }}>
                      <div style={{ fontSize: 14 }}>{idx+1}. {activity}</div>
                      <div className="coin-badge">{amount}</div>
                    </div>
                    {idx < topActivities.length-1 && <div className="divider" style={{ margin: 0 }} />}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-title" style={{ marginBottom: 12 }}>Статусы заказов</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(analytics?.orderStats || {}).map(([status, count]) => (
              <span key={status} className={`pill pill-${status.toLowerCase()}`}>{status}: {count}</span>
            ))}
          </div>
        </>
      ) : tab === 'users' ? (
        /* ── Users Management ── */
        <>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="input-glass" style={{ paddingLeft: 38 }} placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            {users.map((u, idx) => (
              <div key={u.id}>
                <button style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'inherit' }} onClick={() => openUser(u)}>
                  <div className="avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
                    {u.display_name.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {u.username && `@${u.username} · `}
                      <span className={`pill ${ROLE_COLORS[u.role]}`} style={{ fontSize: 10, padding: '2px 6px' }}>{t(`roles.${u.role}`)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div className="coin-badge">{u.balance}</div>
                    <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
                  </div>
                </button>
                {idx < users.length-1 && <div className="divider" style={{ margin: 0 }} />}
              </div>
            ))}
          </div>

          {/* User detail modal */}
          {selectedUser && (
            <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
              <div className="bottom-sheet" style={{ maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
                <div className="sheet-handle" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700 }}>{selectedUser.display_name}</div>
                    {selectedUser.username && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{selectedUser.username}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="coin-badge" style={{ fontSize: 20 }}>{userBalance} TC</div>
                  </div>
                </div>

                {/* Role change */}
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{t('admin.roles_title')}</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {ROLES.map((r) => (
                      <button key={r} className={`chip ${selectedUser.role === r ? 'active' : ''}`} onClick={() => handleRoleChange(selectedUser.id, r)}>
                        {t(`roles.${r}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Balance adjustment */}
                <div className="glass-card" style={{ padding: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{t('admin.adjust_balance')}</div>
                  <input className="input-glass" type="number" placeholder="±50" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} style={{ marginBottom: 8 }} />
                  <input className="input-glass" placeholder={t('admin.correction_reason')} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} style={{ marginBottom: 8 }} />
                  <button className="btn-primary" style={{ fontFamily: 'inherit' }} onClick={handleAdjust} disabled={adjusting || !adjustAmount}>
                    {adjusting ? '⏳...' : `⚙️ ${t('common.confirm')}`}
                  </button>
                </div>

                {/* Recent txs */}
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{t('admin.all_transactions')}</div>
                {userTxLoading ? (
                  <div className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <div className="glass-card" style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
                    {userTxs.slice(0,20).map((tx, idx) => (
                      <div key={tx.id}>
                        <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{t(`tx_types.${tx.type}`)}</div>
                            {tx.reason && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{tx.reason}</div>}
                          </div>
                          <span className={`pill pill-${tx.type.toLowerCase()}`} style={{ fontSize: 12 }}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount} TC
                          </span>
                        </div>
                        {idx < Math.min(userTxs.length,20)-1 && <div className="divider" style={{ margin: 0 }} />}
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn-secondary" style={{ marginTop: 16, fontFamily: 'inherit' }} onClick={() => setSelectedUser(null)}>
                  {t('common.close')}
                </button>
              </div>
            </div>
          )}
        </>
      ) : tab === 'orders' ? (
        /* ── All Orders ── */
        <div className="glass-card" style={{ overflow: 'hidden' }}>
          {orders.length === 0
            ? <div className="empty-state"><div className="empty-state-text">Нет заказов</div></div>
            : orders.map((o, idx) => (
              <div key={o.id}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{o.product.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.user.display_name}</div>
                    <div className="coin-badge" style={{ fontSize: 13, marginTop: 2 }}>{o.product.price}</div>
                  </div>
                  <span className={`pill pill-${o.status.toLowerCase()}`}>{o.status}</span>
                </div>
                {idx < orders.length-1 && <div className="divider" style={{ margin: 0 }} />}
              </div>
            ))
          }
        </div>
      ) : tab === 'market' ? (
        <ManagerView isEmbedded />
      ) : tab === 'issue' ? (
        <OrganiserView isEmbedded />
      ) : null}
    </div>
  )
}
