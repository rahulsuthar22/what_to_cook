import { NextRequest, NextResponse } from 'next/server';
import { getRecipeRecommendations } from '@/lib/recommendation-engine';

/**
 * Legacy recipe recommendation endpoint (maintained with 100% backward compatibility).
 * Powered by the upgraded weighted recommendation engine with alias matching and classifications.
 * 
 * POST /api/recipes/recommend
 * Body: { ingredients: string[] }
 */
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

    const recommendations = await getRecipeRecommendations({
      ingredientNames: ingredients,
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (error: any) {
    console.error('Error in recipe recommendations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
