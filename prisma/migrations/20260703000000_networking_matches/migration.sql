-- CreateTable
CREATE TABLE "NetworkingMatch" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NetworkingMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NetworkingMatch_eventId_userId_matchUserId_key" ON "NetworkingMatch"("eventId", "userId", "matchUserId");

-- CreateIndex
CREATE INDEX "NetworkingMatch_eventId_userId_score_idx" ON "NetworkingMatch"("eventId", "userId", "score");

-- AddForeignKey
ALTER TABLE "NetworkingMatch" ADD CONSTRAINT "NetworkingMatch_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetworkingMatch" ADD CONSTRAINT "NetworkingMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NetworkingMatch" ADD CONSTRAINT "NetworkingMatch_matchUserId_fkey" FOREIGN KEY ("matchUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
