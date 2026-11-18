import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

/**
 * Public & Admin units endpoint.
 * Returns standard measurement units (Gram, Kilogram, Cup, Tbsp, Tsp, etc.)
 * 
 * GET /api/units
 */
export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true,
        symbol: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, units });
  } catch (error: any) {
    console.error('Error fetching units:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
