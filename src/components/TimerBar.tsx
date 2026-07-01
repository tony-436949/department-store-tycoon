import { useRef, useEffect } from 'react';
import type { GameState } from '../types';
import { formatTime } from '../utils';

/**
 * TimerBar - 상단 중앙 경과 시간 표시 컴포넌트
 *
 * Direct DOM 업데이트(spanRef.innerText)로 매초 갱신하여
 * React 리렌더링 없이 성능을 유지한다.
 *
 * Requirements: 7.1, 7.2, 7.3
 */
interface TimerBarProps {
  stateRef: React.MutableRefObject<GameState>;
}

export function TimerBar({ stateRef }: TimerBarProps) {
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // 초기 표시 업데이트
    if (spanRef.current) {
      spanRef.current.innerText = formatTime(stateRef.current.elapsedTime);
    }

    // 매 초마다 경과 시간 표시 갱신
    const intervalId = setInterval(() => {
      // 게임 오버 시 타이머 정지 (인터벌 정리)
      if (stateRef.current.isGameOver) {
        clearInterval(intervalId);
        return;
      }

      if (spanRef.current) {
        spanRef.current.innerText = formatTime(stateRef.current.elapsedTime);
      }
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [stateRef]);

  return (
    <span ref={spanRef} className="text-gold text-sm font-mono font-bold">
      ⏱ 00:00
    </span>
  );
}
