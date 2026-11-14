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
        r.id AS recipe_id, 
        r.name AS recipe_name, 
        COALESCE(
          (SELECT c.name FROM recipe_categories rc JOIN categories c ON rc.category_id = c.id WHERE rc.recipe_id = r.id LIMIT 1),
          'General'
        ) AS category, 
        (COALESCE(r.prep_time_minutes, 0) + COALESCE(r.cook_time_minutes, 0))::int AS cooking_time, 
        COALESCE(INITCAP(r.difficulty::text), 'Easy') AS difficulty_level, 
        r.image_url, 
        COALESCE(rn.calories_kcal, 0)::int AS calories,
        COALESCE(
          (SELECT string_agg(rs.instruction, E'\n' ORDER BY rs.step_number) FROM recipe_steps rs WHERE rs.recipe_id = r.id),
          r.description,
          ''
        ) AS instructions,
        COUNT(ri.ingredient_id)::int AS total_ingredients_needed,
        SUM(CASE WHEN LOWER(i.name) = ANY(${lowercaseIngredients}) THEN 1 ELSE 0 END)::int AS matched_ingredients_count,
        COALESCE(
          json_agg(
            json_build_object(
              'name', i.name, 
              'quantity', COALESCE(ri.quantity::text, ri.preparation_note, 'as needed'),
              'matched', LOWER(i.name) = ANY(${lowercaseIngredients})
            )
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'
        ) AS ingredients_details
      FROM recipes r
      LEFT JOIN recipe_nutrition rn ON r.id = rn.recipe_id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      LEFT JOIN ingredients i ON ri.ingredient_id = i.id
      GROUP BY r.id, rn.calories_kcal
      HAVING SUM(CASE WHEN LOWER(i.name) = ANY(${lowercaseIngredients}) THEN 1 ELSE 0 END) > 0
      ORDER BY 
        matched_ingredients_count DESC, 
        total_ingredients_needed ASC, 
        r.name ASC;
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
