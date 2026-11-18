import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

type TaxonomyType = 'categories' | 'cuisines' | 'tags' | 'diets';

function getModel(type: TaxonomyType) {
  switch (type) {
    case 'categories':
      return prisma.category;
    case 'cuisines':
      return prisma.cuisine;
    case 'tags':
      return prisma.tag;
    case 'diets':
      return prisma.diet;
    default:
      return null;
  }
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TaxonomyType | null;

    if (!type || !['categories', 'cuisines', 'tags', 'diets'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing type param. Use: categories|cuisines|tags|diets' },
        { status: 400 }
      );
    }

    const model = getModel(type) as any;

    const items = await model.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
        _count: { select: { recipes: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = items.map((item: any) => ({
      ...item,
      recipeCount: item._count?.recipes ?? 0,
    }));

    return NextResponse.json({ success: true, items: formatted, type });
  } catch (error: any) {
    console.error('Error fetching taxonomy:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, name, description } = body as {
      type: TaxonomyType;
      name: string;
      description?: string;
    };

    if (!type || !['categories', 'cuisines', 'tags', 'diets'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing type' },
        { status: 400 }
      );
    }

    if (!name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    const model = getModel(type) as any;
    const slug = generateSlug(name);

    const item = await model.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error creating taxonomy item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TaxonomyType | null;
    const id = searchParams.get('id');

    if (!type || !['categories', 'cuisines', 'tags', 'diets'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing type param' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id param' },
        { status: 400 }
      );
    }

    const model = getModel(type) as any;
    await model.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting taxonomy item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TaxonomyType | null;
    const id = searchParams.get('id');

    if (!type || !['categories', 'cuisines', 'tags', 'diets'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing type param' },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing id param' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { isActive } = body as { isActive: boolean };

    const model = getModel(type) as any;
    const item = await model.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error('Error updating taxonomy item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
