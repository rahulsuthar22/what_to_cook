import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { MealType } from '@/generated/prisma/enums';

// Helper to normalize meal type
function toMealTypeEnum(type: string): MealType {
  const upper = (type || '').toUpperCase();
  if (upper === 'BREAKFAST') return MealType.BREAKFAST;
  if (upper === 'LUNCH') return MealType.LUNCH;
  if (upper === 'DINNER') return MealType.DINNER;
  return MealType.SNACK;
}

// GET /api/planner - Retrieve meal plans for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'user_id query param is required' }, { status: 400 });
    }

    const where: any = { userId };
    if (startDate && endDate) {
      where.mealDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const mealPlans = await prisma.mealPlan.findMany({
      where,
      include: {
        recipe: {
          include: {
            categories: {
              include: {
                category: true,
              },
            },
            nutrition: true,
          },
        },
      },
    });

    // Format output
    const formattedPlans = mealPlans.map(mp => {
      const primaryCategory = mp.recipe?.categories[0]?.category.name || 'General';
      const caloriesVal = mp.recipe?.nutrition?.caloriesKcal ? Number(mp.recipe.nutrition.caloriesKcal) : 0;

      return {
        meal_plan_id: mp.id,
        user_id: mp.userId,
        recipe_id: mp.recipeId,
        meal_type: mp.mealType.charAt(0) + mp.mealType.slice(1).toLowerCase(),
        meal_date: mp.mealDate.toISOString().split('T')[0],
        recipe_name: mp.recipe?.name || 'Recipe',
        category: primaryCategory,
        cooking_time: mp.recipe?.cookTimeMinutes || 0,
        image_url: mp.recipe?.imageUrl || null,
        calories: caloriesVal,
      };
    });

    // Sort by Date, then by Meal Type: Breakfast, Lunch, Dinner, Snack
    const typeOrder: Record<string, number> = { Breakfast: 1, Lunch: 2, Dinner: 3, Snack: 4 };
    formattedPlans.sort((a, b) => {
      if (a.meal_date !== b.meal_date) {
        return a.meal_date.localeCompare(b.meal_date);
      }
      return (typeOrder[a.meal_type] || 5) - (typeOrder[b.meal_type] || 5);
    });

    return NextResponse.json({ success: true, mealPlans: formattedPlans });
  } catch (error: any) {
    console.error('Error fetching meal plans:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/planner - Add a recipe to the meal plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, recipe_id, meal_type, meal_date } = body;

    if (!user_id || !recipe_id || !meal_type || !meal_date) {
      return NextResponse.json(
        { success: false, error: 'Missing fields: user_id, recipe_id, meal_type, meal_date' }, 
        { status: 400 }
      );
    }

    const newPlan = await prisma.mealPlan.create({
      data: {
        userId: user_id,
        recipeId: String(recipe_id),
        mealType: toMealTypeEnum(meal_type),
        mealDate: new Date(meal_date),
      },
    });

    const formattedPlan = {
      meal_plan_id: newPlan.id,
      user_id: newPlan.userId,
      recipe_id: newPlan.recipeId,
      meal_type: newPlan.mealType.charAt(0) + newPlan.mealType.slice(1).toLowerCase(),
      meal_date: newPlan.mealDate.toISOString().split('T')[0],
    };

    return NextResponse.json({ success: true, mealPlan: formattedPlan }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding meal plan:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/planner - Remove a meal plan entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('meal_plan_id');

    if (!planId) {
      return NextResponse.json({ success: false, error: 'meal_plan_id query param is required' }, { status: 400 });
    }

    const deleted = await prisma.mealPlan.delete({
      where: { id: String(planId) },
    });

    return NextResponse.json({ success: true, message: 'Meal plan removed', deletedId: deleted.id });
  } catch (error: any) {
    console.error('Error deleting meal plan:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Meal plan entry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
