import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { RecipeDifficulty, RecipeStatus } from '@/generated/prisma/enums';
import { normalizeRecipe, validateRecipe, NormalizedRecipe } from '@/lib/recipe-templates';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawRecipes = body.recipes;
    const duplicateStrategy: 'skip' | 'update' | 'copy' = body.duplicateStrategy || 'skip';

    if (!Array.isArray(rawRecipes) || rawRecipes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'A non-empty "recipes" array is required for batch import.' },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;
    const errors: Array<{ index: number; name: string; error: string }> = [];
    const importedIds: string[] = [];

    for (let i = 0; i < rawRecipes.length; i++) {
      const raw = rawRecipes[i];
      const normalized: NormalizedRecipe = normalizeRecipe(raw);
      const validation = validateRecipe(normalized);

      if (!validation.valid) {
        failedCount++;
        errors.push({
          index: i + 1,
          name: normalized.name || `Recipe #${i + 1}`,
          error: validation.errors.join('; '),
        });
        continue;
      }

      const baseSlug = slugify(normalized.name) || `recipe-${Date.now()}`;
      const existingRecipe = await prisma.recipe.findUnique({
        where: { slug: baseSlug },
      });

      if (existingRecipe) {
        if (duplicateStrategy === 'skip') {
          skippedCount++;
          continue;
        }
      }

      // Determine final slug
      let finalSlug = baseSlug;
      if (existingRecipe && duplicateStrategy === 'copy') {
        let counter = 1;
        while (await prisma.recipe.findUnique({ where: { slug: `${baseSlug}-copy-${counter}` } })) {
          counter++;
        }
        finalSlug = `${baseSlug}-copy-${counter}`;
      }

      // Map difficulty enum
      let diffEnum: RecipeDifficulty = RecipeDifficulty.EASY;
      if (normalized.difficulty === 'Medium') diffEnum = RecipeDifficulty.MEDIUM;
      if (normalized.difficulty === 'Hard') diffEnum = RecipeDifficulty.HARD;

      try {
        const result = await prisma.$transaction(async (tx) => {
          let recipeRecord;

          if (existingRecipe && duplicateStrategy === 'update') {
            // Update existing recipe record
            recipeRecord = await tx.recipe.update({
              where: { id: existingRecipe.id },
              data: {
                name: normalized.name,
                description: normalized.description || normalized.instructions[0]?.slice(0, 250) || null,
                imageUrl: normalized.imageUrl || existingRecipe.imageUrl,
                cookTimeMinutes: normalized.cookingTime,
                prepTimeMinutes: normalized.prepTime || 0,
                servings: normalized.servings || 4,
                difficulty: diffEnum,
                status: RecipeStatus.PUBLISHED,
                publishedAt: existingRecipe.publishedAt || new Date(),
              },
            });

            // Clean up existing steps and relation links to overwrite with imported data
            await tx.recipeStep.deleteMany({ where: { recipeId: recipeRecord.id } });
            await tx.recipeIngredient.deleteMany({ where: { recipeId: recipeRecord.id } });
            await tx.recipeNutrition.deleteMany({ where: { recipeId: recipeRecord.id } });
            await tx.recipeCategory.deleteMany({ where: { recipeId: recipeRecord.id } });
          } else {
            // Create brand new recipe
            recipeRecord = await tx.recipe.create({
              data: {
                name: normalized.name,
                slug: finalSlug,
                description: normalized.description || normalized.instructions[0]?.slice(0, 250) || null,
                imageUrl: normalized.imageUrl || null,
                cookTimeMinutes: normalized.cookingTime,
                prepTimeMinutes: normalized.prepTime || 0,
                servings: normalized.servings || 4,
                difficulty: diffEnum,
                status: RecipeStatus.PUBLISHED,
                publishedAt: new Date(),
              },
            });
          }

          // 1. Link or create category
          if (normalized.category) {
            const catSlug = slugify(normalized.category) || 'general';
            const catRecord = await tx.category.upsert({
              where: { name: normalized.category },
              update: {},
              create: {
                name: normalized.category,
                slug: catSlug,
              },
            });

            await tx.recipeCategory.create({
              data: {
                recipeId: recipeRecord.id,
                categoryId: catRecord.id,
              },
            });
          }

          // 2. Insert recipe steps
          for (let stepIdx = 0; stepIdx < normalized.instructions.length; stepIdx++) {
            await tx.recipeStep.create({
              data: {
                recipeId: recipeRecord.id,
                stepNumber: stepIdx + 1,
                instruction: normalized.instructions[stepIdx],
              },
            });
          }

          // 3. Insert nutrition if available
          if (normalized.calories || normalized.protein || normalized.carbs || normalized.fat) {
            await tx.recipeNutrition.create({
              data: {
                recipeId: recipeRecord.id,
                caloriesKcal: normalized.calories || undefined,
                proteinG: normalized.protein || undefined,
                carbohydratesG: normalized.carbs || undefined,
                fatG: normalized.fat || undefined,
                fibreG: normalized.fiber || undefined,
              },
            });
          }

          // 4. Upsert ingredients and link
          let sortOrder = 1;
          for (const ing of normalized.ingredients) {
            if (!ing.name) continue;
            const ingSlug = slugify(ing.name) || `ingredient-${Date.now()}`;
            const ingredientRecord = await tx.ingredient.upsert({
              where: { name: ing.name },
              update: {},
              create: {
                name: ing.name,
                slug: ingSlug,
              },
            });

            await tx.recipeIngredient.create({
              data: {
                recipeId: recipeRecord.id,
                ingredientId: ingredientRecord.id,
                preparationNote: ing.quantity || 'as needed',
                sortOrder: sortOrder++,
              },
            });
          }

          return recipeRecord;
        });

        importedCount++;
        importedIds.push(result.id);
      } catch (insertError: unknown) {
        failedCount++;
        const msg = insertError instanceof Error ? insertError.message : String(insertError);
        errors.push({
          index: i + 1,
          name: normalized.name,
          error: msg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total: rawRecipes.length,
      importedCount,
      skippedCount,
      failedCount,
      errors,
      importedIds,
      message: `Processed ${rawRecipes.length} recipes: ${importedCount} imported, ${skippedCount} skipped, ${failedCount} failed.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error during batch recipe import:', msg);
    return NextResponse.json(
      { success: false, error: msg || 'An error occurred during recipe batch import.' },
      { status: 500 }
    );
  }
}

