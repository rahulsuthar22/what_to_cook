import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { generateSlug } from '@/lib/ingredient-service';
import { getAuthenticatedUser } from '@/lib/server-auth';

// GET /api/admin/ingredients/categories
export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.ingredientCategory.findMany({
      include: {
        _count: {
          select: { ingredients: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    const formatted = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      sortOrder: c.sortOrder,
      isActive: c.isActive,
      ingredientCount: c._count.ingredients,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, categories: formatted });
  } catch (error: any) {
    console.error('Error fetching ingredient categories:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/ingredients/categories
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();
    const description = (body.description || '').trim() || null;
    const sortOrder = parseInt(body.sortOrder || '0', 10);

    if (!name) {
      return NextResponse.json({ success: false, error: 'Category name is required' }, { status: 400 });
    }

    const slug = generateSlug(name);

    const existing = await prisma.ingredientCategory.findFirst({
      where: { OR: [{ name: { equals: name, mode: 'insensitive' } }, { slug }] },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `Category "${existing.name}" already exists` },
        { status: 409 }
      );
    }

    const category = await prisma.ingredientCategory.create({
      data: {
        name,
        slug,
        description,
        sortOrder,
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ingredient category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/ingredients/categories?id=
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing category ID' }, { status: 400 });

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
      updateData.name = name;
      updateData.slug = generateSlug(name);
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : null;
    }

    if (body.sortOrder !== undefined) {
      updateData.sortOrder = parseInt(body.sortOrder, 10);
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.ingredientCategory.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    console.error('Error updating ingredient category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/ingredients/categories?id=
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing category ID' }, { status: 400 });

    const count = await prisma.ingredient.count({ where: { categoryId: id } });
    if (count > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete category — assigned to ${count} ingredient${count === 1 ? '' : 's'}. Reassign them first.`,
        },
        { status: 409 }
      );
    }

    await prisma.ingredientCategory.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Category deleted' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 });
    }
    console.error('Error deleting ingredient category:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
