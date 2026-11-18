import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { RecipeDifficulty } from '@/generated/prisma/enums';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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

// PUT /api/recipes/[id] - Update an existing recipe (Admin Panel)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const recipeId = resolvedParams.id;

    if (!recipeId) {
      return NextResponse.json({ success: false, error: 'Invalid recipe ID' }, { status: 400 });
    }

    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Recipe not found' }, { status: 404 });
    }

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
      ingredients,
    } = body;

    if (!recipe_name || !instructions) {
      return NextResponse.json(
        { success: false, error: 'Recipe name and instructions are required.' },
        { status: 400 }
      );
    }

    let diffEnum: RecipeDifficulty = RecipeDifficulty.EASY;
    if (difficulty_level) {
      const upper = difficulty_level.toUpperCase();
      if (upper in RecipeDifficulty) {
        diffEnum = upper as RecipeDifficulty;
      }
    }

    const cookTime = parseInt(cooking_time || '0', 10);
    const caloriesVal = parseInt(calories || '0', 10);
    const proteinVal = parseFloat(protein || '0');
    const carbsVal = parseFloat(carbs || '0');
    const fatVal = parseFloat(fat || '0');
    const fiberVal = parseFloat(fiber || '0');

    // Atomic transaction for clean relation updates
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update base recipe
      const recipe = await tx.recipe.update({
        where: { id: recipeId },
        data: {
          name: recipe_name,
          description: typeof instructions === 'string' ? instructions.slice(0, 250) : null,
          imageUrl: image_url || null,
          cookTimeMinutes: cookTime,
          difficulty: diffEnum,
        },
      });

      // 2. Update category if provided
      if (category && category.trim()) {
        const catName = category.trim();
        const catSlug = slugify(catName) || 'general';
        const catRecord = await tx.category.upsert({
          where: { name: catName },
          update: {},
          create: {
            name: catName,
            slug: catSlug,
          },
        });

        // Reconnect category
        await tx.recipeCategory.deleteMany({ where: { recipeId } });
        await tx.recipeCategory.create({
          data: {
            recipeId,
            categoryId: catRecord.id,
          },
        });
      }

      // 3. Update instructions/steps
      const stepLines = typeof instructions === 'string'
        ? instructions.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [];

      await tx.recipeStep.deleteMany({ where: { recipeId } });
      if (stepLines.length > 0) {
        for (let i = 0; i < stepLines.length; i++) {
          await tx.recipeStep.create({
            data: {
              recipeId,
              stepNumber: i + 1,
              instruction: stepLines[i],
            },
          });
        }
      } else {
        await tx.recipeStep.create({
          data: {
            recipeId,
            stepNumber: 1,
            instruction: String(instructions),
          },
        });
      }

      // 4. Update nutrition
      await tx.recipeNutrition.deleteMany({ where: { recipeId } });
      if (caloriesVal || proteinVal || carbsVal || fatVal || fiberVal) {
        await tx.recipeNutrition.create({
          data: {
            recipeId,
            caloriesKcal: caloriesVal,
            proteinG: proteinVal,
            carbohydratesG: carbsVal,
            fatG: fatVal,
            fibreG: fiberVal,
          },
        });
      }

      // 5. Update ingredients
      if (ingredients && Array.isArray(ingredients)) {
        await tx.recipeIngredient.deleteMany({ where: { recipeId } });

        let sortOrder = 1;
        for (const ing of ingredients) {
          if (!ing.name || !ing.name.trim()) continue;

          const ingName = ing.name.trim();
          const ingSlug = slugify(ingName) || 'ingredient';

          const ingredientRecord = await tx.ingredient.upsert({
            where: { name: ingName },
            update: {},
            create: {
              name: ingName,
              slug: ingSlug,
            },
          });

          await tx.recipeIngredient.create({
            data: {
              recipeId,
              ingredientId: ingredientRecord.id,
              sortOrder: sortOrder++,
              preparationNote: ing.quantity || 'as needed',
            },
          });
        }
      }

      return recipe;
    });

    return NextResponse.json({
      success: true,
      message: 'Recipe updated successfully',
      recipe: {
        recipe_id: updated.id,
        recipe_name: updated.name,
      },
    });
  } catch (error: any) {
    console.error('Error updating recipe:', error);
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
