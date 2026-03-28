import { prisma } from '@/lib/prisma'
import { validateTelegramInitData, parseTelegramUser } from '@/lib/telegram-auth'
import { NextRequest } from 'next/server'

/**
 * POST /api/auth/telegram
 * Validates Telegram initData, upserts the user, returns user record.
 * Called by the frontend on mount in production mode.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { initData } = body

    if (!initData) {
      return Response.json({ error: 'initData required' }, { status: 400 })
    }

    // Validate HMAC signature
    const isValid = validateTelegramInitData(initData)
    if (!isValid) {
      console.warn('[Auth] Invalid initData received')
      return Response.json({ error: 'Invalid initData' }, { status: 401 })
    }

    // Parse user from initData
    const tgUser = parseTelegramUser(initData)
    if (!tgUser) {
      return Response.json({ error: 'Could not parse user from initData' }, { status: 400 })
    }

    // Upsert user — creates on first login, updates name/username on subsequent logins
    const user = await prisma.user.upsert({
      where: { telegram_id: tgUser.telegram_id },
      update: {
        username: tgUser.username,
        display_name: tgUser.display_name,
        // Don't override language preference if user has set it manually
      },
      create: {
        telegram_id: tgUser.telegram_id,
        username: tgUser.username,
        display_name: tgUser.display_name,
        role: 'MEMBER', // All new users start as MEMBER
        language: tgUser.language,
      },
    })

    return Response.json({ user }, { status: 200 })
  } catch (e) {
    console.error('[Auth] Error:', e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
