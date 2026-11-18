import { NextRequest, NextResponse } from 'next/server';
import { searchIngredients } from '@/lib/ingredient-service';
import { prisma } from '@/config/db';

/**
 * Public ingredient search & catalog endpoint.
 * Supports:
 * - Canonical name and alias search (e.g. "aloo" -> Potato, "pyaz" -> Onion)
 * - Category filtering (?category= or ?categoryId=)
 * - Pagination (?limit= & ?offset=)
 * - Active-only default
 * 
 * GET /api/ingredients?search=aloo&categoryId=&limit=20&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || searchParams.get('category') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // If category is a slug or name, resolve to categoryId
    let resolvedCategoryId = categoryId;
    if (categoryId && categoryId !== 'ALL' && !categoryId.includes('-')) {
      const cat = await prisma.ingredientCategory.findFirst({
        where: {
          OR: [
            { id: { equals: categoryId } },
            { slug: { equals: categoryId.toLowerCase() } },
            { name: { equals: categoryId, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      if (cat) resolvedCategoryId = cat.id;
    }

    const result = await searchIngredients({
      search,
      categoryId: resolvedCategoryId,
      activeOnly: !includeInactive,
      limit,
      offset,
      sort: 'name',
    });

    return NextResponse.json({
      success: true,
      ingredients: result.ingredients,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching public ingredients:', error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
