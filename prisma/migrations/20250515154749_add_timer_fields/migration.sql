-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "timerDuration" INTEGER,
ADD COLUMN     "timerIsRunning" BOOLEAN,
ADD COLUMN     "timerStartTime" TIMESTAMP(3);
