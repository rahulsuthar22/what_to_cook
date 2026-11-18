import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import bcrypt from 'bcryptjs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

async function getDbRoles(): Promise<string[]> {
  try {
    const enumRows = await prisma.$queryRaw<Array<{ role: string }>>`
      SELECT enumlabel AS role
      FROM pg_enum
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
      WHERE typname = 'AdminRole' OR typname = 'admin_role'
      ORDER BY enumsortorder ASC;
    `;
    if (enumRows && enumRows.length > 0) {
      return enumRows.map((r) => r.role);
    }
  } catch {
    // If pg_enum query fails, query distinct from table
  }

  try {
    const distinctRows = await prisma.admin.findMany({
      distinct: ['role'],
      select: { role: true },
    });
    const roles = distinctRows.map((r) => String(r.role)).filter(Boolean);
    if (roles.length > 0) {
      return roles;
    }
  } catch {
    // fallback
  }

  return ['SUPERADMIN', 'ADMIN'];
}

// GET: Retrieve list of all administrators and dynamic roles from DB
export async function GET() {
  try {
    const [admins, dbRoles] = await Promise.all([
      prisma.admin.findMany({
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      getDbRoles(),
    ]);

    // Secondary staff assignable roles (SuperAdmin is CLI singleton)
    const assignableRoles = dbRoles.filter(
      (r) => r.toUpperCase() !== 'SUPERADMIN' && r.toUpperCase() !== 'SUPER_ADMIN'
    );

    return NextResponse.json({
      success: true,
      admins,
      roles: assignableRoles.length > 0 ? assignableRoles : ['ADMIN'],
      allRoles: ['SUPERADMIN', 'ADMIN'],
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error fetching staff:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch staff accounts.' },
      { status: 500 }
    );
  }
}

// POST: Create a staff administrator with ADMIN role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: rawEmail, password: rawPassword, role: rawRole } = body;

    const email = (rawEmail || '').trim().toLowerCase();
    const password = (rawPassword || '').trim();
    const roleInput = (rawRole || 'ADMIN').trim().toUpperCase();

    // 1. Validation
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required.' },
        { status: 400 }
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { success: false, error: `Invalid email address: "${email}".` },
        { status: 400 }
      );
    }

    if (!password || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    // 2. SuperAdmin singleton rule enforcement
    if (roleInput === 'SUPERADMIN' || roleInput === 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'SuperAdmin is provisioned via CLI only. Staff cannot be assigned SuperAdmin role.',
        },
        { status: 400 }
      );
    }

    // 3. Only ADMIN role allowed for staff
    if (roleInput !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Allowed role for staff is ADMIN.' },
        { status: 400 }
      );
    }

    // 4. Email Uniqueness Check
    const existing = await prisma.admin.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `An account with email "${email}" already exists.` },
        { status: 409 }
      );
    }

    // 5. Hash Password & Create
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const admin = await prisma.admin.create({
      data: {
        email,
        passwordHash,
        role: 'ADMIN',
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      admin,
    }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error creating staff:', msg);
    return NextResponse.json(
      { success: false, error: 'Failed to create staff account.' },
      { status: 500 }
    );
  }
}
