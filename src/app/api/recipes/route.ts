import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getVideoUrl } from './[id]/route';

interface IngredientInput {
  name: string;
  category?: string;
  quantity?: string;
}

// GET /api/recipes - Fetch recipes with optional query filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (difficulty) {
      where.difficultyLevel = difficulty;
    }

    const recipes = await prisma.recipe.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: {
        recipeName: 'asc',
      },
      include: {
        recipeIngredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    // Transform relation output to match original expected format in frontend components
    const formattedRecipes = recipes.map(r => ({
      recipe_id: r.id,
      recipe_name: r.recipeName,
      category: r.category,
      cooking_time: r.cookingTime,
      difficulty_level: r.difficultyLevel,
      instructions: r.instructions,
      image_url: r.imageUrl,
      calories: r.calories,
      protein: r.protein,
      carbs: r.carbs,
      fat: r.fat,
      fiber: r.fiber,
      vitamins: r.vitamins,
      video_url: getVideoUrl(r.recipeName),
      ingredients: r.recipeIngredients.map(ri => ({
        name: ri.ingredient.ingredientName,
        category: ri.ingredient.category,
        quantity: ri.quantity,
      })),
    }));

    return NextResponse.json({ success: true, recipes: formattedRecipes });
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/recipes - Create a new recipe (Admin Dashboard)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      recipe_name, 
      category, 
      cooking_time, 
      difficulty_level, 
      instructions, 
      image_url, 
      calories, 
      protein,
      carbs,
      fat,
      fiber,
      vitamins,
      ingredients 
    } = body;

    if (!recipe_name || !instructions) {
      return NextResponse.json(
        { success: false, error: 'Recipe name and instructions are required' }, 
        { status: 400 }
      );
    }

    // Prisma Transaction ensures atomic consistency
    const resultRecipe = await prisma.$transaction(async (tx) => {
      // 1. Create the recipe
      const newRecipe = await tx.recipe.create({
        data: {
          recipeName: recipe_name,
          category: category || 'Uncategorized',
          cookingTime: parseInt(cooking_time || '0', 10),
          difficultyLevel: difficulty_level || 'Easy',
          instructions,
          imageUrl: image_url || null,
          calories: parseInt(calories || '0', 10),
          protein: parseFloat(protein || '0'),
          carbs: parseFloat(carbs || '0'),
          fat: parseFloat(fat || '0'),
          fiber: parseFloat(fiber || '0'),
          vitamins: vitamins || null,
        },
      });

      // 2. Process ingredients if provided
      if (ingredients && Array.isArray(ingredients)) {
        for (const ing of ingredients as IngredientInput[]) {
          if (!ing.name) continue;

          // Upsert ingredient
          const ingredient = await tx.ingredient.upsert({
            where: { ingredientName: ing.name },
            update: {},
            create: {
              ingredientName: ing.name,
              category: ing.category || 'Pantry',
            },
          });

          // Insert into junction table
          await tx.recipeIngredient.create({
            data: {
              recipeId: newRecipe.id,
              ingredientId: ingredient.id,
              quantity: ing.quantity || 'as needed',
            },
          });
        }
      }

      return newRecipe;
    });

    // Format output
    const formattedRecipe = {
      recipe_id: resultRecipe.id,
      recipe_name: resultRecipe.recipeName,
      category: resultRecipe.category,
      cooking_time: resultRecipe.cookingTime,
      difficulty_level: resultRecipe.difficultyLevel,
      instructions: resultRecipe.instructions,
      image_url: resultRecipe.imageUrl,
      calories: resultRecipe.calories,
      protein: resultRecipe.protein,
      carbs: resultRecipe.carbs,
      fat: resultRecipe.fat,
      fiber: resultRecipe.fiber,
      vitamins: resultRecipe.vitamins,
    };

    return NextResponse.json({ success: true, recipe: formattedRecipe }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
