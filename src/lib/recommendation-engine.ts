import { prisma } from '@/config/db';
import { RecipeStatus, RecipeDifficulty } from '@/generated/prisma/enums';
import { normalizeIngredientName } from '@/lib/ingredient-service';

export interface RecommendationParams {
  ingredientIds?: string[];
  ingredientNames?: string[];
  userId?: string;
  preferences?: {
    maxCookingTime?: number;
    category?: string;
    difficulty?: string;
  };
  options?: {
    allowMissingIngredients?: boolean;
    limit?: number;
    offset?: number;
  };
}

export interface IngredientMatchDetail {
  id: string;
  name: string;
  quantity: string;
  role: string;
  isOptional: boolean;
  matched: boolean;
}

export interface RecommendedRecipeResult {
  recipe_id: string;
  recipe_name: string;
  slug: string;
  category: string;
  cooking_time: number;
  difficulty_level: string;
  image_url: string | null;
  video_url: string | null;
  calories: number;
  instructions: string;
  match_percentage: number;
  classification: 'COOK_NOW' | 'ALMOST_READY' | 'NEED_INGREDIENTS';
  total_ingredients_needed: number;
  matched_ingredients_count: number;
  missing_ingredients_count: number;
  missing_main_count: number;
  available_ingredients: IngredientMatchDetail[];
  missing_ingredients: IngredientMatchDetail[];
  optional_ingredients: IngredientMatchDetail[];
  pantry_staples: IngredientMatchDetail[];
  ingredients_details: Array<{
    name: string;
    quantity: string;
    matched: boolean;
  }>;
}

// Weights assigned by ingredient role
const ROLE_WEIGHTS: Record<string, number> = {
  MAIN: 5,
  SECONDARY: 3,
  FLAVORING: 1,
  GARNISH: 1,
  PANTRY_STAPLE: 0, // Not penalized if user has basic staples
  OPTIONAL: 0,      // Excluded from required denominator
};

/**
 * Advanced weighted recipe recommendation engine.
 * Computes exact match percentages, role importance, and classifications.
 */
export async function getRecipeRecommendations(
  params: RecommendationParams
): Promise<RecommendedRecipeResult[]> {
  const {
    ingredientIds = [],
    ingredientNames = [],
    userId,
    preferences = {},
    options = {},
  } = params;

  const targetIngredientIds = new Set<string>();
  const targetNormalizedNames = new Set<string>();

  // 1. Add direct IDs
  for (const id of ingredientIds) {
    if (id && typeof id === 'string') targetIngredientIds.add(id.trim());
  }

  // 2. If userId provided, include their pantry ingredients
  if (userId) {
    const pantryItems = await prisma.userPantryItem.findMany({
      where: { userId },
      select: { ingredientId: true, ingredient: { select: { name: true } } },
    });
    for (const p of pantryItems) {
      targetIngredientIds.add(p.ingredientId);
      targetNormalizedNames.add(normalizeIngredientName(p.ingredient.name));
    }
  }

  // 3. Resolve names & aliases
  for (const rawName of ingredientNames) {
    if (!rawName || typeof rawName !== 'string') continue;
    const normalized = normalizeIngredientName(rawName);
    targetNormalizedNames.add(normalized);

    // Look up canonical ingredient
    const found = await prisma.ingredient.findFirst({
      where: { name: { equals: rawName.trim(), mode: 'insensitive' } },
      select: { id: true },
    });
    if (found) {
      targetIngredientIds.add(found.id);
    } else {
      // Look up alias
      const aliasMatch = await prisma.ingredientAlias.findUnique({
        where: { aliasNormalized: normalized },
        select: { ingredientId: true },
      });
      if (aliasMatch) {
        targetIngredientIds.add(aliasMatch.ingredientId);
      }
    }
  }

  if (targetIngredientIds.size === 0 && targetNormalizedNames.size === 0) {
    return [];
  }

  // 4. Query published recipes with filters
  const where: Record<string, unknown> = {
    status: RecipeStatus.PUBLISHED,
  };

  if (preferences.maxCookingTime && preferences.maxCookingTime > 0) {
    where.cookTimeMinutes = { lte: preferences.maxCookingTime };
  }

  if (preferences.category && preferences.category !== 'ALL' && preferences.category !== 'All') {
    where.categories = {
      some: {
        category: {
          name: { equals: preferences.category, mode: 'insensitive' },
        },
      },
    };
  }

  if (preferences.difficulty && preferences.difficulty !== 'ALL') {
    const diffUpper = preferences.difficulty.toUpperCase();
    if (diffUpper in RecipeDifficulty) {
      where.difficulty = diffUpper as RecipeDifficulty;
    }
  }

  const recipes = await prisma.recipe.findMany({
    where,
    include: {
      ingredients: {
        include: {
          ingredient: {
            include: {
              aliases: { select: { aliasNormalized: true } },
            },
          },
          unit: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      steps: {
        orderBy: { stepNumber: 'asc' },
      },
      nutrition: true,
      categories: {
        include: { category: true },
      },
    },
  });

  const scoredRecipes: RecommendedRecipeResult[] = [];

  for (const recipe of recipes) {
    if (!recipe.ingredients || recipe.ingredients.length === 0) continue;

    let totalRequiredWeight = 0;
    let matchedRequiredWeight = 0;
    let matchedIngredientsCount = 0;
    let missingMainCount = 0;

    const availableIngredients: IngredientMatchDetail[] = [];
    const missingIngredients: IngredientMatchDetail[] = [];
    const optionalIngredients: IngredientMatchDetail[] = [];
    const pantryStaples: IngredientMatchDetail[] = [];
    const legacyDetails: Array<{ name: string; quantity: string; matched: boolean }> = [];

    for (const ri of recipe.ingredients) {
      const ingName = ri.ingredient.name;
      const normalizedIngName = normalizeIngredientName(ingName);
      const isIdMatched = targetIngredientIds.has(ri.ingredientId);
      const isNameMatched =
        targetNormalizedNames.has(normalizedIngName) ||
        ri.ingredient.aliases.some((a) => targetNormalizedNames.has(a.aliasNormalized));

      const isMatched = isIdMatched || isNameMatched;

      const qtyVal = ri.quantity ? Number(ri.quantity) : '';
      const unitSym = ri.unit?.symbol || ri.unit?.name || '';
      const formattedQty = `${qtyVal} ${unitSym}`.trim() || ri.preparationNote || 'as needed';

      const roleStr = ri.role ? String(ri.role) : (ri.isOptional ? 'OPTIONAL' : 'MAIN');
      const isOptional = ri.isOptional || roleStr === 'OPTIONAL';
      const isStaple = roleStr === 'PANTRY_STAPLE';

      const detail: IngredientMatchDetail = {
        id: ri.ingredientId,
        name: ingName,
        quantity: formattedQty,
        role: roleStr,
        isOptional,
        matched: isMatched,
      };

      legacyDetails.push({
        name: ingName,
        quantity: formattedQty,
        matched: isMatched,
      });

      if (isStaple) {
        pantryStaples.push(detail);
      } else if (isOptional) {
        optionalIngredients.push(detail);
      } else {
        // Required ingredient
        const weight = ROLE_WEIGHTS[roleStr] !== undefined ? ROLE_WEIGHTS[roleStr] : 3;
        totalRequiredWeight += weight;

        if (isMatched) {
          matchedRequiredWeight += weight;
          matchedIngredientsCount++;
          availableIngredients.push(detail);
        } else {
          missingIngredients.push(detail);
          if (roleStr === 'MAIN') {
            missingMainCount++;
          }
        }
      }
    }

    // Must match at least 1 ingredient to be recommended
    if (matchedIngredientsCount === 0 && !availableIngredients.some((i) => i.matched)) {
      continue;
    }

    // Match percentage calculation
    const matchPercentage =
      totalRequiredWeight > 0
        ? Math.min(100, Math.round((matchedRequiredWeight / totalRequiredWeight) * 100))
        : 100;

    // Classification
    let classification: 'COOK_NOW' | 'ALMOST_READY' | 'NEED_INGREDIENTS' = 'NEED_INGREDIENTS';
    if (matchPercentage >= 85 && missingMainCount === 0 && missingIngredients.length <= 1) {
      classification = 'COOK_NOW';
    } else if (matchPercentage >= 50 && missingMainCount <= 1 && missingIngredients.length <= 3) {
      classification = 'ALMOST_READY';
    }

    const primaryCategory = recipe.categories?.[0]?.category?.name || 'General';
    const cookTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0) || recipe.cookTimeMinutes || 0;
    const diffStr = recipe.difficulty
      ? recipe.difficulty.charAt(0) + recipe.difficulty.slice(1).toLowerCase()
      : 'Easy';
    const instructionsStr =
      recipe.steps && recipe.steps.length > 0
        ? recipe.steps.map((s) => s.instruction).join('\n')
        : recipe.description || '';

    scoredRecipes.push({
      recipe_id: recipe.id,
      recipe_name: recipe.name,
      slug: recipe.slug,
      category: primaryCategory,
      cooking_time: cookTime,
      difficulty_level: diffStr,
      image_url: recipe.imageUrl,
      video_url: recipe.videoUrl,
      calories: recipe.nutrition?.caloriesKcal ? Number(recipe.nutrition.caloriesKcal) : 0,
      instructions: instructionsStr,
      match_percentage: matchPercentage,
      classification,
      total_ingredients_needed: recipe.ingredients.length,
      matched_ingredients_count: matchedIngredientsCount,
      missing_ingredients_count: missingIngredients.length,
      missing_main_count: missingMainCount,
      available_ingredients: availableIngredients,
      missing_ingredients: missingIngredients,
      optional_ingredients: optionalIngredients,
      pantry_staples: pantryStaples,
      ingredients_details: legacyDetails,
    });
  }

  // 7. Sort:
  // 1. match_percentage DESC
  // 2. missing_main_count ASC
  // 3. missing_ingredients_count ASC
  // 4. cooking_time ASC
  scoredRecipes.sort((a, b) => {
    if (b.match_percentage !== a.match_percentage) {
      return b.match_percentage - a.match_percentage;
    }
    if (a.missing_main_count !== b.missing_main_count) {
      return a.missing_main_count - b.missing_main_count;
    }
    if (a.missing_ingredients_count !== b.missing_ingredients_count) {
      return a.missing_ingredients_count - b.missing_ingredients_count;
    }
    return a.cooking_time - b.cooking_time;
  });

  const limit = options.limit || 50;
  const offset = options.offset || 0;
  return scoredRecipes.slice(offset, offset + limit);
}
