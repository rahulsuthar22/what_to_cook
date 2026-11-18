import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/admin/ingredients?search=&limit=25&offset=0&sort=name
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sort = searchParams.get('sort') || 'name';

    const where = search
      ? { name: { contains: search, mode: 'insensitive' as const } }
      : {};

    const orderBy =
      sort === 'newest'
        ? { createdAt: 'desc' as const }
        : sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : { name: 'asc' as const };

    const [ingredients, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          _count: {
            select: {
              recipes: true,
              allergens: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.ingredient.count({ where }),
    ]);

    const formatted = ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      createdAt: i.createdAt,
      recipeCount: i._count.recipes,
      allergenCount: i._count.allergens,
    }));

    return NextResponse.json({ success: true, ingredients: formatted, total, limit, offset });
  } catch (error: any) {
    console.error('Error fetching ingredients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/ingredients  body: { name }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = (body.name || '').trim();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const slug = generateSlug(name);

    // Check duplicate
    const existing = await prisma.ingredient.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Ingredient "${existing.name}" already exists` },
        { status: 409 }
      );
    }

    const ingredient = await prisma.ingredient.create({
      data: { name, slug },
      select: { id: true, name: true, slug: true, createdAt: true },
    });

    return NextResponse.json({ success: true, ingredient });
  } catch (error: any) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/ingredients?id=  body: { name }
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    const body = await request.json();
    const name = (body.name || '').trim();
    if (!name) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    const slug = generateSlug(name);

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: { name, slug },
      select: { id: true, name: true, slug: true, createdAt: true },
    });

    return NextResponse.json({ success: true, ingredient });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Ingredient not found' }, { status: 404 });
    }
    console.error('Error updating ingredient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/ingredients?id=
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });

    // Check usage before delete
    const count = await prisma.recipeIngredient.count({ where: { ingredientId: id } });
    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete — ingredient is used in ${count} recipe${count === 1 ? '' : 's'}`,
        },
        { status: 409 }
      );
    }

    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Ingredient not found' }, { status: 404 });
    }
    console.error('Error deleting ingredient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
