import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

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
        recipe: true,
      },
    });

    // Format output
    const formattedPlans = mealPlans.map(mp => ({
      meal_plan_id: mp.id,
      user_id: mp.userId,
      recipe_id: mp.recipeId,
      meal_type: mp.mealType,
      meal_date: mp.mealDate.toISOString().split('T')[0],
      recipe_name: mp.recipe.recipeName,
      category: mp.recipe.category,
      cooking_time: mp.recipe.cookingTime,
      image_url: mp.recipe.imageUrl,
      calories: mp.recipe.calories,
    }));

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
        recipeId: parseInt(recipe_id, 10),
        mealType: meal_type,
        mealDate: new Date(meal_date),
      },
    });

    const formattedPlan = {
      meal_plan_id: newPlan.id,
      user_id: newPlan.userId,
      recipe_id: newPlan.recipeId,
      meal_type: newPlan.mealType,
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
    const mealPlanId = searchParams.get('meal_plan_id');

    if (!mealPlanId) {
      return NextResponse.json({ success: false, error: 'meal_plan_id query param is required' }, { status: 400 });
    }

    const deleted = await prisma.mealPlan.delete({
      where: { id: parseInt(mealPlanId, 10) },
    });

    const formattedDeleted = {
      meal_plan_id: deleted.id,
      user_id: deleted.userId,
    };

    return NextResponse.json({ success: true, message: 'Meal plan entry deleted', deleted: formattedDeleted });
  } catch (error: any) {
    console.error('Error deleting meal plan:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Meal plan entry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
