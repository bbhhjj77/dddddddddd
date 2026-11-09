import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Search,
  AlertCircle,
  Eye,
  List,
  Sparkles,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCw,
  Tag,
  BookOpen,
  Palette,
  Check,
  HelpCircle,
  Quote,
} from "lucide-react";
import {
  CardBgColor,
  CardBorderStyle,
  CardFormat,
  DifficultyLevel,
  Flashcard,
  FlashcardSet,
  QuestionType,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  CARD_FORMAT_LABELS,
  BG_COLOR_OPTIONS,
  BORDER_STYLE_OPTIONS,
} from "../types";

interface CardEditorTabProps {
  currentSet: FlashcardSet;
  onUpdateCards: (cards: Flashcard[]) => void;
  onAddMoreWithAi: () => void;
  onGoToPresentation: () => void;
}

export const CardEditorTab: React.FC<CardEditorTabProps> = ({
  currentSet,
  onUpdateCards,
  onAddMoreWithAi,
  onGoToPresentation,
}) => {
  const cards = currentSet.cards;

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterFormat, setFilterFormat] = useState<string>("all");
  const [filterReviewOnly, setFilterReviewOnly] = useState<boolean>(false);

  // View Mode: 'list' (full editing list) or 'preview' (interactive flip card preview)
  const [viewMode, setViewMode] = useState<"list" | "preview">("list");
  const [previewIndex, setPreviewIndex] = useState(0);
  const [previewFlipped, setPreviewFlipped] = useState(false);

  // Selection for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirm delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{
    id?: string;
    isBatch?: boolean;
  } | null>(null);

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQ = (card.question || "").toLowerCase().includes(q);
        const matchesA = (card.answer || "").toLowerCase().includes(q);
        const matchesTopic = (card.topic || "").toLowerCase().includes(q);
        const matchesOpts = (card.options || []).some((o) =>
          o.toLowerCase().includes(q)
        );
        if (!matchesQ && !matchesA && !matchesTopic && !matchesOpts) return false;
      }
      // Difficulty
      if (filterDifficulty !== "all" && card.difficulty !== filterDifficulty) {
        return false;
      }
      // Type
      if (filterType !== "all" && card.type !== filterType) {
        return false;
      }
      // Format
      if (filterFormat !== "all" && (card.cardFormat || "short") !== filterFormat) {
        return false;
      }
      // Needs review
      if (filterReviewOnly && !card.needsReview) {
        return false;
      }
      return true;
    });
  }, [cards, searchQuery, filterDifficulty, filterType, filterFormat, filterReviewOnly]);

  // Statistics
  const stats = useMemo(() => {
    const total = cards.length;
    const shortCount = cards.filter((c) => (c.cardFormat || "short") === "short").length;
    const mcCount = cards.filter((c) => c.cardFormat === "multiple_choice").length;
    const vocabCount = cards.filter((c) => c.cardFormat === "vocab").length;
    const emptyCount = cards.filter(
      (c) => !c.question.trim() || !c.answer.trim()
    ).length;
    const reviewCount = cards.filter((c) => c.needsReview).length;
    return { total, shortCount, mcCount, vocabCount, emptyCount, reviewCount };
  }, [cards]);

  // Card Modifications
  const handleUpdateCardField = (
    id: string,
    field: keyof Flashcard,
    value: any
  ) => {
    const next = cards.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    onUpdateCards(next);
  };

  const handleAddBlankCard = (format: CardFormat = "short") => {
    const newCard: Flashcard = {
      id: `card-user-${Date.now()}`,
      question: "",
      answer: "",
      topic: currentSet.subject || "새 개념",
      difficulty: "medium",
      type: "concept",
      cardFormat: format,
      options: format === "multiple_choice" ? ["", "", "", ""] : undefined,
      correctOptionIndex: format === "multiple_choice" ? 0 : undefined,
      customBg: "default",
      customBorder: "default",
      sourcePage: null,
      needsReview: false,
      isAiGenerated: false,
      createdAt: Date.now(),
    };
    onUpdateCards([newCard, ...cards]);
  };

  const handleDuplicateCard = (id: string) => {
    const targetIdx = cards.findIndex((c) => c.id === id);
    if (targetIdx < 0) return;
    const original = cards[targetIdx];
    const duplicated: Flashcard = {
      ...original,
      id: `card-dup-${Date.now()}`,
      question: `${original.question} (복사본)`,
      createdAt: Date.now(),
    };
    const next = [...cards];
    next.splice(targetIdx + 1, 0, duplicated);
    onUpdateCards(next);
  };

  const handleMoveCard = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === cards.length - 1)
    ) {
      return;
    }
    const next = [...cards];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onUpdateCards(next);
  };

  const executeDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.isBatch) {
      const next = cards.filter((c) => !selectedIds.has(c.id));
      onUpdateCards(next);
      setSelectedIds(new Set());
    } else if (deleteTarget.id) {
      const next = cards.filter((c) => c.id !== deleteTarget.id);
      onUpdateCards(next);
      selectedIds.delete(deleteTarget.id);
      setSelectedIds(new Set(selectedIds));
    }
    setDeleteTarget(null);
  };

  // Batch Selection
  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredCards.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCards.map((c) => c.id)));
    }
  };

  const handleBatchUpdateField = (field: keyof Flashcard, value: any) => {
    const next = cards.map((c) =>
      selectedIds.has(c.id) ? { ...c, [field]: value } : c
    );
    onUpdateCards(next);
  };

  // Preview card helpers
  const previewCard: Flashcard | undefined = cards[previewIndex];

  // Helper function to resolve background classes
  const getCustomBgClass = (bg?: CardBgColor) => {
    const found = BG_COLOR_OPTIONS.find((b) => b.id === bg);
    return found?.class || "bg-white";
  };

  // Helper function to resolve border classes
  const getCustomBorderClass = (border?: CardBorderStyle) => {
    const found = BORDER_STYLE_OPTIONS.find((b) => b.id === border);
    return found?.class || "border border-slate-200";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center">
            플래시카드 편집실
            <span className="ml-2.5 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              총 {stats.total}장
            </span>
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => handleAddBlankCard("short")}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            카드 추가
          </button>

          <button
            type="button"
            onClick={onAddMoreWithAi}
            className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            AI 추가
          </button>

          {cards.length > 0 && (
            <button
              type="button"
              onClick={onGoToPresentation}
              className="inline-flex items-center px-4 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              수업 시작
            </button>
          )}
        </div>
      </div>

      {/* 3 Card Formats KPI Filter Buttons (단추형) */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <button
          type="button"
          onClick={() => setFilterFormat(filterFormat === "short" ? "all" : "short")}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
            filterFormat === "short"
              ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span className="text-xs font-bold text-blue-800">📝 단답형</span>
          <span className="ml-2 text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
            {stats.shortCount}장
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterFormat(filterFormat === "multiple_choice" ? "all" : "multiple_choice")}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
            filterFormat === "multiple_choice"
              ? "border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span className="text-xs font-bold text-emerald-800">🔢 객관식 (4개)</span>
          <span className="ml-2 text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            {stats.mcCount}장
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterFormat(filterFormat === "vocab" ? "all" : "vocab")}
          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
            filterFormat === "vocab"
              ? "border-amber-600 bg-amber-50/70 ring-2 ring-amber-500/20"
              : "bg-white border-slate-200 hover:bg-slate-50"
          }`}
        >
          <span className="text-xs font-bold text-amber-800">🌟 단어카드</span>
          <span className="ml-2 text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
            {stats.vocabCount}장
          </span>
        </button>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="질문, 답변, 보기, 개념 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-slate-50/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                지우기
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-1 border border-slate-200 p-0.5 rounded-lg bg-slate-50 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5 mr-1" />
              목록형 편집
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("preview");
                setPreviewFlipped(false);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center transition-colors cursor-pointer ${
                viewMode === "preview"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              형식별 카드 뒤집기 미리보기
            </button>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-600">필터:</span>

          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-md bg-white font-medium text-slate-700"
          >
            <option value="all">형식: 전체</option>
            <option value="short">📝 단답형</option>
            <option value="multiple_choice">🔢 객관식 (4개)</option>
            <option value="vocab">🌟 단어카드</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
          >
            <option value="all">난이도: 전체</option>
            <option value="easy">쉬움</option>
            <option value="medium">보통</option>
            <option value="hard">어려움</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="p-1.5 border border-slate-200 rounded-md bg-white text-slate-700"
          >
            <option value="all">내용 유형: 전체</option>
            <option value="definition">용어 정의</option>
            <option value="concept">핵심 개념</option>
            <option value="cause_effect">원인·결과</option>
            <option value="process">과정 설명</option>
            <option value="comparison">비교·분류</option>
            <option value="application">적용·추론</option>
          </select>

          <button
            type="button"
            onClick={() => setFilterReviewOnly(!filterReviewOnly)}
            className={`px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              filterReviewOnly
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            검토 필요 항목만 ({stats.reviewCount})
          </button>

          {(searchQuery ||
            filterFormat !== "all" ||
            filterDifficulty !== "all" ||
            filterType !== "all" ||
            filterReviewOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterFormat("all");
                setFilterDifficulty("all");
                setFilterType("all");
                setFilterReviewOnly(false);
              }}
              className="text-xs text-blue-600 hover:underline ml-auto cursor-pointer"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* Batch Operations Bar */}
      {viewMode === "list" && cards.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 mb-4 text-xs">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center font-semibold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {selectedIds.size > 0 &&
              selectedIds.size === filteredCards.length ? (
                <CheckSquare className="w-4 h-4 text-blue-600 mr-1.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-400 mr-1.5" />
              )}
              전체 선택 ({selectedIds.size} / {filteredCards.length})
            </button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">
                선택한 {selectedIds.size}장 일괄 변경:
              </span>

              {/* Batch Format */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchUpdateField("cardFormat", e.target.value as CardFormat);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="p-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-700"
              >
                <option value="" disabled>
                  형식 일괄 변경...
                </option>
                <option value="short">📝 단답형으로</option>
                <option value="descriptive">📖 서술형으로</option>
                <option value="multiple_choice">🔢 객관식으로</option>
                <option value="vocab">🌟 단어 플래시로</option>
              </select>

              {/* Batch Background Color */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchUpdateField("customBg", e.target.value as CardBgColor);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="p-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-700"
              >
                <option value="" disabled>
                  배경색 일괄 변경...
                </option>
                {BG_COLOR_OPTIONS.map((bg) => (
                  <option key={bg.id} value={bg.id}>
                    배경: {bg.label}
                  </option>
                ))}
              </select>

              {/* Batch Border Style */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBatchUpdateField("customBorder", e.target.value as CardBorderStyle);
                    e.target.value = "";
                  }
                }}
                defaultValue=""
                className="p-1 text-xs border border-slate-300 rounded-md bg-white font-medium text-slate-700"
              >
                <option value="" disabled>
                  테두리 일괄 변경...
                </option>
                {BORDER_STYLE_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    테두리: {b.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setDeleteTarget({ isBatch: true })}
                className="inline-flex items-center px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                선택 삭제
              </button>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {cards.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            등록된 플래시카드가 없습니다
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            [자료 입력] 탭에서 PDF나 텍스트를 분석하여 카드를 생성하거나, 아래 버튼으로 원하는 형식의 카드를 직접 추가해보세요.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleAddBlankCard("short")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + 단답형 카드 추가
            </button>
            <button
              type="button"
              onClick={() => handleAddBlankCard("multiple_choice")}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + 객관식(4선지) 카드 추가
            </button>
            <button
              type="button"
              onClick={() => handleAddBlankCard("vocab")}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              + 단어 플래시카드 추가
            </button>
          </div>
        </div>
      ) : viewMode === "preview" ? (
        /* INTERACTIVE FLIP CARD PREVIEW MODE (Supports all 4 formats) */
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              카드 {previewIndex + 1} / {cards.length} • 형식:{" "}
              <strong className="text-slate-800 font-bold">
                {CARD_FORMAT_LABELS[previewCard?.cardFormat || "short"]}
              </strong>
            </span>
            <span>화면을 클릭하여 질문과 정답을 뒤집어보세요</span>
          </div>

          {previewCard ? (
            <div
              onClick={() => setPreviewFlipped(!previewFlipped)}
              className="cursor-pointer group relative min-h-[340px] perspective-1000"
            >
              {/* VOCAB FLASHCARD PREVIEW: Beautiful Aesthetic Card */}
              {previewCard.cardFormat === "vocab" ? (
                <div
                  className={`w-full min-h-[340px] rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col justify-between shadow-xl ${
                    previewCard.customBg ? getCustomBgClass(previewCard.customBg) : "bg-white"
                  } ${
                    previewCard.customBorder
                      ? getCustomBorderClass(previewCard.customBorder)
                      : "border-amber-200"
                  } ${
                    previewFlipped
                      ? "ring-2 ring-amber-400/50"
                      : "hover:shadow-2xl"
                  }`}
                >
                  {/* Front: Aesthetic Word Card */}
                  {!previewFlipped ? (
                    <>
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
                          <span className="px-2.5 py-1 text-xs font-extrabold rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                            🌟 단어카드 플래시 (Word)
                          </span>
                          <span className="text-xs font-semibold text-amber-800">
                            {previewCard.partOfSpeech || previewCard.topic}
                          </span>
                        </div>

                        <div className="mt-8 text-center">
                          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            {previewCard.question}
                          </h2>
                          {previewCard.pronunciation && (
                            <p className="text-sm font-mono text-amber-800 mt-2 font-medium">
                              {previewCard.pronunciation}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 mt-6 border-t border-amber-200/50 flex items-center justify-between text-xs text-amber-900">
                        <span className="flex items-center font-medium">
                          <RotateCw className="w-3.5 h-3.5 mr-1" />
                          클릭하여 단어 뜻 및 예문 보기
                        </span>
                        <span className="font-bold">{previewCard.topic}</span>
                      </div>
                    </>
                  ) : (
                    /* Back: Meaning & Example Sentence */
                    <>
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <span className="text-xs font-bold text-slate-400">
                            단어 뜻 / 정의
                          </span>
                          <span className="font-bold text-sm text-amber-900">
                            {previewCard.question}
                          </span>
                        </div>

                        <div className="mt-4">
                          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                            {previewCard.answer}
                          </h3>

                          {previewCard.exampleSentence && (
                            <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                              <p className="text-xs italic text-slate-800 font-medium">
                                "{previewCard.exampleSentence}"
                              </p>
                              {previewCard.exampleTranslation && (
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {previewCard.exampleTranslation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center">
                          <RotateCw className="w-3.5 h-3.5 mr-1" />
                          클릭하여 단어로 돌아가기
                        </span>
                        <span>{previewCard.topic}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : previewCard.cardFormat === "multiple_choice" ? (
                /* MULTIPLE CHOICE PREVIEW */
                <div
                  className={`w-full min-h-[340px] rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col justify-between shadow-xl ${
                    previewCard.customBg ? getCustomBgClass(previewCard.customBg) : "bg-white"
                  } ${
                    previewCard.customBorder
                      ? getCustomBorderClass(previewCard.customBorder)
                      : "border-emerald-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🔢 객관식 (4선지)
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        {previewCard.topic}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-4">
                      {previewCard.question}
                    </h2>

                    {/* 4 Options preview */}
                    <div className="space-y-2">
                      {(previewCard.options || ["보기 1", "보기 2", "보기 3", "보기 4"]).map(
                        (opt, idx) => {
                          const isCorrect = (previewCard.correctOptionIndex ?? 0) === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between transition-colors ${
                                previewFlipped && isCorrect
                                  ? "bg-emerald-100 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-400/40"
                                  : previewFlipped
                                  ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                                  : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            >
                              <span>
                                {["①", "②", "③", "④"][idx]} {opt}
                              </span>
                              {previewFlipped && isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-md">
                                  ✓ 정답
                                </span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>

                    {previewFlipped && previewCard.explanation && (
                      <p className="mt-3 text-xs text-slate-500 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                        💡 {previewCard.explanation}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center">
                      <RotateCw className="w-3.5 h-3.5 mr-1" />
                      클릭하여 {previewFlipped ? "질문 보기" : "정답 확인"}
                    </span>
                    <span>{QUESTION_TYPE_LABELS[previewCard.type]}</span>
                  </div>
                </div>
              ) : (
                /* SHORT / DESCRIPTIVE PREVIEW */
                <div
                  className={`w-full min-h-[340px] rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col justify-between shadow-xl ${
                    previewCard.customBg ? getCustomBgClass(previewCard.customBg) : "bg-white"
                  } ${
                    previewCard.customBorder
                      ? getCustomBorderClass(previewCard.customBorder)
                      : "border-blue-200"
                  } ${
                    previewFlipped
                      ? "bg-slate-900 border-indigo-500 text-white"
                      : "text-slate-900"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                          previewFlipped
                            ? "bg-indigo-600 text-white"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {previewFlipped ? "단답형 정답" : "단답형 질문"}
                      </span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="font-semibold text-slate-400">
                          {previewCard.topic}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {DIFFICULTY_LABELS[previewCard.difficulty]}
                        </span>
                      </div>
                    </div>

                    <p className="text-xl sm:text-2xl font-bold leading-relaxed mt-4">
                      {previewFlipped ? previewCard.answer : previewCard.question}
                    </p>

                    {previewFlipped && previewCard.explanation && (
                      <p className="text-xs text-indigo-300 mt-4 p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800">
                        💡 {previewCard.explanation}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-6 border-t border-slate-200/40 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center">
                      <RotateCw className="w-3.5 h-3.5 mr-1" />
                      클릭하여 {previewFlipped ? "질문 보기" : "정답 확인"}
                    </span>
                    <span>{QUESTION_TYPE_LABELS[previewCard.type]}</span>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Preview Navigation */}
          <div className="flex items-center justify-center space-x-4 pt-2">
            <button
              type="button"
              disabled={previewIndex <= 0}
              onClick={() => {
                setPreviewIndex(previewIndex - 1);
                setPreviewFlipped(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
            >
              이전 카드
            </button>
            <span className="text-xs font-semibold text-slate-700">
              {previewIndex + 1} / {cards.length}
            </span>
            <button
              type="button"
              disabled={previewIndex >= cards.length - 1}
              onClick={() => {
                setPreviewIndex(previewIndex + 1);
                setPreviewFlipped(false);
              }}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-30 hover:bg-slate-50 cursor-pointer"
            >
              다음 카드
            </button>
          </div>
        </div>
      ) : (
        /* LIST EDITING MODE */
        <div className="space-y-4">
          {filteredCards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6 text-xs text-slate-500">
              조건에 맞는 카드가 없습니다. 검색어나 필터를 변경해보세요.
            </div>
          ) : (
            filteredCards.map((card, index) => {
              const originalIndex = cards.findIndex((c) => c.id === card.id);
              const isSelected = selectedIds.has(card.id);
              const isBlank = !card.question.trim() || !card.answer.trim();
              const format = card.cardFormat || "short";

              return (
                <div
                  key={card.id}
                  className={`rounded-2xl border transition-all shadow-xs ${
                    card.customBg ? getCustomBgClass(card.customBg) : "bg-white"
                  } ${
                    card.customBorder ? getCustomBorderClass(card.customBorder) : "border-slate-200"
                  } ${
                    isBlank
                      ? "ring-2 ring-rose-300"
                      : isSelected
                      ? "ring-2 ring-blue-500"
                      : "hover:border-slate-300"
                  }`}
                >
                  {/* Card Header Toolbar */}
                  <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 rounded-t-2xl flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(card.id)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <span className="font-bold text-xs text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        #{originalIndex + 1}
                      </span>

                      {/* Format Selector */}
                      <select
                        value={format}
                        onChange={(e) =>
                          handleUpdateCardField(
                            card.id,
                            "cardFormat",
                            e.target.value as CardFormat
                          )
                        }
                        className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                          format === "short"
                            ? "bg-blue-50 text-blue-800 border-blue-200"
                            : format === "multiple_choice"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        <option value="short">📝 단답형</option>
                        <option value="multiple_choice">🔢 객관식 (4개)</option>
                        <option value="vocab">🌟 단어카드</option>
                      </select>

                      {/* AI vs User Badge */}
                      {card.isAiGenerated && (
                        <span className="inline-flex items-center text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-sm">
                          AI 생성
                        </span>
                      )}

                      {/* Blank Warning */}
                      {isBlank && (
                        <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-sm">
                          <AlertCircle className="w-3 h-3 mr-0.5 text-rose-600" />
                          내용 미완성
                        </span>
                      )}

                      {card.needsReview && (
                        <span className="inline-flex items-center text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm">
                          <AlertTriangle className="w-3 h-3 mr-0.5 text-amber-600" />
                          검토 필요
                        </span>
                      )}
                    </div>

                    {/* Quick Card Controls */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleMoveCard(originalIndex, "up")}
                        disabled={originalIndex === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded-sm cursor-pointer"
                        title="위로 이동"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveCard(originalIndex, "down")}
                        disabled={originalIndex === cards.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-100 rounded-sm cursor-pointer"
                        title="아래로 이동"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateCard(card.id)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-sm cursor-pointer"
                        title="카드 복제"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ id: card.id })}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-sm cursor-pointer"
                        title="카드 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* FORMAT SPECIFIC EDITING FIELDS */}
                  <div className="p-4 space-y-3">
                    {/* FORMAT 1: SHORT ANSWER */}
                    {format === "short" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1 block">
                            질문 (Front) *
                          </label>
                          <textarea
                            rows={3}
                            value={card.question}
                            placeholder="질문을 입력하세요..."
                            onChange={(e) =>
                              handleUpdateCardField(card.id, "question", e.target.value)
                            }
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-white"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1 block">
                            단답형 정답 (단어 형태) *
                          </label>
                          <textarea
                            rows={3}
                            value={card.answer}
                            placeholder="정답(단어)을 입력하세요..."
                            onChange={(e) =>
                              handleUpdateCardField(card.id, "answer", e.target.value)
                            }
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-white font-bold"
                          />
                        </div>
                      </div>
                    )}

                    {/* FORMAT 3: MULTIPLE CHOICE (4 OPTIONS) */}
                    {format === "multiple_choice" && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-800 mb-1 block">
                            객관식 문제 질문 *
                          </label>
                          <textarea
                            rows={2}
                            value={card.question}
                            placeholder="객관식 문제를 입력하세요..."
                            onChange={(e) =>
                              handleUpdateCardField(card.id, "question", e.target.value)
                            }
                            className="w-full p-2 text-sm border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-white"
                          />
                        </div>

                        {/* 4 Options Grid */}
                        <div>
                          <span className="text-xs font-bold text-slate-700 block mb-1.5">
                            보기 4개 선지 (라디오 버튼으로 정답 선택)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[0, 1, 2, 3].map((optIdx) => {
                              const opts = card.options || ["", "", "", ""];
                              const isCorrect = (card.correctOptionIndex ?? 0) === optIdx;
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center space-x-2 p-2 rounded-lg border ${
                                    isCorrect
                                      ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300"
                                      : "bg-white border-slate-200"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`mc_${card.id}`}
                                    id={`mc_${card.id}_${optIdx}`}
                                    checked={isCorrect}
                                    onChange={() => {
                                      handleUpdateCardField(
                                        card.id,
                                        "correctOptionIndex",
                                        optIdx
                                      );
                                      handleUpdateCardField(
                                        card.id,
                                        "answer",
                                        opts[optIdx] || ""
                                      );
                                    }}
                                    className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                  />
                                  <label
                                    htmlFor={`mc_${card.id}_${optIdx}`}
                                    className="text-xs font-bold text-slate-700 w-6 text-center shrink-0 cursor-pointer"
                                  >
                                    {["①", "②", "③", "④"][optIdx]}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={`보기 ${optIdx + 1}`}
                                    value={opts[optIdx] || ""}
                                    onChange={(e) => {
                                      const nextOpts = [...opts];
                                      nextOpts[optIdx] = e.target.value;
                                      handleUpdateCardField(card.id, "options", nextOpts);
                                      if (isCorrect) {
                                        handleUpdateCardField(
                                          card.id,
                                          "answer",
                                          e.target.value
                                        );
                                      }
                                    }}
                                    className="flex-1 p-1 text-xs border border-slate-200 rounded-md bg-white outline-hidden focus:border-blue-500"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="정답 해설 (선택사항)..."
                            value={card.explanation || ""}
                            onChange={(e) =>
                              handleUpdateCardField(card.id, "explanation", e.target.value)
                            }
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* FORMAT 4: VOCAB FLASHCARD (BEAUTIFUL AESTHETIC CARD) */}
                    {format === "vocab" && (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-amber-900 mb-1 block">
                              단어 / 용어 표제어 (Front) *
                            </label>
                            <input
                              type="text"
                              value={card.question}
                              placeholder="예: Chloroplast 또는 엽록체"
                              onChange={(e) =>
                                handleUpdateCardField(card.id, "question", e.target.value)
                              }
                              className="w-full p-2 text-sm font-bold border border-amber-300 rounded-lg bg-white outline-hidden focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">
                              발음 기호 / 한자음 / 읽기
                            </label>
                            <input
                              type="text"
                              value={card.pronunciation || ""}
                              placeholder="예: [ˈklɔːr.ə.plæst] / 葉綠體"
                              onChange={(e) =>
                                handleUpdateCardField(card.id, "pronunciation", e.target.value)
                              }
                              className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-amber-900 mb-1 block">
                              단어 뜻풀이 / 정의 (Back) *
                            </label>
                            <textarea
                              rows={2}
                              value={card.answer}
                              placeholder="단어의 핵심 정의..."
                              onChange={(e) =>
                                handleUpdateCardField(card.id, "answer", e.target.value)
                              }
                              className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-slate-700 mb-1 block">
                              품사 / 과목 분류
                            </label>
                            <input
                              type="text"
                              value={card.partOfSpeech || ""}
                              placeholder="예: 생명과학 핵심용어, 명사"
                              onChange={(e) =>
                                handleUpdateCardField(card.id, "partOfSpeech", e.target.value)
                              }
                              className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <input
                              type="text"
                              placeholder="교과서 예문 (선택)..."
                              value={card.exampleSentence || ""}
                              onChange={(e) =>
                                handleUpdateCardField(card.id, "exampleSentence", e.target.value)
                              }
                              className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="예문 해석 (선택)..."
                              value={card.exampleTranslation || ""}
                              onChange={(e) =>
                                handleUpdateCardField(card.id, "exampleTranslation", e.target.value)
                              }
                              className="w-full p-1.5 text-xs border border-slate-200 rounded-md bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD DESIGN CONTROLS: Background color & border styling */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Color & Border quick picker */}
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center space-x-1.5">
                          <Palette className="w-3.5 h-3.5 text-slate-500" />
                          <span className="text-slate-600 font-medium">배경색:</span>
                          <select
                            value={card.customBg || "default"}
                            onChange={(e) =>
                              handleUpdateCardField(
                                card.id,
                                "customBg",
                                e.target.value as CardBgColor
                              )
                            }
                            className="p-1 text-xs border border-slate-200 rounded-md bg-white"
                          >
                            {BG_COLOR_OPTIONS.map((bg) => (
                              <option key={bg.id} value={bg.id}>
                                {bg.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-600 font-medium">테두리:</span>
                          <select
                            value={card.customBorder || "default"}
                            onChange={(e) =>
                              handleUpdateCardField(
                                card.id,
                                "customBorder",
                                e.target.value as CardBorderStyle
                              )
                            }
                            className="p-1 text-xs border border-slate-200 rounded-md bg-white"
                          >
                            {BORDER_STYLE_OPTIONS.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Topic, Difficulty, Needs review */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="소단원"
                          value={card.topic || ""}
                          onChange={(e) =>
                            handleUpdateCardField(card.id, "topic", e.target.value)
                          }
                          className="px-2 py-1 text-xs border border-slate-200 rounded-md w-24"
                        />

                        <select
                          value={card.difficulty}
                          onChange={(e) =>
                            handleUpdateCardField(
                              card.id,
                              "difficulty",
                              e.target.value as DifficultyLevel
                            )
                          }
                          className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-700"
                        >
                          <option value="easy">쉬움</option>
                          <option value="medium">보통</option>
                          <option value="hard">어려움</option>
                        </select>

                        <label className="flex items-center space-x-1 cursor-pointer text-slate-600">
                          <input
                            type="checkbox"
                            checked={Boolean(card.needsReview)}
                            onChange={(e) =>
                              handleUpdateCardField(
                                card.id,
                                "needsReview",
                                e.target.checked
                              )
                            }
                            className="rounded-sm border-slate-300 text-amber-600"
                          />
                          <span className="text-[11px]">검토</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Confirmation Modal for Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {deleteTarget.isBatch
                ? `선택한 ${selectedIds.size}장의 카드를 삭제하시겠습니까?`
                : "이 플래시카드를 삭제하시겠습니까?"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              삭제된 카드는 즉시 목록에서 제거됩니다. 실수로 지우지 않도록 확인해주세요.
            </p>
            <div className="mt-5 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
