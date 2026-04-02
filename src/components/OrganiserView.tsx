'use client'

import { useApp } from '@/lib/app-context'
import { useState, useEffect, useCallback } from 'react'
import { Search } from 'lucide-react'

const ACTIVITIES = [
  'Reading Club', 'Kemenger Games', 'Paper Talqy', 'Tulga Talks',
  'Halyq Aldynda', 'Qonaqta Tulga', 'Chess League', 'FIFA 26 League',
  'UFC 5 League', 'KINO TIME', 'General'
]

interface Member { id: string; display_name: string; username: string | null; balance: number }
interface Template { id: string; name: string; amount: number; activity: string | null }

export function OrganiserView({ isEmbedded }: { isEmbedded?: boolean }) {
  const { user, t } = useApp()
  const [members, setMembers] = useState<Member[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Member | null>(null)
  const [mode, setMode] = useState<'give' | 'remove'>('give')
  const [useTemplate, setUseTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [activity, setActivity] = useState(ACTIVITIES[0])
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchMembers = useCallback(async () => {
    const res = await fetch(`/api/users?search=${search}`)
    if (res.ok) { const d = await res.json(); setMembers(d.users.filter((u: Member & { role: string }) => u.id !== user?.id)) }
  }, [search, user])

  const fetchTemplates = useCallback(async () => {
    try {
      // return hardcoded templates for now (could be stored in DB)
      setTemplates([
        { id: '1', name: t('organiser.templates_title') + ' — Посещаемость', amount: 20, activity: 'General' },
        { id: '2', name: 'Участие', amount: 30, activity: null },
        { id: '3', name: '1-е место', amount: 100, activity: null },
        { id: '4', name: '2-е место', amount: 70, activity: null },
        { id: '5', name: '3-е место', amount: 50, activity: null },
        { id: '6', name: 'Спикер', amount: 60, activity: 'Tulga Talks' },
        { id: '7', name: 'Волонтёр', amount: 40, activity: 'General' },
        { id: '8', name: 'Победитель', amount: 100, activity: null },
      ])
    } catch {}
  }, [t])

  useEffect(() => { fetchMembers() }, [fetchMembers])
  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const handleTemplateSelect = (tmpl: Template) => {
    setSelectedTemplate(tmpl)
    setAmount(String(tmpl.amount))
    if (tmpl.activity) setActivity(tmpl.activity)
    setReason(tmpl.name)
  }

  const handleSubmit = async () => {
    if (!selected || !user) return
    const numAmount = parseInt(amount)
    if (!numAmount || numAmount <= 0) { showToast(t('organiser.error_zero'), 'error'); return }

    const finalAmount = mode === 'give' ? numAmount : -numAmount
    setSubmitting(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selected.id,
          actor_id: user.id,
          amount: finalAmount,
          type: mode === 'give' ? 'EARN' : 'REMOVED',
          activity,
          reason,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error === 'Insufficient balance' ? t('organiser.error_insufficient') : (json.error || t('errors.generic')), 'error')
      } else {
        showToast(mode === 'give' ? t('organiser.success_give') : t('organiser.success_remove'), 'success')
        setSelected(null); setAmount(''); setReason(''); setSelectedTemplate(null)
        fetchMembers()
      }
    } catch {
      showToast(t('errors.network'), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const content = (
    <>
      {toast && <div className={`toast toast-${toast.type}`}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}

      {!isEmbedded && (
        <>
          <h1 className="page-title">{t('organiser.title')}</h1>
          <p className="page-subtitle" style={{ marginBottom: 20 }}>{t('common.app_name')}</p>
        </>
      )}

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button id="mode-give" className={`chip ${mode === 'give' ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center' }} onClick={() => setMode('give')}>
          ➕ {t('organiser.give_coins')}
        </button>
        <button id="mode-remove" className={`chip ${mode === 'remove' ? 'active' : ''}`} style={{ flex: 1, textAlign: 'center' }} onClick={() => setMode('remove')}>
          ➖ {t('organiser.remove_coins')}
        </button>
      </div>

      {/* Member search */}
      <div className="section-header" style={{ marginBottom: 8 }}>
        <span className="section-title">{t('organiser.select_member')}</span>
      </div>
      <div style={{ position: 'relative', marginBottom: 10 }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input className="input-glass" style={{ paddingLeft: 38 }} placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {selected ? (
        <div className="glass-card" style={{ padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'rgba(79,142,247,0.30)' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{selected.display_name}</div>
            {selected.username && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{selected.username}</div>}
            <div className="coin-badge" style={{ fontSize: 13, marginTop: 4 }}>{selected.balance} TC</div>
          </div>
          <button className="btn-secondary" style={{ width: 'auto', padding: '8px 14px', fontSize: 13 }} onClick={() => setSelected(null)}>
            {t('common.cancel')}
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: 16, overflow: 'hidden', maxHeight: 240, overflowY: 'auto' }}>
          {members.length === 0
            ? <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 14, textAlign: 'center' }}>Нет участников</div>
            : members.map((m, idx) => (
                <div key={m.id}>
                  <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontFamily: 'inherit' }} onClick={() => setSelected(m)}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{m.display_name}</div>
                      {m.username && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{m.username}</div>}
                    </div>
                    <div className="coin-badge" style={{ fontSize: 14 }}>{m.balance}</div>
                  </button>
                  {idx < members.length - 1 && <div className="divider" style={{ margin: 0 }} />}
                </div>
              ))}
        </div>
      )}

      {selected && (
        <>
          {/* Templates */}
          <div className="section-header" style={{ marginBottom: 8 }}>
            <span className="section-title">{t('organiser.select_template')}</span>
            <button className={`chip ${useTemplate ? 'active' : ''}`} onClick={() => setUseTemplate(!useTemplate)}>
              {useTemplate ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          {useTemplate && (
            <div className="filter-chips" style={{ flexWrap: 'wrap', marginBottom: 16 }}>
              {templates.map((tmpl) => (
                <button key={tmpl.id} className={`chip ${selectedTemplate?.id === tmpl.id ? 'active' : ''}`} onClick={() => handleTemplateSelect(tmpl)}>
                  {tmpl.name} (+{tmpl.amount})
                </button>
              ))}
            </div>
          )}

          {/* Activity */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{t('organiser.select_activity')}</label>
            <select className="input-glass" value={activity} onChange={(e) => setActivity(e.target.value)}>
              {ACTIVITIES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Amount */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{t('organiser.amount_label')}</label>
            <input
              className="input-glass"
              type="number"
              min="1"
              placeholder="50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Reason */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{t('organiser.reason_label')}</label>
            <textarea className="input-glass" placeholder={t('organiser.reason_placeholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <button
            id="btn-submit-tx"
            className={mode === 'give' ? 'btn-primary' : 'btn-danger'}
            style={{ borderRadius: 'var(--radius-full)', padding: '14px 24px', width: '100%', fontFamily: 'inherit' }}
            onClick={handleSubmit}
            disabled={submitting || !amount}
          >
            {submitting ? '⏳...' : (mode === 'give'
              ? `✅ ${t('organiser.submit_give')} ${amount || '?'} TC → ${selected.display_name}`
              : `❌ ${t('organiser.submit_remove')} ${amount || '?'} TC ← ${selected.display_name}`
            )}
          </button>
        </>
      )}
    </>
  )

  if (isEmbedded) return content
  return <div className="page">{content}</div>
}
