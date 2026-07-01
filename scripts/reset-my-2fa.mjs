#!/usr/bin/env node
/**
 * Emergency 2FA reset. Clears totpSecret + totpEnabledAt for a single
 * user, letting them sign in with just their password.
 *
 * Usage:
 *   node scripts/reset-my-2fa.mjs samaustin1961@gmail.com
 *
 * Reads DATABASE_URL from .env (or the ambient environment). Point it
 * at whatever database you want unstuck — local Postgres for local dev,
 * or your production Supabase URL for a locked-out prod account.
 *
 * Safety:
 *  - Refuses to run without an email argument.
 *  - Confirms the target user + role before touching anything.
 *  - Prompts for "yes" before writing (unless RESET_2FA_YES=1).
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";

// Prisma Client auto-loads .env on init, so no dotenv dependency needed.

const emailArg = process.argv[2];
if (!emailArg) {
  console.error("Usage: node scripts/reset-my-2fa.mjs <email>");
  process.exit(1);
}
const email = emailArg.toLowerCase().trim();

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set. Point it at the DB you want to fix — e.g.\n" +
      '  DATABASE_URL="postgresql://..." node scripts/reset-my-2fa.mjs ' +
      email,
  );
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      totpEnabledAt: true,
      totpSecret: true,
    },
  });

  if (!user) {
    console.error(`No user with email ${email}. Nothing changed.`);
    process.exit(2);
  }

  console.log("");
  console.log("Target:");
  console.log(`  id:            ${user.id}`);
  console.log(`  email:         ${user.email}`);
  console.log(`  name:          ${user.name}`);
  console.log(`  role:          ${user.role}`);
  console.log(`  totpEnabled:   ${user.totpEnabledAt ? "yes" : "no"}`);
  console.log(`  totpSecret:    ${user.totpSecret ? "set" : "null"}`);
  console.log("");

  if (!user.totpSecret && !user.totpEnabledAt) {
    console.log("2FA is already clear on this account. Nothing to do.");
    process.exit(0);
  }

  if (process.env.RESET_2FA_YES !== "1") {
    const rl = createInterface({ input: stdin, output: stdout });
    const answer = await rl.question("Wipe totpSecret + totpEnabledAt? [yes/N] ");
    rl.close();
    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Aborted.");
      process.exit(0);
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { totpSecret: null, totpEnabledAt: null },
  });

  console.log("");
  console.log(`✓ Cleared 2FA for ${user.email}.`);
  console.log("  Sign in at /login with just email + password.");
  console.log(
    "  To re-enrol, visit /admin/security once you're back in.",
  );
} finally {
  await prisma.$disconnect();
}
