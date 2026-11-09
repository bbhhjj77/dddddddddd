import express from "express";
import { generateFlashcards, GenerateCardsRequest } from "./geminiService.ts";

export const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

apiRouter.post("/generate-cards", async (req, res) => {
  try {
    const body: GenerateCardsRequest = req.body;

    if (!body) {
      return res.status(400).json({
        success: false,
        error: "요청 본문(Body) 데이터가 비어 있습니다.",
      });
    }

    if (!body.text && !body.pdfBase64) {
      return res.status(400).json({
        success: false,
        error: "분석할 텍스트 자료를 입력하거나 PDF 파일을 업로드해주세요.",
      });
    }

    const result = await generateFlashcards(body);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("카드 생성 API 에러:", error);
    const errorMessage =
      error?.message ||
      "AI 플래시카드 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    return res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});
