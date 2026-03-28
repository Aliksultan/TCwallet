import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// GET /api/admin/analytics — Super Admin only
export async function GET(_request: NextRequest) {
  try {
    const [totalUsers, allTransactions, orderStats] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.findMany({ select: { amount: true, type: true, activity: true } }),
      prisma.order.groupBy({ by: ['status'], _count: { id: true } }),
    ])

    const tcIssued = allTransactions
      .filter((t) => ['EARN', 'ADJUSTMENT', 'CORRECTION'].includes(t.type) && t.amount > 0)
      .reduce((s, t) => s + t.amount, 0)

    const tcSpent = allTransactions
      .filter((t) => t.type === 'SPENT')
      .reduce((s, t) => s + Math.abs(t.amount), 0)

    const tcRefunded = allTransactions
      .filter((t) => t.type === 'REFUND')
      .reduce((s, t) => s + t.amount, 0)

    const tcRemoved = allTransactions
      .filter((t) => t.type === 'REMOVED')
      .reduce((s, t) => s + Math.abs(t.amount), 0)

    // Activity breakdown
    const activityMap: Record<string, number> = {}
    allTransactions
      .filter((t) => t.type === 'EARN' && t.activity)
      .forEach((t) => {
        activityMap[t.activity!] = (activityMap[t.activity!] || 0) + t.amount
      })

    const orderStatusMap = Object.fromEntries(
      orderStats.map((o) => [o.status, o._count.id])
    )

    return Response.json({
      totalUsers,
      tcIssued,
      tcSpent,
      tcRefunded,
      tcRemoved,
      activityBreakdown: activityMap,
      orderStats: orderStatusMap,
    })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
