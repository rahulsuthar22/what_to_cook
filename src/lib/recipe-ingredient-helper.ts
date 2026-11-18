import { prisma } from '@/config/db';
import { generateSlug, normalizeIngredientName } from '@/lib/ingredient-service';
import { IngredientRole } from '@/generated/prisma/enums';

export interface StructuredIngredientInput {
  id?: string;
  ingredientId?: string;
  ingredient_id?: string;
  name?: string;
  quantity?: number | string | null;
  unitId?: string | null;
  unit_id?: string | null;
  unitSymbol?: string | null;
  unit_symbol?: string | null;
  preparationNote?: string | null;
  preparation_note?: string | null;
  isOptional?: boolean;
  is_optional?: boolean;
  role?: IngredientRole | string | null;
  sortOrder?: number;
}

/**
 * Normalizes input ingredients from either structured UI or legacy text/JSON format,
 * resolves canonical ingredients & units, and inserts into recipe_ingredients inside a transaction.
 */
export async function syncRecipeIngredients(
  tx: any,
  recipeId: string,
  ingredients: StructuredIngredientInput[]
) {
  // 1. Clear existing recipe ingredients for this recipe
  await tx.recipeIngredient.deleteMany({ where: { recipeId } });

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return;
  }

  // Pre-load units for fast symbol matching if needed
  const allUnits = await tx.unit.findMany();
  const unitBySymbol = new Map<string, string>();
  const unitById = new Set<string>();

  for (const u of allUnits) {
    unitById.add(u.id);
    if (u.symbol) unitBySymbol.set(u.symbol.toLowerCase(), u.id);
    unitBySymbol.set(u.name.toLowerCase(), u.id);
  }

  let sortOrder = 1;
  const processedIngredientIds = new Set<string>();

  for (const item of ingredients) {
    let ingredientId = item.ingredientId || item.ingredient_id;
    const rawName = (item.name || '').trim();

    // If no explicit ID, resolve by name or alias
    if (!ingredientId && rawName) {
      const normalized = normalizeIngredientName(rawName);

      // Check canonical name
      const existing = await tx.ingredient.findFirst({
        where: { name: { equals: rawName, mode: 'insensitive' } },
        select: { id: true },
      });

      if (existing) {
        ingredientId = existing.id;
      } else {
        // Check alias
        const aliasMatch = await tx.ingredientAlias.findUnique({
          where: { aliasNormalized: normalized },
          select: { ingredientId: true },
        });

        if (aliasMatch) {
          ingredientId = aliasMatch.ingredientId;
        } else {
          // Create new canonical ingredient
          const newSlug = generateSlug(rawName) || 'ingredient';
          const created = await tx.ingredient.create({
            data: {
              name: rawName,
              slug: `${newSlug}-${Date.now().toString(36)}`,
            },
            select: { id: true },
          });
          ingredientId = created.id;
        }
      }
    }

    if (!ingredientId) continue;

    // Prevent duplicate ingredient in same recipe
    if (processedIngredientIds.has(ingredientId)) continue;
    processedIngredientIds.add(ingredientId);

    // Resolve unit
    let resolvedUnitId: string | null = null;
    const candidateUnitId = item.unitId || item.unit_id;
    if (candidateUnitId && unitById.has(candidateUnitId)) {
      resolvedUnitId = candidateUnitId;
    } else {
      const candidateSymbol = (item.unitSymbol || item.unit_symbol || '').trim().toLowerCase();
      if (candidateSymbol && unitBySymbol.has(candidateSymbol)) {
        resolvedUnitId = unitBySymbol.get(candidateSymbol) || null;
      }
    }

    // Parse quantity
    let parsedQty: number | null = null;
    let prepNote = (item.preparationNote || item.preparation_note || '').trim() || null;

    if (item.quantity !== undefined && item.quantity !== null && item.quantity !== '') {
      const num = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity));
      if (!isNaN(num) && num > 0) {
        parsedQty = num;
      } else if (typeof item.quantity === 'string' && !prepNote) {
        // Legacy fallback: quantity string like "as needed" or "2 pinches"
        prepNote = item.quantity;
      }
    }

    // Parse Role
    let roleEnum: IngredientRole | null = null;
    const rawRole = String(item.role || '').toUpperCase();
    if (rawRole in IngredientRole) {
      roleEnum = rawRole as IngredientRole;
    }

    const isOptional = Boolean(item.isOptional || item.is_optional || roleEnum === IngredientRole.OPTIONAL);

    await tx.recipeIngredient.create({
      data: {
        recipeId,
        ingredientId,
        unitId: resolvedUnitId,
        quantity: parsedQty,
        preparationNote: prepNote,
        isOptional,
        role: roleEnum,
        sortOrder: item.sortOrder || sortOrder++,
      },
    });
  }
}
