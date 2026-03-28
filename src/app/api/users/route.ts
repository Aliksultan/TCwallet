import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// GET /api/users?search=xxx  — Admin/Organiser: search users
// GET /api/users?id=xxx       — Get single user
export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get('search')
  const id = request.nextUrl.searchParams.get('id')

  try {
    if (id) {
      const user = await prisma.user.findUnique({ where: { id } })
      if (!user) return Response.json({ error: 'Not found' }, { status: 404 })
      const transactions = await prisma.transaction.findMany({
        where: { user_id: id },
        orderBy: { created_at: 'desc' },
        take: 100,
        include: { actor: { select: { display_name: true, role: true } } },
      })
      const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0)
      return Response.json({ user, transactions, balance })
    }

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { display_name: { contains: search } },
              { username: { contains: search } },
            ],
          }
        : undefined,
      orderBy: { created_at: 'asc' },
    })

    // Compute balance per user
    const balances = await prisma.transaction.groupBy({
      by: ['user_id'],
      _sum: { amount: true },
    })

    const balanceMap = new Map(balances.map((b) => [b.user_id, b._sum.amount ?? 0]))
    const result = users.map((u) => ({ ...u, balance: balanceMap.get(u.id) ?? 0 }))

    return Response.json({ users: result })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
