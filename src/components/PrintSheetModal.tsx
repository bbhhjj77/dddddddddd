import React, { useState } from "react";
import { Printer, X, LayoutList, Grid } from "lucide-react";
import { FlashcardSet } from "../types";

interface PrintSheetModalProps {
  currentSet: FlashcardSet;
  onClose: () => void;
}

export const PrintSheetModal: React.FC<PrintSheetModalProps> = ({
  currentSet,
  onClose,
}) => {
  const [printLayout, setPrintLayout] = useState<"table" | "cards">("table");

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-content-root, #print-content-root * {
            visibility: visible;
          }
          #print-content-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Toolbar (hidden during print) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                수업용 카드 인쇄 및 학습지 출력
              </h2>
              <p className="text-xs text-slate-500">
                학생 배포용 복습 유인물이나 손으로 오려서 넘겨보는 단어장 형태로 인쇄합니다.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Layout switch */}
            <div className="flex items-center border border-slate-200 p-0.5 rounded-lg bg-slate-50 text-xs">
              <button
                type="button"
                onClick={() => setPrintLayout("table")}
                className={`px-2.5 py-1 font-semibold rounded-md flex items-center transition-colors ${
                  printLayout === "table"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5 mr-1" />
                학습 정리표 (표)
              </button>
              <button
                type="button"
                onClick={() => setPrintLayout("cards")}
                className={`px-2.5 py-1 font-semibold rounded-md flex items-center transition-colors ${
                  printLayout === "cards"
                    ? "bg-white text-blue-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Grid className="w-3.5 h-3.5 mr-1" />
                오리기용 카드
              </button>
            </div>

            <button
              type="button"
              onClick={handleTriggerPrint}
              className="inline-flex items-center px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              인쇄하기 (Ctrl+P)
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

        {/* Printable Paper Preview Body */}
        <div className="p-8 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            id="print-content-root"
            className="w-full max-w-[210mm] min-h-[297mm] bg-white p-8 sm:p-12 shadow-md border border-slate-200 rounded-lg text-black font-sans"
          >
            {/* Print Header */}
            <div className="border-b-2 border-black pb-4 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>
                  {currentSet.grade} {currentSet.subject}
                </span>
                <span>ClassFlip 학습자료</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-black">
                {currentSet.title}
              </h1>
              <div className="flex justify-between items-center text-xs text-slate-600 mt-2">
                <span>
                  총 {currentSet.cards.length}문항 | 일자: ____________________
                </span>
                <span>
                  학년 / 반: ________ / 이름: ____________________
                </span>
              </div>
            </div>

            {/* Layout 1: Table format */}
            {printLayout === "table" ? (
              <table className="w-full border-collapse border border-black text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-black text-black">
                    <th className="border border-black p-2.5 w-10 text-center">#</th>
                    <th className="border border-black p-2.5 text-left w-1/2">
                      질문 (핵심 개념 및 탐구)
                    </th>
                    <th className="border border-black p-2.5 text-left w-1/2">
                      답변 및 풀이
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentSet.cards.map((c, i) => (
                    <tr key={c.id} className="border-b border-slate-300">
                      <td className="border border-black p-2.5 text-center font-bold">
                        {i + 1}
                      </td>
                      <td className="border border-black p-2.5 align-top font-semibold text-slate-900 leading-relaxed">
                        {c.question}
                        {c.topic && (
                          <div className="text-[10px] text-slate-500 mt-1">
                            [{c.topic}]
                          </div>
                        )}
                      </td>
                      <td className="border border-black p-2.5 align-top text-slate-800 leading-relaxed">
                        {c.answer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              /* Layout 2: Printable Flashcard Grid */
              <div className="grid grid-cols-2 gap-4">
                {currentSet.cards.map((c, i) => (
                  <div
                    key={c.id}
                    className="border-2 border-dashed border-slate-400 p-4 rounded-lg flex flex-col justify-between min-h-[140px] text-xs"
                  >
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500 pb-1 mb-2 border-b border-slate-200">
                        <span className="font-bold">카드 #{i + 1}</span>
                        <span>{c.topic}</span>
                      </div>
                      <p className="font-bold text-sm text-black mb-3">
                        {c.question}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-slate-700 bg-slate-50 p-2 rounded-sm">
                      <span className="font-bold text-[10px] text-blue-700 block mb-0.5">
                        [정답]
                      </span>
                      {c.answer}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Print Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
              ClassFlip - 중학교 수업용 AI 플래시카드 제작 웹앱
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
