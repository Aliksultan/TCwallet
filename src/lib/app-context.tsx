'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslations, Translations, t as translateFn } from '@/lib/i18n'
import { MOCK_USERS, MockRole } from '@/lib/mock-auth'

interface User {
  id: string
  telegram_id: string
  username?: string | null
  display_name: string
  role: string
  language: string
}

interface AppContextValue {
  user: User | null
  lang: string
  translations: Translations
  setLang: (lang: string) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  mockRole: MockRole
  setMockRole: (role: MockRole) => void
  isLoading: boolean
  isDev: boolean
  authError?: string | null
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mockRole, setMockRoleState] = useState<MockRole>('member')
  const [lang, setLangState] = useState('ru')
  const [isLoading, setIsLoading] = useState(true)
  const [isWebApp, setIsWebApp] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  const [realUser, setRealUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  // Use real user if inside Telegram, otherwise use mock user
  const user: User | null = isWebApp
    ? realUser
    : { ...MOCK_USERS[mockRole], language: lang }

  useEffect(() => {
    async function initAuth() {
      console.log('[Auth] initAuth started')
      // Fallback: forcefully remove loading screen after 3.5s no matter what
      const safetyTimeout = setTimeout(() => {
        console.log('[Auth] Safety timeout triggered, forcefully un-loading')
        setIsLoading(false)
      }, 3500)

      try {
        const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null
        const initData = tg?.initData || ''

        if (initData) {
          console.log('[Auth] Telegram WebApp detected, fetching real auth...')
          setIsWebApp(true)
          if (tg) {
            try { tg.ready() } catch (e) { console.error('tg.ready() err:', e) }
            try { tg.expand() } catch (e) { console.error('tg.expand() err:', e) }
          }

          const res = await fetch('/api/auth/telegram', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true' // bypass ngrok warning screens
            },
            body: JSON.stringify({ initData })
          })

          console.log('[Auth] fetch completed, status:', res.status)

          const data = await res.json()
          if (data.user) {
            console.log('[Auth] real user loaded successfully')
            setRealUser(data.user)
            if (data.user.language) setLangState(data.user.language)
          } else {
            console.error('[Auth Error]', data.error)
            setAuthError(data.error || 'Server rejected authentication')
          }
        } else {
          console.log('[Auth] Local browser mode detected (no initData)')
          // Local browser testing without Telegram
          setIsWebApp(false)
          try {
            const savedRole = localStorage.getItem('tcwallet_dev_role') as MockRole
            const savedLang = localStorage.getItem('tcwallet_lang')
            if (savedRole && MOCK_USERS[savedRole]) setMockRoleState(savedRole)
            if (savedLang) setLangState(savedLang)
          } catch {}
        }
      } catch (e: any) {
        console.error('Auth initialization error:', e)
        setAuthError(e.message || 'Unknown network error')
      } finally {
        console.log('[Auth] initAuth finally block executed')
        clearTimeout(safetyTimeout)
        setIsLoading(false)
      }
    }

    // Delay start slightly to guarantee React is hydrated
    setTimeout(initAuth, 10)
  }, [])

  const setMockRole = useCallback((role: MockRole) => {
    setMockRoleState(role)
    try { localStorage.setItem('tcwallet_dev_role', role) } catch {}
  }, [])

  const setLang = useCallback((newLang: string) => {
    setLangState(newLang)
    try { localStorage.setItem('tcwallet_lang', newLang) } catch {}
  }, [])

  const translations = getTranslations(lang)

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translateFn(translations, key, vars),
    [translations]
  )

  return (
    <AppContext.Provider value={{ user, lang, translations, setLang, t, mockRole, setMockRole, isLoading, isDev, authError }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
