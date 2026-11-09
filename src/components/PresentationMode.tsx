import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Maximize2,
  Minimize2,
  X,
  Eye,
  EyeOff,
  Settings,
  Volume2,
  VolumeX,
  Shuffle,
  HelpCircle,
  Clock,
  Sparkles,
  Keyboard,
  Check,
  Quote,
  Palette,
  CheckCircle2,
} from "lucide-react";
import {
  CardTheme,
  DifficultyLevel,
  Flashcard,
  FlashcardSet,
  PresentationSettings,
  SoundType,
  QUESTION_TYPE_LABELS,
  DIFFICULTY_LABELS,
  CARD_FORMAT_LABELS,
  BG_COLOR_OPTIONS,
  BORDER_STYLE_OPTIONS,
  CardBgColor,
  CardBorderStyle,
} from "../types";
import { THEME_CONFIGS } from "../utils/themeStyles";
import { soundManager } from "../utils/soundEffects";

interface PresentationModeProps {
  currentSet: FlashcardSet;
  settings: PresentationSettings;
  onUpdateSettings: (newSettings: PresentationSettings) => void;
  onExit: () => void;
}

export const PresentationMode: React.FC<PresentationModeProps> = ({
  currentSet,
  settings,
  onUpdateSettings,
  onExit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showShortcutModal, setShowShortcutModal] = useState(false);

  // First-time teacher shortcut onboarding overlay state
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState<boolean>(
    () => {
      try {
        const dismissed = localStorage.getItem(
          "classflip_shortcut_onboarding_dismissed"
        );
        return !dismissed;
      } catch {
        return true;
      }
    }
  );
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboardingOverlay(false);
    if (dontShowAgain) {
      try {
        localStorage.setItem(
          "classflip_shortcut_onboarding_dismissed",
          "true"
        );
      } catch {}
    }
  }, [dontShowAgain]);

  // Deck generation (original vs shuffled)
  const presentationCards = useMemo(() => {
    if (!settings.shuffle) return currentSet.cards;
    // Fisher-Yates shuffle
    const copy = [...currentSet.cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [currentSet.cards, settings.shuffle]);

  // Current Card Index & Answer State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(
    settings.displayMode === "both"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  // Accurate Timer State (seconds remaining and progress ratio)
  const [timerSecondsLeft, setTimerSecondsLeft] = useState<number>(
    settings.questionDuration
  );
  const [timerProgress, setTimerProgress] = useState<number>(0); // 0 to 1

  // Safe sound sync
  useEffect(() => {
    soundManager.setMuted(!settings.soundEnabled);
    soundManager.setVolume(settings.soundVolume);
  }, [settings.soundEnabled, settings.soundVolume]);

  const activeCard: Flashcard | undefined = presentationCards[currentIndex];
  const theme = THEME_CONFIGS[settings.theme] || THEME_CONFIGS.classic;

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (e) {
      console.warn("전체 화면 전환 실패:", e);
    }
  }, []);

  // Listen to fullscreenchange events
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
    };
  }, []);

  // Handle Answer Reveal
  const handleRevealAnswer = useCallback(() => {
    setIsAnswerRevealed(true);
    soundManager.onAnswerReveal(settings.soundType);

    // If playing and autoAdvance is enabled, reset timer for answer duration
    if (isPlaying && settings.autoAdvance) {
      setTimerSecondsLeft(settings.answerDuration);
      setTimerProgress(0);
    }
  }, [isPlaying, settings.autoAdvance, settings.answerDuration, settings.soundType]);

  // Handle Hide Answer (Show question again)
  const handleHideAnswer = useCallback(() => {
    setIsAnswerRevealed(false);
    if (isPlaying && settings.autoRevealAnswer) {
      setTimerSecondsLeft(settings.questionDuration);
      setTimerProgress(0);
    }
  }, [isPlaying, settings.autoRevealAnswer, settings.questionDuration]);

  // Handle Next Card
  const handleNextCard = useCallback(() => {
    if (currentIndex < presentationCards.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setIsAnswerRevealed(settings.displayMode === "both");
      setTimerSecondsLeft(settings.questionDuration);
      setTimerProgress(0);
      soundManager.onCardTransition(settings.soundType);
    } else {
      // Reached the end
      setIsPlaying(false);
      soundManager.playTimerEnd();
    }
  }, [
    currentIndex,
    presentationCards.length,
    settings.displayMode,
    settings.questionDuration,
    settings.soundType,
  ]);

  // Handle Previous Card
  const handlePrevCard = useCallback(() => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setIsAnswerRevealed(settings.displayMode === "both");
      setTimerSecondsLeft(settings.questionDuration);
      setTimerProgress(0);
      soundManager.onCardTransition(settings.soundType);
    }
  }, [currentIndex, settings.displayMode, settings.questionDuration, settings.soundType]);

  // Handle Restart
  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setIsAnswerRevealed(settings.displayMode === "both");
    setTimerSecondsLeft(settings.questionDuration);
    setTimerProgress(0);
    soundManager.playClick();
  }, [settings.displayMode, settings.questionDuration]);

  // Step Action (Next or Reveal depending on state)
  const handleNextStep = useCallback(() => {
    if (settings.displayMode === "both") {
      handleNextCard();
    } else if (!isAnswerRevealed) {
      handleRevealAnswer();
    } else {
      handleNextCard();
    }
  }, [settings.displayMode, isAnswerRevealed, handleRevealAnswer, handleNextCard]);

  // TIMER ENGINE
  useEffect(() => {
    if (!isPlaying) {
      return;
    }

    const intervalMs = 100;
    const interval = setInterval(() => {
      // Phase 1: Question showing, waiting to reveal answer
      if (!isAnswerRevealed) {
        if (!settings.autoRevealAnswer) {
          // If auto reveal is turned off, do not countdown to reveal
          return;
        }

        const totalDuration = settings.questionDuration;
        setTimerSecondsLeft((prev) => {
          const next = Math.max(0, prev - intervalMs / 1000);
          const elapsed = totalDuration - next;
          setTimerProgress(Math.min(1, elapsed / totalDuration));

          if (next <= 0) {
            // Trigger answer reveal!
            setTimeout(() => {
              handleRevealAnswer();
            }, 0);
          }
          return next;
        });
      } else {
        // Phase 2: Answer is revealed, waiting to advance to next card
        if (!settings.autoAdvance) {
          // Do not auto-advance if setting is off
          return;
        }

        const totalDuration = settings.answerDuration;
        setTimerSecondsLeft((prev) => {
          const next = Math.max(0, prev - intervalMs / 1000);
          const elapsed = totalDuration - next;
          setTimerProgress(Math.min(1, elapsed / totalDuration));

          if (next <= 0) {
            // Trigger next card!
            setTimeout(() => {
              handleNextCard();
            }, 0);
          }
          return next;
        });
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    isAnswerRevealed,
    settings.autoRevealAnswer,
    settings.autoAdvance,
    settings.questionDuration,
    settings.answerDuration,
    handleRevealAnswer,
    handleNextCard,
  ]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input/textarea/select
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (["input", "textarea", "select"].includes(targetTag)) {
        return;
      }

      // If the first-time onboarding overlay is active, dismiss it on common action keys
      if (showOnboardingOverlay) {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape" || e.key === "ArrowRight") {
          e.preventDefault();
          handleDismissOnboarding();
          return;
        }
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevCard();
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!isAnswerRevealed) {
          handleRevealAnswer();
        } else {
          handleNextCard();
        }
      } else if (e.key === "Escape") {
        if (showOnboardingOverlay) {
          setShowOnboardingOverlay(false);
        } else if (showSettingsDrawer) {
          setShowSettingsDrawer(false);
        } else if (showShortcutModal) {
          setShowShortcutModal(false);
        } else if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onExit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    showOnboardingOverlay,
    handleDismissOnboarding,
    handleNextStep,
    handlePrevCard,
    handleRevealAnswer,
    handleNextCard,
    isAnswerRevealed,
    showSettingsDrawer,
    showShortcutModal,
    onExit,
  ]);

  // Font Size classes
  const fontSizes = {
    normal: {
      questionHero: "text-2xl sm:text-3xl md:text-4xl",
      questionShrunk: "text-xs sm:text-sm",
      answerHero: "text-3xl sm:text-5xl md:text-6xl",
    },
    large: {
      questionHero: "text-3xl sm:text-4xl md:text-5xl",
      questionShrunk: "text-sm sm:text-base",
      answerHero: "text-4xl sm:text-6xl md:text-7xl",
    },
    xlarge: {
      questionHero: "text-4xl sm:text-5xl md:text-6xl",
      questionShrunk: "text-base sm:text-lg",
      answerHero: "text-5xl sm:text-7xl md:text-8xl",
    },
  }[settings.fontSize];

  // Dynamic question font size scaler based on character length so card stays compact
  const getDynamicQuestionHeroSize = (
    text: string,
    baseSetting: "normal" | "large" | "xlarge" = "large"
  ): string => {
    const len = (text || "").length;
    if (baseSetting === "normal") {
      if (len > 90) return "text-base sm:text-lg md:text-xl leading-relaxed";
      if (len > 60) return "text-lg sm:text-xl md:text-2xl leading-relaxed";
      if (len > 35) return "text-xl sm:text-2xl md:text-3xl leading-snug";
      return "text-2xl sm:text-3xl md:text-4xl leading-snug";
    }
    if (baseSetting === "large") {
      if (len > 90) return "text-lg sm:text-xl md:text-2xl leading-relaxed";
      if (len > 60) return "text-xl sm:text-2xl md:text-3xl leading-snug";
      if (len > 35) return "text-2xl sm:text-3xl md:text-4xl leading-snug";
      return "text-3xl sm:text-4xl md:text-5xl leading-snug";
    }
    // xlarge
    if (len > 90) return "text-xl sm:text-2xl md:text-3xl leading-relaxed";
    if (len > 60) return "text-2xl sm:text-3xl md:text-4xl leading-snug";
    if (len > 35) return "text-3xl sm:text-4xl md:text-5xl leading-snug";
    return "text-4xl sm:text-5xl md:text-6xl leading-snug";
  };

  // Vocab word size scaler
  const getVocabWordSize = (text: string): string => {
    const len = (text || "").length;
    if (len > 30) return "text-2xl sm:text-3xl md:text-4xl";
    if (len > 15) return "text-3xl sm:text-4xl md:text-5xl";
    return "text-4xl sm:text-6xl md:text-7xl";
  };

  // Vocab definition font size scaler based on length and presence of example sentence so card stays consistent
  const getVocabDefinitionSize = (
    text: string,
    hasExample: boolean,
    baseSetting: "normal" | "large" | "xlarge" = "large"
  ): string => {
    const len = (text || "").length;
    if (hasExample) {
      if (len > 70) return "text-sm sm:text-base md:text-lg leading-relaxed";
      if (len > 40) return "text-base sm:text-lg md:text-xl leading-relaxed";
      if (len > 20) return "text-lg sm:text-xl md:text-2xl leading-snug";
      return "text-xl sm:text-2xl md:text-3xl leading-snug";
    }
    if (baseSetting === "normal") {
      if (len > 80) return "text-base sm:text-lg md:text-xl leading-relaxed";
      if (len > 45) return "text-lg sm:text-xl md:text-2xl leading-relaxed";
      if (len > 20) return "text-xl sm:text-2xl md:text-3xl leading-snug";
      return "text-2xl sm:text-3xl md:text-4xl leading-snug";
    }
    if (baseSetting === "large") {
      if (len > 80) return "text-lg sm:text-xl md:text-2xl leading-relaxed";
      if (len > 45) return "text-xl sm:text-2xl md:text-3xl leading-snug";
      if (len > 20) return "text-2xl sm:text-3xl md:text-4xl leading-snug";
      return "text-3xl sm:text-4xl md:text-5xl leading-snug";
    }
    // xlarge
    if (len > 80) return "text-xl sm:text-2xl md:text-3xl leading-relaxed";
    if (len > 45) return "text-2xl sm:text-3xl md:text-4xl leading-snug";
    if (len > 20) return "text-3xl sm:text-4xl md:text-5xl leading-snug";
    return "text-4xl sm:text-5xl md:text-6xl leading-snug";
  };

  // Helper to resolve card background color
  const getResolvedBgClass = (card?: Flashcard) => {
    if (card?.customBg && card.customBg !== "default") {
      const found = BG_COLOR_OPTIONS.find((b) => b.id === card.customBg);
      if (found?.class) return found.class;
    }
    if (settings.globalBg && settings.globalBg !== "default") {
      const found = BG_COLOR_OPTIONS.find((b) => b.id === settings.globalBg);
      if (found?.class) return found.class;
    }
    return theme.cardBgClass;
  };

  // Helper to resolve card border style
  const getResolvedBorderClass = (card?: Flashcard) => {
    if (card?.customBorder && card.customBorder !== "default") {
      const found = BORDER_STYLE_OPTIONS.find((b) => b.id === card.customBorder);
      if (found?.class) return found.class;
    }
    if (settings.globalBorder && settings.globalBorder !== "default") {
      const found = BORDER_STYLE_OPTIONS.find((b) => b.id === settings.globalBorder);
      if (found?.class) return found.class;
    }
    return theme.cardBorderClass;
  };

  const progressPercent =
    presentationCards.length > 0
      ? ((currentIndex + 1) / presentationCards.length) * 100
      : 0;

  return (
    <div
      ref={containerRef}
      className={`relative min-h-screen w-full flex flex-col justify-between select-none overflow-hidden transition-colors duration-300 ${theme.bgClass}`}
    >
      {/* Top Classroom Bar: Set Title, Progress, Controls */}
      <header className="px-6 py-4 flex items-center justify-between z-20">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg tracking-tight truncate max-w-xs sm:max-w-md text-slate-800 dark:text-slate-100">
            {currentSet.title}
          </span>
        </div>

        {/* Card Counter & Timer Pill */}
        <div className="flex items-center space-x-3">
          {isPlaying && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>{Math.ceil(timerSecondsLeft)}초</span>
            </div>
          )}

          <div className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 font-bold text-sm tracking-wide text-slate-800 dark:text-slate-200">
            {currentIndex + 1} / {presentationCards.length}
          </div>

          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              onUpdateSettings({
                ...settings,
                soundEnabled: !settings.soundEnabled,
              });
            }}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={settings.soundEnabled ? "효과음 끄기" : "효과음 켜기"}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* Settings Drawer Button */}
          <button
            type="button"
            onClick={() => setShowSettingsDrawer(true)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="수업 및 테마 설정 열기"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Shortcut Help Button */}
          <button
            type="button"
            onClick={() => setShowOnboardingOverlay(true)}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer border border-black/10 dark:border-white/15"
            title="키보드 단축키 및 무선 프리젠터 안내"
          >
            <Keyboard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline text-xs font-semibold">단축키 안내</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={isFullscreen ? "전체화면 종료" : "전체화면 시작"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Exit Presentation */}
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            title="수업 모드 종료 (편집 화면으로)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress Bar (Overall Deck Progress) */}
      <div className="w-full bg-slate-200/50 dark:bg-slate-800/50 h-1.5 relative">
        <div
          className={`h-full transition-all duration-300 ${theme.progressBarClass}`}
          style={{ width: `${progressPercent}%` }}
        />
        {/* Timer Sub-progress indicator when playing */}
        {isPlaying && (
          <div
            className="absolute top-0 left-0 h-full bg-white/70 dark:bg-white/90 transition-all duration-100"
            style={{ width: `${timerProgress * 100}%` }}
          />
        )}
      </div>

      {/* MAIN CARD STAGE */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 max-w-5xl mx-auto w-full">
        {activeCard ? (
          <div
            className={`w-full h-[460px] sm:h-[500px] md:h-[540px] max-h-[75vh] flex flex-col rounded-3xl overflow-hidden transition-all duration-300 ${getResolvedBgClass(
              activeCard
            )} ${getResolvedBorderClass(activeCard)} ${theme.cardShadowClass}`}
          >
            {/* When Answer is Revealed: Clean reference bar at top, followed by the answer */}
            {settings.displayMode === "both" || isAnswerRevealed ? (
              <div className="flex flex-col h-full flex-1 overflow-hidden transition-all duration-300">
                {/* Clean Top Question Reference Bar without metadata labels */}
                <div className="px-6 sm:px-8 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-center shrink-0">
                  <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-snug truncate max-w-3xl break-keep">
                    {activeCard.question}
                    {activeCard.cardFormat === "vocab" && activeCard.pronunciation && (
                      <span className="ml-2 font-mono text-xs text-amber-600 dark:text-amber-400">
                        ({activeCard.pronunciation})
                      </span>
                    )}
                  </p>
                </div>

                {/* Answer Sections */}
                {/* FORMAT A: MULTIPLE CHOICE */}
                {activeCard.cardFormat === "multiple_choice" ? (
                  <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
                    <div className="w-full max-w-3xl mx-auto my-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
                        {(
                          activeCard.options || ["보기 1", "보기 2", "보기 3", "보기 4"]
                        ).map((opt, idx) => {
                          const isCorrect = (activeCard.correctOptionIndex ?? 0) === idx;
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                isCorrect
                                  ? "bg-emerald-600 text-white border-emerald-500 shadow-xl ring-4 ring-emerald-300/60 dark:ring-emerald-500/40 scale-102"
                                  : "bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-40 line-through"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <span
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                    isCorrect
                                      ? "bg-white text-emerald-800"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                  }`}
                                >
                                  {["①", "②", "③", "④"][idx]}
                                </span>
                                <span className="font-extrabold text-base sm:text-lg break-keep">
                                  {opt}
                                </span>
                              </div>
                              {isCorrect && (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-white text-emerald-800 shadow-xs">
                                  ✓ 정답
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {activeCard.explanation && (
                        <div className="mt-4 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-600 dark:text-slate-300 break-keep text-center">
                          {activeCard.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeCard.cardFormat === "vocab" ? (
                  /* FORMAT B: VOCAB FLASH ANSWER (Adaptive text size to keep card uniform) */
                  <div className="flex-1 p-6 sm:p-10 md:p-12 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-95 duration-300 overflow-y-auto">
                    <div className="w-full max-w-2xl mx-auto my-auto py-2">
                      <h3
                        className={`font-black leading-snug tracking-tight text-amber-950 dark:text-amber-100 break-keep ${getVocabDefinitionSize(
                          activeCard.answer,
                          Boolean(activeCard.exampleSentence),
                          settings.fontSize
                        )}`}
                      >
                        {activeCard.answer}
                      </h3>

                      {activeCard.exampleSentence && (
                        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 max-w-xl mx-auto">
                          <p className="text-sm sm:text-base font-serif italic text-slate-800 dark:text-slate-200 leading-relaxed break-keep">
                            "{activeCard.exampleSentence}"
                          </p>
                          {activeCard.exampleTranslation && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium break-keep">
                              {activeCard.exampleTranslation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* FORMAT D: SHORT ANSWER */
                  <div
                    className={`flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center items-center text-center animate-in fade-in zoom-in-95 duration-300 overflow-y-auto ${theme.answerBgClass}`}
                  >
                    <div className="w-full max-w-2xl mx-auto my-auto py-2">
                      <h3
                        className={`font-black leading-tight tracking-tight text-emerald-600 dark:text-emerald-400 break-keep ${fontSizes.answerHero}`}
                      >
                        {activeCard.answer}
                      </h3>

                      {activeCard.explanation && (
                        <div className="mt-5 max-w-xl mx-auto px-4 py-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 text-xs sm:text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 break-keep">
                          {activeCard.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* When Answer is Hidden: Pure Question Presentation without any auxiliary labels */
              activeCard.cardFormat === "multiple_choice" ? (
                /* MULTIPLE CHOICE QUESTION VIEW */
                <div
                  onClick={handleRevealAnswer}
                  className="flex-1 p-6 sm:p-8 md:p-10 flex flex-col justify-center cursor-pointer overflow-y-auto transition-all duration-300"
                >
                  <div className="w-full max-w-3xl mx-auto my-auto">
                    <h2
                      className={`font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 break-keep text-center ${getDynamicQuestionHeroSize(
                        activeCard.question,
                        settings.fontSize
                      )}`}
                    >
                      {activeCard.question}
                    </h2>

                    {/* 4 Options Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-2">
                      {(
                        activeCard.options || ["보기 1", "보기 2", "보기 3", "보기 4"]
                      ).map((opt, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center space-x-3 text-slate-800 dark:text-slate-200 text-sm sm:text-base font-bold shadow-2xs"
                        >
                          <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {["①", "②", "③", "④"][idx]}
                          </span>
                          <span className="break-keep">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : activeCard.cardFormat === "vocab" ? (
                /* VOCAB QUESTION VIEW */
                <div
                  onClick={handleRevealAnswer}
                  className="flex-1 p-8 sm:p-12 md:p-14 flex flex-col justify-center items-center text-center cursor-pointer overflow-y-auto transition-all duration-300"
                >
                  <div className="w-full max-w-2xl mx-auto my-auto">
                    <h2
                      className={`font-black text-slate-900 dark:text-white tracking-tight break-keep ${getVocabWordSize(
                        activeCard.question
                      )}`}
                    >
                      {activeCard.question}
                    </h2>
                    {activeCard.pronunciation && (
                      <div className="mt-4 inline-block px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 font-mono text-sm sm:text-base font-bold text-amber-900 dark:text-amber-300">
                        {activeCard.pronunciation}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* SHORT ANSWER QUESTION VIEW */
                <div
                  onClick={handleRevealAnswer}
                  className="flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center items-center text-center cursor-pointer overflow-y-auto transition-all duration-300"
                >
                  <div className="w-full max-w-3xl mx-auto my-auto">
                    <h2
                      className={`font-extrabold tracking-tight text-slate-900 dark:text-white max-w-2xl mx-auto break-keep ${getDynamicQuestionHeroSize(
                        activeCard.question,
                        settings.fontSize
                      )}`}
                    >
                      {activeCard.question}
                    </h2>
                  </div>
                </div>
              )
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500">
            표시할 카드가 없습니다.
          </div>
        )}
      </main>

      {/* BOTTOM CONTROLS DOCK */}
      <footer className="p-4 sm:p-6 z-20 flex justify-center">
        <div
          className={`flex items-center space-x-2 sm:space-x-4 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-md border ${theme.controlBarBgClass}`}
        >
          {/* Previous Card */}
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={handlePrevCard}
            className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 transition-all cursor-pointer"
            title="이전 카드 (←)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Reveal or Hide Answer */}
          {settings.displayMode !== "both" && (
            <button
              type="button"
              onClick={isAnswerRevealed ? handleHideAnswer : handleRevealAnswer}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center transition-all cursor-pointer ${
                isAnswerRevealed
                  ? "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
              }`}
              title="답변 토글 (Enter)"
            >
              {isAnswerRevealed ? (
                <>
                  <EyeOff className="w-4 h-4 mr-1.5" />
                  답변 숨기기
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1.5" />
                  답변 공개
                </>
              )}
            </button>
          )}

          {/* Play / Pause Auto-Timer */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-3 rounded-xl transition-all cursor-pointer shadow-md ${
              isPlaying
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
            title={isPlaying ? "일시 정지 (스페이스바)" : "자동 재생 시작 (스페이스바)"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Card / Step */}
          <button
            type="button"
            disabled={
              currentIndex === presentationCards.length - 1 && isAnswerRevealed
            }
            onClick={handleNextStep}
            className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-20 transition-all cursor-pointer"
            title="다음 단계 / 다음 카드 (→)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Restart Deck */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer"
            title="처음부터 다시 시작"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Persistent Keyboard Shortcut Quick-Guide Bar */}
        <div className="hidden md:flex items-center justify-center mt-2.5">
          <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-full bg-black/10 dark:bg-white/10 backdrop-blur-xs text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-black/5 dark:border-white/10 shadow-2xs">
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-[10px] font-bold mr-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                Enter
              </kbd>
              정답 공개
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-[10px] font-bold mr-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                →
              </kbd>
              다음 카드
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-[10px] font-bold mr-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                ←
              </kbd>
              이전 카드
            </span>
            <span className="opacity-40">•</span>
            <span className="flex items-center">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-[10px] font-bold mr-1 border border-slate-300 dark:border-slate-700 shadow-2xs">
                Space
              </kbd>
              타이머 재생/정지
            </span>
            <span className="opacity-40">•</span>
            <button
              type="button"
              onClick={() => setShowOnboardingOverlay(true)}
              className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer ml-0.5"
            >
              단축키 전체보기
            </button>
          </div>
        </div>
      </footer>

      {/* SETTINGS DRAWER / MODAL */}
      {showSettingsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-lg">수업 및 화면 설정</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Theme Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  카드 디자인 테마 (4종)
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(
                    Object.keys(THEME_CONFIGS) as Array<CardTheme>
                  ).map((themeKey) => {
                    const cfg = THEME_CONFIGS[themeKey];
                    const isSelected = settings.theme === themeKey;
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, theme: themeKey })
                        }
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                            : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {cfg.name}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {cfg.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Timer Controls */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  초 단위 자동 타이머 설정
                </label>

                {/* Question Duration */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">질문 표시 시간</span>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {settings.questionDuration}초
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[3, 5, 10, 15, 20, 30].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            questionDuration: sec,
                          })
                        }
                        className={`flex-1 py-1 text-xs rounded-md font-semibold transition-colors ${
                          settings.questionDuration === sec
                            ? "bg-blue-600 text-white"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center space-x-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoRevealAnswer}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          autoRevealAnswer: e.target.checked,
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      설정 시간 후 자동으로 답변 공개
                    </span>
                  </label>
                </div>

                {/* Answer Duration */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">답변 표시 시간</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {settings.answerDuration}초
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {[3, 4, 5, 10, 15, 20].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            answerDuration: sec,
                          })
                        }
                        className={`flex-1 py-1 text-xs rounded-md font-semibold transition-colors ${
                          settings.answerDuration === sec
                            ? "bg-indigo-600 text-white"
                            : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                  <label className="flex items-center space-x-2 mt-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoAdvance}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          autoAdvance: e.target.checked,
                        })
                      }
                      className="rounded-sm border-slate-300 text-indigo-600"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      답변 확인 후 자동으로 다음 카드로 넘어가기
                    </span>
                  </label>
                </div>
              </div>

              {/* 3. Sound Effects Controls */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    효과음 설정
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          soundEnabled: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {settings.soundEnabled && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                        효과음 종류
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "bell", label: "가벼운 종소리" },
                          { id: "chime", label: "타이머 종료음" },
                          { id: "alert", label: "짧은 알림음" },
                          { id: "click", label: "부드러운 클릭" },
                        ].map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              onUpdateSettings({
                                ...settings,
                                soundType: s.id as SoundType,
                              });
                              soundManager.playSoundByType(s.id as SoundType);
                            }}
                            className={`py-1.5 px-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                              settings.soundType === s.id
                                ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                                : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        <span>볼륨 조절</span>
                        <span>{Math.round(settings.soundVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={settings.soundVolume}
                          onChange={(e) => {
                            const vol = parseFloat(e.target.value);
                            onUpdateSettings({
                              ...settings,
                              soundVolume: vol,
                            });
                          }}
                          className="w-full accent-blue-600"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            soundManager.playSoundByType(settings.soundType)
                          }
                          className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md shrink-0"
                        >
                          미리듣기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Display Mode & Font Size */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  표시 및 글자 크기
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, displayMode: "flip" })
                    }
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors ${
                      settings.displayMode === "flip"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    질문 후 답변 공개
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({ ...settings, displayMode: "both" })
                    }
                    className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-colors ${
                      settings.displayMode === "both"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    질문과 답변 함께 보기
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  {(
                    [
                      { id: "normal", label: "보통 글자" },
                      { id: "large", label: "큰 글자 (권장)" },
                      { id: "xlarge", label: "아주 큰 글자" },
                    ] as const
                  ).map((sz) => (
                    <button
                      key={sz.id}
                      type="button"
                      onClick={() =>
                        onUpdateSettings({ ...settings, fontSize: sz.id })
                      }
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg border text-center transition-colors ${
                        settings.fontSize === sz.id
                          ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>

                {/* Shuffle Cards toggle */}
                <div className="pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.shuffle}
                      onChange={(e) =>
                        onUpdateSettings({
                          ...settings,
                          shuffle: e.target.checked,
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center">
                      <Shuffle className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      카드 무작위 섞기 (원본 순서는 보존됨)
                    </span>
                  </label>
                </div>
              </div>

              {/* 5. Custom Background & Border Override */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center">
                  <Palette className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  전체 카드 배경색 &amp; 테두리 스타일
                </label>

                {/* Background Swatches */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    바탕화면색 (배경)
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BG_COLOR_OPTIONS.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, globalBg: bg.id })
                        }
                        className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          (settings.globalBg || "default") === bg.id
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/60 font-bold ring-1 ring-blue-500"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-3 h-3 rounded-full border border-slate-300 shrink-0 ${bg.previewBg}`}
                        />
                        <span className="truncate">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Border Styles */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-1.5">
                    테두리 스타일
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {BORDER_STYLE_OPTIONS.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, globalBorder: b.id })
                        }
                        className={`p-1.5 rounded-lg border text-xs font-medium text-left transition-all ${
                          (settings.globalBorder || "default") === b.id
                            ? "border-blue-600 bg-blue-50/60 dark:bg-blue-950/60 font-bold ring-1 ring-blue-500"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        <span className="truncate block">{b.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Close Drawer Button */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setShowSettingsDrawer(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                설정 완료 및 수업 계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FIRST-TIME TEACHER KEYBOARD SHORTCUTS ONBOARDING OVERLAY */}
      {showOnboardingOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 p-6 sm:p-8 animate-in fade-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-2">
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  교실 수업 진행 가이드
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center">
                  <Keyboard className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
                  수업 발표 모드 단축키 안내
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  선생님께서 교탁 앞이나 교실을 다니며 무선 프리젠터와 키보드로 매끄럽게 수업을 진행하실 수 있습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDismissOnboarding}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="안내창 닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Shortcut Key Cards (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-5">
              {/* Card 1: Enter / Right Arrow */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs">
                    Enter
                  </kbd>
                  <span className="text-xs text-slate-400">또는</span>
                  <kbd className="px-2 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs">
                    →
                  </kbd>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    정답 공개 &amp; 다음 카드
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    질문이 보일 때 누르면 <strong className="text-blue-600 dark:text-blue-400 font-semibold">정답이 공개</strong>되고, 정답이 공개된 상태에서 다시 누르면 <strong className="text-blue-600 dark:text-blue-400 font-semibold">다음 카드</strong>로 넘어갑니다.
                  </p>
                </div>
              </div>

              {/* Card 2: Left Arrow */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs">
                    ←
                  </kbd>
                  <span className="text-xs text-slate-500 font-medium">왼쪽 방향키</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    이전 카드로 되돌아가기
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    학생들과 앞선 학습 개념을 다시 점검하거나 질문을 재확인하고 싶을 때 즉시 이전 카드로 돌아갑니다.
                  </p>
                </div>
              </div>

              {/* Card 3: Spacebar */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <kbd className="px-3 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs">
                    Spacebar
                  </kbd>
                  <span className="text-xs text-slate-500 font-medium">스페이스바</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    타이머 일시정지 / 재생
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    설정한 초 단위 자동 타이머를 시작하거나, 교사 설명 및 학생 발표가 길어질 때 잠시 정지시킵니다.
                  </p>
                </div>
              </div>

              {/* Card 4: Esc */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
                <div className="flex items-center space-x-2 mb-2">
                  <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg border border-slate-300 dark:border-slate-600 shadow-xs">
                    Esc
                  </kbd>
                  <span className="text-xs text-slate-500 font-medium">이스케이프</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                    전체화면 종료 / 수업 종료
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    프로젝터 전체화면을 해제하거나 카드 편집실 화면으로 안전하게 복귀합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Wireless Presenter Compatibility Notice */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-900/50 flex items-center space-x-3 text-xs mb-5">
              <span className="text-lg">📡</span>
              <div className="text-slate-700 dark:text-slate-300">
                <strong className="text-blue-900 dark:text-blue-300 font-bold">
                  무선 프리젠터(레이저 포인터) 100% 호환:
                </strong>{" "}
                시중의 모든 교실용 무선 프리젠터의 <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-semibold">다음(Next)</code> 및 <code className="bg-white/80 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-semibold">이전(Back)</code> 버튼으로 자유롭게 제어하실 수 있습니다.
              </div>
            </div>

            {/* Footer with "Don't show again" checkbox & Start Teaching CTA */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>다음 수업부터 바로 시작하기 (다시 표시하지 않음)</span>
              </label>

              <button
                type="button"
                onClick={handleDismissOnboarding}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center cursor-pointer"
              >
                <Check className="w-4 h-4 mr-1.5" />
                단축키 확인 완료 • 수업 시작하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
