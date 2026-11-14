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
    const recipeId = resolvedParams.id;

    if (!recipeId) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
        steps: {
          orderBy: {
            stepNumber: 'asc',
          },
        },
        nutrition: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ success: false, error: 'Recipe not found' }, { status: 404 });
    }

    const primaryCategory = recipe.categories?.[0]?.category?.name || 'Uncategorized';
    const cookTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0) || recipe.cookTimeMinutes || 0;
    const difficultyStr = recipe.difficulty 
      ? recipe.difficulty.charAt(0) + recipe.difficulty.slice(1).toLowerCase() 
      : 'Easy';
    const instructionsStr = recipe.steps && recipe.steps.length > 0
      ? recipe.steps.map(s => s.instruction).join('\n')
      : (recipe.description || '');

    const formattedRecipe = {
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      category: primaryCategory,
      cooking_time: cookTime,
      difficulty_level: difficultyStr,
      instructions: instructionsStr,
      image_url: recipe.imageUrl,
      calories: recipe.nutrition?.caloriesKcal ? Number(recipe.nutrition.caloriesKcal) : 0,
      protein: recipe.nutrition?.proteinG ? Number(recipe.nutrition.proteinG) : 0,
      carbs: recipe.nutrition?.carbohydratesG ? Number(recipe.nutrition.carbohydratesG) : 0,
      fat: recipe.nutrition?.fatG ? Number(recipe.nutrition.fatG) : 0,
      fiber: recipe.nutrition?.fibreG ? Number(recipe.nutrition.fibreG) : 0,
      vitamins: (recipe.metadata as any)?.vitamins || null,
      video_url: recipe.videoUrl || getVideoUrl(recipe.name),
      ingredients: recipe.ingredients.map(ri => {
        const qtyVal = ri.quantity ? Number(ri.quantity) : '';
        const unitSymbol = ri.unit?.symbol || ri.unit?.name || '';
        const formattedQty = `${qtyVal} ${unitSymbol}`.trim() || ri.preparationNote || 'as needed';
        return {
          name: ri.ingredient.name,
          category: 'Pantry',
          quantity: formattedQty,
        };
      }),
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
    const recipeId = resolvedParams.id;

    if (!recipeId) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const deleted = await prisma.recipe.delete({
      where: { id: recipeId },
    });

    const formattedDeleted = {
      recipe_id: deleted.id,
      recipe_name: deleted.name,
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
