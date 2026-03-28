'use client'

import { useApp } from '@/lib/app-context'
import { MOCK_USERS, MockRole } from '@/lib/mock-auth'
import { Globe, ChevronRight } from 'lucide-react'

const ROLE_BADGE_STYLE: Record<string, string> = {
  MEMBER: 'pill-earn',
  ORGANISER: 'pill-adjustment',
  MANAGER: 'pill-accepted',
  SUPER_ADMIN: 'pill-completed',
}

export function ProfileView() {
  const { user, lang, setLang, t, mockRole, setMockRole, isDev } = useApp()

  const initials = (user?.display_name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)

  const devRoles: { key: MockRole; label: string }[] = [
    { key: 'member', label: '👤 Member' },
    { key: 'organiser', label: '🎯 Organiser' },
    { key: 'manager', label: '🛍️ T-Market Manager' },
    { key: 'admin', label: '⚡ Super Admin' },
  ]

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 20 }}>{t('profile.title')}</h1>

      {/* Profile Card */}
      <div className="glass-card" style={{ padding: 20, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="avatar" style={{ width: 60, height: 60, fontSize: 22 }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{user?.display_name}</div>
          {user?.username && (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{user.username}</div>
          )}
          <div style={{ marginTop: 8 }}>
            <span className={`pill ${ROLE_BADGE_STYLE[user?.role || 'MEMBER']}`}>
              {t(`roles.${user?.role || 'MEMBER'}`)}
            </span>
          </div>
        </div>
      </div>

      {/* Language switcher */}
      <div className="section-header" style={{ marginBottom: 8 }}>
        <span className="section-title">{t('profile.language')}</span>
      </div>
      <div className="glass-card" style={{ marginBottom: 16 }}>
        {[
          { code: 'ru', label: t('profile.lang_ru'), flag: '🇷🇺' },
          { code: 'kk', label: t('profile.lang_kk'), flag: '🇰🇿' },
        ].map((l, idx) => (
          <div key={l.code}>
            <button
              id={`lang-${l.code}`}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                color: lang === l.code ? 'var(--accent-primary)' : 'var(--text-primary)',
                fontWeight: lang === l.code ? 600 : 400, fontFamily: 'inherit', fontSize: 15,
              }}
              onClick={() => setLang(l.code)}
            >
              <Globe size={18} style={{ color: 'var(--text-muted)' }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{l.flag} {l.label}</span>
              {lang === l.code && <span style={{ color: 'var(--accent-primary)', fontSize: 18 }}>✓</span>}
            </button>
            {idx === 0 && <div className="divider" style={{ margin: 0 }} />}
          </div>
        ))}
      </div>

      {/* Dev Role Switcher */}
      {isDev && (
        <>
          <div className="section-header" style={{ marginBottom: 8 }}>
            <span className="section-title" style={{ color: 'var(--accent-gold)' }}>
              🛠 {t('profile.dev_role_switch')}
            </span>
          </div>
          <div className="glass-card" style={{ marginBottom: 16, overflow: 'hidden', borderColor: 'rgba(245,200,66,0.20)' }}>
            {devRoles.map((r, idx) => (
              <div key={r.key}>
                <button
                  id={`dev-role-${r.key}`}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    color: mockRole === r.key ? 'var(--accent-gold)' : 'var(--text-primary)',
                    fontWeight: mockRole === r.key ? 600 : 400, fontFamily: 'inherit', fontSize: 15,
                  }}
                  onClick={() => setMockRole(r.key)}
                >
                  <span style={{ flex: 1, textAlign: 'left' }}>{r.label}</span>
                  {mockRole === r.key
                    ? <span style={{ color: 'var(--accent-gold)' }}>✓</span>
                    : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  }
                </button>
                {idx < devRoles.length - 1 && <div className="divider" style={{ margin: 0 }} />}
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: '10px 14px', borderColor: 'rgba(245,200,66,0.15)', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--accent-gold)', opacity: 0.7 }}>
              🔧 Dev Mode Active — Mock Auth Running. Switch roles above to test different user experiences.
            </div>
          </div>
        </>
      )}

      {/* App info */}
      <div className="glass-card" style={{ padding: '12px 16px', marginBottom: 80 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
          Tulga Community TC Wallet v1.0<br />
          © 2026 Tulga Community
        </div>
      </div>
    </div>
  )
}
