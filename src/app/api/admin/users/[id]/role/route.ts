import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// PATCH /api/admin/users/[id]/role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { role } = body

    const validRoles = ['MEMBER', 'ORGANISER', 'MANAGER', 'SUPER_ADMIN']
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Invalid role' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    })

    return Response.json({ user })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
