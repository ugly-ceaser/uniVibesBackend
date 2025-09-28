-- AlterTable
ALTER TABLE "Answer" ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "ForumSummary" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "opinion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumSummary_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ForumSummary" ADD CONSTRAINT "ForumSummary_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
