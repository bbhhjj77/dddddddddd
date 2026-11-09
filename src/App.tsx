import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "./components/Header";
import { MaterialInputTab } from "./components/MaterialInputTab";
import { CardEditorTab } from "./components/CardEditorTab";
import { PresentationMode } from "./components/PresentationMode";
import { SavedSetsModal } from "./components/SavedSetsModal";
import { PrintSheetModal } from "./components/PrintSheetModal";
import { Flashcard, FlashcardSet, PresentationSettings } from "./types";
import {
  loadCurrentSet,
  loadSavedSets,
  loadSettings,
  parseImportedJson,
  saveCurrentSet,
  saveSavedSets,
  saveSettings,
} from "./utils/storage";

export default function App() {
  const [currentSet, setCurrentSet] = useState<FlashcardSet>(loadCurrentSet);
  const [savedSets, setSavedSets] = useState<FlashcardSet[]>(loadSavedSets);
  const [settings, setSettings] = useState<PresentationSettings>(loadSettings);

  const [activeTab, setActiveTab] = useState<"input" | "editor" | "presentation">(
    "input"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Modals
  const [showSavedSetsModal, setShowSavedSetsModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Hidden JSON Import File Input
  const jsonInputRef = useRef<HTMLInputElement>(null);

  // Auto-save debounced
  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      saveCurrentSet(currentSet);
      setIsSaving(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [currentSet]);

  // Save settings when changed
  const handleUpdateSettings = useCallback((newSettings: PresentationSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  }, []);

  // Update title
  const handleUpdateTitle = useCallback((newTitle: string) => {
    setCurrentSet((prev) => ({ ...prev, title: newTitle }));
  }, []);

  // Create brand new set
  const handleNewSet = useCallback(() => {
    const newDeck: FlashcardSet = {
      id: `set-${Date.now()}`,
      title: "새 플래시카드 세트",
      description: "중학교 수업용 플래시카드",
      subject: "과학",
      grade: "중학교 2학년",
      cards: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentSet(newDeck);
    const updated = [newDeck, ...savedSets];
    setSavedSets(updated);
    saveSavedSets(updated);
    setActiveTab("input");
  }, [savedSets]);

  // Select an existing set
  const handleSelectSet = useCallback((set: FlashcardSet) => {
    setCurrentSet(set);
    saveCurrentSet(set);
  }, []);

  // Delete a saved set
  const handleDeleteSet = useCallback(
    (id: string) => {
      const remaining = savedSets.filter((s) => s.id !== id);
      setSavedSets(remaining);
      saveSavedSets(remaining);

      if (currentSet.id === id) {
        if (remaining.length > 0) {
          setCurrentSet(remaining[0]);
          saveCurrentSet(remaining[0]);
        } else {
          handleNewSet();
        }
      }
    },
    [savedSets, currentSet.id, handleNewSet]
  );

  // Duplicate a set
  const handleDuplicateSet = useCallback(
    (set: FlashcardSet) => {
      const dup: FlashcardSet = {
        ...set,
        id: `set-dup-${Date.now()}`,
        title: `${set.title} (복사본)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updated = [dup, ...savedSets];
      setSavedSets(updated);
      saveSavedSets(updated);
    },
    [savedSets]
  );

  // Rename a set
  const handleRenameSet = useCallback(
    (id: string, newTitle: string) => {
      const updated = savedSets.map((s) =>
        s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s
      );
      setSavedSets(updated);
      saveSavedSets(updated);

      if (currentSet.id === id) {
        setCurrentSet((prev) => ({ ...prev, title: newTitle }));
      }
    },
    [savedSets, currentSet.id]
  );

  // Add cards (append or replace)
  const handleAddCards = useCallback(
    (newCards: Flashcard[], append: boolean = true, recommendedTitle?: string) => {
      setCurrentSet((prev) => {
        const nextCards = append ? [...prev.cards, ...newCards] : newCards;
        const nextTitle =
          recommendedTitle && (!prev.title || prev.title.includes("새 플래시카드"))
            ? recommendedTitle
            : prev.title;

        const updated = {
          ...prev,
          title: nextTitle,
          cards: nextCards,
          updatedAt: Date.now(),
        };
        saveCurrentSet(updated);
        return updated;
      });
      // Automatically refresh saved sets
      setSavedSets(loadSavedSets());
    },
    []
  );

  // Update cards in editor
  const handleUpdateCards = useCallback((cards: Flashcard[]) => {
    setCurrentSet((prev) => ({
      ...prev,
      cards,
      updatedAt: Date.now(),
    }));
  }, []);

  // JSON Import handler
  const handleJsonFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = reader.result as string;
        const importedSet = parseImportedJson(content);
        setCurrentSet(importedSet);
        saveCurrentSet(importedSet);
        const updated = [importedSet, ...savedSets];
        setSavedSets(updated);
        saveSavedSets(updated);
        setActiveTab("editor");
        alert(
          `'${importedSet.title}' 세트(${importedSet.cards.length}장)를 성공적으로 불러왔습니다.`
        );
      } catch (err: any) {
        alert(
          `JSON 파일을 불러오는 중 오류가 발생했습니다: ${err.message || err}`
        );
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={jsonInputRef}
        accept=".json"
        onChange={handleJsonFileSelected}
        className="hidden"
      />

      {/* When in presentation mode, show presentation view full screen */}
      {activeTab === "presentation" ? (
        <PresentationMode
          currentSet={currentSet}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onExit={() => setActiveTab("editor")}
        />
      ) : (
        <>
          {/* Header */}
          <Header
            currentSet={currentSet}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isSaving={isSaving}
            onUpdateTitle={handleUpdateTitle}
            onNewSet={handleNewSet}
            onOpenSavedSets={() => setShowSavedSetsModal(true)}
            onOpenPrintModal={() => setShowPrintModal(true)}
            onImportClick={() => jsonInputRef.current?.click()}
          />

          {/* Tab Workspaces */}
          <main className="flex-1">
            {activeTab === "input" && (
              <MaterialInputTab
                currentSet={currentSet}
                onAddCards={handleAddCards}
                onGoToEditor={() => setActiveTab("editor")}
              />
            )}

            {activeTab === "editor" && (
              <CardEditorTab
                currentSet={currentSet}
                onUpdateCards={handleUpdateCards}
                onAddMoreWithAi={() => setActiveTab("input")}
                onGoToPresentation={() => setActiveTab("presentation")}
              />
            )}
          </main>
        </>
      )}

      {/* Saved Sets Modal */}
      {showSavedSetsModal && (
        <SavedSetsModal
          currentSetId={currentSet.id}
          savedSets={savedSets}
          onSelectSet={handleSelectSet}
          onNewSet={handleNewSet}
          onDeleteSet={handleDeleteSet}
          onDuplicateSet={handleDuplicateSet}
          onRenameSet={handleRenameSet}
          onClose={() => setShowSavedSetsModal(false)}
        />
      )}

      {/* Print Sheet Modal */}
      {showPrintModal && (
        <PrintSheetModal
          currentSet={currentSet}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
