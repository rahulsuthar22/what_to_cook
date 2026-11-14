import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { GroceryItemStatus } from '@/generated/prisma/enums';

// GET /api/grocery - Retrieve grocery list for a user (with recipe associations)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id query param is required' }, { status: 400 });
    }

    const groceryList = await prisma.groceryListItem.findMany({
      where: { userId },
      include: {
        ingredient: true,
        unit: true,
      },
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Look up which planned recipes use each ingredient + per-recipe quantity
    const userMealPlans = await prisma.mealPlan.findMany({
      where: { userId },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    // Build a map: ingredient name (lowercase) -> array of { recipe, quantity }
    const ingredientDetails = new Map<string, { recipe: string; quantity: string }[]>();
    for (const plan of userMealPlans) {
      if (!plan.recipe) continue;
      for (const ri of plan.recipe.ingredients) {
        const ingName = ri.ingredient.name.trim().toLowerCase();
        if (!ingredientDetails.has(ingName)) {
          ingredientDetails.set(ingName, []);
        }
        const existing = ingredientDetails.get(ingName)!;
        if (!existing.some(e => e.recipe === plan.recipe.name)) {
          const qtyStr = ri.quantity ? `${ri.quantity} ${ri.unit?.symbol || ''}`.trim() : 'as needed';
          existing.push({
            recipe: plan.recipe.name,
            quantity: qtyStr,
          });
        }
      }
    }

    const formattedList = groceryList.map(g => {
      const displayName = g.ingredient?.name || g.customName || 'Item';
      const details = ingredientDetails.get(displayName.trim().toLowerCase()) || [];
      const recipeNames = details.map(d => d.recipe);
      const totalParts = details.map(d => `${d.quantity} (${d.recipe})`);
      const defaultQtyStr = g.quantity ? `${g.quantity} ${g.unit?.symbol || ''}`.trim() : '1';
      const totalQuantity = totalParts.length > 0 ? totalParts.join(' + ') : defaultQtyStr;

      return {
        grocery_id: g.id,
        user_id: g.userId,
        ingredient_name: displayName,
        quantity: defaultQtyStr,
        status: g.status === GroceryItemStatus.PURCHASED ? 'Purchased' : 'Pending',
        created_at: g.createdAt,
        used_in: recipeNames,
        recipe_quantities: details,
        total_quantity: totalQuantity,
      };
    });

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

    if (!user_id || !ingredient_name) {
      return NextResponse.json(
        { success: false, error: 'Missing fields: user_id, ingredient_name' }, 
        { status: 400 }
      );
    }

    // Try finding matching ingredient in catalog
    const matchingIngredient = await prisma.ingredient.findFirst({
      where: {
        name: { equals: ingredient_name.trim(), mode: 'insensitive' }
      }
    });

    const parsedQty = parseFloat(quantity) || 1;

    const item = await prisma.groceryListItem.create({
      data: {
        userId: user_id,
        ingredientId: matchingIngredient ? matchingIngredient.id : null,
        customName: matchingIngredient ? null : ingredient_name.trim(),
        quantity: parsedQty,
        status: GroceryItemStatus.PENDING,
      },
      include: {
        ingredient: true,
        unit: true,
      }
    });

    const displayName = item.ingredient?.name || item.customName || ingredient_name;
    const qtyStr = item.quantity ? `${item.quantity}` : (quantity || '1');

    const formattedItem = {
      grocery_id: item.id,
      user_id: item.userId,
      ingredient_name: displayName,
      quantity: qtyStr,
      status: 'Pending',
      used_in: [],
      recipe_quantities: [],
      total_quantity: qtyStr,
    };

    return NextResponse.json({ success: true, item: formattedItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding grocery item:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/grocery - Update grocery item status, quantity, or name
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { grocery_id, status, quantity, ingredient_name } = body;

    if (!grocery_id) {
      return NextResponse.json({ success: false, error: 'grocery_id is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status.toUpperCase() === 'PURCHASED' ? GroceryItemStatus.PURCHASED : GroceryItemStatus.PENDING;
    }
    if (quantity !== undefined) {
      updateData.quantity = parseFloat(quantity) || null;
    }
    if (ingredient_name) {
      updateData.customName = ingredient_name;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    const updated = await prisma.groceryListItem.update({
      where: { id: String(grocery_id) },
      data: updateData,
      include: {
        ingredient: true,
        unit: true,
      }
    });

    const displayName = updated.ingredient?.name || updated.customName || 'Item';
    const formattedUpdated = {
      grocery_id: updated.id,
      user_id: updated.userId,
      ingredient_name: displayName,
      quantity: updated.quantity ? `${updated.quantity}` : '',
      status: updated.status === GroceryItemStatus.PURCHASED ? 'Purchased' : 'Pending',
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

      const deletedBatch = await prisma.groceryListItem.deleteMany({
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

    const deleted = await prisma.groceryListItem.delete({
      where: { id: String(groceryId) },
      include: {
        ingredient: true,
      }
    });

    const formattedDeleted = {
      grocery_id: deleted.id,
      user_id: deleted.userId,
      ingredient_name: deleted.ingredient?.name || deleted.customName || 'Item',
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
