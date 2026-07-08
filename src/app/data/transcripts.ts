import type { Language, TranscriptEntry } from "../types";

export const TRANSCRIPTS: TranscriptEntry[] = [
  {
    id: "t1", speakerIdx: 1, ts: "09:01",
    original: "Good morning everyone. Let's start with our quarterly business review.",
    translations: {
      ko: "안녕하세요 여러분. 분기 비즈니스 리뷰를 시작하겠습니다.",
      en: "Good morning everyone. Let's start with our quarterly business review.",
      ja: "皆さん、おはようございます。四半期ビジネスレビューを始めましょう。",
      zh: "大家早上好。我们开始季度业务审查吧。",
    },
  },
  {
    id: "t2", speakerIdx: 2, ts: "09:03",
    original: "我们的销售数据显示第三季度增长了15%，已超出预期目标。",
    translations: {
      ko: "3분기 판매 데이터가 15% 성장하여 목표를 초과 달성했습니다.",
      en: "Our Q3 sales data shows 15% growth, exceeding our projected target.",
      ja: "Q3の販売データは15%成長を示しており、目標を超えました。",
      zh: "我们的销售数据显示第三季度增长了15%，已超出预期目标。",
    },
  },
  {
    id: "t3", speakerIdx: 3, ts: "09:06",
    original: "新しいマーケティング戦略について提案があります。SNSをより積極的に活用すべきです。",
    translations: {
      ko: "새로운 마케팅 전략을 제안합니다. SNS를 더욱 적극적으로 활용해야 합니다.",
      en: "I have a proposal for our new marketing strategy. We should leverage social media more actively.",
      ja: "新しいマーケティング戦略について提案があります。SNSをより積極的に活用すべきです。",
      zh: "我有新营销策略的建议。我们应该更积极地利用社交媒体。",
    },
  },
  {
    id: "t4", speakerIdx: 0, ts: "09:09",
    original: "좋은 제안입니다. SNS 마케팅 예산을 20% 늘리는 방향으로 검토해보겠습니다.",
    translations: {
      ko: "좋은 제안입니다. SNS 마케팅 예산을 20% 늘리는 방향으로 검토해보겠습니다.",
      en: "Great proposal. Let's review increasing our social media marketing budget by 20%.",
      ja: "良い提案です。SNSマーケティング予算を20%増やす方向で検討しましょう。",
      zh: "好建议。我们来研究将社交媒体营销预算增加20%的方案。",
    },
  },
];

export const CAPTIONS: Record<Language, string[]> = {
  ko: [
    "안녕하세요 여러분. 분기 비즈니스 리뷰를 시작하겠습니다.",
    "3분기 판매 데이터가 15% 성장하여 목표를 초과 달성했습니다.",
    "새로운 마케팅 전략을 제안합니다. SNS를 더욱 적극적으로 활용해야 합니다.",
    "SNS 마케팅 예산을 20% 늘리는 방향으로 검토해보겠습니다.",
    "다음 분기 목표 설정에 대해서도 논의가 필요합니다.",
  ],
  en: [
    "Good morning everyone. Let's start with our quarterly business review.",
    "Our Q3 sales data shows 15% growth, exceeding our projected target.",
    "I have a proposal — we should leverage social media more actively.",
    "Let's review increasing our social media marketing budget by 20%.",
    "We should also discuss setting our targets for next quarter.",
  ],
  ja: [
    "皆さん、おはようございます。四半期ビジネスレビューを始めましょう。",
    "Q3の販売データは15%成長を示しており、目標を超えました。",
    "SNSをより積極的に活用するマーケティング戦略を提案します。",
    "SNSマーケティング予算を20%増やす方向で検討しましょう。",
    "来四半期の目標設定についても議論が必要です。",
  ],
  zh: [
    "大家早上好。我们开始季度业务审查吧。",
    "Q3销售数据增长15%，超出目标。",
    "我建议更积极地利用社交媒体开展营销活动。",
    "我们来研究将社交媒体营销预算增加20%的方案。",
    "我们还需要讨论制定下季度的目标。",
  ],
};

export const ACTIVE_SPEAKERS = [1, 2, 3, 0, 1, 2];
