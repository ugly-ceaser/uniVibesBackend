/*
  Warnings:

  - You are about to drop the column `summary` on the `Answer` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the `ForumSummary` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[sessionId,sequenceNumber]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[studentId,courseId,sessionType]` on the table `ChatSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sequenceNumber` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ChatMessage` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `role` on the `ChatMessage` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updatedAt` to the `ChatSession` table without a default value. This is not possible if the table is not empty.
  - Made the column `title` on table `ChatSession` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "SessionType" AS ENUM ('course', 'general', 'academic', 'campus');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('active', 'archived', 'deleted');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateEnum
CREATE TYPE "MessageContentType" AS ENUM ('text', 'markdown', 'json');

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "ForumSummary" DROP CONSTRAINT "ForumSummary_forumId_fkey";

-- DropIndex
DROP INDEX "ChatMessage_sessionId_idx";

-- AlterTable
ALTER TABLE "Answer" DROP COLUMN "summary";

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "contentType" "MessageContentType" NOT NULL DEFAULT 'text',
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sequenceNumber" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "role",
ADD COLUMN     "role" "MessageRole" NOT NULL;

-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "sessionType" "SessionType" NOT NULL DEFAULT 'general',
ADD COLUMN     "status" "SessionStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "summary";

-- DropTable
DROP TABLE "ForumSummary";

-- CreateTable
CREATE TABLE "ChatAnalytics" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messageId" TEXT,
    "tokensUsed" INTEGER,
    "modelUsed" TEXT,
    "responseTimeMs" INTEGER,
    "costUsd" DECIMAL(10,8),
    "confidenceScore" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAnalytics_sessionId_idx" ON "ChatAnalytics"("sessionId");

-- CreateIndex
CREATE INDEX "ChatAnalytics_modelUsed_createdAt_idx" ON "ChatAnalytics"("modelUsed", "createdAt");

-- CreateIndex
CREATE INDEX "ChatAnalytics_createdAt_costUsd_idx" ON "ChatAnalytics"("createdAt", "costUsd");

-- CreateIndex
CREATE UNIQUE INDEX "CourseRequest_studentId_key" ON "CourseRequest"("studentId");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_sequenceNumber_idx" ON "ChatMessage"("sessionId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_role_idx" ON "ChatMessage"("sessionId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_sessionId_sequenceNumber_key" ON "ChatMessage"("sessionId", "sequenceNumber");

-- CreateIndex
CREATE INDEX "ChatSession_studentId_courseId_idx" ON "ChatSession"("studentId", "courseId");

-- CreateIndex
CREATE INDEX "ChatSession_studentId_sessionType_idx" ON "ChatSession"("studentId", "sessionType");

-- CreateIndex
CREATE INDEX "ChatSession_lastMessageAt_idx" ON "ChatSession"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatSession_createdAt_idx" ON "ChatSession"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_studentId_courseId_sessionType_key" ON "ChatSession"("studentId", "courseId", "sessionType");

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRequest" ADD CONSTRAINT "CourseRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
