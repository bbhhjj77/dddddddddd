import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export interface GenerateCardsRequest {
  text?: string;
  pdfBase64?: string;
  pdfMimeType?: string;
  subject?: string;
  grade?: string;
  cardCount?: number;
  difficulty?: "easy" | "medium" | "hard" | "mixed";
  questionType?:
    | "definition"
    | "concept"
    | "cause_effect"
    | "process"
    | "comparison"
    | "application"
    | "mixed";
  cardFormat?: "short" | "multiple_choice" | "vocab" | "mixed";
  answerLength?: "short" | "medium" | "detailed";
  focusCore?: boolean;
  pageRange?: string;
  existingQuestions?: string[];
}

export interface GeneratedCard {
  question: string;
  answer: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  type:
    | "definition"
    | "concept"
    | "cause_effect"
    | "process"
    | "comparison"
    | "application";
  cardFormat: "short" | "multiple_choice" | "vocab";
  options?: string[];
  correctOptionIndex?: number;
  explanation?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  sourcePage?: number | null;
  needsReview?: boolean;
}

export interface GenerateCardsResponse {
  title: string;
  summary: string;
  cards: GeneratedCard[];
}

export async function generateFlashcards(
  req: GenerateCardsRequest
): Promise<GenerateCardsResponse> {
  const {
    text,
    pdfBase64,
    pdfMimeType = "application/pdf",
    subject = "기타",
    grade = "중학교 2학년",
    cardCount = 10,
    difficulty = "mixed",
    questionType = "mixed",
    cardFormat = "mixed",
    answerLength = "short",
    focusCore = true,
    pageRange,
    existingQuestions = [],
  } = req;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY가 서버 환경 변수에 설정되어 있지 않습니다. AI Studio의 Settings > Secrets 패널을 확인하세요."
    );
  }

  if (!text && !pdfBase64) {
    throw new Error("분석할 텍스트 또는 PDF 자료를 입력해주세요.");
  }

  const lengthInstructions = {
    short: "답변은 핵심만 1~2문장으로 간결하고 명확하게 작성할 것.",
    medium: "답변은 핵심 원리와 중요 부연을 포함해 2~3문장으로 작성할 것.",
    detailed: "답변은 원인, 결과, 세부 조건 및 예시를 포함하여 상세하게 작성할 것.",
  }[answerLength];

  const difficultyInstruction =
    difficulty === "mixed"
      ? "쉬움(기초 어휘/단순 사실), 보통(개념 이해/설명), 어려움(심화 원리/적용)을 골고루 분배할 것."
      : `모든 카드의 난이도를 '${difficulty}'(으)로 맞출 것.`;

  const typeInstruction =
    questionType === "mixed"
      ? "용어 정의(definition), 핵심 개념(concept), 원인과 결과(cause_effect), 과정 설명(process), 비교·분류(comparison), 적용 및 추론(application) 유형을 적절히 혼합할 것."
      : `질문 유형을 '${questionType}' 중심으로 집중 제작할 것.`;

  const formatInstruction = {
    short: "모든 카드를 핵심 용어, 공식, 짧은 단답을 묻는 '단답형(short)'으로 제작할 것.",
    multiple_choice: "모든 카드를 4가지 보기(options) 중 1개의 정답을 고르는 '객관식(multiple_choice)'으로 제작할 것. 반드시 4개의 선지와 correctOptionIndex(0~3)를 포함할 것.",
    vocab: "모든 카드를 핵심 용어/어휘를 집중 학습하는 '단어카드(vocab)'로 제작할 것. 발음/한자음(pronunciation), 품사/분류(partOfSpeech), 예문(exampleSentence), 해석(exampleTranslation)을 반드시 포함할 것.",
    mixed: "단답형(short), 객관식(multiple_choice, 4지선다), 단어카드(vocab) 3가지 형식을 골고루 조화롭게 혼합하여 제작할 것.",
  }[cardFormat];

  const existingQuestionsNotice =
    existingQuestions && existingQuestions.length > 0
      ? `\n[기존 질문 목록 - 절대 중복 생성 금지]:\n${existingQuestions.slice(-15).map((q) => `- ${q}`).join("\n")}`
      : "";

  const pageRangeNotice = pageRange?.trim()
    ? `\n[분석 페이지 범위]: 제공된 자료 중 '${pageRange}' 페이지만 집중 분석할 것.`
    : "";

  const systemInstruction = `당신은 대한민국 중학교 교육과정에 정통한 수석 교사이자 교수학습자료 설계 전문가입니다.
제공된 교육 자료를 분석하여, 중학교 교실 프로젝터 수업에서 활용할 3가지 형식의 플래시카드를 제작합니다.

[3가지 카드 형식 가이드라인]
1. 단답형 (short): 질문은 명확하고 직관적이어야 하며, 정답(answer)은 서술형 문장이 아닌 단일 명사나 핵심 단어/용어 형태(예: '훈민정음', '엽록체', '녹말', '측우기')로 반드시 간결한 단어 형태로만 작성하십시오. 부가 설명이나 배경 지식은 반드시 'explanation' 필드에 넣고 'answer'에는 오직 정답 단어만을 작성할 것.
2. 객관식 (multiple_choice): 질문과 함께 반드시 정확히 4개의 보기(options)를 제공합니다. 오답 선지도 그럴듯하게 구성하고 correctOptionIndex(0, 1, 2, 3)를 정확히 지정합니다.
3. 단어카드 (vocab): 핵심 학술 용어나 필수 단어를 집중 암기할 수 있도록 질문에는 '단어/용어명', 답변에는 '명확한 뜻풀이'를 넣고 pronunciation(발음/한자음), partOfSpeech(품사/분류), exampleSentence(실제 교과서 용례 문장), exampleTranslation(해석)을 풍부하게 채워줍니다.

[엄격한 생성 준수 규칙]
1. 반드시 사용자가 제공한 자료의 사실에 근거하십시오. 자료에 없는 가상의 사실을 임의로 지어내지 마십시오.
2. 중학생(만 13~15세)의 언어 발달 수준과 교육과정 어휘에 맞는 자연스럽고 정확한 한국어로 작성하십시오.
3. [질문 길이 엄격 제한 - 절대 세 줄 이상 길어지지 않도록 작성]:
   - 질문(question)은 프로젝터 화면에서 학생들이 한눈에 읽을 수 있도록 반드시 공백 포함 60자 이내(최대 70자 이내, 1~2줄, 절대 3줄 이상 초과 금지)로 간결하고 명확하게 작성할 것.
   - 3줄 이상 길어지는 장황한 지문형 질문이나 복합 문장은 절대 생성하지 마십시오. 핵심만 간결하게 물어보아야 합니다.
4. 카드 1개당 반드시 1개의 명확한 학습 목표를 담고, 정답이 모호하거나 논란이 될 수 있는 주관적 질문은 피하십시오.
5. 요청된 카드 개수(${cardCount}개)를 정확히 생성하십시오.`;

  const userPrompt = `[수업 정보 및 생성 조건]
- 과목: ${subject}
- 대상 학년: ${grade}
- 요청 카드 개수: ${cardCount}개
- 질문 형식 기준: ${formatInstruction}
- 질문 길이 제한: 모든 질문은 절대 3줄(70자)을 넘지 않도록 간결하고 명확하게 1~2줄(60자 이내)로 핵심만 작성할 것.
- 난이도 기준: ${difficultyInstruction}
- 질문 내용 유형: ${typeInstruction}
- 답변 길이 기준: ${lengthInstructions}
- 핵심 개념 집중: ${focusCore ? "시험에 자주 나오는 단원 핵심 개념 위주로 선별" : "자료의 전반적인 세부 내용까지 폭넓게 포함"}
${pageRangeNotice}
${existingQuestionsNotice}

자료를 분석하여 중학교 수업 현장에서 프로젝터에 띄우고 즉시 활용할 수 있는 플래시카드 세트를 JSON 규격에 맞추어 생성해주세요.`;

  // Content parts
  const contentsParts: any[] = [];

  if (pdfBase64) {
    contentsParts.push({
      inlineData: {
        mimeType: pdfMimeType,
        data: pdfBase64,
      },
    });
  }

  if (text) {
    contentsParts.push({
      text: `[제공된 교육 자료 본문]\n${text}`,
    });
  }

  contentsParts.push({
    text: userPrompt,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: {
      parts: contentsParts,
    },
    config: {
      systemInstruction,
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "자료에 어울리는 명확한 플래시카드 세트 제목 (예: [중2 과학] 광합성과 호흡)",
          },
          summary: {
            type: Type.STRING,
            description: "단원 핵심 학습 내용 요약 (1~2문장)",
          },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: {
                  type: Type.STRING,
                  description:
                    "중학생 눈높이의 명확한 질문 (절대 3줄 이상 길어지지 않는 1~2줄, 최대 60~70자 이내의 간결한 질문; 단어카드는 표제어 단어)",
                },
                answer: {
                  type: Type.STRING,
                  description: "질문에 직접 대응하는 정답 또는 단어 뜻풀이",
                },
                topic: {
                  type: Type.STRING,
                  description: "핵심 소단원 또는 개념어",
                },
                difficulty: {
                  type: Type.STRING,
                  enum: ["easy", "medium", "hard"],
                },
                type: {
                  type: Type.STRING,
                  enum: [
                    "definition",
                    "concept",
                    "cause_effect",
                    "process",
                    "comparison",
                    "application",
                  ],
                },
                cardFormat: {
                  type: Type.STRING,
                  enum: ["short", "multiple_choice", "vocab"],
                  description: "카드 형식: short(단답형), multiple_choice(객관식), vocab(단어카드)",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "객관식 전용: 4개의 보기 선지",
                },
                correctOptionIndex: {
                  type: Type.INTEGER,
                  description: "객관식 전용: 정답 선지 번호 (0, 1, 2, 3)",
                },
                explanation: {
                  type: Type.STRING,
                  description: "선택형 또는 서술형 보충 해설",
                },
                pronunciation: {
                  type: Type.STRING,
                  description: "단어카드 전용: 발음 기호, 한자음, 또는 음독",
                },
                partOfSpeech: {
                  type: Type.STRING,
                  description: "단어카드 전용: 품사 또는 용어 분류 (예: 명사, 생명과학)",
                },
                exampleSentence: {
                  type: Type.STRING,
                  description: "단어카드 전용: 교과서 예문 또는 용례 문장",
                },
                exampleTranslation: {
                  type: Type.STRING,
                  description: "단어카드 전용: 예문 해석",
                },
                sourcePage: {
                  type: Type.INTEGER,
                  description: "원문 페이지 번호 (확인 불가시 0)",
                },
                needsReview: {
                  type: Type.BOOLEAN,
                  description: "근거 부족 또는 교사 추가 확인 필요 여부",
                },
              },
              required: ["question", "answer", "difficulty", "type", "cardFormat"],
            },
          },
        },
        required: ["cards"],
      },
    },
  });

  const rawText = response.text;
  if (!rawText) {
    throw new Error("Gemini 모델로부터 응답을 받지 못했습니다. 다시 시도해주세요.");
  }

  try {
    const parsed = JSON.parse(rawText) as GenerateCardsResponse;
    if (!parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("카드 생성 응답 형식이 올바르지 않습니다.");
    }

    parsed.cards = parsed.cards.map((c, idx) => {
      const format = ["short", "multiple_choice", "vocab"].includes(
        c.cardFormat
      )
        ? c.cardFormat
        : "short";

      let options = c.options;
      let correctOptionIndex = c.correctOptionIndex;

      // Ensure 4 options if multiple_choice
      if (format === "multiple_choice") {
        if (!options || !Array.isArray(options) || options.length < 4) {
          options = [
            c.answer,
            "오답 보기 1",
            "오답 보기 2",
            "오답 보기 3",
          ];
          correctOptionIndex = 0;
        } else {
          options = options.slice(0, 4);
          if (typeof correctOptionIndex !== "number" || correctOptionIndex < 0 || correctOptionIndex > 3) {
            correctOptionIndex = 0;
          }
        }
      }

      return {
        question: c.question?.trim() || `질문 ${idx + 1}`,
        answer: c.answer?.trim() || "답변을 입력하세요.",
        topic: c.topic?.trim() || subject,
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
        cardFormat: format,
        options,
        correctOptionIndex,
        explanation: c.explanation?.trim() || undefined,
        pronunciation: c.pronunciation?.trim() || undefined,
        partOfSpeech: c.partOfSpeech?.trim() || undefined,
        exampleSentence: c.exampleSentence?.trim() || undefined,
        exampleTranslation: c.exampleTranslation?.trim() || undefined,
        sourcePage: typeof c.sourcePage === "number" && c.sourcePage > 0 ? c.sourcePage : null,
        needsReview: Boolean(c.needsReview),
      };
    });

    if (!parsed.title) {
      parsed.title = `[${grade} ${subject}] 플래시카드 세트`;
    }

    return parsed;
  } catch (err: any) {
    console.error("JSON 파싱 오류:", err, "Raw output:", rawText);
    throw new Error(`AI 응답 데이터 처리 중 오류가 발생했습니다: ${err.message}`);
  }
}
