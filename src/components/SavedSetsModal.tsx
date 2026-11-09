import React, { useState } from "react";
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";
import { FlashcardSet } from "../types";

interface SavedSetsModalProps {
  currentSetId: string;
  savedSets: FlashcardSet[];
  onSelectSet: (set: FlashcardSet) => void;
  onNewSet: () => void;
  onDeleteSet: (id: string) => void;
  onDuplicateSet: (set: FlashcardSet) => void;
  onRenameSet: (id: string, newTitle: string) => void;
  onClose: () => void;
}

export const SavedSetsModal: React.FC<SavedSetsModalProps> = ({
  currentSetId,
  savedSets,
  onSelectSet,
  onNewSet,
  onDeleteSet,
  onDuplicateSet,
  onRenameSet,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleDraft, setEditTitleDraft] = useState("");

  const handleStartRename = (set: FlashcardSet) => {
    setEditingId(set.id);
    setEditTitleDraft(set.title);
  };

  const handleConfirmRename = (id: string) => {
    if (editTitleDraft.trim()) {
      onRenameSet(id, editTitleDraft.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                플래시카드 세트 보관함
              </h2>
              <p className="text-xs text-slate-500">
                저장된 세트를 전환하거나 복제 및 관리할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onNewSet();
                onClose();
              }}
              className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />새 세트 만들기
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sets List */}
        <div className="p-6 overflow-y-auto divide-y divide-slate-100 space-y-2">
          {savedSets.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              보관함에 저장된 카드 세트가 없습니다.
            </div>
          ) : (
            savedSets.map((set) => {
              const isCurrent = set.id === currentSetId;
              const isEditing = editingId === set.id;
              const dateStr = new Date(set.updatedAt || set.createdAt).toLocaleDateString(
                "ko-KR"
              );

              return (
                <div
                  key={set.id}
                  className={`p-4 rounded-xl transition-all flex items-center justify-between gap-4 ${
                    isCurrent
                      ? "bg-blue-50/60 border border-blue-200"
                      : "hover:bg-slate-50 border border-transparent"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editTitleDraft}
                          onChange={(e) => setEditTitleDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleConfirmRename(set.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="px-2 py-1 text-sm font-semibold border border-blue-500 rounded-md outline-hidden flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleConfirmRename(set.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3
                            onClick={() => {
                              onSelectSet(set);
                              onClose();
                            }}
                            className="font-bold text-sm text-slate-900 truncate hover:text-blue-600 cursor-pointer"
                          >
                            {set.title}
                          </h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-md shrink-0">
                              현재 작업 중
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center">
                            <Layers className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            {set.cards.length}장의 카드
                          </span>
                          <span>•</span>
                          <span>
                            {set.grade} {set.subject}
                          </span>
                          <span>•</span>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                            {dateStr}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 shrink-0">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSet(set);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                      >
                        열기
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartRename(set)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                      title="이름 변경"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDuplicateSet(set)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                      title="세트 복제"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {savedSets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteSet(set.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="세트 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
