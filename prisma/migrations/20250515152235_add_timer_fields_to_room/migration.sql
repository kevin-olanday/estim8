-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "timerDuration" INTEGER,
ADD COLUMN     "timerIsRunning" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timerStart" TIMESTAMP(3);
