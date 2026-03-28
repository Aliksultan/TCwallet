import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { notifyManagersNewOrder } from '@/lib/telegram-bot'

// POST /api/orders — Member purchases a product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, product_id } = body

    if (!user_id || !product_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify product is active
    const product = await prisma.product.findUnique({ where: { id: product_id } })
    if (!product || !product.is_active) {
      return Response.json({ error: 'Product not available' }, { status: 404 })
    }

    // Get buyer info
    const buyer = await prisma.user.findUnique({ where: { id: user_id } })
    if (!buyer) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Compute current balance atomically
    const agg = await prisma.transaction.aggregate({
      where: { user_id },
      _sum: { amount: true },
    })
    const currentBalance = agg._sum.amount ?? 0

    if (currentBalance < product.price) {
      return Response.json(
        { error: 'Insufficient balance', currentBalance, price: product.price },
        { status: 422 }
      )
    }

    // Atomic: deduct TC and create order
    const result = await prisma.$transaction(async (tx) => {
      const spendTx = await tx.transaction.create({
        data: {
          user_id,
          actor_id: user_id,
          amount: -product.price,
          type: 'SPENT',
          activity: 'T-Market',
          reason: `Покупка: ${product.name}`,
        },
      })

      const order = await tx.order.create({
        data: {
          user_id,
          product_id,
          transaction_id: spendTx.id,
          status: 'PENDING',
        },
      })

      return { spendTx, order }
    })

    // Fire notification to all T-Market Managers (async, don't block response)
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { telegram_id: true },
    })
    const managerIds = managers.map((m) => m.telegram_id)

    if (managerIds.length > 0) {
      notifyManagersNewOrder({
        managerTelegramIds: managerIds,
        orderId: result.order.id,
        productName: product.name,
        productPrice: product.price,
        buyerName: buyer.display_name,
        buyerUsername: buyer.username,
      }).catch(console.error) // fire-and-forget
    }

    return Response.json(
      {
        order: result.order,
        transaction: result.spendTx,
        newBalance: currentBalance - product.price,
      },
      { status: 201 }
    )
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET /api/orders?userId=xxx or ?all=true
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const all = request.nextUrl.searchParams.get('all') === 'true'
  const status = request.nextUrl.searchParams.get('status')

  try {
    const orders = await prisma.order.findMany({
      where: {
        ...(userId && !all ? { user_id: userId } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { created_at: 'desc' },
      include: {
        product: true,
        user: { select: { id: true, display_name: true, username: true } },
        transaction: true,
      },
    })
    return Response.json({ orders })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
