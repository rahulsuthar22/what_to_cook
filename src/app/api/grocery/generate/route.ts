import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { GroceryItemStatus } from '@/generated/prisma/enums';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, start_date, end_date } = body;

    if (!user_id || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: user_id, start_date, end_date' },
        { status: 400 }
      );
    }

    // 1. Find all user meal plans in the given date range
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: user_id,
        mealDate: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
      },
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

    // 2. Aggregate all required ingredients (avoiding duplicates)
    const neededIngredientsMap = new Map<string, { ingredientId: string; originalName: string; quantity: number | null; unitId: string | null }>();
    for (const plan of mealPlans) {
      if (!plan.recipe) continue;
      for (const ri of plan.recipe.ingredients) {
        const name = ri.ingredient.name;
        const nameLower = name.trim().toLowerCase();
        if (!neededIngredientsMap.has(nameLower)) {
          neededIngredientsMap.set(nameLower, {
            ingredientId: ri.ingredient.id,
            originalName: name,
            quantity: ri.quantity ? Number(ri.quantity) : null,
            unitId: ri.unitId,
          });
        }
      }
    }

    // 3. Find current items in the user's grocery list
    const existingGrocery = await prisma.groceryListItem.findMany({
      where: { userId: user_id },
      include: { ingredient: true },
    });
    const existingNamesSet = new Set(
      existingGrocery.map(g => (g.ingredient?.name || g.customName || '').trim().toLowerCase())
    );

    // 4. Filter out items already on the list
    const missingIngredients: { ingredientId: string; name: string; quantity: number | null; unitId: string | null }[] = [];
    neededIngredientsMap.forEach((details, nameLower) => {
      if (!existingNamesSet.has(nameLower)) {
        missingIngredients.push({
          ingredientId: details.ingredientId,
          name: details.originalName,
          quantity: details.quantity,
          unitId: details.unitId,
        });
      }
    });

    if (missingIngredients.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All recipe ingredients are already in your grocery list!', 
        items: [] 
      });
    }

    // 5. Batch create the missing items in a transaction
    const insertedItems = await prisma.$transaction(
      missingIngredients.map(item => 
        prisma.groceryListItem.create({
          data: {
            userId: user_id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
            unitId: item.unitId,
            status: GroceryItemStatus.PENDING,
          },
        })
      )
    );

    const formattedInserted = insertedItems.map((item, idx) => ({
      grocery_id: item.id,
      user_id: item.userId,
      ingredient_name: missingIngredients[idx].name,
      quantity: item.quantity ? `${item.quantity}` : '1',
      status: 'Pending',
    }));

    return NextResponse.json({ 
      success: true, 
      message: `Generated ${formattedInserted.length} grocery items successfully`, 
      items: formattedInserted 
    });
  } catch (error: any) {
    console.error('Error generating grocery list:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
