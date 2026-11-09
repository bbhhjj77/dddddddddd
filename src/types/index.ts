export type DifficultyLevel = "easy" | "medium" | "hard";

export type QuestionType =
  | "definition"
  | "concept"
  | "cause_effect"
  | "process"
  | "comparison"
  | "application";

// 3가지 카드 형식: 단답형, 객관식(보기4개), 단어카드
export type CardFormat = "short" | "multiple_choice" | "vocab";

export type CardBgColor =
  | "default"
  | "white"
  | "cream"
  | "mint"
  | "sky"
  | "lavender"
  | "dark";

export type CardBorderStyle =
  | "default"
  | "subtle"
  | "thick"
  | "dashed"
  | "rounded"
  | "accent";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  topic?: string;
  difficulty: DifficultyLevel;
  type: QuestionType;
  cardFormat: CardFormat; // 단답형, 객관식(4지선다), 단어카드
  // 객관식(multiple_choice) 전용 필드 (4개 보기)
  options?: [string, string, string, string] | string[];
  correctOptionIndex?: number; // 0, 1, 2, 3
  explanation?: string; // 해설
  // 단어카드(vocab) 전용 필드
  pronunciation?: string; // 발음 기호 / 한자음 / 읽기
  partOfSpeech?: string; // 품사 또는 용어 분류
  exampleSentence?: string; // 교과서 예문
  exampleTranslation?: string; // 예문 해석
  // 디자인 커스텀 (바탕화면색, 테두리 스타일)
  customBg?: CardBgColor;
  customBorder?: CardBorderStyle;
  sourcePage?: number | null;
  needsReview?: boolean;
  isAiGenerated?: boolean;
  createdAt: number;
}

export interface FlashcardSet {
  id: string;
  title: string;
  description?: string;
  subject: string;
  grade: string;
  cards: Flashcard[];
  createdAt: number;
  updatedAt: number;
}

export type CardTheme = "classic" | "pastel" | "dark" | "colorful";

export type SoundType = "bell" | "chime" | "click" | "alert" | "silent";

export interface PresentationSettings {
  theme: CardTheme;
  questionDuration: number; // in seconds
  autoRevealAnswer: boolean;
  answerDuration: number; // in seconds
  autoAdvance: boolean;
  shuffle: boolean;
  fontSize: "normal" | "large" | "xlarge";
  displayMode: "flip" | "both";
  soundEnabled: boolean;
  soundType: SoundType;
  soundVolume: number; // 0.0 to 1.0
  globalBg?: CardBgColor;
  globalBorder?: CardBorderStyle;
}

export interface AIGenerationOptions {
  subject: string;
  grade: string;
  cardCount: number;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionType:
    | "definition"
    | "concept"
    | "cause_effect"
    | "process"
    | "comparison"
    | "application"
    | "mixed";
  cardFormat: "short" | "multiple_choice" | "vocab" | "mixed";
  answerLength: "short" | "medium" | "detailed";
  focusCore: boolean;
  pageRange?: string;
}

export const CARD_FORMAT_LABELS: Record<CardFormat, string> = {
  short: "단답형",
  multiple_choice: "객관식(보기4개)",
  vocab: "단어카드",
};

export const CARD_FORMAT_DESCRIPTIONS: Record<CardFormat, string> = {
  short: "핵심 용어 단답 퀴즈",
  multiple_choice: "4가지 보기 중 정답 선택",
  vocab: "용어, 발음, 예문 단어카드",
};

export const BG_COLOR_OPTIONS: Array<{
  id: CardBgColor;
  label: string;
  class: string;
  previewBg: string;
}> = [
  { id: "default", label: "테마 기본", class: "", previewBg: "bg-slate-100" },
  { id: "white", label: "화이트", class: "!bg-white", previewBg: "bg-white" },
  { id: "cream", label: "따뜻한 크림", class: "!bg-amber-50/70", previewBg: "bg-amber-100" },
  { id: "mint", label: "산뜻한 민트", class: "!bg-emerald-50/70", previewBg: "bg-emerald-100" },
  { id: "sky", label: "스카이 블루", class: "!bg-sky-50/70", previewBg: "bg-sky-100" },
  { id: "lavender", label: "은은한 라벤더", class: "!bg-purple-50/70", previewBg: "bg-purple-100" },
  { id: "dark", label: "프로젝터 다크", class: "!bg-slate-900 !text-white", previewBg: "bg-slate-900" },
];

export const BORDER_STYLE_OPTIONS: Array<{
  id: CardBorderStyle;
  label: string;
  class: string;
}> = [
  { id: "default", label: "테마 기본", class: "" },
  { id: "subtle", label: "은은한 얇은 선", class: "!border !border-slate-300 dark:!border-slate-700 !shadow-sm" },
  { id: "thick", label: "두껍고 선명한 선", class: "!border-2 sm:!border-3 !border-slate-800 dark:!border-slate-300 !shadow-md" },
  { id: "dashed", label: "노트 스타일 점선", class: "!border-2 !border-dashed !border-slate-400 dark:!border-slate-600" },
  { id: "rounded", label: "부드러운 둥근 테두리", class: "!border !border-slate-200 !rounded-3xl !shadow-xl" },
  { id: "accent", label: "상단 컬러 포인트 바", class: "!border-t-4 !border-t-blue-600 !border-x !border-b !border-slate-200 !shadow-md" },
];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  definition: "용어 정의",
  concept: "핵심 개념",
  cause_effect: "원인·결과",
  process: "과정 설명",
  comparison: "비교·분류",
  application: "적용·추론",
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
};

export const SUBJECT_OPTIONS = [
  "과학",
  "역사",
  "사회",
  "국어",
  "영어",
  "수학",
  "기술·가정",
  "도덕",
  "음악",
  "미술",
  "체육",
  "기타",
] as const;

export const GRADE_OPTIONS = [
  "중학교 1학년",
  "중학교 2학년",
  "중학교 3학년",
] as const;
