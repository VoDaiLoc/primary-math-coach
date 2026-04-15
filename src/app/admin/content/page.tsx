"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminSidebar } from "@/features/admin/components/AdminSidebar";
import { GradeTable } from "@/features/admin/components/GradeTable";
import { TopicTable } from "@/features/admin/components/TopicTable";
import { SkillTable } from "@/features/admin/components/SkillTable";
import {
  BlueprintTable,
  ValidatorRulesTable,
  PromptTemplateTable,
} from "@/features/admin/components/AdminTables";
import { QuestionBankTable } from "@/features/admin/components/QuestionBankTable";
import { CandidateReviewTable } from "@/features/admin/components/CandidateReviewTable";
import { CsvImporter } from "@/features/admin/components/CsvImporter";
import { ExamPaperBuilder } from "@/features/admin/components/ExamPaperBuilder";
import { SectionCard } from "@/components/shared/SectionCard";
import type { Grade, CurriculumTopic, QuestionBlueprint, ValidatorRule, PromptTemplate } from "@/types";
import type {
  AdminGradesResponse,
  AdminTopicsResponse,
  AdminSkillsResponse,
  AdminBlueprintsResponse,
  AdminValidatorRulesResponse,
  AdminPromptTemplatesResponse,
  AdminSkillRow,
  QuestionBankItemRow,
  AdminQuestionBankResponse,
  QuestionCandidateRow,
  AdminCandidatesResponse,
  ExamPaperRow,
  ExamPaperDetail,
  ExamPaperDetailItem,
  AdminExamPapersResponse,
} from "@/types/api";

// ── Tab titles (Vietnamese) ────────────────────────────────────────────────────

const TITLES: Record<string, string> = {
  "lop":                  "Lớp",
  "chu-de":               "Chủ đề",
  "ky-nang":              "Kỹ năng",
  "blueprint":            "Blueprint câu hỏi",
  "quy-tac-kiem-tra":     "Quy tắc kiểm tra",
  "mau-prompt-ai":        "Mẫu prompt AI",
  "ngan-hang-cau-hoi":    "Ngân hàng câu hỏi",
  "cau-hoi-ai-cho-duyet": "Câu hỏi AI chờ duyệt",
  "import-csv":           "Import CSV",
  "ngan-hang-de":         "Ngân hàng đề",
  "tao-de":               "Tạo đề",
};

// ── Per-tab data shape ─────────────────────────────────────────────────────────

type TabData = {
  grades?: Grade[];
  topics?: CurriculumTopic[];
  skills?: AdminSkillRow[];
  blueprints?: QuestionBlueprint[];
  validatorRules?: ValidatorRule[];
  promptTemplates?: PromptTemplate[];
  bankItems?: QuestionBankItemRow[];
  candidates?: QuestionCandidateRow[];
  examPapers?: ExamPaperRow[];
};

// ── Data fetcher ───────────────────────────────────────────────────────────────

async function fetchTab(tab: string): Promise<TabData> {
  if (tab === "lop") {
    const r = await fetch("/api/admin/grades").then((r) => r.json() as Promise<AdminGradesResponse>);
    return { grades: r.grades };
  }
  if (tab === "chu-de") {
    const [topicsRes, gradesRes] = await Promise.all([
      fetch("/api/admin/topics").then((r) => r.json() as Promise<AdminTopicsResponse>),
      fetch("/api/admin/grades").then((r) => r.json() as Promise<AdminGradesResponse>),
    ]);
    return { topics: topicsRes.topics, grades: gradesRes.grades };
  }
  if (tab === "ky-nang") {
    const [skillsRes, topicsRes] = await Promise.all([
      fetch("/api/admin/skills").then((r) => r.json() as Promise<AdminSkillsResponse>),
      fetch("/api/admin/topics").then((r) => r.json() as Promise<AdminTopicsResponse>),
    ]);
    return { skills: skillsRes.skills, topics: topicsRes.topics };
  }
  if (tab === "blueprint") {
    const [bpRes, topicsRes] = await Promise.all([
      fetch("/api/admin/blueprints").then((r) => r.json() as Promise<AdminBlueprintsResponse>),
      fetch("/api/admin/topics").then((r) => r.json() as Promise<AdminTopicsResponse>),
    ]);
    return { blueprints: bpRes.blueprints, topics: topicsRes.topics };
  }
  if (tab === "quy-tac-kiem-tra") {
    const r = await fetch("/api/admin/validator-rules").then((r) => r.json() as Promise<AdminValidatorRulesResponse>);
    return { validatorRules: r.rules };
  }
  if (tab === "mau-prompt-ai") {
    const r = await fetch("/api/admin/prompt-templates").then((r) => r.json() as Promise<AdminPromptTemplatesResponse>);
    return { promptTemplates: r.templates };
  }
  if (tab === "ngan-hang-cau-hoi") {
    const r = await fetch("/api/admin/question-bank?pageSize=100").then((r) => r.json() as Promise<AdminQuestionBankResponse>);
    return { bankItems: r.items };
  }
  if (tab === "cau-hoi-ai-cho-duyet") {
    const r = await fetch("/api/admin/question-candidates?pageSize=50").then((r) => r.json() as Promise<AdminCandidatesResponse>);
    return { candidates: r.candidates };
  }
  if (tab === "ngan-hang-de" || tab === "tao-de") {
    const r = await fetch("/api/admin/exam-papers").then((r) => r.json() as Promise<AdminExamPapersResponse>);
    return { examPapers: r.papers };
  }
  return {};
}

// ── AdminContent ──────────────────────────────────────────────────────────────

function AdminContent() {
  const params = useSearchParams();
  const tab = params.get("tab") ?? "lop";

  const [tabData, setTabData]   = useState<Partial<Record<string, TabData>>>({});
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const fetchedTabs = useRef<Set<string>>(new Set());

  const [selectedPaper, setSelectedPaper] = useState<ExamPaperDetail | null>(null);
  const [loadingPaper, setLoadingPaper]   = useState(false);

  useEffect(() => {
    setSelectedPaper(null);
    if (fetchedTabs.current.has(tab)) return;
    fetchedTabs.current.add(tab);
    setLoading(true);
    setError(null);
    fetchTab(tab)
      .then((data) => setTabData((prev) => ({ ...prev, [tab]: data })))
      .catch(() => setError("Không thể tải dữ liệu. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [tab]);

  const data = tabData[tab];

  function handleArchiveBankItem(id: string) {
    setTabData((prev) => {
      const items = prev[tab]?.bankItems?.filter((i) => i.id !== id);
      return { ...prev, [tab]: { ...prev[tab], bankItems: items } };
    });
  }

  function handleCandidateReviewed(updated: QuestionCandidateRow) {
    setTabData((prev) => {
      const candidates = prev[tab]?.candidates?.map((c) => (c.id === updated.id ? updated : c));
      return { ...prev, [tab]: { ...prev[tab], candidates } };
    });
  }

  function handlePaperItemAdded(item: ExamPaperDetailItem) {
    setSelectedPaper((p) => (p ? { ...p, items: [...p.items, item] } : null));
  }

  function handlePaperItemRemoved(itemId: string) {
    setSelectedPaper((p) => (p ? { ...p, items: p.items.filter((i) => i.id !== itemId) } : null));
  }

  async function openPaperBuilder(paperId: string) {
    setLoadingPaper(true);
    try {
      const [paperRes, bankRes] = await Promise.all([
        fetch(`/api/admin/exam-papers/${paperId}`).then((r) => r.json() as Promise<ExamPaperDetail>),
        fetch("/api/admin/question-bank?reviewStatus=approved&pageSize=300")
          .then((r) => r.json() as Promise<AdminQuestionBankResponse>),
      ]);
      setSelectedPaper(paperRes);
      setTabData((prev) => ({ ...prev, [tab]: { ...prev[tab], bankItems: bankRes.items } }));
    } finally {
      setLoadingPaper(false);
    }
  }

  // ── Sub-renders ─────────────────────────────────────────────────────────────

  function renderCurriculumTab() {
    if (!data) return null;
    if (tab === "lop")     return <SectionCard title="Lớp"><GradeTable grades={data.grades ?? []} /></SectionCard>;
    if (tab === "chu-de")  return <SectionCard title="Chủ đề"><TopicTable topics={data.topics ?? []} grades={data.grades ?? []} /></SectionCard>;
    if (tab === "ky-nang") return <SectionCard title="Kỹ năng"><SkillTable skills={data.skills ?? []} topics={data.topics ?? []} /></SectionCard>;
    return null;
  }

  function renderContentTab() {
    if (!data) return null;
    if (tab === "blueprint")          return <SectionCard title="Blueprint câu hỏi"><BlueprintTable items={data.blueprints ?? []} topics={(data.topics ?? []).map((t) => ({ id: t.id, name: t.name }))} /></SectionCard>;
    if (tab === "quy-tac-kiem-tra")   return <SectionCard title="Quy tắc kiểm tra"><ValidatorRulesTable items={data.validatorRules ?? []} /></SectionCard>;
    if (tab === "mau-prompt-ai")      return <SectionCard title="Mẫu prompt AI"><PromptTemplateTable items={data.promptTemplates ?? []} /></SectionCard>;
    return null;
  }

  function renderBankTab() {
    if (tab === "ngan-hang-cau-hoi") {
      return (
        <SectionCard title="Ngân hàng câu hỏi">
          <QuestionBankTable items={data?.bankItems ?? []} onArchive={handleArchiveBankItem} />
        </SectionCard>
      );
    }
    if (tab === "cau-hoi-ai-cho-duyet") {
      return (
        <SectionCard title="Câu hỏi AI chờ duyệt">
          <CandidateReviewTable candidates={data?.candidates ?? []} onReviewed={handleCandidateReviewed} />
        </SectionCard>
      );
    }
    if (tab === "import-csv") {
      return (
        <div className="space-y-5">
          <CsvImporter type="topics"    label="Import Chủ đề" />
          <CsvImporter type="skills"    label="Import Kỹ năng" />
          <CsvImporter type="questions" label="Import Câu hỏi vào ngân hàng" />
        </div>
      );
    }
    return null;
  }

  function renderExamList() {
    return (
      <SectionCard title={tab === "tao-de" ? "Chọn đề để soạn" : "Ngân hàng đề"}>
        {loadingPaper && <p className="text-sm text-neutral-400 py-2">Đang tải...</p>}
        {(data?.examPapers ?? []).length === 0 ? (
          <p className="text-sm text-neutral-400 py-4">Chưa có đề nào trong ngân hàng.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200">
                  {["Tiêu đề", "Lớp", "Chủ đề", "Số câu", "Trạng thái", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.examPapers ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className="py-3 pr-4 font-medium text-neutral-800">{p.title}</td>
                    <td className="py-3 pr-4 text-neutral-500 whitespace-nowrap">Lớp {p.gradeLevel}</td>
                    <td className="py-3 pr-4 text-neutral-500">{p.topicName ?? "—"}</td>
                    <td className="py-3 pr-4 text-neutral-500">{p.itemCount}</td>
                    <td className="py-3 pr-4">
                      <span className="text-[11px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">{p.status}</span>
                    </td>
                    <td className="py-3">
                      <button onClick={() => openPaperBuilder(p.id)} className="text-xs text-blue-500 hover:underline">
                        Soạn đề
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    );
  }

  function renderExamTab() {
    if (tab !== "ngan-hang-de" && tab !== "tao-de") return null;
    if (selectedPaper) {
      return (
        <SectionCard title={`Soạn đề: ${selectedPaper.title}`}>
          <button onClick={() => setSelectedPaper(null)} className="text-xs text-blue-500 hover:underline mb-4 block">
            ← Quay lại danh sách
          </button>
          <ExamPaperBuilder
            paper={selectedPaper}
            bankItems={data?.bankItems ?? []}
            onItemAdded={handlePaperItemAdded}
            onItemRemoved={handlePaperItemRemoved}
          />
        </SectionCard>
      );
    }
    return renderExamList();
  }

  function renderContent() {
    if (loading) return <p className="text-sm text-neutral-400 py-6">Đang tải...</p>;
    if (error)   return <p className="text-sm text-red-500 py-6">{error}</p>;
    return renderCurriculumTab() ?? renderContentTab() ?? renderBankTab() ?? renderExamTab();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <AdminSidebar activeTab={tab} />
      <div className="flex-1 min-w-0">
        <h2 className="text-[18px] font-bold text-neutral-900 mb-4">{TITLES[tab] ?? tab}</h2>
        {renderContent()}
      </div>
    </div>
  );
}

export default function AdminContentPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-neutral-900 tracking-tight">Admin · Nội dung</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Quản lý chương trình học và cấu hình hệ thống</p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-warning-light text-yellow-700 border border-yellow-300">
          ⚠ Môi trường nội bộ
        </span>
      </div>
      <Suspense fallback={<div className="text-sm text-neutral-400">Đang tải...</div>}>
        <AdminContent />
      </Suspense>
    </div>
  );
}

