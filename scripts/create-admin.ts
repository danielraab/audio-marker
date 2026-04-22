#!/usr/bin/env node
/**
 * CLI script to create or promote a user to admin
 * Usage: npm run admin:create <email>
 * Or in production: node --loader tsx scripts/create-admin.ts <email>
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createAdmin(email: string) {
  try {
    console.log(`\n🔍 Searching for user with email: ${email}`);

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // User exists, update to admin
      if (user.isAdmin) {
        console.log(`✅ User ${email} is already an admin.`);
        return;
      }

      user = await prisma.user.update({
        where: { email },
        data: { isAdmin: true },
      });

      console.log(`✅ Successfully promoted ${email} to admin!`);
    } else {
      // User doesn't exist, create new admin user
      user = await prisma.user.create({
        data: {
          email,
          name: "",
          isAdmin: true,
        },
      });

      console.log(`✅ Successfully created new admin user: ${email}`);
      console.log(
        `ℹ️  Note: User will need to sign in via configured auth provider.`,
      );
    }

    console.log(`\nUser Details:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Admin: ${user.isAdmin}`);
    console.log(`  Email Verified: ${user.emailVerified ? "Yes" : "No"}`);
  } catch (error) {
    console.error(`\n❌ Error creating/updating admin user:`, error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const email = process.argv[2];

if (!email) {
  console.error(`\n❌ Error: Email address is required`);
  console.log(`\nUsage: npm run admin:create <email>`);
  console.log(`Example: npm run admin:create admin@example.com\n`);
  process.exit(1);
}

// Basic email validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error(`\n❌ Error: Invalid email address format`);
  process.exit(1);
}

void createAdmin(email);
