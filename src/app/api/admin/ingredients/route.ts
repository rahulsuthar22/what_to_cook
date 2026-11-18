import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import {
  generateSlug,
  normalizeIngredientName,
  checkIngredientConflict,
  addIngredientAlias,
} from '@/lib/ingredient-service';
import { getAuthenticatedUser } from '@/lib/server-auth';

// GET /api/admin/ingredients?search=&limit=25&offset=0&sort=name&categoryId=&status=
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    // In dev / admin layout, auth might be handled by middleware or page guard, but if auth is present and not admin, reject
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') || '';
    const status = searchParams.get('status') || 'ALL'; // ALL | ACTIVE | INACTIVE
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const sort = searchParams.get('sort') || 'name';

    const where: any = {};

    if (search.trim()) {
      const normalizedSearch = normalizeIngredientName(search);
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        {
          aliases: {
            some: {
              aliasNormalized: { contains: normalizedSearch, mode: 'insensitive' as const },
            },
          },
        },
      ];
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (status === 'ACTIVE') {
      where.isActive = true;
    } else if (status === 'INACTIVE') {
      where.isActive = false;
    }

    const orderBy =
      sort === 'newest'
        ? { createdAt: 'desc' as const }
        : sort === 'oldest'
        ? { createdAt: 'asc' as const }
        : { name: 'asc' as const };

    const [ingredients, total, categories] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          aliases: {
            select: { id: true, alias: true, aliasNormalized: true },
            orderBy: { alias: 'asc' },
          },
          _count: {
            select: {
              recipes: true,
              allergens: true,
              pantryItems: true,
              groceryListItems: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.ingredient.count({ where }),
      prisma.ingredientCategory.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const formatted = ingredients.map((i) => ({
      id: i.id,
      name: i.name,
      slug: i.slug,
      description: i.description,
      imageUrl: i.imageUrl,
      isActive: i.isActive,
      categoryId: i.categoryId,
      categoryName: i.category?.name || 'Uncategorized',
      aliases: i.aliases.map((a) => a.alias),
      aliasesList: i.aliases,
      recipeCount: i._count.recipes,
      allergenCount: i._count.allergens,
      pantryCount: i._count.pantryItems,
      groceryCount: i._count.groceryListItems,
      createdAt: i.createdAt,
    }));

    return NextResponse.json({
      success: true,
      ingredients: formatted,
      total,
      limit,
      offset,
      categories,
    });
  } catch (error: any) {
    console.error('Error fetching admin ingredients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/admin/ingredients
// Body: { name, description?, categoryId?, imageUrl?, isActive?, aliases?: string[] }
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const name = (body.name || '').trim();
    const description = (body.description || '').trim() || null;
    const categoryId = body.categoryId || null;
    const imageUrl = (body.imageUrl || '').trim() || null;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const aliases: string[] = Array.isArray(body.aliases) ? body.aliases : [];

    if (!name) {
      return NextResponse.json({ success: false, error: 'Ingredient name is required' }, { status: 400 });
    }

    // Check duplicate name, slug, or alias conflict
    const conflict = await checkIngredientConflict(name);
    if (conflict.hasConflict) {
      return NextResponse.json({ success: false, error: conflict.reason }, { status: 409 });
    }

    const slug = generateSlug(name);

    // Create inside transaction to save ingredient + aliases atomically
    const result = await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.create({
        data: {
          name,
          slug,
          description,
          categoryId,
          imageUrl,
          isActive,
        },
      });

      // Save initial aliases if provided
      if (aliases.length > 0) {
        for (const rawAlias of aliases) {
          const alias = rawAlias.trim();
          if (!alias) continue;
          const normalized = normalizeIngredientName(alias);
          if (normalized === normalizeIngredientName(name)) continue;

          // Check if already used
          const existingAlias = await tx.ingredientAlias.findUnique({
            where: { aliasNormalized: normalized },
          });
          if (!existingAlias) {
            await tx.ingredientAlias.create({
              data: {
                ingredientId: ingredient.id,
                alias,
                aliasNormalized: normalized,
              },
            });
          }
        }
      }

      return ingredient;
    });

    const created = await prisma.ingredient.findUnique({
      where: { id: result.id },
      include: {
        category: true,
        aliases: true,
      },
    });

    return NextResponse.json({ success: true, ingredient: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ingredient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/ingredients?id=
// Body: { name?, description?, categoryId?, imageUrl?, isActive?, addAlias?, removeAliasId? }
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ingredient ID' }, { status: 400 });

    const body = await request.json();

    // 1. If operation is adding a single alias
    if (body.addAlias) {
      try {
        const newAlias = await addIngredientAlias(id, String(body.addAlias));
        return NextResponse.json({ success: true, alias: newAlias });
      } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
    }

    // 2. If operation is removing an alias
    if (body.removeAliasId) {
      await prisma.ingredientAlias.deleteMany({
        where: { id: String(body.removeAliasId), ingredientId: id },
      });
      return NextResponse.json({ success: true, message: 'Alias removed' });
    }

    // 3. Normal ingredient updates
    const updateData: any = {};

    if (body.name !== undefined) {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
      }

      const conflict = await checkIngredientConflict(name, id);
      if (conflict.hasConflict) {
        return NextResponse.json({ success: false, error: conflict.reason }, { status: 409 });
      }

      updateData.name = name;
      updateData.slug = generateSlug(name);
    }

    if (body.description !== undefined) {
      updateData.description = body.description ? body.description.trim() : null;
    }

    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId || null;
    }

    if (body.imageUrl !== undefined) {
      updateData.imageUrl = body.imageUrl ? body.imageUrl.trim() : null;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        aliases: true,
      },
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
    const auth = await getAuthenticatedUser(request);
    if (auth && !auth.isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Missing ingredient ID' }, { status: 400 });

    // Check usage across recipes, grocery lists, and user pantry
    const [recipeCount, groceryCount, pantryCount] = await Promise.all([
      prisma.recipeIngredient.count({ where: { ingredientId: id } }),
      prisma.groceryListItem.count({ where: { ingredientId: id } }),
      prisma.userPantryItem.count({ where: { ingredientId: id } }),
    ]);

    const totalUsage = recipeCount + groceryCount + pantryCount;
    if (totalUsage > 0) {
      const parts: string[] = [];
      if (recipeCount > 0) parts.push(`${recipeCount} recipe${recipeCount === 1 ? '' : 's'}`);
      if (pantryCount > 0) parts.push(`${pantryCount} user pantry item${pantryCount === 1 ? '' : 's'}`);
      if (groceryCount > 0) parts.push(`${groceryCount} grocery list item${groceryCount === 1 ? '' : 's'}`);

      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete ingredient — currently referenced in ${parts.join(', ')}. Consider deactivating it instead.`,
        },
        { status: 409 }
      );
    }

    await prisma.ingredient.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Ingredient deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Ingredient not found' }, { status: 404 });
    }
    console.error('Error deleting ingredient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
