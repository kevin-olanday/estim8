-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "manualOverride" BOOLEAN DEFAULT false,
ADD COLUMN     "originalVotes" TEXT;
