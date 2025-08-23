-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "fullname" TEXT DEFAULT 'Unknown User',
ADD COLUMN     "nin" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "semester" TEXT;
