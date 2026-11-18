import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { normalizeIngredientName, generateSlug } from '@/lib/ingredient-service';

/**
 * POST /api/me/pantry/items/bulk
 * Supports fast bulk adding of ingredients into user pantry.
 * 
 * Body: {
 *   ingredientIds?: string[],
 *   items?: Array<{ ingredientId?: string, name?: string, quantity?: number, unitId?: string }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const candidateIds: string[] = Array.isArray(body.ingredientIds) ? body.ingredientIds : [];
    const candidateItems: any[] = Array.isArray(body.items) ? body.items : [];

    if (candidateIds.length === 0 && candidateItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide ingredientIds array or items array' },
        { status: 400 }
      );
    }

    const resolvedIngredientIds = new Set<string>();

    // 1. Collect direct ingredientIds
    for (const id of candidateIds) {
      if (typeof id === 'string' && id.trim()) {
        resolvedIngredientIds.add(id.trim());
      }
    }

    // 2. Process item objects
    for (const it of candidateItems) {
      if (it.ingredientId) {
        resolvedIngredientIds.add(it.ingredientId);
      } else if (it.name && typeof it.name === 'string') {
        const rawName = it.name.trim();
        const normalized = normalizeIngredientName(rawName);

        const found = await prisma.ingredient.findFirst({
          where: { name: { equals: rawName, mode: 'insensitive' } },
          select: { id: true },
        });

        if (found) {
          resolvedIngredientIds.add(found.id);
        } else {
          const alias = await prisma.ingredientAlias.findUnique({
            where: { aliasNormalized: normalized },
            select: { ingredientId: true },
          });
          if (alias) {
            resolvedIngredientIds.add(alias.ingredientId);
          } else {
            const baseSlug = generateSlug(rawName) || 'custom';
            const created = await prisma.ingredient.create({
              data: {
                name: rawName,
                slug: `${baseSlug}-${Date.now().toString(36)}`,
                description: 'User-added pantry ingredient',
              },
              select: { id: true },
            });
            resolvedIngredientIds.add(created.id);
          }
        }
      }
    }

    if (resolvedIngredientIds.size === 0) {
      return NextResponse.json({ success: false, error: 'No valid ingredients found to add' }, { status: 400 });
    }

    // Upsert each item inside a single transaction
    const results = await prisma.$transaction(async (tx) => {
      const addedOrUpdated = [];
      for (const ingredientId of Array.from(resolvedIngredientIds)) {
        const item = await tx.userPantryItem.upsert({
          where: {
            userId_ingredientId: {
              userId: auth.userId,
              ingredientId,
            },
          },
          update: {},
          create: {
            userId: auth.userId,
            ingredientId,
          },
        });
        addedOrUpdated.push(item);
      }
      return addedOrUpdated;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully added ${results.length} item(s) to pantry`,
      count: results.length,
    });
  } catch (error: any) {
    console.error('Error in bulk pantry add:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
