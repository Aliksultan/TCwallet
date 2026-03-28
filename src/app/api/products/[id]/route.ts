import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json()
    const { name, description, price, image_url, is_active } = body

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(image_url !== undefined && { image_url }),
        ...(is_active !== undefined && { is_active }),
      },
    })
    return Response.json({ product })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Soft delete — just archive the product
    const product = await prisma.product.update({
      where: { id },
      data: { is_active: false },
    })
    return Response.json({ product })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
