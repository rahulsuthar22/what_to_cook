import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

// GET /api/grocery - Retrieve grocery list for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id query param is required' }, { status: 400 });
    }

    const groceryList = await prisma.groceryList.findMany({
      where: { userId },
      orderBy: [
        { status: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const formattedList = groceryList.map(g => ({
      grocery_id: g.id,
      user_id: g.userId,
      ingredient_name: g.ingredientName,
      quantity: g.quantity,
      status: g.status,
      created_at: g.createdAt,
    }));

    return NextResponse.json({ success: true, groceryList: formattedList });
  } catch (error: any) {
    console.error('Error fetching grocery list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/grocery - Manually add an item to the grocery list
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ingredient_name, quantity } = body;

    if (!user_id || !ingredient_name || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing fields: user_id, ingredient_name, quantity' }, 
        { status: 400 }
      );
    }

    const item = await prisma.groceryList.create({
      data: {
        userId: user_id,
        ingredientName: ingredient_name,
        quantity: quantity,
        status: 'Pending',
      },
    });

    const formattedItem = {
      grocery_id: item.id,
      user_id: item.userId,
      ingredient_name: item.ingredientName,
      quantity: item.quantity,
      status: item.status,
    };

    return NextResponse.json({ success: true, item: formattedItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding grocery item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/grocery - Update grocery item status or quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { grocery_id, status, quantity } = body;

    if (!grocery_id) {
      return NextResponse.json({ success: false, error: 'grocery_id is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (quantity) {
      updateData.quantity = quantity;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.groceryList.update({
      where: { id: parseInt(grocery_id, 10) },
      data: updateData,
    });

    const formattedUpdated = {
      grocery_id: updated.id,
      user_id: updated.userId,
      ingredient_name: updated.ingredientName,
      quantity: updated.quantity,
      status: updated.status,
    };

    return NextResponse.json({ success: true, item: formattedUpdated });
  } catch (error: any) {
    console.error('Error updating grocery item:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Grocery item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/grocery - Delete a single item or clear the entire list
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groceryId = searchParams.get('grocery_id');
    const userId = searchParams.get('user_id');
    const clearAll = searchParams.get('clear') === 'true';

    if (clearAll) {
      if (!userId) {
        return NextResponse.json({ success: false, error: 'user_id is required to clear list' }, { status: 400 });
      }

      const deletedBatch = await prisma.groceryList.deleteMany({
        where: { userId },
      });

      return NextResponse.json({ 
        success: true, 
        message: 'All grocery items cleared', 
        count: deletedBatch.count 
      });
    }

    if (!groceryId) {
      return NextResponse.json({ success: false, error: 'grocery_id or clear=true query param is required' }, { status: 400 });
    }

    const deleted = await prisma.groceryList.delete({
      where: { id: parseInt(groceryId, 10) },
    });

    const formattedDeleted = {
      grocery_id: deleted.id,
      user_id: deleted.userId,
      ingredient_name: deleted.ingredientName,
    };

    return NextResponse.json({ success: true, message: 'Grocery item deleted', deleted: formattedDeleted });
  } catch (error: any) {
    console.error('Error deleting grocery item:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Grocery item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
