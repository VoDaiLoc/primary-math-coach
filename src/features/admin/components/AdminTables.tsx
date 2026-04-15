"use client";

import { useState } from "react";
import type { QuestionBlueprint, ValidatorRule, PromptTemplate } from "@/types";
import type { PatchBlueprintBody, CreateBlueprintBody, CreateValidatorRuleBody, PatchValidatorRuleBody } from "@/types/api";
import { ToggleSwitch } from "./ToggleSwitch";

/* Shared saved/error indicator */
function SaveStatus({ status }: { status?: "saving" | "saved" | "error" }) {
  if (!status) return null;
  if (status === "saving") return <span className="text-[10px] text-neutral-400 animate-pulse">Dang luu...</span>;
  if (status === "saved")  return <span className="text-[10px] text-green-600 font-semibold">Da luu</span>;
  return <span className="text-[10px] text-red-500 font-semibold">Loi</span>;
}

/* ====================================================================
   BlueprintTable — full CRUD
   ==================================================================== */
type BlueprintSave = Record<string, "saving" | "saved" | "error">;

const FORMAT_LABELS: Record<string, string> = { mcq: "Trac nghiem", fillin: "Dien vao" };

export function BlueprintTable({ items, topics }: {
  items: QuestionBlueprint[];
  topics: { id: string; name: string }[];
}) {
  const [data,    setData]    = useState<QuestionBlueprint[]>(items);
  const [saves,   setSaves]   = useState<BlueprintSave>({});
  const [editId,  setEditId]  = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [draft,   setDraft]   = useState({ easy: "30", medium: "50", hard: "20", version: "v1", name: "" });
  const [newForm, setNewForm] = useState({ name: "", topicId: "", format: "mcq", easy: "30", medium: "50", hard: "20", version: "v1" });
  const [newErr,  setNewErr]  = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function openEdit(b: QuestionBlueprint) {
    setEditId(b.id);
    setDraft({ easy: String(b.easyPercent), medium: String(b.mediumPercent), hard: String(b.hardPercent), version: b.version, name: b.name });
  }

  async function toggleEnabled(b: QuestionBlueprint) {
    setData((prev) => prev.map((x) => x.id === b.id ? { ...x, isEnabled: !x.isEnabled } : x));
    setSaves((s) => ({ ...s, [b.id]: "saving" }));
    const body: PatchBlueprintBody = { isEnabled: !b.isEnabled };
    try {
      const res = await fetch(`/api/admin/blueprints/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setSaves((s) => ({ ...s, [b.id]: res.ok ? "saved" : "error" }));
      if (!res.ok) setData((prev) => prev.map((x) => x.id === b.id ? { ...x, isEnabled: b.isEnabled } : x));
    } catch {
      setData((prev) => prev.map((x) => x.id === b.id ? { ...x, isEnabled: b.isEnabled } : x));
      setSaves((s) => ({ ...s, [b.id]: "error" }));
    }
  }

  async function saveEdit(id: string) {
    const easy = Number.parseInt(draft.easy, 10);
    const medium = Number.parseInt(draft.medium, 10);
    const hard = Number.parseInt(draft.hard, 10);
    if ([easy, medium, hard].some(Number.isNaN) || easy + medium + hard !== 100) { alert("Tong phan tram phai bang 100."); return; }
    if (!draft.name.trim()) { alert("Ten khong duoc rong."); return; }
    setSaves((s) => ({ ...s, [id]: "saving" }));
    try {
      const body: PatchBlueprintBody = { name: draft.name.trim(), easyPercent: easy, mediumPercent: medium, hardPercent: hard, version: draft.version };
      const res = await fetch(`/api/admin/blueprints/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const updated: QuestionBlueprint = await res.json();
        setData((prev) => prev.map((x) => x.id === id ? updated : x));
        setSaves((s) => ({ ...s, [id]: "saved" }));
        setEditId(null);
      } else { setSaves((s) => ({ ...s, [id]: "error" })); }
    } catch { setSaves((s) => ({ ...s, [id]: "error" })); }
  }

  async function handleDelete(b: QuestionBlueprint) {
    if (!confirm(`Xoa blueprint "${b.name}"?`)) return;
    setSaves((s) => ({ ...s, [b.id]: "saving" }));
    try {
      const res = await fetch(`/api/admin/blueprints/${b.id}`, { method: "DELETE" });
      if (res.ok) { setData((prev) => prev.filter((x) => x.id !== b.id)); }
      else { setSaves((s) => ({ ...s, [b.id]: "error" })); alert("Khong the xoa blueprint."); }
    } catch { setSaves((s) => ({ ...s, [b.id]: "error" })); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const easy = Number.parseInt(newForm.easy, 10);
    const medium = Number.parseInt(newForm.medium, 10);
    const hard = Number.parseInt(newForm.hard, 10);
    if (!newForm.name.trim()) { setNewErr("Ten la bat buoc."); return; }
    if (!newForm.topicId) { setNewErr("Vui long chon chu de."); return; }
    if ([easy, medium, hard].some(Number.isNaN) || easy + medium + hard !== 100) { setNewErr("Tong phan tram phai bang 100."); return; }
    setCreating(true); setNewErr(null);
    const body: CreateBlueprintBody = { name: newForm.name.trim(), topicId: newForm.topicId, questionFormat: newForm.format as "mcq" | "fillin", easyPercent: easy, mediumPercent: medium, hardPercent: hard, version: newForm.version || "v1" };
    try {
      const res = await fetch("/api/admin/blueprints", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok) {
        setData((prev) => [...prev, json]);
        setShowNew(false);
        setNewForm({ name: "", topicId: "", format: "mcq", easy: "30", medium: "50", hard: "20", version: "v1" });
      } else { setNewErr(json.error ?? "Loi tao blueprint."); }
    } catch { setNewErr("Loi ket noi."); }
    finally { setCreating(false); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-neutral-700">{data.length} blueprint</span>
        <button onClick={() => setShowNew(!showNew)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#0F52BA,#002B8C)" }}>
          {showNew ? "Huy" : "+ Tao blueprint"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="mb-4 border border-blue-200 bg-blue-50 rounded-[10px] p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Blueprint moi</p>
          {newErr && <p className="text-xs text-red-600">{newErr}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Ten *</label>
              <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs" placeholder="Cong co nho - MCQ" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Chu de *</label>
              <select value={newForm.topicId} onChange={(e) => setNewForm((f) => ({ ...f, topicId: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs bg-white">
                <option value="">-- Chon --</option>
                {topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Loai</label>
              <select value={newForm.format} onChange={(e) => setNewForm((f) => ({ ...f, format: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs bg-white">
                <option value="mcq">Trac nghiem</option>
                <option value="fillin">Dien vao</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Phien ban</label>
              <input value={newForm.version} onChange={(e) => setNewForm((f) => ({ ...f, version: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs" placeholder="v1" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Phan phoi De / Vua / Kho (tong=100)</label>
              <div className="flex gap-2">
                <input type="number" min="0" max="100" value={newForm.easy} onChange={(e) => setNewForm((f) => ({ ...f, easy: e.target.value }))} className="w-20 border rounded px-2 py-1.5 text-xs" placeholder="De%" />
                <input type="number" min="0" max="100" value={newForm.medium} onChange={(e) => setNewForm((f) => ({ ...f, medium: e.target.value }))} className="w-20 border rounded px-2 py-1.5 text-xs" placeholder="Vua%" />
                <input type="number" min="0" max="100" value={newForm.hard} onChange={(e) => setNewForm((f) => ({ ...f, hard: e.target.value }))} className="w-20 border rounded px-2 py-1.5 text-xs" placeholder="Kho%" />
              </div>
            </div>
          </div>
          <button type="submit" disabled={creating} className="self-start px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: "#0F52BA" }}>
            {creating ? "Dang tao..." : "Tao blueprint"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              {["Ten", "Loai", "Phan phoi do kho", "Phien ban", "Bat", ""].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 pr-4 font-semibold text-neutral-800 text-xs">
                  {editId === b.id
                    ? <input className="border rounded px-1 py-0.5 text-xs w-40" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
                    : b.name}
                </td>
                <td className="py-3 pr-4 text-neutral-500 text-xs">{FORMAT_LABELS[b.questionFormat] ?? b.questionFormat}</td>
                <td className="py-3 pr-4 text-xs text-neutral-500">
                  {editId === b.id ? (
                    <div className="flex items-center gap-1">
                      <input className="w-10 border rounded px-1 py-0.5 text-xs" value={draft.easy} onChange={(e) => setDraft((d) => ({ ...d, easy: e.target.value }))} />
                      <span>/</span>
                      <input className="w-10 border rounded px-1 py-0.5 text-xs" value={draft.medium} onChange={(e) => setDraft((d) => ({ ...d, medium: e.target.value }))} />
                      <span>/</span>
                      <input className="w-10 border rounded px-1 py-0.5 text-xs" value={draft.hard} onChange={(e) => setDraft((d) => ({ ...d, hard: e.target.value }))} />
                    </div>
                  ) : `De ${b.easyPercent}% / Vua ${b.mediumPercent}% / Kho ${b.hardPercent}%`}
                </td>
                <td className="py-3 pr-4 text-xs font-mono text-neutral-500">
                  {editId === b.id
                    ? <input className="w-14 border rounded px-1 py-0.5 text-xs font-mono" value={draft.version} onChange={(e) => setDraft((d) => ({ ...d, version: e.target.value }))} />
                    : b.version}
                </td>
                <td className="py-3 pr-4">
                  <ToggleSwitch checked={b.isEnabled} onChange={() => toggleEnabled(b)} disabled={saves[b.id] === "saving"} />
                </td>
                <td className="py-3 whitespace-nowrap">
                  {editId === b.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(b.id)} disabled={saves[b.id] === "saving"} className="text-xs font-semibold text-white bg-primary px-2 py-0.5 rounded hover:opacity-90 disabled:opacity-50">Luu</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Huy</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(b)} className="text-xs text-primary hover:underline">Sua</button>
                      <button onClick={() => handleDelete(b)} className="text-xs text-red-500 hover:underline">Xoa</button>
                      <SaveStatus status={saves[b.id]} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Chua co blueprint nao.</p>}
      </div>
    </div>
  );
}

/* ====================================================================
   ValidatorRulesTable — full CRUD
   ==================================================================== */
const SCOPE_LABELS: Record<string, string> = { global: "Toan cuc", grade: "Lop", topic: "Chu de", skill: "Ky nang", blueprint: "Blueprint" };

export function ValidatorRulesTable({ items }: { items: ValidatorRule[] }) {
  const [data,    setData]    = useState<ValidatorRule[]>(items);
  const [saves,   setSaves]   = useState<Record<string, "saving" | "saved" | "error">>({});
  const [editId,  setEditId]  = useState<string | null>(null);
  const [draft,   setDraft]   = useState({ description: "", scope: "global", isActive: true });
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", description: "", scope: "global" });
  const [newErr,  setNewErr]  = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  function openEdit(r: ValidatorRule) {
    setEditId(r.id);
    setDraft({ description: r.description, scope: r.scope ?? "global", isActive: r.isActive });
  }

  async function saveEdit(id: string) {
    setSaves((s) => ({ ...s, [id]: "saving" }));
    const body: PatchValidatorRuleBody = { description: draft.description, scope: draft.scope, isActive: draft.isActive };
    try {
      const res = await fetch(`/api/admin/validator-rules/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const updated: ValidatorRule = await res.json();
        setData((prev) => prev.map((x) => x.id === id ? updated : x));
        setSaves((s) => ({ ...s, [id]: "saved" }));
        setEditId(null);
      } else { setSaves((s) => ({ ...s, [id]: "error" })); }
    } catch { setSaves((s) => ({ ...s, [id]: "error" })); }
  }

  async function toggleActive(r: ValidatorRule) {
    setData((prev) => prev.map((x) => x.id === r.id ? { ...x, isActive: !x.isActive } : x));
    setSaves((s) => ({ ...s, [r.id]: "saving" }));
    const body: PatchValidatorRuleBody = { isActive: !r.isActive };
    try {
      const res = await fetch(`/api/admin/validator-rules/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setSaves((s) => ({ ...s, [r.id]: res.ok ? "saved" : "error" }));
      if (!res.ok) setData((prev) => prev.map((x) => x.id === r.id ? { ...x, isActive: r.isActive } : x));
    } catch {
      setData((prev) => prev.map((x) => x.id === r.id ? { ...x, isActive: r.isActive } : x));
      setSaves((s) => ({ ...s, [r.id]: "error" }));
    }
  }

  async function handleDelete(r: ValidatorRule) {
    if (!confirm(`Xoa quy tac "${r.name}"?`)) return;
    setSaves((s) => ({ ...s, [r.id]: "saving" }));
    try {
      const res = await fetch(`/api/admin/validator-rules/${r.id}`, { method: "DELETE" });
      if (res.ok) { setData((prev) => prev.filter((x) => x.id !== r.id)); }
      else { setSaves((s) => ({ ...s, [r.id]: "error" })); alert("Khong the xoa quy tac."); }
    } catch { setSaves((s) => ({ ...s, [r.id]: "error" })); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newForm.name.trim()) { setNewErr("Ten la bat buoc."); return; }
    if (!newForm.description.trim()) { setNewErr("Mo ta la bat buoc."); return; }
    setCreating(true); setNewErr(null);
    const body: CreateValidatorRuleBody = { name: newForm.name.trim(), description: newForm.description.trim(), scope: newForm.scope };
    try {
      const res = await fetch("/api/admin/validator-rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (res.ok) {
        setData((prev) => [...prev, json]);
        setShowNew(false);
        setNewForm({ name: "", description: "", scope: "global" });
      } else { setNewErr(json.error ?? "Loi tao quy tac."); }
    } catch { setNewErr("Loi ket noi."); }
    finally { setCreating(false); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-semibold text-neutral-700">{data.length} quy tac</span>
        <button onClick={() => setShowNew(!showNew)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#0F52BA,#002B8C)" }}>
          {showNew ? "Huy" : "+ Them quy tac"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={handleCreate} className="mb-4 border border-blue-200 bg-blue-50 rounded-[10px] p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-neutral-600 uppercase tracking-wide">Quy tac moi</p>
          {newErr && <p className="text-xs text-red-600">{newErr}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Ten quy tac *</label>
              <input value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs font-mono" placeholder="range_check" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Pham vi</label>
              <select value={newForm.scope} onChange={(e) => setNewForm((f) => ({ ...f, scope: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs bg-white">
                <option value="global">Toan cuc</option>
                <option value="grade">Lop</option>
                <option value="topic">Chu de</option>
                <option value="skill">Ky nang</option>
                <option value="blueprint">Blueprint</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-neutral-500 mb-1">Mo ta *</label>
              <input value={newForm.description} onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-xs" placeholder="Ket qua phai nam trong pham vi so cua lop" />
            </div>
          </div>
          <button type="submit" disabled={creating} className="self-start px-4 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50" style={{ background: "#0F52BA" }}>
            {creating ? "Dang them..." : "Them quy tac"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-neutral-200">
              {["Quy tac", "Mo ta", "Pham vi", "Bat", ""].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="py-3 pr-4 font-mono text-xs text-neutral-700">{r.name}</td>
                <td className="py-3 pr-4 text-xs text-neutral-500 max-w-[240px]">
                  {editId === r.id
                    ? <input className="w-full border rounded px-1 py-0.5 text-xs" value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
                    : r.description}
                </td>
                <td className="py-3 pr-4 text-xs text-neutral-400">
                  {editId === r.id
                    ? <select value={draft.scope} onChange={(e) => setDraft((d) => ({ ...d, scope: e.target.value }))} className="border rounded px-1 py-0.5 text-xs bg-white">
                        {Object.entries(SCOPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    : (SCOPE_LABELS[r.scope ?? "global"] ?? r.scope)}
                </td>
                <td className="py-3 pr-4">
                  <ToggleSwitch checked={r.isActive} onChange={() => toggleActive(r)} disabled={saves[r.id] === "saving"} />
                </td>
                <td className="py-3 whitespace-nowrap">
                  {editId === r.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(r.id)} disabled={saves[r.id] === "saving"} className="text-xs font-semibold text-white bg-primary px-2 py-0.5 rounded hover:opacity-90 disabled:opacity-50">Luu</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-neutral-400 hover:text-neutral-600">Huy</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(r)} className="text-xs text-primary hover:underline">Sua</button>
                      <button onClick={() => handleDelete(r)} className="text-xs text-red-500 hover:underline">Xoa</button>
                      <SaveStatus status={saves[r.id]} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && <p className="py-8 text-center text-sm text-neutral-400">Chua co quy tac nao.</p>}
      </div>
    </div>
  );
}

/* ====================================================================
   PromptTemplateTable — read-only (source-file-based, no DB editing)
   ==================================================================== */
export function PromptTemplateTable({ items }: { items: PromptTemplate[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-neutral-400 italic mb-1">
        Cac mau prompt duoc doc truc tiep tu source code (/src/prompts). Admin khong chinh sua truc tiep trong DB.
      </p>
      {items.map((t) => (
        <div key={t.id} className="border border-neutral-200 rounded-[10px] p-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-neutral-800">{t.name}</p>
              <p className="text-xs text-neutral-400 mt-0.5">v{t.version} · {t.modelTarget}</p>
            </div>
            <button onClick={() => setExpanded(expanded === t.id ? null : t.id)} className="text-xs text-primary font-semibold hover:underline">
              {expanded === t.id ? "Thu gon" : "Xem template"}
            </button>
          </div>
          {expanded === t.id && (
            <pre className="mt-3 bg-neutral-50 border border-neutral-200 rounded-[8px] p-3 text-xs text-neutral-700 whitespace-pre-wrap font-mono overflow-x-auto">
              {t.template}
            </pre>
          )}
        </div>
      ))}
      {items.length === 0 && <p className="py-4 text-center text-sm text-neutral-400">Khong tim thay file prompt.</p>}
    </div>
  );
}
