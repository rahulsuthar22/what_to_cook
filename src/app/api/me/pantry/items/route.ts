import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { normalizeIngredientName, generateSlug } from '@/lib/ingredient-service';

/**
 * POST /api/me/pantry/items
 * Adds a single ingredient to the user's pantry.
 * Quantity, unit, expiryDate, notes are completely optional for MVP.
 * 
 * Body: {
 *   ingredientId?: string,
 *   name?: string,
 *   quantity?: number | string,
 *   unitId?: string,
 *   expiryDate?: string,
 *   notes?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    let ingredientId = body.ingredientId || body.ingredient_id;
    const rawName = (body.name || '').trim();

    // If ingredientId is not provided, resolve by name or alias, or create user custom ingredient
    if (!ingredientId && rawName) {
      const normalized = normalizeIngredientName(rawName);

      // 1. Try canonical match
      const canonical = await prisma.ingredient.findFirst({
        where: { name: { equals: rawName, mode: 'insensitive' } },
        select: { id: true },
      });

      if (canonical) {
        ingredientId = canonical.id;
      } else {
        // 2. Try alias match
        const aliasMatch = await prisma.ingredientAlias.findUnique({
          where: { aliasNormalized: normalized },
          select: { ingredientId: true },
        });

        if (aliasMatch) {
          ingredientId = aliasMatch.ingredientId;
        } else {
          // 3. Create as new catalog ingredient
          const baseSlug = generateSlug(rawName) || 'custom-ingredient';
          const newIng = await prisma.ingredient.create({
            data: {
              name: rawName,
              slug: `${baseSlug}-${Date.now().toString(36)}`,
              description: 'User-added pantry ingredient',
            },
            select: { id: true },
          });
          ingredientId = newIng.id;
        }
      }
    }

    if (!ingredientId) {
      return NextResponse.json(
        { success: false, error: 'Either ingredientId or ingredient name is required' },
        { status: 400 }
      );
    }

    // Parse optional fields
    let parsedQty: number | null = null;
    if (body.quantity !== undefined && body.quantity !== null && body.quantity !== '') {
      const num = parseFloat(String(body.quantity));
      if (!isNaN(num) && num > 0) {
        parsedQty = num;
      }
    }

    let parsedExpiry: Date | null = null;
    if (body.expiryDate) {
      const d = new Date(body.expiryDate);
      if (!isNaN(d.getTime())) {
        parsedExpiry = d;
      }
    }

    const unitId = body.unitId || null;
    const notes = (body.notes || '').trim() || null;

    // Upsert into user_pantry_items (prevents duplicate entry for same user and ingredient)
    const item = await prisma.userPantryItem.upsert({
      where: {
        userId_ingredientId: {
          userId: auth.userId,
          ingredientId,
        },
      },
      update: {
        quantity: parsedQty !== null ? parsedQty : undefined,
        unitId: unitId !== undefined ? unitId : undefined,
        expiryDate: parsedExpiry !== undefined ? parsedExpiry : undefined,
        notes: notes !== undefined ? notes : undefined,
      },
      create: {
        userId: auth.userId,
        ingredientId,
        quantity: parsedQty,
        unitId,
        expiryDate: parsedExpiry,
        notes,
      },
      include: {
        ingredient: {
          include: {
            category: { select: { name: true } },
          },
        },
        unit: {
          select: { name: true, symbol: true },
        },
      },
    });

    const qtyStr = item.quantity ? `${item.quantity} ${item.unit?.symbol || item.unit?.name || ''}`.trim() : '';

    return NextResponse.json({
      success: true,
      message: 'Item added to pantry',
      item: {
        id: item.id,
        ingredientId: item.ingredientId,
        name: item.ingredient.name,
        category: item.ingredient.category?.name || 'Pantry',
        quantity: item.quantity ? Number(item.quantity) : null,
        formattedQuantity: qtyStr || 'available',
        unitId: item.unitId,
        unitSymbol: item.unit?.symbol || null,
        expiryDate: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding pantry item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
