import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { exportRecipesToCSV } from '@/lib/recipe-templates';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get('format') || 'json').toLowerCase();
    const category = searchParams.get('category');
    const download = searchParams.get('download') === 'true';

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

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredients: {
          include: {
            ingredient: true,
            unit: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
        steps: {
          orderBy: { stepNumber: 'asc' },
        },
        nutrition: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Format recipes into clean standard export structure
    const formatted = recipes.map((r) => {
      const primaryCategory = r.categories?.[0]?.category?.name || 'General';
      const diffStr = r.difficulty
        ? r.difficulty.charAt(0) + r.difficulty.slice(1).toLowerCase()
        : 'Easy';

      return {
        recipe_name: r.name,
        slug: r.slug,
        category: primaryCategory,
        cooking_time: r.cookTimeMinutes || 20,
        prep_time: r.prepTimeMinutes || 0,
        difficulty_level: diffStr,
        servings: r.servings || 4,
        description: r.description || '',
        instructions: r.steps.map((s) => s.instruction),
        ingredients: r.ingredients.map((ri) => ({
          name: ri.ingredient.name,
          quantity: ri.preparationNote || (ri.quantity ? `${Number(ri.quantity)} ${ri.unit?.symbol || ''}`.trim() : 'as needed'),
        })),
        image_url: r.imageUrl || '',
        calories: r.nutrition?.caloriesKcal ? Number(r.nutrition.caloriesKcal) : undefined,
        protein: r.nutrition?.proteinG ? Number(r.nutrition.proteinG) : undefined,
        carbs: r.nutrition?.carbohydratesG ? Number(r.nutrition.carbohydratesG) : undefined,
        fat: r.nutrition?.fatG ? Number(r.nutrition.fatG) : undefined,
        fiber: r.nutrition?.fibreG ? Number(r.nutrition.fibreG) : undefined,
        published_at: r.publishedAt?.toISOString(),
      };
    });

    const timestamp = new Date().toISOString().split('T')[0];

    if (format === 'csv') {
      const csvData = exportRecipesToCSV(formatted);
      const headers = new Headers();
      headers.set('Content-Type', 'text/csv; charset=utf-8');
      if (download) {
        headers.set('Content-Disposition', `attachment; filename="whattocook-recipes-${timestamp}.csv"`);
      }
      return new NextResponse(csvData, { status: 200, headers });
    }

    // JSON export
    const payload = {
      exportMetadata: {
        system: 'WhatToCook Admin Catalog',
        exportDate: new Date().toISOString(),
        totalCount: formatted.length,
        version: '1.0',
      },
      recipes: formatted,
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json; charset=utf-8');
    if (download) {
      headers.set('Content-Disposition', `attachment; filename="whattocook-recipes-${timestamp}.json"`);
    }

    return new NextResponse(JSON.stringify(payload, null, 2), { status: 200, headers });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error exporting recipes:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to export recipes catalog.' },
      { status: 500 }
    );
  }
}

