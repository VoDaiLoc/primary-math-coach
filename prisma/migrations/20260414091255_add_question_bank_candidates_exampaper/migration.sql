-- CreateEnum
CREATE TYPE "QuestionSource" AS ENUM ('MANUAL', 'IMPORTED', 'AI_GENERATED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "question_bank_items" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "format" "QuestionFormat" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "hint" TEXT,
    "choices" JSONB,
    "source" "QuestionSource" NOT NULL DEFAULT 'MANUAL',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "modelUsed" TEXT,
    "blueprintId" TEXT,
    "promptTemplateVersion" TEXT,
    "validatorSummary" JSONB,
    "topicId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "skillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_bank_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_candidates" (
    "id" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "format" "QuestionFormat" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "hint" TEXT,
    "choices" JSONB,
    "modelUsed" TEXT,
    "blueprintId" TEXT,
    "blueprintVersion" TEXT,
    "promptTemplateSlug" TEXT,
    "validatorPassed" BOOLEAN NOT NULL,
    "validatorErrors" JSONB,
    "candidateStatus" "CandidateStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "bankItemId" TEXT,
    "topicId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "skillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_papers" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "gradeId" TEXT NOT NULL,
    "topicId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exam_papers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_paper_items" (
    "id" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "scoreWeight" INTEGER NOT NULL DEFAULT 1,
    "examPaperId" TEXT NOT NULL,
    "questionBankItemId" TEXT NOT NULL,

    CONSTRAINT "exam_paper_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_bank_items_topicId_idx" ON "question_bank_items"("topicId");

-- CreateIndex
CREATE INDEX "question_bank_items_gradeId_idx" ON "question_bank_items"("gradeId");

-- CreateIndex
CREATE INDEX "question_bank_items_reviewStatus_idx" ON "question_bank_items"("reviewStatus");

-- CreateIndex
CREATE INDEX "question_bank_items_source_idx" ON "question_bank_items"("source");

-- CreateIndex
CREATE INDEX "question_candidates_topicId_idx" ON "question_candidates"("topicId");

-- CreateIndex
CREATE INDEX "question_candidates_candidateStatus_idx" ON "question_candidates"("candidateStatus");

-- CreateIndex
CREATE INDEX "exam_papers_gradeId_idx" ON "exam_papers"("gradeId");

-- CreateIndex
CREATE INDEX "exam_paper_items_examPaperId_idx" ON "exam_paper_items"("examPaperId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_paper_items_examPaperId_questionBankItemId_key" ON "exam_paper_items"("examPaperId", "questionBankItemId");

-- AddForeignKey
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_bank_items" ADD CONSTRAINT "question_bank_items_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_candidates" ADD CONSTRAINT "question_candidates_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_candidates" ADD CONSTRAINT "question_candidates_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_candidates" ADD CONSTRAINT "question_candidates_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_papers" ADD CONSTRAINT "exam_papers_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_paper_items" ADD CONSTRAINT "exam_paper_items_examPaperId_fkey" FOREIGN KEY ("examPaperId") REFERENCES "exam_papers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_paper_items" ADD CONSTRAINT "exam_paper_items_questionBankItemId_fkey" FOREIGN KEY ("questionBankItemId") REFERENCES "question_bank_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
