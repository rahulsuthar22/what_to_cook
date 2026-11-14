import 'dotenv/config';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db';

interface AdminArgs {
  email?: string;
  password?: string;
  role?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

function parseArgs(): AdminArgs {
  const args = process.argv.slice(2);
  const parsed: AdminArgs = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--email' || arg === '-e') {
      parsed.email = args[++i];
    } else if (arg === '--password' || arg === '-p') {
      parsed.password = args[++i];
    } else if (arg === '--role' || arg === '-r') {
      parsed.role = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  // Fallback to environment variables if not passed via CLI
  parsed.email = parsed.email || process.env.ADMIN_EMAIL;
  parsed.password = parsed.password || process.env.ADMIN_PASSWORD;
  parsed.role = parsed.role || process.env.ADMIN_ROLE;

  return parsed;
}

function printHelp() {
  console.log(`
Usage: tsx scripts/create-admin.ts [options]

Options:
  -e, --email <email>        Admin email address
  -p, --password <password>  Admin password (minimum ${MIN_PASSWORD_LENGTH} characters)
  -r, --role <role>          Admin role (default: "Admin")
  -h, --help                 Display this help message

Environment variables (fallback):
  ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_ROLE

Examples:
  tsx scripts/create-admin.ts --email admin@example.com --password supersecret --role Admin
  tsx scripts/create-admin.ts (runs interactive mode)
`);
}

function promptQuestion(rl: readline.Interface, query: string, isPassword = false): Promise<string> {
  return new Promise((resolve) => {
    if (!isPassword || !process.stdin.isTTY) {
      rl.question(query, (answer) => resolve(answer.trim()));
      return;
    }

    // Masked password prompt for interactive TTY
    const stdout = process.stdout;
    stdout.write(query);

    const onData = (char: Buffer) => {
      const charStr = char.toString('utf-8');
      if (charStr === '\n' || charStr === '\r' || charStr === '\u0004') {
        stdout.write('\n');
        process.stdin.removeListener('data', onData);
      } else if (charStr === '\u0003') {
        // Ctrl+C
        process.exit(1);
      } else if (charStr === '\b' || charStr === '\x7f') {
        // Backspace
        stdout.write('\b \b');
      } else {
        stdout.write('*');
      }
    };

    // Standard readline fallback if masking is complex in current subshell
    rl.question('', (answer) => {
      resolve(answer.trim());
    });
  });
}

async function promptCredentials(): Promise<{ email: string; password: string; role: string }> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const email = await new Promise<string>((resolve) => {
      rl.question('Enter Admin Email: ', (ans) => resolve(ans.trim()));
    });

    const password = await new Promise<string>((resolve) => {
      rl.question('Enter Admin Password: ', (ans) => resolve(ans.trim()));
    });

    const roleInput = await new Promise<string>((resolve) => {
      rl.question('Enter Admin Role (default: Admin): ', (ans) => resolve(ans.trim()));
    });

    return {
      email,
      password,
      role: roleInput || 'Admin',
    };
  } finally {
    rl.close();
  }
}

export async function createAdmin(emailInput: string, passwordInput: string, roleInput = 'Admin') {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const role = roleInput.trim() || 'Admin';

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

  console.log(`\nHashing password for admin "${email}"...`);
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  console.log('Writing admin account to database...');
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
    },
    create: {
      email,
      passwordHash,
      role,
    },
  });

  return admin;
}

async function main() {
  console.log('========================================');
  console.log('       WhatToCook Admin Provisioning    ');
  console.log('========================================');

  try {
    const cliArgs = parseArgs();
    let email = cliArgs.email;
    let password = cliArgs.password;
    let role = cliArgs.role;

    if (!email || !password) {
      if (!process.stdin.isTTY && (!email || !password)) {
        console.error('Error: Non-interactive environment detected. Please provide credentials via flags (--email, --password) or environment variables.');
        process.exit(1);
      }
      const prompted = await promptCredentials();
      email = email || prompted.email;
      password = password || prompted.password;
      role = role || prompted.role;
    }

    const admin = await createAdmin(email, password, role);

    console.log('\n✅ Admin Account Ready!');
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log(`   Date:  ${admin.updatedAt.toISOString()}\n`);
  } catch (error: any) {
    console.error('\n❌ Admin Provisioning Failed:');
    console.error(`   ${error.message || error}\n`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute if run directly from CLI
if (require.main === module || process.argv[1]?.includes('create-admin')) {
  main();
}
