/*
  Warnings:

  - You are about to drop the `grade_release_configs` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[gradeId,code]` on the table `curriculum_topics` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "grade_release_configs" DROP CONSTRAINT "grade_release_configs_gradeId_fkey";

-- DropIndex
DROP INDEX "curriculum_topics_code_key";

-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "validator_rules" ADD COLUMN     "scope" TEXT NOT NULL DEFAULT 'global';

-- DropTable
DROP TABLE "grade_release_configs";

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_topics_gradeId_code_key" ON "curriculum_topics"("gradeId", "code");
