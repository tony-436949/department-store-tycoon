import { useState } from 'react';
import type { GameState, FacilityId } from '../types';
import { FACILITIES } from '../constants';
import { formatKoreanNumber, calculateFacilityCost } from '../utils';

interface FacilityTabProps {
  stateRef: React.MutableRefObject<GameState>;
  purchaseFacility: (facilityId: FacilityId) => boolean;
}

const FACILITY_IDS: FacilityId[] = ['popup-store', 'gift-desk', 'parking-shuttle'];

/**
 * FacilityTab - 시설 3종 목록 컴포넌트
 *
 * - 시설명, 현재 비용(한국어 포맷), CPS 증가량, 보유 수량 표시
 * - 보유 재화 부족 시 구매 버튼 비활성화
 * - 구매 성공 시 forceUpdate로 UI 갱신
 *
 * Requirements: 3.3, 3.5, 9.4, 12.4, 13.3
 */
export function FacilityTab({ stateRef, purchaseFacility }: FacilityTabProps) {
  const [, setUpdateCounter] = useState(0);

  const forceUpdate = () => setUpdateCounter((c) => c + 1);

  const handlePurchase = (facilityId: FacilityId) => {
    const success = purchaseFacility(facilityId);
    if (success) {
      forceUpdate();
    }
  };

  const state = stateRef.current;

  return (
    <div className="space-y-1.5">
      {FACILITY_IDS.map((facilityId) => {
        const config = FACILITIES[facilityId];
        const owned = state.facilities[facilityId];
        const cost = calculateFacilityCost(config, owned);
        const canAfford = state.coins >= cost;

        return (
          <div
            key={facilityId}
            className="flex items-center justify-between bg-dark-navy/50 px-3 py-2 border border-purple/20 rounded"
          >
            {/* 시설 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white text-[0.8rem] font-bold">{config.name}</span>
                <span className="text-purple-light text-[0.65rem]">
                  +{config.cpsIncrease} CPS
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-gold text-[0.7rem] font-mono">
                  {formatKoreanNumber(cost)}
                </span>
                <span className="text-purple-light/60 text-[0.65rem]">
                  보유 {owned}개
                </span>
              </div>
            </div>

            {/* 구매 버튼 */}
            <button
              onClick={() => handlePurchase(facilityId)}
              disabled={!canAfford}
              className={`px-3 py-1.5 text-[0.7rem] font-bold border rounded transition-colors ${
                canAfford
                  ? 'bg-gold/20 border-gold/50 text-gold hover:bg-gold/30 active:bg-gold/40'
                  : 'bg-dark-navy/30 border-purple/20 text-purple-light/40 cursor-not-allowed'
              }`}
            >
              구매
            </button>
          </div>
        );
      })}
    </div>
  );
}
