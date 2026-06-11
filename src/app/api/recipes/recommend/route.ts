import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ingredients } = body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please provide an array of available ingredients' },
        { status: 400 }
      );
    }

    const lowercaseIngredients = ingredients.map((ing: string) => ing.trim().toLowerCase());

    // Execute the advanced scoring algorithm via Prisma raw SQL query
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        r.recipe_id, 
        r.recipe_name, 
        r.category, 
        r.cooking_time, 
        r.difficulty_level, 
        r.image_url, 
        r.calories,
        r.instructions,
        COUNT(ri.ingredient_id)::int AS total_ingredients_needed,
        SUM(CASE WHEN LOWER(i.ingredient_name) = ANY(${lowercaseIngredients}) THEN 1 ELSE 0 END)::int AS matched_ingredients_count,
        COALESCE(
          json_agg(
            json_build_object(
              'name', i.ingredient_name, 
              'quantity', ri.quantity,
              'matched', LOWER(i.ingredient_name) = ANY(${lowercaseIngredients})
            )
          ) FILTER (WHERE i.ingredient_id IS NOT NULL), 
          '[]'
        ) AS ingredients_details
      FROM recipes r
      LEFT JOIN recipe_ingredients ri ON r.recipe_id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
      GROUP BY r.recipe_id
      HAVING SUM(CASE WHEN LOWER(i.ingredient_name) = ANY(${lowercaseIngredients}) THEN 1 ELSE 0 END) > 0
      ORDER BY 
        matched_ingredients_count DESC, 
        total_ingredients_needed ASC, 
        r.recipe_name ASC;
    `;

    const recommendations = result.map(row => {
      const total = row.total_ingredients_needed || 1;
      const matched = row.matched_ingredients_count || 0;
      const match_percentage = Math.round((matched / total) * 100);
      return {
        ...row,
        match_percentage,
      };
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    console.error('Error in recipe recommendations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
