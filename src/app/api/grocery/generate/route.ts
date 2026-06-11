import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

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
            recipeIngredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
      },
    });

    // 2. Aggregate all required ingredients (avoiding duplicates)
    const neededIngredientsMap = new Map<string, { originalName: string; quantity: string }>();
    for (const plan of mealPlans) {
      for (const ri of plan.recipe.recipeIngredients) {
        const name = ri.ingredient.ingredientName;
        neededIngredientsMap.set(name.toLowerCase(), {
          originalName: name,
          quantity: ri.quantity || 'as needed',
        });
      }
    }

    // 3. Find current items in the user's grocery list
    const existingGrocery = await prisma.groceryList.findMany({
      where: { userId: user_id },
      select: { ingredientName: true },
    });
    const existingNamesSet = new Set(existingGrocery.map(g => g.ingredientName.trim().toLowerCase()));

    // 4. Filter out items already on the list
    const missingIngredients: { name: string; quantity: string }[] = [];
    neededIngredientsMap.forEach((details, nameLower) => {
      if (!existingNamesSet.has(nameLower)) {
        missingIngredients.push({
          name: details.originalName,
          quantity: details.quantity,
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
        prisma.groceryList.create({
          data: {
            userId: user_id,
            ingredientName: item.name,
            quantity: item.quantity,
            status: 'Pending',
          },
        })
      )
    );

    const formattedInserted = insertedItems.map(item => ({
      grocery_id: item.id,
      user_id: item.userId,
      ingredient_name: item.ingredientName,
      quantity: item.quantity,
      status: item.status,
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
