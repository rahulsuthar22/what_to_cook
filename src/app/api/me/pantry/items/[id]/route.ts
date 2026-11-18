import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getAuthenticatedUser } from '@/lib/server-auth';

// PATCH /api/me/pantry/items/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const resolvedParams = await params;
    const itemId = resolvedParams.id;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.userPantryItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pantry item not found' }, { status: 404 });
    }

    if (existing.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Access denied: You do not own this pantry item' }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.quantity !== undefined) {
      if (body.quantity === null || body.quantity === '') {
        updateData.quantity = null;
      } else {
        const num = parseFloat(String(body.quantity));
        updateData.quantity = isNaN(num) ? null : num;
      }
    }

    if (body.unitId !== undefined) {
      updateData.unitId = body.unitId || null;
    }

    if (body.expiryDate !== undefined) {
      if (!body.expiryDate) {
        updateData.expiryDate = null;
      } else {
        const d = new Date(body.expiryDate);
        updateData.expiryDate = isNaN(d.getTime()) ? null : d;
      }
    }

    if (body.notes !== undefined) {
      updateData.notes = body.notes ? String(body.notes).trim() : null;
    }

    const updated = await prisma.userPantryItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        ingredient: true,
        unit: true,
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        ingredientId: updated.ingredientId,
        name: updated.ingredient.name,
        quantity: updated.quantity ? Number(updated.quantity) : null,
        unitId: updated.unitId,
        unitSymbol: updated.unit?.symbol || null,
        expiryDate: updated.expiryDate ? updated.expiryDate.toISOString().split('T')[0] : null,
        notes: updated.notes,
      },
    });
  } catch (error: any) {
    console.error('Error updating pantry item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/me/pantry/items/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if (!auth || !auth.userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const resolvedParams = await params;
    const itemId = resolvedParams.id;

    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Item ID required' }, { status: 400 });
    }

    // Verify ownership before deleting
    const existing = await prisma.userPantryItem.findUnique({
      where: { id: itemId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Pantry item not found' }, { status: 404 });
    }

    if (existing.userId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Access denied: You do not own this pantry item' }, { status: 403 });
    }

    await prisma.userPantryItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true, message: 'Item removed from pantry' });
  } catch (error: any) {
    console.error('Error deleting pantry item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
