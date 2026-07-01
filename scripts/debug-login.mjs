#!/usr/bin/env node
/**
 * Reproduces the login flow directly against whatever DATABASE_URL points
 * at. When production login is throwing 500s and Vercel logs are slow,
 * this shows you the exact stack in a couple of seconds.
 *
 * Usage:
 *   $env:DATABASE_URL="..."; node scripts/debug-login.mjs samilix055@gmail.com <password>
 *
 * The password argument is optional — omit it to only test the DB read.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const emailArg = process.argv[2];
const passwordArg = process.argv[3];
if (!emailArg) {
  console.error("Usage: node scripts/debug-login.mjs <email> [password]");
  process.exit(1);
}
const email = emailArg.toLowerCase().trim();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Export it first (or run in a shell that has .env loaded).");
  process.exit(1);
}

const prisma = new PrismaClient({ log: ["error"] });

try {
  console.log(`\n1. Looking up user by email ${email}…`);
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      suspendedAt: true,
      expiresAt: true,
      totpEnabledAt: true,
      totpSecret: true,
    },
  });

  if (!user) {
    console.log("   ✗ No user with that email.");
    process.exit(2);
  }
  console.log(`   ✓ Found ${user.role} ${user.name} (id ${user.id})`);
  console.log(`   passwordHash:  ${user.passwordHash ? "set (" + user.passwordHash.length + " chars)" : "NULL — cannot sign in with password"}`);
  console.log(`   suspendedAt:   ${user.suspendedAt ?? "null"}`);
  console.log(`   expiresAt:     ${user.expiresAt ?? "null"}`);
  console.log(`   totpEnabledAt: ${user.totpEnabledAt ?? "null"}`);
  console.log(`   totpSecret:    ${user.totpSecret ? "set" : "null"}`);

  if (user.suspendedAt) {
    console.log("\n✗ Login would fail: account is suspended.");
    process.exit(3);
  }
  if (user.expiresAt && user.expiresAt < new Date()) {
    console.log("\n✗ Login would fail: access window expired.");
    process.exit(3);
  }
  if (user.totpEnabledAt && user.totpSecret) {
    console.log("\nℹ Login would prompt for 2FA (totpEnabledAt is set).");
  }

  if (!passwordArg) {
    console.log("\n(No password provided — skipping password verify.)");
    process.exit(0);
  }

  console.log("\n2. Comparing password with bcrypt…");
  if (!user.passwordHash) {
    console.log("   ✗ passwordHash is null — password sign-in impossible.");
    process.exit(3);
  }
  const ok = await bcrypt.compare(passwordArg, user.passwordHash);
  console.log(`   ${ok ? "✓" : "✗"} bcrypt.compare returned ${ok}`);

  if (!ok) {
    console.log("\n✗ Login would fail: wrong password.");
    console.log("  If you're sure the password is right, the hash on the account may be stale.");
    console.log("  Reset it with a superadmin, or run scripts/reset-my-2fa.mjs pattern.");
    process.exit(3);
  }

  console.log("\n✓ Everything would succeed — the API should return a session cookie.");
  console.log("  If login still errors in the browser, the failure is elsewhere (redirect target).");
} catch (err) {
  console.error("\n✗ Uncaught error while running the flow:\n", err);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
