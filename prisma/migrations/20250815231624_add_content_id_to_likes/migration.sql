/*
  Warnings:

  - Added the required column `contentId` to the `Likes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Likes" ADD COLUMN     "contentId" TEXT NOT NULL;
