import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// GET /api/wallet?userId=xxx
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        transactions: {
          orderBy: { created_at: 'desc' },
          take: 50,
          include: { actor: { select: { display_name: true, role: true } } },
        },
      },
    })

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    // Balance = sum of all transactions (positive = earn/refund, negative = spent/removed)
    const balance = user.transactions.reduce((sum, tx) => sum + tx.amount, 0)

    return Response.json({ user, balance, transactions: user.transactions })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
