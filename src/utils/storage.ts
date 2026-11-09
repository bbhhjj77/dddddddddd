import { FlashcardSet, PresentationSettings } from "../types";
import { SAMPLE_PRESETS } from "./presets";

const STORAGE_KEY_CURRENT_SET = "classflip_current_set_v2";
const STORAGE_KEY_SAVED_SETS = "classflip_saved_sets_v2";
const STORAGE_KEY_SETTINGS = "classflip_settings_v1";

export const DEFAULT_SETTINGS: PresentationSettings = {
  theme: "classic",
  questionDuration: 5,
  autoRevealAnswer: true,
  answerDuration: 4,
  autoAdvance: false,
  shuffle: false,
  fontSize: "large",
  displayMode: "flip",
  soundEnabled: true,
  soundType: "chime",
  soundVolume: 0.5,
};

export function loadCurrentSet(): FlashcardSet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_SET);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cards)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("로컬 스토리지 현재 세트 로드 실패:", e);
  }

  // Fallback to initial preset
  const defaultSet = SAMPLE_PRESETS[0];
  saveCurrentSet(defaultSet);
  return defaultSet;
}

export function saveCurrentSet(set: FlashcardSet): boolean {
  try {
    const updated = {
      ...set,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_CURRENT_SET, JSON.stringify(updated));

    // Also update in saved sets list
    const saved = loadSavedSets();
    const idx = saved.findIndex((s) => s.id === set.id);
    if (idx >= 0) {
      saved[idx] = updated;
    } else {
      saved.unshift(updated);
    }
    saveSavedSets(saved);
    return true;
  } catch (e) {
    console.error("저장 실패 (로컬 스토리지 한도 초과 등):", e);
    return false;
  }
}

export function loadSavedSets(): FlashcardSet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_SETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("저장된 세트 목록 로드 실패:", e);
  }

  // Initial populate with sample presets
  try {
    localStorage.setItem(
      STORAGE_KEY_SAVED_SETS,
      JSON.stringify(SAMPLE_PRESETS)
    );
  } catch {}
  return SAMPLE_PRESETS;
}

export function saveSavedSets(sets: FlashcardSet[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_SETS, JSON.stringify(sets));
    return true;
  } catch (e) {
    console.error("세트 목록 저장 실패:", e);
    return false;
  }
}

export function loadSettings(): PresentationSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn("설정 로드 실패:", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: PresentationSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn("설정 저장 실패:", e);
  }
}

/**
 * JSON 파일로 내보내기 다운로드
 */
export function exportSetToJson(set: FlashcardSet): void {
  const dataStr = JSON.stringify(set, null, 2);
  const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanTitle = set.title.replace(/[\\/:*?"<>|]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ClassFlip_${cleanTitle}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * CSV 파일로 내보내기 (Excel 한글 깨짐 방지 UTF-8 BOM 포함)
 */
export function exportSetToCsv(set: FlashcardSet): void {
  const headers = [
    "번호",
    "형식",
    "질문/용어",
    "답변/뜻풀이",
    "소주제/개념",
    "난이도",
    "유형",
    "보기1",
    "보기2",
    "보기3",
    "보기4",
    "정답선지번호",
    "발음/한자",
    "품사",
    "예문",
    "출처페이지",
    "검토필요",
  ];

  const rows = set.cards.map((c, i) => [
    (i + 1).toString(),
    c.cardFormat || "short",
    `"${(c.question || "").replace(/"/g, '""')}"`,
    `"${(c.answer || "").replace(/"/g, '""')}"`,
    `"${(c.topic || "").replace(/"/g, '""')}"`,
    c.difficulty,
    c.type,
    c.options?.[0] ? `"${c.options[0].replace(/"/g, '""')}"` : "",
    c.options?.[1] ? `"${c.options[1].replace(/"/g, '""')}"` : "",
    c.options?.[2] ? `"${c.options[2].replace(/"/g, '""')}"` : "",
    c.options?.[3] ? `"${c.options[3].replace(/"/g, '""')}"` : "",
    typeof c.correctOptionIndex === "number" ? (c.correctOptionIndex + 1).toString() : "",
    c.pronunciation ? `"${c.pronunciation.replace(/"/g, '""')}"` : "",
    c.partOfSpeech ? `"${c.partOfSpeech.replace(/"/g, '""')}"` : "",
    c.exampleSentence ? `"${c.exampleSentence.replace(/"/g, '""')}"` : "",
    c.sourcePage ? c.sourcePage.toString() : "",
    c.needsReview ? "Y" : "N",
  ]);

  const csvContent =
    "\uFEFF" + // UTF-8 BOM
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const cleanTitle = set.title.replace(/[\\/:*?"<>|]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `ClassFlip_${cleanTitle}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 업로드된 JSON 파일 파싱 및 유효성 검사
 */
export function parseImportedJson(jsonString: string): FlashcardSet {
  const parsed = JSON.parse(jsonString);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("유효한 JSON 객체 파일이 아닙니다.");
  }

  // Check if it's a FlashcardSet or an array of cards
  let cards = Array.isArray(parsed.cards) ? parsed.cards : Array.isArray(parsed) ? parsed : null;

  if (!cards || !Array.isArray(cards)) {
    throw new Error("JSON 파일 내에 'cards' 목록이 포함되어 있지 않습니다.");
  }

  const validCards = cards.map((c: any, index: number) => ({
    id: c.id || `card-import-${Date.now()}-${index}`,
    question: (c.question || c.q || `질문 ${index + 1}`).trim(),
    answer: (c.answer || c.a || "").trim(),
    topic: c.topic || "가져온 카드",
    difficulty: ["easy", "medium", "hard"].includes(c.difficulty)
      ? c.difficulty
      : "medium",
    type: [
      "definition",
      "concept",
      "cause_effect",
      "process",
      "comparison",
      "application",
    ].includes(c.type)
      ? c.type
      : "concept",
    cardFormat: ["short", "descriptive", "multiple_choice", "vocab"].includes(c.cardFormat)
      ? c.cardFormat
      : "short",
    options: Array.isArray(c.options) ? c.options.slice(0, 4) : undefined,
    correctOptionIndex: typeof c.correctOptionIndex === "number" ? c.correctOptionIndex : undefined,
    explanation: c.explanation || undefined,
    pronunciation: c.pronunciation || undefined,
    partOfSpeech: c.partOfSpeech || undefined,
    exampleSentence: c.exampleSentence || undefined,
    exampleTranslation: c.exampleTranslation || undefined,
    customBg: c.customBg || "default",
    customBorder: c.customBorder || "default",
    sourcePage: typeof c.sourcePage === "number" ? c.sourcePage : null,
    needsReview: Boolean(c.needsReview),
    isAiGenerated: Boolean(c.isAiGenerated),
    createdAt: c.createdAt || Date.now(),
  }));

  return {
    id: `set-import-${Date.now()}`,
    title: parsed.title?.trim() || "가져온 플래시카드 세트",
    description: parsed.description || "외부 파일에서 가져온 카드 목록입니다.",
    subject: parsed.subject || "기타",
    grade: parsed.grade || "중학교 2학년",
    cards: validCards,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
