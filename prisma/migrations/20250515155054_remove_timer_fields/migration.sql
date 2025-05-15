/*
  Warnings:

  - You are about to drop the column `timerDuration` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `timerIsRunning` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `timerStartTime` on the `Room` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Room" DROP COLUMN "timerDuration",
DROP COLUMN "timerIsRunning",
DROP COLUMN "timerStartTime";
