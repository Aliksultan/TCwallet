'use client'

import { useApp } from '@/lib/app-context'
import { WalletView } from '@/components/WalletView'
import { MarketView } from '@/components/MarketView'
import { ProfileView } from '@/components/ProfileView'
import { OrganiserView } from '@/components/OrganiserView'
import { ManagerView } from '@/components/ManagerView'
import { AdminView } from '@/components/AdminView'
import { BottomNav } from '@/components/BottomNav'
import { useState, useEffect } from 'react'

type Tab = 'wallet' | 'market' | 'profile' | 'admin'

export default function Home() {
  // @ts-ignore
  const { user, isLoading, t, authError } = useApp()
  const [activeTab, setActiveTab] = useState<Tab>('wallet')

  useEffect(() => {
    // Reset to wallet when role changes
    setActiveTab('wallet')
  }, [user?.role])

  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 16
      }}>
        <div style={{ fontSize: 40 }}>◈</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t('common.loading')}</div>
      </div>
    )
  }

  if (authError && user === null) {
    return (
      <div style={{ padding: 20, textAlign: 'center', marginTop: 60 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <h2 style={{ fontSize: 18, marginBottom: 8 }}>Ошибка авторизации</h2>
        <p style={{ color: 'var(--accent-red)', fontSize: 13, background: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8 }}>
          {authError}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 16 }}>
          Попробуйте обновить ссылку в BotFather или перезапустить Mini App.
        </p>
      </div>
    )
  }

  const isAdmin = user?.role === 'SUPER_ADMIN'
  const isOrganiser = user?.role === 'ORGANISER'
  const isManager = user?.role === 'MANAGER'

  const showAdminTab = isAdmin || isOrganiser || isManager

  const renderContent = () => {
    switch (activeTab) {
      case 'wallet': return <WalletView />
      case 'market': return <MarketView />
      case 'profile': return <ProfileView />
      case 'admin':
        if (isAdmin) return <AdminView />
        if (isOrganiser) return <OrganiserView />
        if (isManager) return <ManagerView />
        return <WalletView />
      default: return <WalletView />
    }
  }

  return (
    <>
      {renderContent()}
      <BottomNav
        active={activeTab}
        onChange={setActiveTab}
        showAdmin={showAdminTab}
      />
    </>
  )
}
