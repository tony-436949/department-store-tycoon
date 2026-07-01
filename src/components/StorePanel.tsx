import { useState } from 'react';
import type { GameState, FacilityId, BuffId } from '../types';
import { FACILITIES, BUFFS } from '../constants';
import { formatKoreanNumber, calculateFacilityCost } from '../utils';

interface StorePanelProps {
  stateRef: React.MutableRefObject<GameState>;
  purchaseFacility: (facilityId: FacilityId) => boolean;
  purchaseBuff: (buffId: BuffId) => boolean;
}

type TabType = 'facility' | 'buff';

const FACILITY_IDS: FacilityId[] = [
  'popup-event', 'coffee-coupon', 'discount-voucher', 'bargain-sale',
  'vip-marketing', 'sns-ad', 'tv-ad', 'prize-event', 'celeb-collab',
];
const BUFF_IDS: BuffId[] = [
  'capital-increase', 'talent-recruit', 'pb-brand', 'branch-expand',
  'it-upgrade', 'logistics-center', 'global-entry', 'smart-store', 'eco-invest',
];

/** 마케팅별 아이콘 */
const FACILITY_ICONS: Record<FacilityId, string> = {
  'popup-event': '🎪',
  'coffee-coupon': '☕',
  'discount-voucher': '🎟️',
  'bargain-sale': '🏷️',
  'vip-marketing': '💳',
  'sns-ad': '📱',
  'tv-ad': '📺',
  'prize-event': '🎰',
  'celeb-collab': '⭐',
};

/** 투자 프로젝트별 아이콘 */
const BUFF_ICONS: Record<BuffId, string> = {
  'capital-increase': '💰',
  'talent-recruit': '👔',
  'pb-brand': '🏷️',
  'branch-expand': '🏗️',
  'it-upgrade': '💻',
  'logistics-center': '🚛',
  'global-entry': '🌍',
  'smart-store': '🤖',
  'eco-invest': '🌱',
};

/** 투자 프로젝트 효과 설명 */
const BUFF_DESCRIPTIONS: Record<BuffId, string> = {
  'capital-increase': '터치 ×2',
  'talent-recruit': 'CPS ×2',
  'pb-brand': 'CPS ×2',
  'branch-expand': '전체 ×3',
  'it-upgrade': 'CPS ×3',
  'logistics-center': '전체 ×5',
  'global-entry': '전체 ×5',
  'smart-store': '전체 ×10',
  'eco-invest': '전체 ×100',
};

/**
 * StorePanel - 트렌디한 그리드 카드 형태 상점
 * 가로로 아이콘 카드를 나열, 클릭 가능 시 색상 활성화, 불가 시 음영 처리
 */
export function StorePanel({ stateRef, purchaseFacility, purchaseBuff }: StorePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('facility');
  const [, setUpdateCounter] = useState(0);
  const forceUpdate = () => setUpdateCounter((c) => c + 1);

  const state = stateRef.current;

  const handleFacilityPurchase = (id: FacilityId) => {
    if (purchaseFacility(id)) forceUpdate();
  };

  const handleBuffPurchase = (id: BuffId) => {
    if (purchaseBuff(id)) forceUpdate();
  };

  return (
    <div className="h-full flex flex-col">
      {/* 탭 전환 */}
      <div className="flex gap-2 mb-3 flex-shrink-0">
        <button
          onClick={() => setActiveTab('facility')}
          className={`flex-1 py-2.5 text-base font-bold rounded-xl border-2 transition-all ${
            activeTab === 'facility'
              ? 'bg-purple/30 border-purple text-purple-light shadow-[0_0_12px_rgba(142,68,173,0.4)]'
              : 'bg-dark-navy/60 border-dark-navy-light text-white/40'
          }`}
        >
          🎯 마케팅
        </button>
        <button
          onClick={() => setActiveTab('buff')}
          className={`flex-1 py-2.5 text-base font-bold rounded-xl border-2 transition-all ${
            activeTab === 'buff'
              ? 'bg-gold/20 border-gold text-gold shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : 'bg-dark-navy/60 border-dark-navy-light text-white/40'
          }`}
        >
          📈 투자
        </button>
      </div>

      {/* 카드 그리드 */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'facility' ? (
          <div className="grid grid-cols-3 gap-3">
            {FACILITY_IDS.map((id) => {
              const config = FACILITIES[id];
              const owned = state.facilities[id];
              const cost = calculateFacilityCost(config, owned);
              const canAfford = state.coins >= cost;

              return (
                <button
                  key={id}
                  onClick={() => handleFacilityPurchase(id)}
                  disabled={!canAfford}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all active:scale-95 ${
                    canAfford
                      ? 'bg-gradient-to-b from-purple/30 to-dark-navy-light border-purple/60 shadow-[0_0_16px_rgba(142,68,173,0.3)]'
                      : 'bg-dark-navy/70 border-dark-navy-light grayscale-[60%] opacity-50'
                  }`}
                >
                  {/* 보유 수량 뱃지 */}
                  {owned > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-gold text-dark-navy text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                      {owned}
                    </span>
                  )}

                  {/* 아이콘 */}
                  <span className="text-4xl mb-1">{FACILITY_ICONS[id]}</span>

                  {/* 이름 */}
                  <span className={`text-sm font-bold leading-tight text-center ${canAfford ? 'text-white' : 'text-white/50'}`}>
                    {config.name}
                  </span>

                  {/* CPS */}
                  <span className={`text-xs mt-0.5 ${canAfford ? 'text-purple-light' : 'text-purple-light/40'}`}>
                    +{config.cpsIncrease} CPS
                  </span>

                  {/* 가격 */}
                  <span className={`text-xs font-mono mt-1 ${canAfford ? 'text-gold' : 'text-gold/40'}`}>
                    {formatKoreanNumber(cost)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {BUFF_IDS.map((id) => {
              const config = BUFFS[id];
              const isPurchased = state.buffs[id];
              const canAfford = state.coins >= config.cost;
              const isActive = isPurchased;
              const canBuy = !isPurchased && canAfford;

              return (
                <button
                  key={id}
                  onClick={() => handleBuffPurchase(id)}
                  disabled={isPurchased || !canAfford}
                  className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-3 transition-all active:scale-95 ${
                    isActive
                      ? 'bg-gradient-to-b from-gold/30 to-gold/10 border-gold shadow-[0_0_16px_rgba(212,175,55,0.35)]'
                      : canBuy
                        ? 'bg-gradient-to-b from-purple/20 to-dark-navy-light border-purple/50 shadow-[0_0_16px_rgba(142,68,173,0.3)]'
                        : 'bg-dark-navy/70 border-dark-navy-light grayscale-[60%] opacity-50'
                  }`}
                >
                  {/* 구매 완료 체크 */}
                  {isActive && (
                    <span className="absolute top-1.5 right-1.5 text-sm">✅</span>
                  )}

                  {/* 아이콘 */}
                  <span className="text-4xl mb-1">{BUFF_ICONS[id]}</span>

                  {/* 이름 */}
                  <span className={`text-sm font-bold leading-tight text-center ${
                    isActive ? 'text-gold' : canBuy ? 'text-white' : 'text-white/50'
                  }`}>
                    {config.name}
                  </span>

                  {/* 효과 */}
                  <span className={`text-xs mt-0.5 ${
                    isActive ? 'text-gold/80' : canBuy ? 'text-purple-light' : 'text-purple-light/40'
                  }`}>
                    {BUFF_DESCRIPTIONS[id]}
                  </span>

                  {/* 가격 */}
                  <span className={`text-xs font-mono mt-1 ${
                    isActive ? 'text-gold/60' : canBuy ? 'text-gold' : 'text-gold/40'
                  }`}>
                    {isPurchased ? '적용중' : formatKoreanNumber(config.cost)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
