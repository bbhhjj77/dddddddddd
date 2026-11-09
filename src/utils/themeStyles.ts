import { CardTheme } from "../types";

export interface ThemeConfig {
  id: CardTheme;
  name: string;
  description: string;
  badge: string;
  // Presentation container background
  bgClass: string;
  // Card outer shell
  cardBgClass: string;
  cardBorderClass: string;
  cardShadowClass: string;
  // Text colors
  textPrimaryClass: string;
  textSecondaryClass: string;
  // Question section accent
  questionHeaderBg: string;
  questionHeaderText: string;
  // Answer section accent
  answerHeaderBg: string;
  answerHeaderText: string;
  answerBgClass: string;
  // Accent badge
  accentBadgeClass: string;
  // Progress bar color
  progressBarClass: string;
  // Controls bar background
  controlBarBgClass: string;
}

export const THEME_CONFIGS: Record<CardTheme, ThemeConfig> = {
  classic: {
    id: "classic",
    name: "클래식",
    description: "단정한 흰색 배경과 남색 포인트",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    bgClass: "bg-slate-100",
    cardBgClass: "bg-white",
    cardBorderClass: "border border-slate-200 shadow-xl",
    cardShadowClass: "shadow-2xl shadow-slate-200/50",
    textPrimaryClass: "text-slate-900",
    textSecondaryClass: "text-slate-600",
    questionHeaderBg: "bg-blue-50 border-b border-blue-100",
    questionHeaderText: "text-blue-900 font-bold",
    answerHeaderBg: "bg-indigo-50 border-b border-indigo-100",
    answerHeaderText: "text-indigo-900 font-bold",
    answerBgClass: "bg-slate-50 border border-indigo-100",
    accentBadgeClass: "bg-blue-600 text-white",
    progressBarClass: "bg-blue-600",
    controlBarBgClass: "bg-white/90 border-slate-200 text-slate-800",
  },
  pastel: {
    id: "pastel",
    name: "파스텔",
    description: "부드럽고 편안한 파스텔 톤",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bgClass: "bg-amber-50/60",
    cardBgClass: "bg-emerald-50/70 border border-emerald-100",
    cardBorderClass: "border border-emerald-200/60 shadow-lg",
    cardShadowClass: "shadow-xl shadow-emerald-900/5",
    textPrimaryClass: "text-emerald-950",
    textSecondaryClass: "text-emerald-800/80",
    questionHeaderBg: "bg-teal-100/70 border-b border-teal-200/60",
    questionHeaderText: "text-teal-900 font-bold",
    answerHeaderBg: "bg-amber-100/70 border-b border-amber-200/60",
    answerHeaderText: "text-amber-900 font-bold",
    answerBgClass: "bg-white/90 border border-amber-200/60",
    accentBadgeClass: "bg-teal-700 text-white",
    progressBarClass: "bg-teal-600",
    controlBarBgClass: "bg-white/90 border-emerald-100 text-emerald-900",
  },
  dark: {
    id: "dark",
    name: "다크 (프로젝터용)",
    description: "교실 프로젝터에 최적화된 고대비 흑백",
    badge: "bg-slate-800 text-slate-200 border-slate-700",
    bgClass: "bg-slate-950",
    cardBgClass: "bg-slate-900 border border-slate-800",
    cardBorderClass: "border border-slate-700 shadow-2xl",
    cardShadowClass: "shadow-2xl shadow-black/80 ring-1 ring-white/10",
    textPrimaryClass: "text-slate-50",
    textSecondaryClass: "text-slate-300",
    questionHeaderBg: "bg-slate-800/80 border-b border-slate-700",
    questionHeaderText: "text-cyan-300 font-bold",
    answerHeaderBg: "bg-slate-800 border-b border-slate-700",
    answerHeaderText: "text-emerald-300 font-bold",
    answerBgClass: "bg-slate-950/80 border border-slate-800",
    accentBadgeClass: "bg-cyan-500 text-slate-950 font-bold",
    progressBarClass: "bg-cyan-400",
    controlBarBgClass: "bg-slate-900/90 border-slate-800 text-slate-200",
  },
  colorful: {
    id: "colorful",
    name: "컬러풀",
    description: "질문(보라)과 정답(오렌지)이 선명한 대비",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    bgClass: "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50",
    cardBgClass: "bg-white",
    cardBorderClass: "border-2 border-indigo-200 shadow-xl",
    cardShadowClass: "shadow-2xl shadow-indigo-500/10",
    textPrimaryClass: "text-slate-900",
    textSecondaryClass: "text-slate-600",
    questionHeaderBg: "bg-gradient-to-r from-indigo-600 to-purple-600",
    questionHeaderText: "text-white font-bold",
    answerHeaderBg: "bg-gradient-to-r from-amber-500 to-orange-500",
    answerHeaderText: "text-white font-bold",
    answerBgClass: "bg-orange-50/50 border-2 border-orange-200",
    accentBadgeClass: "bg-purple-600 text-white",
    progressBarClass: "bg-gradient-to-r from-indigo-500 to-pink-500",
    controlBarBgClass: "bg-white/95 border-purple-100 text-slate-900",
  },
};
