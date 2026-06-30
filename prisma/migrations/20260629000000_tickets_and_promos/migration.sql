-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priceCents" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "capacity" INTEGER,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "saleStartsAt" TIMESTAMP(3),
    "saleEndsAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TicketType_eventId_active_sortOrder_idx" ON "TicketType"("eventId", "active", "sortOrder");

-- CreateTable
CREATE TABLE "PromoCode" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" INTEGER NOT NULL,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "ticketTypeId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromoCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_eventId_code_key" ON "PromoCode"("eventId", "code");

-- CreateIndex
CREATE INDEX "PromoCode_eventId_active_idx" ON "PromoCode"("eventId", "active");

-- AlterTable: Registration
ALTER TABLE "Registration" ADD COLUMN     "ticketTypeId" TEXT,
ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "paidCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Registration_paymentId_key" ON "Registration"("paymentId");

-- CreateIndex
CREATE INDEX "Registration_ticketTypeId_idx" ON "Registration"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Registration_promoCodeId_idx" ON "Registration"("promoCodeId");

-- AlterTable: Payment
ALTER TABLE "Payment" ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'renewal',
ADD COLUMN     "eventId" TEXT,
ADD COLUMN     "ticketTypeId" TEXT,
ADD COLUMN     "promoCodeId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_eventId_idx" ON "Payment"("eventId");

-- CreateIndex
CREATE INDEX "Payment_ticketTypeId_idx" ON "Payment"("ticketTypeId");

-- AddForeignKey: TicketType -> Event
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: PromoCode -> Event, PromoCode -> TicketType
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Registration -> TicketType, PromoCode, Payment
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Payment -> Event, TicketType, PromoCode
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;
