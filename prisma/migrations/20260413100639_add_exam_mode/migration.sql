-- CreateEnum
CREATE TYPE "ExamMode" AS ENUM ('PRACTICE', 'TIMED_EXAM');

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "mode" "ExamMode" NOT NULL DEFAULT 'PRACTICE',
ADD COLUMN     "timeLimitMinutes" INTEGER;
