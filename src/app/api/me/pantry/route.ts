import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { normalizeIngredientName, generateSlug } from '@/lib/ingredient-service';

/**
 * GET /api/me/pantry
 * Retrieves all pantry items for the currently authenticated user.
 * Identity is derived strictly from server-side session/token.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const pantryItems = await prisma.userPantryItem.findMany({
      where: { userId: auth.userId },
      include: {
        ingredient: {
          include: {
            category: { select: { id: true, name: true, slug: true } },
            aliases: { select: { alias: true } },
          },
        },
        unit: {
          select: { id: true, name: true, symbol: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = pantryItems.map((item) => {
      const qtyStr = item.quantity ? `${item.quantity} ${item.unit?.symbol || item.unit?.name || ''}`.trim() : '';
      return {
        id: item.id,
        ingredientId: item.ingredientId,
        name: item.ingredient.name,
        slug: item.ingredient.slug,
        imageUrl: item.ingredient.imageUrl,
        category: item.ingredient.category?.name || 'Pantry',
        aliases: item.ingredient.aliases.map((a) => a.alias),
        quantity: item.quantity ? Number(item.quantity) : null,
        formattedQuantity: qtyStr || 'available',
        unitId: item.unitId,
        unitSymbol: item.unit?.symbol || null,
        unitName: item.unit?.name || null,
        expiryDate: item.expiryDate ? item.expiryDate.toISOString().split('T')[0] : null,
        notes: item.notes,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      pantry: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error('Error fetching personal pantry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/me/pantry?clear=true
 * Clears the entire pantry for the authenticated user.
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const deleted = await prisma.userPantryItem.deleteMany({
      where: { userId: auth.userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Pantry cleared successfully',
      count: deleted.count,
    });
  } catch (error: any) {
    console.error('Error clearing pantry:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
