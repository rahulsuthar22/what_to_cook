import readline from 'readline';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/db';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log('--- Create New Admin Account ---');
  
  try {
    const email = await askQuestion('Enter Admin Email: ');
    if (!email.trim()) {
      console.error('Email cannot be empty.');
      process.exit(1);
    }

    const password = await askQuestion('Enter Admin Password: ');
    if (!password.trim() || password.length < 6) {
      console.error('Password must be at least 6 characters.');
      process.exit(1);
    }

    const role = await askQuestion('Enter Admin Role (default: Admin): ');
    const finalRole = role.trim() || 'Admin';

    console.log('\nCreating admin account...');
    
    // Hash password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Upsert or create admin in the database
    const admin = await prisma.admin.upsert({
      where: { email: email.trim().toLowerCase() },
      update: {
        passwordHash,
        role: finalRole,
      },
      create: {
        email: email.trim().toLowerCase(),
        passwordHash,
        role: finalRole,
      }
    });

    console.log(`\n🎉 Success! Admin user "${admin.email}" has been created/updated with role "${admin.role}".`);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
