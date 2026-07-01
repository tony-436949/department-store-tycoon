import { useRef, useEffect } from 'react';
import type { GameState } from '../types';
import { EVOLUTION_STAGES } from '../constants';
import { formatKoreanNumber } from '../utils';

/**
 * EvolutionDisplay - 현재 진화 단계명 및 진행률 바 표시 컴포넌트
 *
 * Direct DOM 업데이트(useRef + setInterval)로 진행률 바를 갱신하여
 * React 리렌더링 없이 고빈도 totalEarned 변화에 대응한다.
 *
 * 진행률 계산:
 * - progress = (totalEarned - 현재 단계 threshold) / (다음 단계 threshold - 현재 단계 threshold)
 * - 범위를 [0, 1]로 클램핑
 * - 최대 단계(9) 도달 시 100% 표시
 *
 * Requirements: 5.12
 */
interface EvolutionDisplayProps {
  stateRef: React.MutableRefObject<GameState>;
}

export function EvolutionDisplay({ stateRef }: EvolutionDisplayProps) {
  const stageNameRef = useRef<HTMLSpanElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const percentTextRef = useRef<HTMLSpanElement>(null);
  const thresholdTextRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function updateDisplay() {
      const state = stateRef.current;
      const currentStageIndex = state.evolutionStage - 1; // 0-indexed
      const currentStage = EVOLUTION_STAGES[currentStageIndex];

      // 단계명 업데이트
      if (stageNameRef.current) {
        stageNameRef.current.innerText = `${currentStage.stage}단계 ${currentStage.name}`;
      }

      // 진행률 계산
      let progress: number;
      let nextThreshold: number;

      if (state.evolutionStage >= 9) {
        // 최대 단계: 100% 표시
        progress = 1;
        nextThreshold = currentStage.threshold;
      } else {
        const currentThreshold = currentStage.threshold;
        nextThreshold = EVOLUTION_STAGES[currentStageIndex + 1].threshold;
        const range = nextThreshold - currentThreshold;

        if (range <= 0) {
          progress = 1;
        } else {
          progress = (state.totalEarned - currentThreshold) / range;
        }

        // [0, 1] 클램핑
        progress = Math.max(0, Math.min(1, progress));
      }

      const percent = Math.floor(progress * 100);

      // 진행률 바 너비 업데이트
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${percent}%`;
      }

      // 퍼센트 텍스트 업데이트
      if (percentTextRef.current) {
        percentTextRef.current.innerText = `${percent}%`;
      }

      // 목표치 텍스트 업데이트
      if (thresholdTextRef.current) {
        if (state.evolutionStage >= 9) {
          thresholdTextRef.current.innerText = '최대 단계 달성!';
        } else {
          thresholdTextRef.current.innerText = `목표: ${formatKoreanNumber(nextThreshold)}`;
        }
      }
    }

    // 초기 표시
    updateDisplay();

    // 500ms 간격으로 갱신 (totalEarned는 매 프레임 변하지만 UI는 적당한 빈도로 갱신)
    const intervalId = setInterval(updateDisplay, 500);

    return () => {
      clearInterval(intervalId);
    };
  }, [stateRef]);

  return (
    <div className="w-full">
      {/* 단계명 + 퍼센트 */}
      <div className="flex items-center justify-between">
        <span ref={stageNameRef} className="text-gold font-bold text-sm">
          1단계 노점
        </span>
        <span ref={percentTextRef} className="text-purple-light text-sm font-mono">
          0%
        </span>
      </div>

      {/* 진행률 바 */}
      <div className="bg-dark-navy-light border border-purple/30 rounded h-3 overflow-hidden mt-1">
        <div
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-purple to-gold transition-[width] duration-300 ease-out"
          style={{ width: '0%' }}
        />
      </div>

      {/* 목표치 표시 */}
      <div className="text-right mt-0.5">
        <span ref={thresholdTextRef} className="text-purple-light/70 text-xs">
          목표: 500원
        </span>
      </div>
    </div>
  );
}
