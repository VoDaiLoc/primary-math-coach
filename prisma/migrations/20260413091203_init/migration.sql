-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "QuestionFormat" AS ENUM ('MCQ', 'FILLIN');

-- CreateEnum
CREATE TYPE "TopicStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'GRADED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MasteryStatus" AS ENUM ('STRONG', 'DEVELOPING', 'WEAK');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PARENT', 'TEACHER', 'ADMIN');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolName" TEXT,
    "schoolYear" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "displayName" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "curriculum_topics" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TopicStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "gradeId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "curriculum_topics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question_blueprints" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questionFormat" "QuestionFormat" NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'v1.0',
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "easyPercent" INTEGER NOT NULL,
    "mediumPercent" INTEGER NOT NULL,
    "hardPercent" INTEGER NOT NULL,
    "constraints" JSONB,
    "topicId" TEXT NOT NULL,
    "skillId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validator_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "validator_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "modelTarget" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_release_configs" (
    "id" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "aiGenerationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoRecommendEnabled" BOOLEAN NOT NULL DEFAULT false,
    "timedExamEnabled" BOOLEAN NOT NULL DEFAULT false,
    "version" TEXT NOT NULL DEFAULT 'v0.1.0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_release_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "format" "QuestionFormat" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "gradeId" TEXT NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_items" (
    "id" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionFormat" "QuestionFormat" NOT NULL,
    "difficulty" "DifficultyLevel" NOT NULL,
    "correctAnswer" TEXT NOT NULL,
    "hint" TEXT,
    "choices" JSONB,
    "sourceQuestionId" TEXT,
    "examId" TEXT NOT NULL,

    CONSTRAINT "exam_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_answers" (
    "id" TEXT NOT NULL,
    "givenAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "submissionId" TEXT NOT NULL,
    "examItemId" TEXT NOT NULL,

    CONSTRAINT "submission_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "id" TEXT NOT NULL,
    "sessionCount" INTEGER NOT NULL DEFAULT 0,
    "totalQuestions" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "accuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "mastery" "MasteryStatus" NOT NULL DEFAULT 'WEAK',
    "lastPracticedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "students_userId_idx" ON "students"("userId");

-- CreateIndex
CREATE INDEX "students_gradeId_idx" ON "students"("gradeId");

-- CreateIndex
CREATE UNIQUE INDEX "grades_level_key" ON "grades"("level");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "curriculum_topics_code_key" ON "curriculum_topics"("code");

-- CreateIndex
CREATE INDEX "curriculum_topics_gradeId_idx" ON "curriculum_topics"("gradeId");

-- CreateIndex
CREATE INDEX "curriculum_topics_subjectId_idx" ON "curriculum_topics"("subjectId");

-- CreateIndex
CREATE INDEX "skills_topicId_idx" ON "skills"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_topicId_code_key" ON "skills"("topicId", "code");

-- CreateIndex
CREATE INDEX "question_blueprints_topicId_idx" ON "question_blueprints"("topicId");

-- CreateIndex
CREATE UNIQUE INDEX "validator_rules_name_key" ON "validator_rules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_slug_key" ON "prompt_templates"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "grade_release_configs_gradeId_key" ON "grade_release_configs"("gradeId");

-- CreateIndex
CREATE INDEX "exams_studentId_idx" ON "exams"("studentId");

-- CreateIndex
CREATE INDEX "exams_topicId_idx" ON "exams"("topicId");

-- CreateIndex
CREATE INDEX "exam_items_examId_idx" ON "exam_items"("examId");

-- CreateIndex
CREATE INDEX "submissions_examId_idx" ON "submissions"("examId");

-- CreateIndex
CREATE INDEX "submissions_studentId_idx" ON "submissions"("studentId");

-- CreateIndex
CREATE INDEX "submission_answers_submissionId_idx" ON "submission_answers"("submissionId");

-- CreateIndex
CREATE INDEX "learning_progress_studentId_idx" ON "learning_progress"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "learning_progress_studentId_topicId_key" ON "learning_progress"("studentId", "topicId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_topics" ADD CONSTRAINT "curriculum_topics_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "curriculum_topics" ADD CONSTRAINT "curriculum_topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_blueprints" ADD CONSTRAINT "question_blueprints_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_blueprints" ADD CONSTRAINT "question_blueprints_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_release_configs" ADD CONSTRAINT "grade_release_configs_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "grades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_items" ADD CONSTRAINT "exam_items_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_examItemId_fkey" FOREIGN KEY ("examItemId") REFERENCES "exam_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "learning_progress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "curriculum_topics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
