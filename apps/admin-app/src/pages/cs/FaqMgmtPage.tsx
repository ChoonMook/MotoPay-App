// FAQ 관리(AD-CS-03) — 등록·수정·삭제, 순서 변경, 카테고리별 분류.
// [인터랙션 참고] 원 기획서는 "드래그로 정렬순서 변경"이지만 CstItemMgmtPage.tsx(AD-CTLG-03)와 동일하게
// 이 화면 규모(항목 10~20개 내외)에 별도 DnD 라이브러리를 도입하는 대신 위/아래 버튼으로 대체했다.
import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import {
  listAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  reorderFaqs,
  type AdminFaqItem,
} from "../../api/faqs";
import { getGroup, type CommonCodeDetailApi } from "../../api/commonCodes";
import ConfirmModal from "../../components/ConfirmModal";
import PageBreadcrumb from "../../components/PageBreadcrumb";

const inputClass =
  "w-full rounded-lg border border-[#ced4da] bg-white px-3 py-2 text-xs font-normal outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/5";
const labelClass = "ml-0.5 text-[11px] font-bold tracking-widest text-secondary uppercase";

function buildLabelMap(details: CommonCodeDetailApi[]): (code: string) => string {
  const map = new Map(details.map((d) => [d.detailCode, d.detailName]));
  return (code: string) => map.get(code) ?? code;
}

interface EditDraft {
  id: number | null; // null이면 신규 등록
  category: string;
  question: string;
  answer: string;
}

function EditModal({
  draft,
  categories,
  onClose,
  onSaved,
  onError,
}: {
  draft: EditDraft;
  categories: CommonCodeDetailApi[];
  onClose: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [category, setCategory] = useState(draft.category || categories[0]?.detailCode || "");
  const [question, setQuestion] = useState(draft.question);
  const [answer, setAnswer] = useState(draft.answer);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!category && question.trim().length > 0 && answer.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      if (draft.id === null) {
        await createFaq({ category, question: question.trim(), answer: answer.trim() });
      } else {
        await updateFaq(draft.id, { category, question: question.trim(), answer: answer.trim() });
      }
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-secondary/40 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-[520px] flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant/60 px-6 py-4">
          <h3 className="text-base font-bold text-secondary">{draft.id === null ? "FAQ 추가" : "FAQ 수정"}</h3>
          <button type="button" onClick={onClose} className="text-outline hover:text-on-surface">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-6">
          <div className="space-y-1.5">
            <label className={labelClass}>카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((c) => (
                <option key={c.detailCode} value={c.detailCode}>
                  {c.detailName}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>질문</label>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="질문을 입력해 주세요" className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>답변</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="답변을 입력해 주세요"
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FaqMgmtPage() {
  const [items, setItems] = useState<AdminFaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CommonCodeDetailApi[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminFaqItem | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [reordering, setReordering] = useState(false);

  const load = () => {
    setLoading(true);
    listAdminFaqs(categoryFilter === "all" ? undefined : categoryFilter)
      .then(setItems)
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "FAQ 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(load, [categoryFilter]);

  useEffect(() => {
    getGroup("FAQ_CATEGORY")
      .then((g) => setCategories(g.details.filter((d) => d.useYn)))
      .catch((err) => setGlobalError(err instanceof Error ? err.message : "코드 목록을 불러오지 못했습니다."));
  }, []);

  useEffect(() => {
    if (!globalError) return;
    const t = setTimeout(() => setGlobalError(""), 3200);
    return () => clearTimeout(t);
  }, [globalError]);

  const categoryLabel = useMemo(() => buildLabelMap(categories), [categories]);

  const toggleUseYn = async (item: AdminFaqItem) => {
    try {
      const updated = await updateFaq(item.id, { useYn: !item.useYn });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "노출여부 변경에 실패했습니다.");
    }
  };

  const swapOrder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length || reordering) return;
    const current = items[index];
    const target = items[targetIndex];

    const reordered = [...items];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setItems(reordered);

    setReordering(true);
    try {
      await reorderFaqs([
        { id: current.id, sortOrder: target.sortOrder },
        { id: target.id, sortOrder: current.sortOrder },
      ]);
      setItems((prev) =>
        prev.map((i) => {
          if (i.id === current.id) return { ...i, sortOrder: target.sortOrder };
          if (i.id === target.id) return { ...i, sortOrder: current.sortOrder };
          return i;
        }),
      );
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "순서 변경에 실패했습니다.");
      load();
    } finally {
      setReordering(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFaq(pendingDelete.id);
      setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-8 py-6">
      <PageBreadcrumb path="/cs/faq-mgmt" />

      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-outline-variant/30 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <label className={labelClass}>카테고리</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={`${inputClass} w-36`}>
            <option value="all">전체</option>
            {categories.map((c) => (
              <option key={c.detailCode} value={c.detailCode}>
                {c.detailName}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => setEditDraft({ id: null, category: categoryFilter === "all" ? "" : categoryFilter, question: "", answer: "" })}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" />
          FAQ 추가
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-on-surface-variant">불러오는 중...</div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-outline-variant/30 bg-white py-16 text-center text-xs text-on-surface-variant">
          등록된 FAQ가 없습니다.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 shadow-sm transition-opacity ${
                item.useYn ? "border-outline-variant/30 bg-white" : "border-outline-variant/30 bg-white opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => swapOrder(index, -1)}
                    disabled={index === 0 || reordering}
                    className="text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => swapOrder(index, 1)}
                    disabled={index === items.length - 1 || reordering}
                    className="text-outline transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditDraft({ id: item.id, category: item.category, question: item.question, answer: item.answer })}>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-primary">{categoryLabel(item.category)}</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-secondary">{item.question}</div>
                  <div className="mt-1 text-xs text-on-surface-variant">{item.answer}</div>
                </div>

                <div className="flex flex-none items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleUseYn(item)}
                    aria-label="노출여부"
                    aria-pressed={item.useYn}
                    className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
                      item.useYn ? "bg-primary" : "bg-outline-variant"
                    }`}
                  >
                    <span
                      className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        item.useYn ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <button type="button" onClick={() => setPendingDelete(item)} className="text-outline hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editDraft && (
        <EditModal
          draft={editDraft}
          categories={categories}
          onClose={() => setEditDraft(null)}
          onSaved={() => {
            setEditDraft(null);
            load();
          }}
          onError={setGlobalError}
        />
      )}

      {pendingDelete && (
        <ConfirmModal
          title="FAQ 삭제"
          message={`"${pendingDelete.question}" 항목을 삭제하시겠습니까?`}
          confirmLabel="삭제"
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}

      {globalError && (
        <div className="fixed right-6 bottom-6 z-[999] rounded-lg bg-red-600 px-4 py-3 text-xs font-bold text-white shadow-xl">
          {globalError}
        </div>
      )}
    </div>
  );
}
