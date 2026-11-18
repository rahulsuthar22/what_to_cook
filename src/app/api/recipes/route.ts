import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { getVideoUrl } from './[id]/route';
import { RecipeDifficulty, RecipeStatus } from '@/generated/prisma/enums';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

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
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: any = {};
    if (category && category !== 'ALL') {
      where.categories = {
        some: {
          category: {
            name: {
              equals: category,
              mode: 'insensitive',
            },
          },
        },
      };
    }
    if (difficulty && difficulty !== 'ALL') {
      const diffUpper = difficulty.toUpperCase();
      if (diffUpper in RecipeDifficulty) {
        where.difficulty = diffUpper as RecipeDifficulty;
      }
    }
    if (search && search.trim()) {
      where.name = {
        contains: search.trim(),
        mode: 'insensitive',
      };
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sort === 'name_desc') {
      orderBy = { name: 'desc' };
    } else if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'time_asc') {
      orderBy = { cookTimeMinutes: 'asc' };
    } else if (sort === 'time_desc') {
      orderBy = { cookTimeMinutes: 'desc' };
    }

    const [total, recipes, categoryRecords] = await Promise.all([
      prisma.recipe.count({ where }),
      prisma.recipe.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
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
      }),
      prisma.category.findMany({
        select: { name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    // Transform relation output to match original expected format in frontend components
    const formattedRecipes = recipes.map(r => {
      const primaryCategory = r.categories?.[0]?.category?.name || 'Uncategorized';
      const cookTime = (r.prepTimeMinutes || 0) + (r.cookTimeMinutes || 0) || r.cookTimeMinutes || 0;
      const difficultyStr = r.difficulty 
        ? r.difficulty.charAt(0) + r.difficulty.slice(1).toLowerCase() 
        : 'Easy';
      const instructionsStr = r.steps && r.steps.length > 0
        ? r.steps.map(s => s.instruction).join('\n')
        : (r.description || '');

      return {
        recipe_id: r.id,
        recipe_name: r.name,
        category: primaryCategory,
        cooking_time: cookTime,
        difficulty_level: difficultyStr,
        instructions: instructionsStr,
        image_url: r.imageUrl,
        calories: r.nutrition?.caloriesKcal ? Number(r.nutrition.caloriesKcal) : 0,
        protein: r.nutrition?.proteinG ? Number(r.nutrition.proteinG) : 0,
        carbs: r.nutrition?.carbohydratesG ? Number(r.nutrition.carbohydratesG) : 0,
        fat: r.nutrition?.fatG ? Number(r.nutrition.fatG) : 0,
        fiber: r.nutrition?.fibreG ? Number(r.nutrition.fibreG) : 0,
        vitamins: (r.metadata as any)?.vitamins || null,
        video_url: r.videoUrl || getVideoUrl(r.name),
        created_at: r.createdAt.toISOString(),
        ingredients: r.ingredients.map(ri => {
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
    });

    return NextResponse.json({
      success: true,
      recipes: formattedRecipes,
      total,
      limit,
      offset,
      categories: categoryRecords.map(c => c.name),
    });
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

    let diffEnum: RecipeDifficulty = RecipeDifficulty.EASY;
    if (difficulty_level) {
      const upper = difficulty_level.toUpperCase();
      if (upper in RecipeDifficulty) {
        diffEnum = upper as RecipeDifficulty;
      }
    }

    const baseSlug = slugify(recipe_name) || 'recipe';
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.recipe.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const cookTime = parseInt(cooking_time || '0', 10);
    const caloriesVal = parseInt(calories || '0', 10);
    const proteinVal = parseFloat(protein || '0');
    const carbsVal = parseFloat(carbs || '0');
    const fatVal = parseFloat(fat || '0');
    const fiberVal = parseFloat(fiber || '0');

    // Prisma Transaction ensures atomic consistency
    const resultRecipe = await prisma.$transaction(async (tx) => {
      // 1. Create base recipe
      const newRecipe = await tx.recipe.create({
        data: {
          name: recipe_name,
          slug,
          description: typeof instructions === 'string' ? instructions.slice(0, 250) : null,
          imageUrl: image_url || null,
          cookTimeMinutes: cookTime,
          prepTimeMinutes: 0,
          difficulty: diffEnum,
          status: RecipeStatus.PUBLISHED,
          publishedAt: new Date(),
          metadata: vitamins ? { vitamins } : undefined,
        },
      });

      // 2. Link category if provided
      if (category) {
        const catSlug = slugify(category);
        const catRecord = await tx.category.upsert({
          where: { name: category },
          update: {},
          create: {
            name: category,
            slug: catSlug,
          },
        });

        await tx.recipeCategory.create({
          data: {
            recipeId: newRecipe.id,
            categoryId: catRecord.id,
          },
        });
      }

      // 3. Create recipe steps from instructions
      const stepLines = typeof instructions === 'string'
        ? instructions.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
        : [];

      if (stepLines.length > 0) {
        for (let i = 0; i < stepLines.length; i++) {
          await tx.recipeStep.create({
            data: {
              recipeId: newRecipe.id,
              stepNumber: i + 1,
              instruction: stepLines[i],
            },
          });
        }
      } else {
        await tx.recipeStep.create({
          data: {
            recipeId: newRecipe.id,
            stepNumber: 1,
            instruction: String(instructions),
          },
        });
      }

      // 4. Create nutrition if provided
      if (caloriesVal || proteinVal || carbsVal || fatVal || fiberVal) {
        await tx.recipeNutrition.create({
          data: {
            recipeId: newRecipe.id,
            caloriesKcal: caloriesVal,
            proteinG: proteinVal,
            carbohydratesG: carbsVal,
            fatG: fatVal,
            fibreG: fiberVal,
          },
        });
      }

      // 5. Process ingredients if provided
      if (ingredients && Array.isArray(ingredients)) {
        let sortOrder = 1;
        for (const ing of ingredients as IngredientInput[]) {
          if (!ing.name) continue;

          const ingSlug = slugify(ing.name);
          const ingredient = await tx.ingredient.upsert({
            where: { name: ing.name },
            update: {},
            create: {
              name: ing.name,
              slug: ingSlug,
            },
          });

          await tx.recipeIngredient.create({
            data: {
              recipeId: newRecipe.id,
              ingredientId: ingredient.id,
              preparationNote: ing.quantity || 'as needed',
              sortOrder: sortOrder++,
            },
          });
        }
      }

      return newRecipe;
    });

    // Format output
    const formattedRecipe = {
      recipe_id: resultRecipe.id,
      recipe_name: resultRecipe.name,
      category: category || 'Uncategorized',
      cooking_time: resultRecipe.cookTimeMinutes,
      difficulty_level: difficulty_level || 'Easy',
      instructions,
      image_url: resultRecipe.imageUrl,
      calories: caloriesVal,
      protein: proteinVal,
      carbs: carbsVal,
      fat: fatVal,
      fiber: fiberVal,
      vitamins: vitamins || null,
    };

    return NextResponse.json({ success: true, recipe: formattedRecipe }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating recipe:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
