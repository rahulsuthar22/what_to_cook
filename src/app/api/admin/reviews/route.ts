import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const rating = searchParams.get('rating') || '';
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') || 'newest';

    const orderBy =
      sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : sort === 'highest'
        ? { rating: 'desc' as const }
        : sort === 'lowest'
        ? { rating: 'asc' as const }
        : { createdAt: 'desc' as const };

    const where: any = {};

    if (search) {
      where.recipe = { name: { contains: search, mode: 'insensitive' } };
    }

    if (rating && rating !== '') {
      const parsedRating = parseInt(rating, 10);
      if (!isNaN(parsedRating) && parsedRating >= 1 && parsedRating <= 5) {
        where.rating = parsedRating;
      }
    }

    const [reviews, total] = await Promise.all([
      prisma.recipeReview.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          recipe: { select: { id: true, name: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.recipeReview.count({ where }),
    ]);

    return NextResponse.json({ success: true, reviews, total, limit, offset });
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id param' },
        { status: 400 }
      );
    }

    await prisma.recipeReview.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
