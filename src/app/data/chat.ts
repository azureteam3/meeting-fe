import type { ChatMessage, Language } from "../types";

export const INIT_CHAT: Record<Language, ChatMessage[]> = {
  ko: [{ role: "ai", text: "안녕하세요! AI 어시스턴트입니다. 회의 요약, 번역 지원, 주요 결정사항 정리를 도와드립니다. 무엇이든 물어보세요 😊" }],
  en: [{ role: "ai", text: "Hello! I'm your AI assistant. I can help with meeting summaries, translation support, and organizing key decisions. Ask me anything 😊" }],
  ja: [{ role: "ai", text: "こんにちは！AIアシスタントです。会議の要約、翻訳サポート、重要事項の整理をお手伝いします。何でも聞いてください 😊" }],
  zh: [{ role: "ai", text: "你好！我是AI助手。我可以帮助您进行会议摘要、翻译支持和整理重要决定。请随时提问 😊" }],
};

export const QUICK_Q: Record<Language, string[]> = {
  ko: ["회의 요약해줘", "액션 아이템은?", "이 발언 번역해줘"],
  en: ["Summarize the meeting", "What are the action items?", "Translate this remark"],
  ja: ["会議を要約して", "アクションアイテムは？", "この発言を翻訳して"],
  zh: ["总结会议", "行动项目是什么？", "翻译这段话"],
};

export const AI_ANSWERS: Record<Language, Record<string, string>> = {
  ko: {
    "회의 요약해줘": "📋 **회의 요약 (09:00 ~ 현재)**\n\n• John Miller가 분기 리뷰를 개회했습니다\n• 李伟 — Q3 매출 15% 성장, 목표 초과 달성\n• 田中桜 — SNS 마케팅 전략 강화 제안\n• 김민준 — SNS 예산 20% 증액 검토 지시\n\n⏱ 경과 시간: 9분",
    "액션 아이템은?": "✅ **액션 아이템**\n\n1. SNS 마케팅 예산 20% 증액안 검토\n2. Q4 목표 수립 및 로드맵 작성\n3. 마케팅 전략 발표 자료 준비\n4. 다음 회의 일정 조율",
    "이 발언 번역해줘": "번역이 필요한 발언 텍스트를 붙여넣으시면 한국어로 번역해드립니다.",
  },
  en: {
    "Summarize the meeting": "📋 **Meeting Summary (09:00 ~ Now)**\n\n• John Miller opened the quarterly review\n• Li Wei — Q3 sales up 15%, exceeded targets\n• Tanaka Sakura — proposed stronger social media strategy\n• Kim Minjun — directed review of 20% budget increase\n\n⏱ Elapsed: 9 minutes",
    "What are the action items?": "✅ **Action Items**\n\n1. Review 20% social media budget increase\n2. Set Q4 targets and draft roadmap\n3. Prepare marketing strategy presentation\n4. Schedule follow-up meeting",
    "Translate this remark": "Paste the text you'd like translated and I'll convert it to English for you.",
  },
  ja: {
    "会議を要約して": "📋 **会議要約 (09:00 ~ 現在)**\n\n• John Millerが四半期レビューを開会\n• 李伟 — Q3売上15%増、目標超達成\n• 田中桜 — SNSマーケティング強化を提案\n• 김민준 — 予算20%増の検討を指示\n\n⏱ 経過時間: 9分",
    "アクションアイテムは？": "✅ **アクションアイテム**\n\n1. SNSマーケティング予算20%増の検討\n2. Q4目標設定とロードマップ作成\n3. マーケティング戦略プレゼン資料の準備\n4. 次回会議の日程調整",
    "この発言を翻訳して": "翻訳したいテキストを貼り付けていただければ、日本語に翻訳します。",
  },
  zh: {
    "总结会议": "📋 **会议摘要 (09:00 ~ 现在)**\n\n• John Miller主持了季度审查\n• 李伟 — Q3销售额增长15%，超出目标\n• 田中桜 — 提议加强社交媒体营销策略\n• 김민준 — 指示审查增加20%预算\n\n⏱ 已过时间：9分钟",
    "行动项目是什么？": "✅ **行动项目**\n\n1. 审查社交媒体营销预算增加20%\n2. 制定Q4目标和路线图\n3. 准备营销策略演示材料\n4. 安排后续会议时间",
    "翻译这段话": "请粘贴您想翻译的文本，我将为您翻译成中文。",
  },
};
