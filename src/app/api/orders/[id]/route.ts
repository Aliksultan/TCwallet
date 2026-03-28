import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import {
  notifyMemberOrderAccepted,
  notifyMemberOrderDeclined,
  notifyMemberOrderCompleted,
} from '@/lib/telegram-bot'

// PATCH /api/orders/[id] — Manager updates order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { status, actor_id } = body

    const validTransitions: Record<string, string[]> = {
      PENDING: ['ACCEPTED', 'DECLINED'],
      ACCEPTED: ['COMPLETED'],
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        product: true,
        user: { select: { id: true, telegram_id: true, language: true, display_name: true } },
      },
    })
    if (!order) return Response.json({ error: 'Order not found' }, { status: 404 })

    const allowed = validTransitions[order.status]
    if (!allowed || !allowed.includes(status)) {
      return Response.json(
        { error: `Cannot transition from ${order.status} to ${status}` },
        { status: 422 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
      })

      // Decline → auto-refund transaction
      if (status === 'DECLINED') {
        await tx.transaction.create({
          data: {
            user_id: order.user_id,
            actor_id: actor_id || order.user_id,
            amount: order.product.price,
            type: 'REFUND',
            activity: 'T-Market',
            reason: `Возврат: ${order.product.name}`,
          },
        })
      }

      return updatedOrder
    })

    // Fire appropriate notification (fire-and-forget)
    const member = order.user
    if (status === 'ACCEPTED') {
      notifyMemberOrderAccepted({
        memberTelegramId: member.telegram_id,
        productName: order.product.name,
        language: member.language,
      }).catch(console.error)
    } else if (status === 'DECLINED') {
      notifyMemberOrderDeclined({
        memberTelegramId: member.telegram_id,
        productName: order.product.name,
        refundAmount: order.product.price,
        language: member.language,
      }).catch(console.error)
    } else if (status === 'COMPLETED') {
      notifyMemberOrderCompleted({
        memberTelegramId: member.telegram_id,
        productName: order.product.name,
        language: member.language,
      }).catch(console.error)
    }

    return Response.json({ order: result })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
