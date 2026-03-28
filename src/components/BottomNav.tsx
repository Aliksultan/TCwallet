'use client'

import { useApp } from '@/lib/app-context'
import { Wallet, ShoppingBag, User, Shield } from 'lucide-react'

type Tab = 'wallet' | 'market' | 'profile' | 'admin'

interface BottomNavProps {
  active: Tab
  onChange: (tab: Tab) => void
  showAdmin: boolean
}

export function BottomNav({ active, onChange, showAdmin }: BottomNavProps) {
  const { t, user } = useApp()

  const getAdminLabel = () => {
    if (user?.role === 'SUPER_ADMIN') return t('admin.dashboard')
    return t('nav.admin')
  }

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      <button
        id="nav-wallet"
        className={`nav-item ${active === 'wallet' ? 'active' : ''}`}
        onClick={() => onChange('wallet')}
        aria-label={t('nav.wallet')}
      >
        <Wallet size={20} strokeWidth={active === 'wallet' ? 2.5 : 1.8} />
        <span>{t('nav.wallet')}</span>
      </button>

      <button
        id="nav-market"
        className={`nav-item ${active === 'market' ? 'active' : ''}`}
        onClick={() => onChange('market')}
        aria-label={t('nav.market')}
      >
        <ShoppingBag size={20} strokeWidth={active === 'market' ? 2.5 : 1.8} />
        <span>{t('nav.market')}</span>
      </button>

      <button
        id="nav-profile"
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => onChange('profile')}
        aria-label={t('nav.profile')}
      >
        <User size={20} strokeWidth={active === 'profile' ? 2.5 : 1.8} />
        <span>{t('nav.profile')}</span>
      </button>

      {showAdmin && (
        <button
          id="nav-admin"
          className={`nav-item ${active === 'admin' ? 'active' : ''}`}
          onClick={() => onChange('admin')}
          aria-label={getAdminLabel()}
        >
          <Shield size={20} strokeWidth={active === 'admin' ? 2.5 : 1.8} />
          <span>{getAdminLabel()}</span>
        </button>
      )}
    </nav>
  )
}
