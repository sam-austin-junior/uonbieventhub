-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'stripe',
ADD COLUMN     "planId" TEXT,
ADD COLUMN     "flutterwaveTxRef" TEXT,
ADD COLUMN     "flutterwaveTxId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_flutterwaveTxRef_key" ON "Payment"("flutterwaveTxRef");

-- CreateIndex
CREATE INDEX "Payment_planId_idx" ON "Payment"("planId");

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "billingPeriod" TEXT NOT NULL DEFAULT 'one_time',
    "recommended" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "features" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "Plan_active_sortOrder_idx" ON "Plan"("active", "sortOrder");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed the three default plans matching the previous hardcoded landing
-- page so the site keeps rendering pricing even before a superadmin
-- visits the new admin page.
INSERT INTO "Plan" ("id", "code", "name", "tagline", "description", "priceCents", "currency", "billingPeriod", "recommended", "active", "sortOrder", "features", "createdAt", "updatedAt")
VALUES
    (
        'plan_single_event',
        'single_event',
        'Single event',
        'One-off',
        'Conferences, summits and annual flagships.',
        50000,
        'USD',
        'one_time',
        false,
        true,
        10,
        E'Unlimited sessions & speakers\nUnlimited attendees\nQR check-in & certificates\nAI assistant on your programme\nEmail & in-app broadcasts',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'plan_team',
        'team',
        'Team',
        'Most popular',
        'Organisations hosting multiple events per year.',
        250000,
        'USD',
        'year',
        true,
        true,
        20,
        E'Everything in Single event\nUnlimited events per year\nMultiple organizer seats\nPriority onboarding & support\nQuarterly business review',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'plan_enterprise',
        'enterprise',
        'Enterprise',
        'Tailored',
        'Large organisations with custom requirements.',
        750000,
        'USD',
        'year',
        false,
        true,
        30,
        E'Everything in Team\nCo-branded onboarding\nDedicated success manager\nSLA on email delivery\nAnnual usage review',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
