import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export function getVideoUrl(recipeName: string): string {
  const name = recipeName.toLowerCase();
  if (name.includes('paneer butter masala')) return 'https://www.youtube.com/embed/S2G4d5W9gUY';
  if (name.includes('fried rice')) return 'https://www.youtube.com/embed/t_KcrgJ8q6s';
  if (name.includes('tomato soup')) return 'https://www.youtube.com/embed/sA7stV4r-aE';
  if (name.includes('aloo jeera')) return 'https://www.youtube.com/embed/c0JjHiaf-0A';
  if (name.includes('spinach') || name.includes('palak')) return 'https://www.youtube.com/embed/f4_jK3Pz24w';
  if (name.includes('paneer bhurji')) return 'https://www.youtube.com/embed/H0dZ7E2B0tU';
  if (name.includes('egg bhurji')) return 'https://www.youtube.com/embed/aEszS82987E';
  if (name.includes('butter chicken')) return 'https://www.youtube.com/embed/a03U45jFxOI';
  if (name.includes('salad')) return 'https://www.youtube.com/embed/U33e8bY4v-Q';
  return 'https://www.youtube.com/embed/w77zP6-oXgI';
}

// GET /api/recipes/[id] - Fetch detailed recipe by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id, 10);

    if (isNaN(recipeId)) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ success: false, error: 'Recipe not found' }, { status: 404 });
    }

    const formattedRecipe = {
      recipe_id: recipe.id,
      recipe_name: recipe.recipeName,
      category: recipe.category,
      cooking_time: recipe.cookingTime,
      difficulty_level: recipe.difficultyLevel,
      instructions: recipe.instructions,
      image_url: recipe.imageUrl,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fat: recipe.fat,
      fiber: recipe.fiber,
      vitamins: recipe.vitamins,
      video_url: getVideoUrl(recipe.recipeName),
      ingredients: recipe.recipeIngredients.map(ri => ({
        name: ri.ingredient.ingredientName,
        category: ri.ingredient.category,
        quantity: ri.quantity,
      })),
    };

    return NextResponse.json({ success: true, recipe: formattedRecipe });
  } catch (error: any) {
    console.error('Error fetching recipe by ID:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/recipes/[id] - Delete a recipe (Admin Panel)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = parseInt(resolvedParams.id, 10);

    if (isNaN(recipeId)) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const deleted = await prisma.recipe.delete({
      where: { id: recipeId },
    });

    const formattedDeleted = {
      recipe_id: deleted.id,
      recipe_name: deleted.recipeName,
      category: deleted.category,
    };

    return NextResponse.json({ 
      success: true, 
      message: 'Recipe deleted successfully', 
      recipe: formattedDeleted 
    });
  } catch (error: any) {
    console.error('Error deleting recipe:', error);
    // Handle Prisma record not found error (P2025)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
