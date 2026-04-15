"use client";

import { useEffect, useState } from "react";
import type { AdminSkillRow } from "@/types/api";
import type { CurriculumTopic } from "@/types/domain";
import { ToggleSwitch } from "./ToggleSwitch";

interface SkillTableProps {
  readonly skills: AdminSkillRow[];
  readonly topics?: CurriculumTopic[];
}

const INPUT_CLS = "border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white w-full";
const BTN_PRIMARY = "text-xs px-4 py-1.5 rounded-[7px] font-semibold text-white disabled:opacity-50 transition-all duration-200 hover:scale-[1.03]";
const BTN_GHOST   = "text-xs px-3 py-1.5 rounded-[7px] border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors";
const GRAD = { background: "linear-gradient(135deg, #0F52BA, #002B8C)" };

export function SkillTable({ skills: initialSkills, topics: topicsProp }: SkillTableProps) {
  const [data, setData] = useState<AdminSkillRow[]>(initialSkills);

  const [topics, setTopics] = useState<CurriculumTopic[]>(topicsProp ?? []);
  useEffect(() => {
    if (topics.length > 0) return;
    fetch("/api/admin/topics").then((r) => r.json()).then((d) => setTopics(d.topics ?? [])).catch(() => {});
  }, [topics.length]);

  const [search, setSearch]           = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterActive, setFilterActive] = useState<"" | "true" | "false">("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", code: "", topicId: "", description: "" });
  const [creating, setCreating]     = useState(false);
  const [createErr, setCreateErr]   = useState<string | null>(null);

  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editForm, setEditForm]     = useState({ name: "", code: "", description: "" });
  const [editErr, setEditErr]       = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const [deletingId, setDeletingId]     = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const displayed = data.filter((s) => {
    const matchTopic  = !filterTopic || s.topicId === filterTopic;
    const matchActive = filterActive === "" || String(s.isActive) === filterActive;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
    return matchTopic && matchActive && matchSearch;
  });

  async function toggleActive(skill: AdminSkillRow) {
    const newVal = !skill.isActive;
    setData((d) => d.map((s) => s.id === skill.id ? { ...s, isActive: newVal } : s));
    try {
      const res = await fetch(`/api/admin/skills/${skill.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newVal }),
      });
      if (res.ok) {
        const updated: AdminSkillRow = await res.json();
        setData((d) => d.map((s) => s.id === skill.id ? updated : s));
      } else {
        setData((d) => d.map((s) => s.id === skill.id ? { ...s, isActive: skill.isActive } : s));
      }
    } catch {
      setData((d) => d.map((s) => s.id === skill.id ? { ...s, isActive: skill.isActive } : s));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.topicId) { setCreateErr("Ten ky nang va Chu de la bat buoc."); return; }
    setCreating(true); setCreateErr(null);
    try {
      const res = await fetch("/api/admin/skills", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const body = await res.json();
      if (!res.ok) { setCreateErr(body.error ?? "Loi khong xac dinh."); return; }
      setData((d) => [body, ...d]);
      setCreateForm({ name: "", code: "", topicId: "", description: "" });
      setShowCreate(false);
    } catch { setCreateErr("Loi ket noi."); }
    finally { setCreating(false); }
  }

  function startEdit(s: AdminSkillRow) {
    setEditingId(s.id);
    setEditForm({ name: s.name, code: s.code, description: s.description });
    setEditErr(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.name.trim()) { setEditErr("Ten khong duoc rong."); return; }
    setEditSaving(true); setEditErr(null);
    try {
      const res = await fetch(`/api/admin/skills/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, code: editForm.code, description: editForm.description }),
      });
      const body = await res.json();
      if (!res.ok) { setEditErr(body.error ?? "Loi khong xac dinh."); return; }
      setData((d) => d.map((s) => s.id === editingId ? body : s));
      setEditingId(null);
    } catch { setEditErr("Loi ket noi."); }
    finally { setEditSaving(false); }
  }

  async function handleDelete(id: string) {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) { alert(body.error ?? "Loi xoa ky nang."); return; }
      if (body.deleted) {
        setData((d) => d.filter((s) => s.id !== id));
      } else {
        setData((d) => d.map((s) => s.id === id ? { ...s, isActive: false } : s));
        alert(body.reason ?? "Da vo hieu hoa ky nang.");
      }
      setDeletingId(null);
    } catch { alert("Loi ket noi."); }
    finally { setDeleteLoading(false); }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Tim theo ten / code..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-44" />
          <select value={filterTopic} onChange={(e) => setFilterTopic(e.target.value)}
            className="border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm bg-white">
            <option value="">Tat ca chu de</option>
            {topics.map((t) => <option key={t.id} value={t.id}>Lop {t.gradeLevel} - {t.name}</option>)}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as "" | "true" | "false")}
            className="border border-neutral-200 rounded-[7px] px-3 py-1.5 text-sm bg-white">
            <option value="">Tat ca trang thai</option>
            <option value="true">Hoat dong</option>
            <option value="false">An</option>
          </select>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-neutral-400">{displayed.length} ky nang</span>
          <button onClick={() => { setShowCreate((v) => !v); setCreateErr(null); }} className={BTN_PRIMARY} style={GRAD}>
            {showCreate ? "x Dong" : "+ Tao moi"}
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-blue-50 border border-primary/20 rounded-[10px] p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-neutral-700">Tao ky nang moi</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Ten ky nang *</label>
              <input type="text" placeholder="Cong hai so co nho" value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Chu de *</label>
              <select value={createForm.topicId} onChange={(e) => setCreateForm((f) => ({ ...f, topicId: e.target.value }))} className={INPUT_CLS}>
                <option value="">-- Chon chu de --</option>
                {topics.map((t) => <option key={t.id} value={t.id}>Lop {t.gradeLevel} - {t.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Code (tu tao neu bo trong)</label>
              <input type="text" placeholder="add_carry" value={createForm.code}
                onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value }))} className={INPUT_CLS} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-500">Mo ta</label>
              <input type="text" placeholder="Mo ta ngan..." value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} className={INPUT_CLS} />
            </div>
          </div>
          {createErr && <p className="text-xs text-red-500">{createErr}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={creating} className={BTN_PRIMARY} style={GRAD}>
              {creating ? "Dang luu..." : "Luu ky nang"}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className={BTN_GHOST}>Huy</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-[10px]">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="border-b border-neutral-200">
                {["Chu de", "Ten / Code", "TT", "Kich hoat", ""].map((h) => (
                  <th key={h} className="text-left text-[11px] font-semibold text-neutral-400 uppercase tracking-wide py-2.5 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.flatMap((s) => {
                const rows = [
                  <tr key={s.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
                    <td className="py-2.5 pr-4 text-xs text-neutral-500 whitespace-nowrap truncate max-w-[150px]">{s.topicName}</td>
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-neutral-800 truncate max-w-[180px]">{s.name}</p>
                      <p className="text-[11px] text-neutral-400 font-mono">{s.code}</p>
                    </td>
                    <td className="py-2.5 pr-4 text-neutral-500 font-mono text-xs">{s.displayOrder}</td>
                    <td className="py-2.5 pr-4">
                      <ToggleSwitch checked={s.isActive} onChange={() => toggleActive(s)} />
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      <div className="flex gap-1.5 items-center">
                        {editingId !== s.id && (
                          <>
                            <button onClick={() => startEdit(s)} className="text-[11px] px-2 py-0.5 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100">Sua</button>
                            <button onClick={() => setDeletingId(s.id)} className="text-[11px] px-2 py-0.5 rounded border border-red-200 text-red-500 hover:bg-red-50">Xoa</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>,
                ];
                if (editingId === s.id) {
                  rows.push(
                    <tr key={`edit-${s.id}`} className="bg-blue-50">
                      <td colSpan={5} className="px-4 py-3">
                        <form onSubmit={handleEdit} className="flex flex-wrap gap-2 items-end">
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-neutral-500">Ten *</label>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              className="border rounded-[6px] px-2 py-1 text-sm w-44" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-neutral-500">Code</label>
                            <input type="text" value={editForm.code} onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
                              className="border rounded-[6px] px-2 py-1 text-sm w-32 font-mono" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[11px] text-neutral-500">Mo ta</label>
                            <input type="text" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                              className="border rounded-[6px] px-2 py-1 text-sm w-44" />
                          </div>
                          {editErr && <p className="text-xs text-red-500 w-full">{editErr}</p>}
                          <button type="submit" disabled={editSaving} className={BTN_PRIMARY} style={GRAD}>{editSaving ? "Luu..." : "Luu"}</button>
                          <button type="button" onClick={() => setEditingId(null)} className={BTN_GHOST}>Huy</button>
                        </form>
                      </td>
                    </tr>
                  );
                }
                if (deletingId === s.id) {
                  rows.push(
                    <tr key={`del-${s.id}`} className="bg-red-50">
                      <td colSpan={5} className="px-4 py-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm text-red-700">Xoa ky nang <strong>{s.name}</strong>? Neu co du lieu lien quan se vo hieu hoa.</span>
                          <button onClick={() => handleDelete(s.id)} disabled={deleteLoading}
                            className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                            {deleteLoading ? "Dang xoa..." : "Xac nhan"}
                          </button>
                          <button onClick={() => setDeletingId(null)} className={BTN_GHOST}>Huy</button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
              {displayed.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-neutral-400">Khong tim thay ky nang nao.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
