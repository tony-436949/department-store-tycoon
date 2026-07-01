import type { FacilityConfig, FacilityId, BuffConfig, BuffId, EvolutionStage } from './types';

// ─── 마케팅 데이터 (9종) ─────────────────────────────────────────

export const FACILITIES: Record<FacilityId, FacilityConfig> = {
  'popup-event': {
    id: 'popup-event',
    name: '팝업스토어 행사',
    baseCost: 10,
    cpsIncrease: 1,
    inflationRate: 1.08,
  },
  'coffee-coupon': {
    id: 'coffee-coupon',
    name: '커피쿠폰 발행',
    baseCost: 30,
    cpsIncrease: 2,
    inflationRate: 1.07,
  },
  'discount-voucher': {
    id: 'discount-voucher',
    name: '금액할인권 발송',
    baseCost: 80,
    cpsIncrease: 4,
    inflationRate: 1.07,
  },
  'bargain-sale': {
    id: 'bargain-sale',
    name: '에누리 마케팅',
    baseCost: 200,
    cpsIncrease: 8,
    inflationRate: 1.06,
  },
  'vip-marketing': {
    id: 'vip-marketing',
    name: '우수고객 마케팅',
    baseCost: 500,
    cpsIncrease: 15,
    inflationRate: 1.06,
  },
  'sns-ad': {
    id: 'sns-ad',
    name: 'SNS 광고',
    baseCost: 1_500,
    cpsIncrease: 30,
    inflationRate: 1.05,
  },
  'tv-ad': {
    id: 'tv-ad',
    name: 'TV 광고',
    baseCost: 5_000,
    cpsIncrease: 60,
    inflationRate: 1.05,
  },
  'prize-event': {
    id: 'prize-event',
    name: '경품행사',
    baseCost: 15_000,
    cpsIncrease: 120,
    inflationRate: 1.04,
  },
  'celeb-collab': {
    id: 'celeb-collab',
    name: '셀럽 콜라보',
    baseCost: 50_000,
    cpsIncrease: 250,
    inflationRate: 1.04,
  },
};

// ─── 대규모 투자 프로젝트 (9종) ──────────────────────────────────

export const BUFFS: Record<BuffId, BuffConfig> = {
  'capital-increase': {
    id: 'capital-increase',
    name: '증자',
    cost: 500,
    multiplierType: 'touch',
    multiplier: 2,
  },
  'talent-recruit': {
    id: 'talent-recruit',
    name: '우수인력 채용',
    cost: 2_000,
    multiplierType: 'cps',
    multiplier: 2,
  },
  'pb-brand': {
    id: 'pb-brand',
    name: 'PB브랜드 육성',
    cost: 8_000,
    multiplierType: 'cps',
    multiplier: 2,
  },
  'branch-expand': {
    id: 'branch-expand',
    name: '지점 확장',
    cost: 30_000,
    multiplierType: 'all',
    multiplier: 3,
  },
  'it-upgrade': {
    id: 'it-upgrade',
    name: '전산장비 교체',
    cost: 100_000,
    multiplierType: 'cps',
    multiplier: 3,
  },
  'logistics-center': {
    id: 'logistics-center',
    name: '물류센터 구축',
    cost: 500_000,
    multiplierType: 'all',
    multiplier: 5,
  },
  'global-entry': {
    id: 'global-entry',
    name: '해외 진출',
    cost: 2_000_000,
    multiplierType: 'all',
    multiplier: 5,
  },
  'smart-store': {
    id: 'smart-store',
    name: '스마트스토어 전환',
    cost: 10_000_000,
    multiplierType: 'all',
    multiplier: 10,
  },
  'eco-invest': {
    id: 'eco-invest',
    name: 'ESG 경영 투자',
    cost: 100_000_000,
    multiplierType: 'infinite',
    multiplier: 100,
  },
};

// ─── 진화 단계 데이터 (9단계) ────────────────────────────────────

export const EVOLUTION_STAGES: EvolutionStage[] = [
  { stage: 1, name: '노점', threshold: 0, effect: null },
  { stage: 2, name: '신문가판대', threshold: 500, effect: 'dust-cloud' },
  { stage: 3, name: '세븐일레븐', threshold: 5_000, effect: 'neon-sign' },
  { stage: 4, name: '롯데슈퍼', threshold: 50_000, effect: 'lens-flare' },
  { stage: 5, name: '롯데마트', threshold: 500_000, effect: 'zoom-out' },
  { stage: 6, name: '롯데아울렛', threshold: 5_000_000, effect: 'marble-wipe' },
  { stage: 7, name: '롯데백화점', threshold: 50_000_000, effect: 'panorama' },
  { stage: 8, name: '롯데프리미엄아울렛', threshold: 500_000_000, effect: 'gold-particle' },
  { stage: 9, name: '롯데타운', threshold: 5_000_000_000, effect: 'firework-hologram' },
];

// ─── 게임 설정 상수 ─────────────────────────────────────────────

export const INITIAL_TOUCH_POWER = 1;
export const VIP_SPAWN_MIN_MS = 60_000;
export const VIP_SPAWN_MAX_MS = 120_000;
export const VIP_LIFETIME_MS = 5_000;
export const VIP_REWARD_MULTIPLIER = 100;
export const SAVE_DEBOUNCE_MS = 5_000;
export const STORAGE_KEY = 'department-store-tycoon-save';
