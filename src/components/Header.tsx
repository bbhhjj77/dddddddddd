import React, { useState } from "react";
import {
  Sparkles,
  Play,
  FileText,
  Edit3,
  FolderOpen,
  Plus,
  Download,
  Upload,
  Printer,
  CheckCircle2,
  Clock,
  ChevronDown,
  Layers,
} from "lucide-react";
import { FlashcardSet } from "../types";
import { exportSetToCsv, exportSetToJson } from "../utils/storage";

interface HeaderProps {
  currentSet: FlashcardSet;
  activeTab: "input" | "editor" | "presentation";
  setActiveTab: (tab: "input" | "editor" | "presentation") => void;
  isSaving: boolean;
  onUpdateTitle: (newTitle: string) => void;
  onNewSet: () => void;
  onOpenSavedSets: () => void;
  onOpenPrintModal: () => void;
  onImportClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSet,
  activeTab,
  setActiveTab,
  isSaving,
  onUpdateTitle,
  onNewSet,
  onOpenSavedSets,
  onOpenPrintModal,
  onImportClick,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(currentSet.title);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleSaveTitle = () => {
    if (titleDraft.trim()) {
      onUpdateTitle(titleDraft.trim());
    } else {
      setTitleDraft(currentSet.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setTitleDraft(currentSet.title);
      setIsEditingTitle(false);
    }
  };

  const hasCards = currentSet.cards.length > 0;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Branding */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  ClassFlip
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  중학 수업용
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                교사용 AI 플래시카드 제작 & 교실 발표
              </p>
            </div>
          </div>

          {/* Current Set Title & Save Indicator */}
          <div className="flex-1 max-w-md mx-4 hidden md:flex items-center space-x-2">
            <div className="relative flex-1 group">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="w-full px-2.5 py-1 text-sm font-medium border border-blue-500 rounded-md shadow-xs outline-hidden ring-2 ring-blue-500/20 bg-white"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTitleDraft(currentSet.title);
                    setIsEditingTitle(true);
                  }}
                  className="w-full text-left px-2.5 py-1 rounded-md text-sm font-semibold text-slate-800 hover:bg-slate-100 flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                  title="클릭하여 세트 제목 수정"
                >
                  <span className="truncate">{currentSet.title}</span>
                  <Edit3 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 ml-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            {/* Auto Save Status */}
            <div className="shrink-0 flex items-center space-x-1 text-xs text-slate-500">
              {isSaving ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                  <span className="text-amber-600 font-medium">저장 중...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-400">자동 저장됨</span>
                </>
              )}
            </div>
          </div>

          {/* Header Action Menu: New, Saved Sets, Import/Export */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onNewSet}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="새 플래시카드 세트 만들기"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span className="hidden sm:inline">새 세트</span>
            </button>

            <button
              type="button"
              onClick={onOpenSavedSets}
              className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="저장된 세트 보관함 열기"
            >
              <FolderOpen className="w-3.5 h-3.5 mr-1 text-slate-500" />
              <span className="hidden sm:inline">보관함</span>
            </button>

            {/* Export / Import Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                <span className="hidden sm:inline">내보내기</span>
                <ChevronDown className="w-3 h-3 ml-1 text-slate-400" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        exportSetToJson(currentSet);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-2 text-blue-600" />
                      JSON 파일로 저장
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        exportSetToCsv(currentSet);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-2 text-emerald-600" />
                      엑셀(CSV)로 내보내기
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPrintModal();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <Printer className="w-3.5 h-3.5 mr-2 text-slate-600" />
                      인쇄용 카드 목록 출력
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        onImportClick();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center"
                    >
                      <Upload className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                      JSON 파일 불러오기
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Direct Classroom Presentation CTA */}
            <button
              type="button"
              onClick={() => setActiveTab("presentation")}
              disabled={!hasCards}
              className={`inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${
                hasCards
                  ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
              title={hasCards ? "대형 화면 수업 발표 모드 시작" : "카드를 먼저 등록해주세요"}
            >
              <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
              수업 시작
            </button>
          </div>
        </div>

        {/* 3 Main Workflow Tabs */}
        <div className="flex border-t border-slate-100">
          <nav className="flex space-x-6 py-2" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab("input")}
              className={`flex items-center py-2 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "input"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              1. 자료 입력 &amp; AI 생성
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("editor")}
              className={`flex items-center py-2 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                activeTab === "editor"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Layers className="w-4 h-4 mr-2" />
              2. 카드 편집실
              <span
                className={`ml-2 px-2 py-0.5 text-xs rounded-full font-bold ${
                  hasCards
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {currentSet.cards.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("presentation")}
              disabled={!hasCards}
              className={`flex items-center py-2 px-1 text-sm font-semibold border-b-2 transition-colors ${
                !hasCards
                  ? "border-transparent text-slate-300 cursor-not-allowed"
                  : activeTab === "presentation"
                  ? "border-indigo-600 text-indigo-600 cursor-pointer"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 cursor-pointer"
              }`}
            >
              <Play className="w-4 h-4 mr-2 fill-current" />
              3. 수업 시작 (발표)
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
