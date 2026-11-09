import React, { useState, useRef } from "react";
import {
  FileText,
  Upload,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ListPlus,
  Table,
  PlusCircle,
  FileCheck,
  X,
  RefreshCw,
  Sliders,
  Check,
  Palette,
  Quote,
  RotateCw,
  Eye,
} from "lucide-react";
import {
  AIGenerationOptions,
  CardBgColor,
  CardBorderStyle,
  CardFormat,
  Flashcard,
  FlashcardSet,
  BG_COLOR_OPTIONS,
  BORDER_STYLE_OPTIONS,
  CARD_FORMAT_LABELS,
  GRADE_OPTIONS,
  SUBJECT_OPTIONS,
} from "../types";
import { SAMPLE_PRESETS } from "../utils/presets";

interface MaterialInputTabProps {
  currentSet: FlashcardSet;
  onAddCards: (cards: Flashcard[], append?: boolean, newTitle?: string) => void;
  onGoToEditor: () => void;
}

export const MaterialInputTab: React.FC<MaterialInputTabProps> = ({
  currentSet,
  onAddCards,
  onGoToEditor,
}) => {
  // Main mode: "ai" (PDF / Text upload) or "manual" (Direct input)
  const [inputMode, setInputMode] = useState<"ai" | "manual">("ai");

  // Direct manual input sub-mode: "single" | "bulk" | "table"
  const [manualSubMode, setManualSubMode] = useState<"single" | "bulk" | "table">("single");

  // Manual single card fields
  const [singleFormat, setSingleFormat] = useState<CardFormat>("short");
  const [singleQ, setSingleQ] = useState("");
  const [singleA, setSingleA] = useState("");
  const [singleTopic, setSingleTopic] = useState("");
  const [singleDiff, setSingleDiff] = useState<"easy" | "medium" | "hard">("medium");
  const [singleType, setSingleType] = useState<
    "definition" | "concept" | "cause_effect" | "process" | "comparison" | "application"
  >("concept");

  // Multiple Choice 4 Options
  const [mcOptions, setMcOptions] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [mcCorrectIndex, setMcCorrectIndex] = useState<number>(0);
  const [singleExplanation, setSingleExplanation] = useState("");

  // Vocab Flashcard fields
  const [vocabPronunciation, setVocabPronunciation] = useState("");
  const [vocabPartOfSpeech, setVocabPartOfSpeech] = useState("");
  const [vocabExample, setVocabExample] = useState("");
  const [vocabTranslation, setVocabTranslation] = useState("");

  // Card Design Customization (Background & Border)
  const [singleCustomBg, setSingleCustomBg] = useState<CardBgColor>("default");
  const [singleCustomBorder, setSingleCustomBorder] = useState<CardBorderStyle>("default");
  const [previewFlip, setPreviewFlip] = useState(false);

  const getSelectedBgClass = (bg: CardBgColor) => {
    const found = BG_COLOR_OPTIONS.find((b) => b.id === bg);
    return found?.class || "bg-white";
  };

  const getSelectedBorderClass = (border: CardBorderStyle) => {
    const found = BORDER_STYLE_OPTIONS.find((b) => b.id === border);
    return found?.class || "border border-slate-200";
  };

  // Manual bulk text
  const [bulkText, setBulkText] = useState(
    "질문 1: 세종 25년(1443년)에 창제되어 1446년에 반포된 조선 고유 문자의 명칭은?\n답변 1: 훈민정음\n\n질문 2: 식물이 광합성을 수행하는 세포 내 소기관은?\n답변 2: 엽록체\n\n질문 3: 광합성의 산물인 포도당이 잎에 임시 저장되는 형태는?\n답변 3: 녹말"
  );

  // Manual table rows
  const [tableRows, setTableRows] = useState<
    Array<{ q: string; a: string; topic: string; diff: "easy" | "medium" | "hard"; format: CardFormat }>
  >([
    { q: "", a: "", topic: "", diff: "medium", format: "short" },
    { q: "", a: "", topic: "", diff: "medium", format: "short" },
    { q: "", a: "", topic: "", diff: "medium", format: "short" },
  ]);

  // AI Generation state
  const [textMaterial, setTextMaterial] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Options
  const [aiOptions, setAiOptions] = useState<AIGenerationOptions>({
    subject: currentSet.subject || "과학",
    grade: currentSet.grade || "중학교 2학년",
    cardCount: 10,
    difficulty: "mixed",
    questionType: "mixed",
    cardFormat: "mixed",
    answerLength: "short",
    focusCore: true,
    pageRange: "",
  });

  // Processing & Loading
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [lastGeneratedCount, setLastGeneratedCount] = useState<number | null>(null);

  // Handle PDF file select & Base64 convert
  const handleFileChange = (file: File) => {
    setGenerationError(null);
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf") && !file.type.includes("text")) {
      setGenerationError("PDF 문서(.pdf) 또는 텍스트 문서(.txt) 형식만 지원합니다.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setGenerationError("파일 크기가 20MB를 초과합니다. 페이지 범위를 줄이거나 더 작은 파일을 선택해주세요.");
      return;
    }

    setUploadedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      setFileBase64(base64);
    };
    reader.onerror = () => {
      setGenerationError("파일을 읽는 도중 오류가 발생했습니다. 다시 시도해주세요.");
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Submit AI Generation
  const handleGenerateCards = async () => {
    if (!uploadedFile && !textMaterial.trim()) {
      setGenerationError("분석할 PDF 파일을 업로드하거나 교과서/학습지 텍스트를 입력해주세요.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setLastGeneratedCount(null);
    setLoadingStep("자료 분석 및 핵심 개념 추출 중...");

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep("선택한 카드 형식에 맞춰 플래시카드 생성 중...");
      }, 2000);

      const payload: any = {
        subject: aiOptions.subject,
        grade: aiOptions.grade,
        cardCount: aiOptions.cardCount,
        difficulty: aiOptions.difficulty,
        questionType: aiOptions.questionType,
        cardFormat: aiOptions.cardFormat,
        answerLength: aiOptions.answerLength,
        focusCore: aiOptions.focusCore,
        pageRange: aiOptions.pageRange?.trim() || undefined,
        existingQuestions: currentSet.cards.map((c) => c.question),
      };

      if (uploadedFile && fileBase64) {
        payload.pdfBase64 = fileBase64;
        payload.pdfMimeType = uploadedFile.type || "application/pdf";
      }

      if (textMaterial.trim()) {
        payload.text = textMaterial.trim();
      }

      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(stepTimer1);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "서버 통신 중 오류가 발생했습니다.");
      }

      const generated = data.data;
      const formattedCards: Flashcard[] = (generated.cards || []).map(
        (c: any, idx: number) => ({
          id: `card-ai-${Date.now()}-${idx}`,
          question: c.question,
          answer: c.answer,
          topic: c.topic || aiOptions.subject,
          difficulty: c.difficulty || "medium",
          type: c.type || "concept",
          cardFormat: c.cardFormat || "short",
          options: c.options,
          correctOptionIndex: c.correctOptionIndex,
          explanation: c.explanation,
          pronunciation: c.pronunciation,
          partOfSpeech: c.partOfSpeech,
          exampleSentence: c.exampleSentence,
          exampleTranslation: c.exampleTranslation,
          customBg: "default",
          customBorder: "default",
          sourcePage: c.sourcePage || null,
          needsReview: Boolean(c.needsReview),
          isAiGenerated: true,
          createdAt: Date.now(),
        })
      );

      if (formattedCards.length === 0) {
        throw new Error("자료에서 유효한 플래시카드를 추출하지 못했습니다. 더 구체적인 내용을 입력해주세요.");
      }

      onAddCards(formattedCards, true, generated.title);
      setLastGeneratedCount(formattedCards.length);
    } catch (err: any) {
      console.error("AI Generation Error:", err);
      setGenerationError(
        err.message || "카드 생성에 실패했습니다. 입력 내용과 네트워크 상태를 확인해주세요."
      );
    } finally {
      setIsGenerating(false);
      setLoadingStep("");
    }
  };

  // Add single manual card
  const handleAddSingleCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleQ.trim()) {
      setGenerationError("질문 또는 단어 표제어를 입력해주세요.");
      return;
    }

    if (singleFormat === "multiple_choice") {
      const validOpts = mcOptions.filter((o) => o.trim());
      if (validOpts.length < 4) {
        setGenerationError("객관식 카드는 4개의 보기 선지를 모두 입력해야 합니다.");
        return;
      }
    } else if (!singleA.trim()) {
      setGenerationError("정답 또는 뜻풀이를 입력해주세요.");
      return;
    }

    const answerValue =
      singleFormat === "multiple_choice"
        ? mcOptions[mcCorrectIndex] || mcOptions[0]
        : singleA.trim();

    const newCard: Flashcard = {
      id: `card-manual-${Date.now()}`,
      question: singleQ.trim(),
      answer: answerValue,
      topic: singleTopic.trim() || currentSet.subject || "일반",
      difficulty: singleDiff,
      type: singleType,
      cardFormat: singleFormat,
      options: singleFormat === "multiple_choice" ? [...mcOptions] : undefined,
      correctOptionIndex: singleFormat === "multiple_choice" ? mcCorrectIndex : undefined,
      explanation: singleExplanation.trim() || undefined,
      pronunciation: singleFormat === "vocab" && vocabPronunciation.trim() ? vocabPronunciation.trim() : undefined,
      partOfSpeech: singleFormat === "vocab" && vocabPartOfSpeech.trim() ? vocabPartOfSpeech.trim() : undefined,
      exampleSentence: singleFormat === "vocab" && vocabExample.trim() ? vocabExample.trim() : undefined,
      exampleTranslation: singleFormat === "vocab" && vocabTranslation.trim() ? vocabTranslation.trim() : undefined,
      customBg: singleCustomBg,
      customBorder: singleCustomBorder,
      sourcePage: null,
      needsReview: false,
      isAiGenerated: false,
      createdAt: Date.now(),
    };

    onAddCards([newCard], true);
    setSingleQ("");
    setSingleA("");
    setSingleTopic("");
    setSingleExplanation("");
    setMcOptions(["", "", "", ""]);
    setVocabPronunciation("");
    setVocabPartOfSpeech("");
    setVocabExample("");
    setVocabTranslation("");
    setGenerationError(null);
    setLastGeneratedCount(1);
  };

  // Add bulk text cards
  const handleAddBulkCards = () => {
    if (!bulkText.trim()) {
      setGenerationError("질문과 답변 텍스트를 입력해주세요.");
      return;
    }

    const lines = bulkText.split("\n");
    const extractedCards: Flashcard[] = [];
    let currentQ = "";
    let currentA = "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.includes("\t")) {
        const parts = line.split("\t").map((p) => p.trim());
        if (parts.length >= 2 && parts[0] && parts[1]) {
          extractedCards.push({
            id: `card-bulk-${Date.now()}-${extractedCards.length}`,
            question: parts[0],
            answer: parts[1],
            topic: parts[2] || currentSet.subject || "일반",
            difficulty: "medium",
            type: "concept",
            cardFormat: "short",
            customBg: "default",
            customBorder: "default",
            sourcePage: null,
            needsReview: false,
            isAiGenerated: false,
            createdAt: Date.now(),
          });
          continue;
        }
      }

      const qMatch = line.match(/^(?:질문|\d+[\.\)]|Q\d*[:\.\s]|문제[:\.\s])\s*(.+)/i);
      const aMatch = line.match(/^(?:답변|답|A\d*[:\.\s]|정답[:\.\s])\s*(.+)/i);

      if (qMatch) {
        if (currentQ && currentA) {
          extractedCards.push({
            id: `card-bulk-${Date.now()}-${extractedCards.length}`,
            question: currentQ,
            answer: currentA,
            topic: currentSet.subject || "일반",
            difficulty: "medium",
            type: "concept",
            cardFormat: "short",
            customBg: "default",
            customBorder: "default",
            sourcePage: null,
            needsReview: false,
            isAiGenerated: false,
            createdAt: Date.now(),
          });
          currentQ = "";
          currentA = "";
        }
        currentQ = qMatch[1].trim();
      } else if (aMatch) {
        currentA = aMatch[1].trim();
      } else if (line.includes(":") || line.includes("-") || line.includes("?")) {
        const sep = line.includes(":") ? ":" : line.includes("?") ? "?" : "-";
        const parts = line.split(sep);
        if (parts.length >= 2) {
          const q = (parts[0] + (sep === "?" ? "?" : "")).trim();
          const a = parts.slice(1).join(sep).trim();
          if (q && a) {
            extractedCards.push({
              id: `card-bulk-${Date.now()}-${extractedCards.length}`,
              question: q,
              answer: a,
              topic: currentSet.subject || "일반",
              difficulty: "medium",
              type: "concept",
              cardFormat: "short",
              customBg: "default",
              customBorder: "default",
              sourcePage: null,
              needsReview: false,
              isAiGenerated: false,
              createdAt: Date.now(),
            });
          }
        }
      }
    }

    if (currentQ && currentA) {
      extractedCards.push({
        id: `card-bulk-${Date.now()}-${extractedCards.length}`,
        question: currentQ,
        answer: currentA,
        topic: currentSet.subject || "일반",
        difficulty: "medium",
        type: "concept",
        cardFormat: "short",
        customBg: "default",
        customBorder: "default",
        sourcePage: null,
        needsReview: false,
        isAiGenerated: false,
        createdAt: Date.now(),
      });
    }

    if (extractedCards.length === 0) {
      setGenerationError("인식할 수 있는 질문·답변 형식이 없습니다.");
      return;
    }

    onAddCards(extractedCards, true);
    setBulkText("");
    setGenerationError(null);
    setLastGeneratedCount(extractedCards.length);
  };

  // Add table rows cards
  const handleAddTableCards = () => {
    const validRows = tableRows.filter((r) => r.q.trim() && r.a.trim());
    if (validRows.length === 0) {
      setGenerationError("최소 1개 이상의 질문과 답변을 완성해주세요.");
      return;
    }

    const cards: Flashcard[] = validRows.map((r, i) => ({
      id: `card-tbl-${Date.now()}-${i}`,
      question: r.q.trim(),
      answer: r.a.trim(),
      topic: r.topic.trim() || currentSet.subject || "일반",
      difficulty: r.diff,
      type: "concept",
      cardFormat: r.format,
      customBg: "default",
      customBorder: "default",
      sourcePage: null,
      needsReview: false,
      isAiGenerated: false,
      createdAt: Date.now(),
    }));

    onAddCards(cards, true);
    setTableRows([
      { q: "", a: "", topic: "", diff: "medium", format: "short" },
      { q: "", a: "", topic: "", diff: "medium", format: "short" },
      { q: "", a: "", topic: "", diff: "medium", format: "short" },
    ]);
    setGenerationError(null);
    setLastGeneratedCount(cards.length);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Introduction Banner: <중학교 수업용 플래시카드 만들기> 만 남김 */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          중학교 수업용 플래시카드 만들기
        </h1>
      </div>

      {/* Preset Fast Load Buttons */}
      <div className="flex items-center space-x-2 mb-6 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 font-semibold shrink-0 flex items-center">
          <BookOpen className="w-3.5 h-3.5 mr-1" />
          예시 불러오기:
        </span>
        {SAMPLE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              onAddCards(p.cards, false, p.title);
              setLastGeneratedCount(p.cards.length);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-semibold shrink-0 cursor-pointer"
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Mode Switch Tabs (Button style) */}
      <div className="flex space-x-2 border-b border-slate-200 mb-6 pb-3">
        <button
          type="button"
          onClick={() => {
            setInputMode("ai");
            setGenerationError(null);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors cursor-pointer ${
            inputMode === "ai"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          AI 카드 생성
        </button>

        <button
          type="button"
          onClick={() => {
            setInputMode("manual");
            setGenerationError(null);
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center transition-colors cursor-pointer ${
            inputMode === "manual"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ListPlus className="w-4 h-4 mr-2" />
          직접 입력
        </button>
      </div>

      {/* Feedback Messages */}
      {generationError && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-medium">{generationError}</span>
        </div>
      )}

      {lastGeneratedCount !== null && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              카드 {lastGeneratedCount}장이 등록되었습니다. (총 {currentSet.cards.length}장)
            </span>
          </div>
          <button
            type="button"
            onClick={onGoToEditor}
            className="inline-flex items-center px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
          >
            편집실로 이동
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      )}

      {/* MODE 1: AI GENERATION */}
      {inputMode === "ai" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Material Input */}
            <div className="lg:col-span-7 space-y-4">
              {/* File Upload Box */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    PDF 또는 텍스트 파일
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400">페이지 범위:</span>
                    <input
                      type="text"
                      placeholder="예: 1-5"
                      value={aiOptions.pageRange || ""}
                      onChange={(e) =>
                        setAiOptions({ ...aiOptions, pageRange: e.target.value })
                      }
                      className="w-20 px-2 py-0.5 text-xs border border-slate-200 rounded-md outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/50"
                      : uploadedFile
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-200 bg-slate-50/50 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.txt"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  {uploadedFile ? (
                    <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-200">
                      <div className="flex items-center space-x-2.5 truncate">
                        <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {uploadedFile.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        파일 선택 또는 드래그 앤 드롭
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Text Area */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    직접 텍스트 붙여넣기
                  </span>
                  {textMaterial && (
                    <button
                      type="button"
                      onClick={() => setTextMaterial("")}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      지우기
                    </button>
                  )}
                </div>
                <textarea
                  rows={6}
                  placeholder="수업 자료 본문 또는 핵심 요약문을 붙여넣으세요."
                  value={textMaterial}
                  onChange={(e) => setTextMaterial(e.target.value)}
                  className="w-full p-3 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-slate-50/50 resize-y"
                />
              </div>
            </div>

            {/* Right: AI Options (Button-based layout) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                {/* 1. Format Selection (Button Group - 3 Formats + Mixed) */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    카드 형식 선택
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "mixed", label: "✨ 혼합" },
                      { id: "short", label: "📝 단답형" },
                      { id: "multiple_choice", label: "🔢 객관식(4선지)" },
                      { id: "vocab", label: "🌟 단어카드" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() =>
                          setAiOptions({
                            ...aiOptions,
                            cardFormat: fmt.id as any,
                          })
                        }
                        className={`p-2.5 rounded-lg text-xs font-bold border text-center transition-all cursor-pointer ${
                          aiOptions.cardFormat === fmt.id
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Grade Selection (Button Group) */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    대상 학년
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {GRADE_OPTIONS.map((gr) => (
                      <button
                        key={gr}
                        type="button"
                        onClick={() => setAiOptions({ ...aiOptions, grade: gr })}
                        className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          aiOptions.grade === gr
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {gr.replace("중학교 ", "")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Card Count (Button Group) */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    생성 카드 수
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() =>
                          setAiOptions({ ...aiOptions, cardCount: num })
                        }
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          aiOptions.cardCount === num
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {num}장
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Difficulty (Button Group) */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    난이도
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: "mixed", label: "혼합" },
                      { id: "easy", label: "쉬움" },
                      { id: "medium", label: "보통" },
                      { id: "hard", label: "어려움" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          setAiOptions({ ...aiOptions, difficulty: d.id as any })
                        }
                        className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          aiOptions.difficulty === d.id
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Subject Dropdown */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-1.5">
                    과목
                  </span>
                  <select
                    value={aiOptions.subject}
                    onChange={(e) =>
                      setAiOptions({ ...aiOptions, subject: e.target.value })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white font-medium"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Core concept toggle button */}
                <button
                  type="button"
                  onClick={() =>
                    setAiOptions({ ...aiOptions, focusCore: !aiOptions.focusCore })
                  }
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold border flex items-center justify-center transition-all cursor-pointer ${
                    aiOptions.focusCore
                      ? "bg-amber-50 text-amber-900 border-amber-300"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 mr-1.5 ${
                      aiOptions.focusCore ? "text-amber-600" : "text-slate-300"
                    }`}
                  />
                  시험 단원 핵심 개념 위주 선별
                </button>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateCards}
                    disabled={isGenerating || (!uploadedFile && !textMaterial.trim())}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-sm shadow-md flex items-center justify-center transition-all ${
                      isGenerating
                        ? "bg-slate-300 text-slate-600 cursor-wait"
                        : !uploadedFile && !textMaterial.trim()
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-lg cursor-pointer"
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {loadingStep || "생성 중..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI 카드 {aiOptions.cardCount}장 생성하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: DIRECT MANUAL INPUT */}
      {inputMode === "manual" && (
        <div className="space-y-6">
          {/* Sub-mode Buttons */}
          <div className="flex space-x-2 border-b border-slate-200 pb-3">
            {[
              { id: "single", label: "개별 카드 작성", icon: PlusCircle },
              { id: "bulk", label: "텍스트 일괄 붙여넣기", icon: FileText },
              { id: "table", label: "표 형식 입력", icon: Table },
            ].map((sub) => {
              const Icon = sub.icon;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setManualSubMode(sub.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition-colors cursor-pointer ${
                    manualSubMode === sub.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-1.5" />
                  {sub.label}
                </button>
              );
            })}
          </div>

          {/* Submode 1: Single Card with 3 Formats (Button-based) & Live Preview */}
          {manualSubMode === "single" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form */}
              <form
                onSubmit={handleAddSingleCard}
                className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4"
              >
                {/* 1. Format Switcher (3 Buttons) */}
                <div>
                  <span className="block text-xs font-bold text-slate-800 mb-2">
                    카드 형식 선택
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "short", label: "📝 단답형" },
                      { id: "multiple_choice", label: "🔢 객관식" },
                      { id: "vocab", label: "🌟 단어카드" },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => {
                          setSingleFormat(fmt.id as CardFormat);
                          setPreviewFlip(false);
                        }}
                        className={`py-2 px-3 rounded-xl border-2 text-center text-xs font-bold transition-all cursor-pointer ${
                          singleFormat === fmt.id
                            ? "border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Format Input Fields */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                  {/* SHORT ANSWER */}
                  {singleFormat === "short" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          질문 (Question) *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="예: 세종 25년(1443년)에 창제되어 1446년에 반포된 조선 고유 문자의 명칭은?"
                          value={singleQ}
                          onChange={(e) => setSingleQ(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          단답형 정답 (단어 형태) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="예: 훈민정음"
                          value={singleA}
                          onChange={(e) => setSingleA(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          해설 (선택)
                        </label>
                        <input
                          type="text"
                          placeholder="정답 보충 설명..."
                          value={singleExplanation}
                          onChange={(e) => setSingleExplanation(e.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </>
                  )}

                  {/* MULTIPLE CHOICE */}
                  {singleFormat === "multiple_choice" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          객관식 질문 *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="예: 다음 중 식물의 광합성에 필요한 3대 필수 요소가 아닌 것은?"
                          value={singleQ}
                          onChange={(e) => setSingleQ(e.target.value)}
                          className="w-full p-2.5 text-xs border border-slate-200 rounded-lg outline-hidden focus:border-blue-500 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-2">
                          보기 4개 선지 (정답 라디오 선택) *
                        </label>
                        <div className="space-y-1.5">
                          {mcOptions.map((opt, i) => (
                            <div
                              key={i}
                              className={`flex items-center space-x-2 p-1.5 rounded-lg border ${
                                mcCorrectIndex === i
                                  ? "bg-emerald-50 border-emerald-400"
                                  : "bg-white border-slate-200"
                              }`}
                            >
                              <input
                                type="radio"
                                name="mc_correct"
                                id={`mc_radio_${i}`}
                                checked={mcCorrectIndex === i}
                                onChange={() => setMcCorrectIndex(i)}
                                className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                              />
                              <label
                                htmlFor={`mc_radio_${i}`}
                                className="text-xs font-bold text-slate-700 w-6 text-center cursor-pointer"
                              >
                                {["①", "②", "③", "④"][i]}
                              </label>
                              <input
                                type="text"
                                required
                                placeholder={`보기 ${i + 1}`}
                                value={opt}
                                onChange={(e) => {
                                  const copy = [...mcOptions] as [string, string, string, string];
                                  copy[i] = e.target.value;
                                  setMcOptions(copy);
                                }}
                                className="flex-1 p-1 text-xs border border-slate-200 rounded-md bg-white outline-hidden focus:border-blue-500"
                              />
                              {mcCorrectIndex === i && (
                                <span className="text-[10px] font-bold text-emerald-700 px-1.5 py-0.5 bg-emerald-100 rounded-sm shrink-0">
                                  ✓ 정답
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="정답 해설 (선택)..."
                          value={singleExplanation}
                          onChange={(e) => setSingleExplanation(e.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </>
                  )}

                  {/* VOCAB FLASHCARD */}
                  {singleFormat === "vocab" && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            표제어 (단어) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="예: Chloroplast 또는 엽록체"
                            value={singleQ}
                            onChange={(e) => setSingleQ(e.target.value)}
                            className="w-full p-2 text-xs font-bold border border-slate-200 rounded-lg bg-white outline-hidden focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            발음 / 한자음
                          </label>
                          <input
                            type="text"
                            placeholder="예: [ˈklɔːr.ə.plæst] / 葉綠體"
                            value={vocabPronunciation}
                            onChange={(e) => setVocabPronunciation(e.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            단어 뜻 *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="단어 뜻풀이..."
                            value={singleA}
                            onChange={(e) => setSingleA(e.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white outline-hidden focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            품사 / 분류
                          </label>
                          <input
                            type="text"
                            placeholder="예: 명사, 생명과학"
                            value={vocabPartOfSpeech}
                            onChange={(e) => setVocabPartOfSpeech(e.target.value)}
                            className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="교과서 예문 (선택)..."
                          value={vocabExample}
                          onChange={(e) => setVocabExample(e.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                        <input
                          type="text"
                          placeholder="예문 해석 (선택)..."
                          value={vocabTranslation}
                          onChange={(e) => setVocabTranslation(e.target.value)}
                          className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* 3. Design Selection (Button Swatches) */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>카드 디자인 선택</span>
                  </div>

                  {/* Bg Swatches */}
                  <div className="flex flex-wrap gap-1.5">
                    {BG_COLOR_OPTIONS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => setSingleCustomBg(bg.id)}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                          singleCustomBg === bg.id
                            ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50 font-bold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full border border-slate-300 ${bg.previewBg}`}
                        />
                        <span>{bg.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Border Buttons */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {BORDER_STYLE_OPTIONS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSingleCustomBorder(b.id)}
                        className={`p-1.5 rounded-md border text-[11px] font-medium text-center transition-all cursor-pointer ${
                          singleCustomBorder === b.id
                            ? "border-blue-600 bg-blue-50/40 text-blue-900 font-bold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  카드 추가하기
                </button>
              </form>

              {/* Right Column: Live Preview */}
              <div className="lg:col-span-5 sticky top-20 space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-slate-700 flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    미리보기
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewFlip(!previewFlip)}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 mr-1" />
                    {previewFlip ? "앞면" : "뒷면"}
                  </button>
                </div>

                {/* Preview Card */}
                <div
                  onClick={() => setPreviewFlip(!previewFlip)}
                  className={`w-full min-h-[300px] rounded-2xl p-6 transition-all duration-200 shadow-md flex flex-col justify-between cursor-pointer select-none ${getSelectedBgClass(
                    singleCustomBg
                  )} ${getSelectedBorderClass(singleCustomBorder)}`}
                >
                  {/* VOCAB PREVIEW */}
                  {singleFormat === "vocab" ? (
                    !previewFlip ? (
                      <>
                        <div>
                          <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900">
                              단어카드
                            </span>
                            <span className="text-xs font-semibold text-amber-800">
                              {vocabPartOfSpeech || "어휘"}
                            </span>
                          </div>
                          <div className="mt-6 text-center">
                            <h3 className="text-2xl font-black text-slate-900">
                              {singleQ.trim() || "단어 표제어"}
                            </h3>
                            {vocabPronunciation && (
                              <p className="text-xs font-mono text-amber-800 mt-2 font-semibold">
                                {vocabPronunciation}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="pt-2 text-center text-[11px] text-amber-700">
                          클릭하여 뜻 확인
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 block mb-2">
                            뜻풀이
                          </span>
                          <h4 className="text-xl font-black text-slate-900">
                            {singleA.trim() || "뜻풀이 내용"}
                          </h4>
                          {vocabExample && (
                            <div className="mt-3 p-2.5 bg-amber-50 rounded-lg text-xs italic text-slate-800">
                              "{vocabExample}"
                            </div>
                          )}
                        </div>
                        <div className="pt-2 text-center text-[11px] text-slate-400">
                          클릭하여 단어 보기
                        </div>
                      </>
                    )
                  ) : singleFormat === "multiple_choice" ? (
                    /* MC PREVIEW */
                    !previewFlip ? (
                      <>
                        <div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 inline-block mb-2">
                            객관식
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mb-3">
                            {singleQ.trim() || "객관식 문제"}
                          </h3>
                          <div className="space-y-1.5">
                            {mcOptions.map((opt, i) => (
                              <div
                                key={i}
                                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800"
                              >
                                {["①", "②", "③", "④"][i]} {opt || `보기 ${i + 1}`}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 text-center text-[11px] text-slate-400">
                          클릭하여 정답 확인
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white inline-block mb-2">
                            정답: {["①", "②", "③", "④"][mcCorrectIndex]}번
                          </span>
                          <div className="space-y-1.5 my-2">
                            {mcOptions.map((opt, i) => {
                              const isCorrect = mcCorrectIndex === i;
                              return (
                                <div
                                  key={i}
                                  className={`p-2 rounded-lg border text-xs font-bold ${
                                    isCorrect
                                      ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-400 line-through opacity-50"
                                  }`}
                                >
                                  {["①", "②", "③", "④"][i]} {opt || `보기 ${i + 1}`}
                                </div>
                              );
                            })}
                          </div>
                          {singleExplanation && (
                            <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-md mt-2">
                              💡 {singleExplanation}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 text-center text-[11px] text-slate-400">
                          클릭하여 문제 보기
                        </div>
                      </>
                    )
                  ) : (
                    /* SHORT ANSWER PREVIEW */
                    !previewFlip ? (
                      <>
                        <div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 inline-block mb-3">
                            단답형 질문
                          </span>
                          <h3 className="text-lg font-bold text-slate-900 mt-4">
                            {singleQ.trim() || "질문 내용을 입력하세요"}
                          </h3>
                        </div>
                        <div className="pt-2 text-center text-[11px] text-slate-400">
                          클릭하여 정답 확인
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-600 text-white inline-block mb-3">
                            정답
                          </span>
                          <h4 className="text-2xl font-black text-slate-900 mt-4">
                            {singleA.trim() || "정답"}
                          </h4>
                          {singleExplanation && (
                            <p className="text-xs text-slate-600 bg-slate-100 p-2 rounded-md mt-3">
                              💡 {singleExplanation}
                            </p>
                          )}
                        </div>
                        <div className="pt-2 text-center text-[11px] text-slate-400">
                          클릭하여 질문 보기
                        </div>
                      </>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submode 2: Bulk Delimited Text */}
          {manualSubMode === "bulk" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs max-w-3xl mx-auto space-y-3">
              <span className="font-bold text-slate-800 text-sm block">
                질문과 답변 일괄 입력
              </span>
              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="질문: 세종 25년(1443년)에 창제되어 1446년에 반포된 조선 고유 문자의 명칭은?&#10;답변: 훈민정음&#10;&#10;질문: 식물이 광합성을 수행하는 세포 내 소기관은?&#10;답변: 엽록체"
                className="w-full p-3 text-xs font-mono border border-slate-200 rounded-xl outline-hidden focus:border-blue-500 bg-slate-50/50"
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddBulkCards}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5 mr-1.5" />
                  카드 일괄 등록
                </button>
              </div>
            </div>
          )}

          {/* Submode 3: Table Format */}
          {manualSubMode === "table" && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 text-sm">
                  표 형식 빠른 입력
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTableRows([
                      ...tableRows,
                      { q: "", a: "", topic: "", diff: "medium", format: "short" },
                    ])
                  }
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />행 추가
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-2 w-10 text-center">#</th>
                      <th className="p-2 w-28">형식</th>
                      <th className="p-2">질문 / 단어 *</th>
                      <th className="p-2">답변 / 뜻 *</th>
                      <th className="p-2 w-24">난이도</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 text-center text-slate-400 font-semibold">
                          {idx + 1}
                        </td>
                        <td className="p-1.5">
                          <select
                            value={row.format}
                            onChange={(e) => {
                              const copy = [...tableRows];
                              copy[idx].format = e.target.value as any;
                              setTableRows(copy);
                            }}
                            className="w-full p-1 border border-slate-200 rounded-md bg-white font-semibold text-blue-700 text-xs"
                          >
                            <option value="short">단답형</option>
                            <option value="multiple_choice">객관식</option>
                            <option value="vocab">단어카드</option>
                          </select>
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="질문..."
                            value={row.q}
                            onChange={(e) => {
                              const copy = [...tableRows];
                              copy[idx].q = e.target.value;
                              setTableRows(copy);
                            }}
                            className="w-full p-1 border border-slate-200 rounded-md outline-hidden focus:border-blue-500 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            placeholder="답변..."
                            value={row.a}
                            onChange={(e) => {
                              const copy = [...tableRows];
                              copy[idx].a = e.target.value;
                              setTableRows(copy);
                            }}
                            className="w-full p-1 border border-slate-200 rounded-md outline-hidden focus:border-blue-500 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={row.diff}
                            onChange={(e) => {
                              const copy = [...tableRows];
                              copy[idx].diff = e.target.value as any;
                              setTableRows(copy);
                            }}
                            className="w-full p-1 border border-slate-200 rounded-md bg-white text-xs"
                          >
                            <option value="easy">쉬움</option>
                            <option value="medium">보통</option>
                            <option value="hard">어려움</option>
                          </select>
                        </td>
                        <td className="p-1.5 text-center">
                          {tableRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setTableRows(tableRows.filter((_, i) => i !== idx));
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddTableCards}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5 mr-1.5" />
                  작성된 카드 등록
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
