import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

/**
 * Customer-facing ingredient search.
 * Returns global/master ingredients (all from `ingredients` table).
 * This endpoint is public — no auth required for a dropdown/search.
 *
 * GET /api/ingredients?search=&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const ingredients = await prisma.ingredient.findMany({
      where,
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
      take: limit,
    });

    return NextResponse.json({ success: true, ingredients });
  } catch (error: any) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
