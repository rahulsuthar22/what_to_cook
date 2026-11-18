import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const mealType = searchParams.get('mealType') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const where: any = {};

    if (mealType) {
      where.mealType = mealType;
    }

    if (dateFrom || dateTo) {
      where.mealDate = {};
      if (dateFrom) {
        where.mealDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.mealDate.lte = new Date(dateTo);
      }
    }

    // Current week boundaries (Mon–Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMonday = (dayOfWeek + 6) % 7;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const [plans, total, byMealType, totalThisWeek] = await Promise.all([
      prisma.mealPlan.findMany({
        where,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          recipe: { select: { id: true, name: true } },
        },
        orderBy: { mealDate: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.mealPlan.count({ where }),
      prisma.mealPlan.groupBy({
        by: ['mealType'],
        _count: { id: true },
      }),
      prisma.mealPlan.count({
        where: {
          mealDate: { gte: weekStart, lte: weekEnd },
        },
      }),
    ]);

    const summary = {
      byMealType: byMealType.map((g) => ({
        mealType: g.mealType,
        count: g._count.id,
      })),
      totalThisWeek,
    };

    return NextResponse.json({ success: true, plans, total, limit, offset, summary });
  } catch (error: any) {
    console.error('Error fetching admin meal plans:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
