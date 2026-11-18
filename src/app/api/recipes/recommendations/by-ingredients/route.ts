import { NextRequest, NextResponse } from 'next/server';
import { getRecipeRecommendations } from '@/lib/recommendation-engine';
import { getAuthenticatedUser } from '@/lib/server-auth';

/**
 * Structured Recommendation Endpoint.
 * 
 * POST /api/recipes/recommendations/by-ingredients
 * Body: {
 *   ingredientIds?: string[],
 *   ingredientNames?: string[],
 *   useUserPantry?: boolean,
 *   preferences?: {
 *     maxCookingTime?: number,
 *     category?: string,
 *     difficulty?: string
 *   },
 *   options?: {
 *     limit?: number,
 *     offset?: number
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ingredientIds = [],
      ingredientNames = [],
      useUserPantry = false,
      preferences,
      options,
    } = body;

    let userId: string | undefined;
    if (useUserPantry) {
      const auth = await getAuthenticatedUser(request);
      if (auth) {
        userId = auth.userId;
      }
    }

    if (
      (!ingredientIds || ingredientIds.length === 0) &&
      (!ingredientNames || ingredientNames.length === 0) &&
      !userId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide ingredientIds, ingredientNames, or set useUserPantry=true',
        },
        { status: 400 }
      );
    }

    const recommendations = await getRecipeRecommendations({
      ingredientIds,
      ingredientNames,
      userId,
      preferences,
      options,
    });

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error: any) {
    console.error('Error in recipe recommendations by ingredients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
