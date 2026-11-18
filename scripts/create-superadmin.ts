import 'dotenv/config';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db';

interface SuperAdminArgs {
  email?: string;
  password?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function parseArgs(): SuperAdminArgs {
  const args = process.argv.slice(2);
  const parsed: SuperAdminArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' || arg === '-e') {
      parsed.email = args[++i];
    } else if (arg === '--password' || arg === '-p') {
      parsed.password = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  // Fallback to environment variables if not passed via CLI
  parsed.email = parsed.email || process.env.SUPERADMIN_EMAIL;
  parsed.password = parsed.password || process.env.SUPERADMIN_PASSWORD;

  return parsed;
}

function printHelp() {
  console.log(`
Usage: tsx scripts/create-superadmin.ts [options]

Provisions the single system SuperAdmin account.
Only ONE SuperAdmin can exist in the system. Standard admins
are created with the ADMIN role.

Options:
  -e, --email <email>        SuperAdmin email address
  -p, --password <password>  SuperAdmin password (minimum ${MIN_PASSWORD_LENGTH} characters)
  -h, --help                 Display this help message

Environment variables (fallback):
  SUPERADMIN_EMAIL (or ADMIN_EMAIL)
  SUPERADMIN_PASSWORD (or ADMIN_PASSWORD)

Examples:
  tsx scripts/create-superadmin.ts --email superadmin@whattocook.com --password supersecret
  tsx scripts/create-superadmin.ts (runs interactive prompt)
`);
}

async function promptCredentials(): Promise<{ email: string; password: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const email = await new Promise<string>((resolve) => {
      rl.question('Enter SuperAdmin Email: ', (ans) => resolve(ans.trim()));
    });

    const password = await new Promise<string>((resolve) => {
      rl.question('Enter SuperAdmin Password: ', (ans) => resolve(ans.trim()));
    });

    return {
      email,
      password,
    };
  } finally {
    rl.close();
  }
}

/**
 * Creates or updates the single SuperAdmin account.
 * Enforces the business rule: Only ONE SuperAdmin can exist in the system.
 */
export async function createSuperAdmin(emailInput: string, passwordInput: string) {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();

  if (!email) {
    throw new Error('Email is required.');
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new Error(`Invalid email address format: "${email}".`);
  }

  if (!password) {
    throw new Error('Password is required.');
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }

  // Check for any existing SuperAdmin in the database
  const existingSuperAdmin = await prisma.admin.findFirst({
    where: {
      OR: [
        { role: 'SUPERADMIN' },
        { role: 'SuperAdmin' },
      ],
    },
  });

  if (existingSuperAdmin && existingSuperAdmin.email !== email) {
    throw new Error(
      `A SuperAdmin account already exists in the system with email: "${existingSuperAdmin.email}". ` +
      `Only one SuperAdmin is permitted. To change credentials, run this script with "${existingSuperAdmin.email}" ` +
      `or update the account in the database.`
    );
  }

  console.log(`\nHashing password for SuperAdmin "${email}"...`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const isUpdate = Boolean(existingSuperAdmin && existingSuperAdmin.email === email);
  console.log(
    isUpdate
      ? `Updating existing SuperAdmin credentials for "${email}"...`
      : `Writing unique SuperAdmin account for "${email}" to database...`
  );

  const superAdmin = await prisma.admin.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'SUPERADMIN',
    },
    create: {
      email,
      passwordHash,
      role: 'SUPERADMIN',
    },
  });

  return superAdmin;
}

async function main() {
  console.log('========================================');
  console.log('    WhatToCook SuperAdmin Provisioning  ');
  console.log('========================================');

  try {
    const cliArgs = parseArgs();
    let email = cliArgs.email;
    let password = cliArgs.password;

    if (!email || !password) {
      if (!process.stdin.isTTY && (!email || !password)) {
        console.error(
          'Error: Non-interactive environment detected. Please provide credentials via flags (--email, --password) or environment variables.'
        );
        process.exit(1);
      }
      const prompted = await promptCredentials();
      email = email || prompted.email;
      password = password || prompted.password;
    }

    const admin = await createSuperAdmin(email, password);

    console.log('\n✅ SuperAdmin Account Ready!');
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   Date:  ${admin.updatedAt.toISOString()}`);
    console.log('   Note:  System SuperAdmin singleton established.\n');
  } catch (error: unknown) {
    console.error('\n❌ SuperAdmin Provisioning Failed:');
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`   ${msg}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.includes('create-superadmin')) {
  main();
}

