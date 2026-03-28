import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { notifyMemberCoinsEarned, notifyMemberCoinsRemoved } from '@/lib/telegram-bot'

// POST /api/transactions — Organiser / Admin creates a transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, actor_id, amount, type, activity, reason } = body

    if (!user_id || !actor_id || amount === undefined || !type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (typeof amount !== 'number' || amount === 0) {
      return Response.json({ error: 'Amount must be non-zero number' }, { status: 400 })
    }

    // Get user for notification
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { telegram_id: true, language: true },
    })

    // Compute current balance
    const agg = await prisma.transaction.aggregate({
      where: { user_id },
      _sum: { amount: true },
    })
    const currentBalance = agg._sum.amount ?? 0

    // Zero-floor constraint for deductions
    if (amount < 0 && currentBalance + amount < 0) {
      return Response.json(
        { error: 'Insufficient balance', currentBalance },
        { status: 422 }
      )
    }

    const transaction = await prisma.transaction.create({
      data: { user_id, actor_id, amount, type, activity, reason },
    })

    const newBalance = currentBalance + amount

    // Fire notification (fire-and-forget)
    if (user) {
      if (amount > 0 && ['EARN', 'ADJUSTMENT', 'CORRECTION'].includes(type)) {
        notifyMemberCoinsEarned({
          memberTelegramId: user.telegram_id,
          amount,
          activity: activity || null,
          reason: reason || null,
          newBalance,
          language: user.language,
        }).catch(console.error)
      } else if (amount < 0 && type === 'REMOVED') {
        notifyMemberCoinsRemoved({
          memberTelegramId: user.telegram_id,
          amount,
          reason: reason || null,
          newBalance,
          language: user.language,
        }).catch(console.error)
      }
    }

    return Response.json({ transaction, newBalance }, { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/transactions?userId=xxx
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  try {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      include: { actor: { select: { display_name: true, role: true } } },
    })
    return Response.json({ transactions })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
