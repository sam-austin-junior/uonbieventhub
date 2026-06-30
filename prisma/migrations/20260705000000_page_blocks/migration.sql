-- AlterTable: CustomPage — opt-in block JSON for the page builder.
-- When populated, supersedes the free-text body on render. Legacy
-- pages stay rendered from `body` so nothing breaks.
ALTER TABLE "CustomPage" ADD COLUMN "blocks" TEXT;
