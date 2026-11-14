import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(request: NextRequest) {
  try {
    // 1. Fetch counts using Prisma
    const totalUsers = await prisma.user.count();
    const totalRecipes = await prisma.recipe.count();
    const totalMealPlans = await prisma.mealPlan.count();
    const totalAdmins = await prisma.admin.count();
    const totalGroceryItems = await prisma.groceryListItem.count();

    // 2. Fetch popular recipes (top 5 in meal plans)
    const popularRecipes = await prisma.$queryRaw<any[]>`
      SELECT r.id AS recipe_id, r.name AS recipe_name, COUNT(mp.id)::int as plan_count
      FROM meal_plans mp
      JOIN recipes r ON mp.recipe_id = r.id
      GROUP BY r.id, r.name
      ORDER BY plan_count DESC
      LIMIT 5;
    `;

    // 3. Fetch popular ingredients (top 5 most used in recipes)
    const popularIngredients = await prisma.$queryRaw<any[]>`
      SELECT i.name AS ingredient_name, COUNT(ri.recipe_id)::int as recipe_count
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      GROUP BY i.id, i.name
      ORDER BY recipe_count DESC
      LIMIT 5;
    `;

    // 4. Fetch recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
      },
    });

    const formattedUsers = recentUsers.map(u => ({
      user_id: u.id,
      full_name: u.fullName,
      email: u.email,
      created_at: u.createdAt,
    }));

    const stats = {
      summary: {
        totalUsers,
        totalRecipes,
        totalMealPlans,
        totalAdmins,
        totalGroceryItems,
      },
      popularRecipes,
      popularIngredients,
      recentUsers: formattedUsers,
    };

    return NextResponse.json({ success: true, stats });
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
