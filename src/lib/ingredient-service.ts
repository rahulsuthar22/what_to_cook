import { prisma } from '@/config/db';

export function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface IngredientSearchParams {
  search?: string;
  categoryId?: string;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
  sort?: 'name' | 'newest' | 'oldest';
}

/**
 * Searches ingredients matching canonical name OR any of its aliases.
 * Supports partial matching, case-insensitivity, and category filtering.
 */
export async function searchIngredients(params: IngredientSearchParams) {
  const {
    search = '',
    categoryId,
    activeOnly = true,
    limit = 25,
    offset = 0,
    sort = 'name',
  } = params;

  const normalizedSearch = normalizeIngredientName(search);

  // Build where condition
  const where: Record<string, unknown> = {};
  if (activeOnly) {
    where.isActive = true;
  }
  if (categoryId && categoryId !== 'ALL') {
    where.categoryId = categoryId;
  }

  if (normalizedSearch) {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' as const } },
      {
        aliases: {
          some: {
            aliasNormalized: { contains: normalizedSearch, mode: 'insensitive' as const },
          },
        },
      },
    ];
  }

  const orderBy =
    sort === 'newest'
      ? { createdAt: 'desc' as const }
      : sort === 'oldest'
      ? { createdAt: 'asc' as const }
      : { name: 'asc' as const };

  const [ingredients, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        aliases: {
          select: { id: true, alias: true, aliasNormalized: true },
        },
        _count: {
          select: {
            recipes: true,
            allergens: true,
            pantryItems: true,
          },
        },
      },
      orderBy,
      take: Math.min(Math.max(1, limit), 100),
      skip: Math.max(0, offset),
    }),
    prisma.ingredient.count({ where }),
  ]);

  const formatted = ingredients.map((i) => {
    // If search was performed, find matched alias if any
    const matchedAlias = normalizedSearch
      ? i.aliases.find((a) => a.aliasNormalized.includes(normalizedSearch))?.alias
      : undefined;

    return {
      id: i.id,
      name: i.name,
      slug: i.slug,
      description: i.description,
      imageUrl: i.imageUrl,
      isActive: i.isActive,
      categoryId: i.categoryId,
      category: i.category,
      aliases: i.aliases.map((a) => a.alias),
      matchedAlias,
      createdAt: i.createdAt,
      recipeCount: i._count.recipes,
      allergenCount: i._count.allergens,
      pantryCount: i._count.pantryItems,
    };
  });

  return { ingredients: formatted, total, limit, offset };
}

/**
 * Checks for duplicate canonical names, slugs, or alias conflicts.
 */
export async function checkIngredientConflict(name: string, excludeId?: string) {
  const normalized = normalizeIngredientName(name);
  const slug = generateSlug(name);

  // Check canonical name
  const existingCanonical = await prisma.ingredient.findFirst({
    where: {
      AND: [
        excludeId ? { id: { not: excludeId } } : {},
        {
          OR: [
            { name: { equals: name.trim(), mode: 'insensitive' as const } },
            { slug },
          ],
        },
      ],
    },
    select: { id: true, name: true },
  });

  if (existingCanonical) {
    return {
      hasConflict: true,
      reason: `An ingredient with name "${existingCanonical.name}" or matching slug already exists.`,
    };
  }

  // Check if this canonical name conflicts with an existing alias
  const existingAlias = await prisma.ingredientAlias.findUnique({
    where: { aliasNormalized: normalized },
    include: { ingredient: { select: { id: true, name: true } } },
  });

  if (existingAlias && existingAlias.ingredient.id !== excludeId) {
    return {
      hasConflict: true,
      reason: `"${name}" is already registered as an alias for ingredient "${existingAlias.ingredient.name}".`,
    };
  }

  return { hasConflict: false };
}

/**
 * Adds an alias to an ingredient safely, ensuring no duplicate alias exists anywhere.
 */
export async function addIngredientAlias(ingredientId: string, alias: string) {
  const cleanAlias = alias.trim();
  const normalized = normalizeIngredientName(cleanAlias);

  if (!cleanAlias) {
    throw new Error('Alias cannot be empty.');
  }

  // Check if alias is same as parent ingredient's canonical name
  const parent = await prisma.ingredient.findUnique({
    where: { id: ingredientId },
    select: { id: true, name: true },
  });
  if (!parent) {
    throw new Error('Ingredient not found.');
  }

  if (normalizeIngredientName(parent.name) === normalized) {
    throw new Error(`Alias "${cleanAlias}" matches the canonical name of this ingredient.`);
  }

  // Check if another ingredient has this canonical name
  const sameNameIngredient = await prisma.ingredient.findFirst({
    where: {
      name: { equals: cleanAlias, mode: 'insensitive' as const },
    },
    select: { id: true, name: true },
  });
  if (sameNameIngredient && sameNameIngredient.id !== ingredientId) {
    throw new Error(`"${cleanAlias}" is already the canonical name of another ingredient.`);
  }

  // Check if alias is already used (unique index on aliasNormalized)
  const existing = await prisma.ingredientAlias.findUnique({
    where: { aliasNormalized: normalized },
    include: { ingredient: { select: { name: true } } },
  });
  if (existing) {
    throw new Error(`Alias "${cleanAlias}" is already assigned to "${existing.ingredient.name}".`);
  }

  return await prisma.ingredientAlias.create({
    data: {
      ingredientId,
      alias: cleanAlias,
      aliasNormalized: normalized,
    },
  });
}
