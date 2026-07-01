import { useState } from 'react';
import type { GameState, BuffId } from '../types';
import { BUFFS } from '../constants';
import { formatKoreanNumber } from '../utils';

interface BuffTabProps {
  stateRef: React.MutableRefObject<GameState>;
  purchaseBuff: (buffId: BuffId) => boolean;
}

const BUFF_IDS: BuffId[] = ['marketing', 'flyer', 'autonomous-shuttle', 'l-cloud'];

/** 버프 효과 설명 매핑 */
const BUFF_DESCRIPTIONS: Record<BuffId, string> = {
  marketing: '터치 수익 ×2',
  flyer: 'CPS ×3',
  'autonomous-shuttle': '전체 수익 ×10',
  'l-cloud': '전체 수익 ×1000',
};

/**
 * BuffTab - 버프 4종 목록 컴포넌트
 *
 * - 버프명, 비용(한국어 포맷), 효과 설명 표시
 * - 구매 완료 시 "구매 완료" 뱃지 표시 및 버튼 비활성화
 * - 보유 재화 부족 시 구매 버튼 비활성화
 * - 구매 성공 시 forceUpdate로 UI 갱신
 *
 * Requirements: 4.3, 4.4, 9.4, 12.4
 */
export function BuffTab({ stateRef, purchaseBuff }: BuffTabProps) {
  const [, setUpdateCounter] = useState(0);

  const forceUpdate = () => setUpdateCounter((c) => c + 1);

  const handlePurchase = (buffId: BuffId) => {
    const success = purchaseBuff(buffId);
    if (success) {
      forceUpdate();
    }
  };

  const state = stateRef.current;

  return (
    <div className="space-y-1.5">
      {BUFF_IDS.map((buffId) => {
        const config = BUFFS[buffId];
        const isPurchased = state.buffs[buffId];
        const canAfford = state.coins >= config.cost;

        return (
          <div
            key={buffId}
            className={`flex items-center justify-between px-3 py-2 border rounded ${
              isPurchased
                ? 'bg-gold/10 border-gold/30'
                : 'bg-dark-navy/50 border-purple/20'
            }`}
          >
            {/* 버프 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[0.8rem] font-bold ${isPurchased ? 'text-gold' : 'text-white'}`}>
                  {config.name}
                </span>
                {isPurchased && (
                  <span className="text-[0.55rem] bg-gold/20 text-gold border border-gold/40 px-1 py-0.5 font-bold rounded">
                    완료
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-gold text-[0.7rem] font-mono">
                  {formatKoreanNumber(config.cost)}
                </span>
                <span className="text-purple-light/60 text-[0.65rem]">
                  {BUFF_DESCRIPTIONS[buffId]}
                </span>
              </div>
            </div>

            {/* 구매 버튼 */}
            <button
              onClick={() => handlePurchase(buffId)}
              disabled={isPurchased || !canAfford}
              className={`px-3 py-1.5 text-[0.7rem] font-bold border rounded transition-colors ${
                isPurchased
                  ? 'bg-gold/10 border-gold/30 text-gold/50 cursor-not-allowed'
                  : canAfford
                    ? 'bg-purple/20 border-purple/50 text-purple-light hover:bg-purple/30 active:bg-purple/40'
                    : 'bg-dark-navy/30 border-purple/20 text-purple-light/40 cursor-not-allowed'
              }`}
            >
              {isPurchased ? '완료' : '구매'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
