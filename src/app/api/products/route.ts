import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// GET /api/products
export async function GET(request: NextRequest) {
  const includeInactive = request.nextUrl.searchParams.get('all') === 'true'

  try {
    const products = await prisma.product.findMany({
      where: includeInactive ? {} : { is_active: true },
      orderBy: { created_at: 'desc' },
    })
    return Response.json({ products })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/products — Manager / Admin creates product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, price, image_url, created_by } = body

    if (!name || price === undefined || !created_by) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: { name, description: description || null, price, image_url: image_url || null, created_by },
    })

    return Response.json({ product }, { status: 201 })
  } catch (e) {
    console.error(e)
    return Response.json({ error: 'Internal error' }, { status: 500 })
  }
}
