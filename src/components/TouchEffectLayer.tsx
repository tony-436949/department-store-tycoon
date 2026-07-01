import type { TouchEffect } from '../types';
import { formatKoreanNumber } from '../utils';

interface TouchEffectLayerProps {
  effects: TouchEffect[];
  onEffectComplete: (id: string) => void;
}

/**
 * 터치 이펙트 레이어 컴포넌트
 * - 터치 위치에 "+{획득량}" 텍스트 이펙트 표시
 * - CSS float-up 애니메이션으로 위로 떠오르며 사라짐
 * - onAnimationEnd로 DOM에서 제거 (메모리 누수 방지, Req 11.4)
 * - pointer-events: none으로 터치 이벤트 통과
 *
 * Requirements: 1.2, 1.3, 1.5, 11.4
 */
export function TouchEffectLayer({ effects, onEffectComplete }: TouchEffectLayerProps) {
  return (
    <div
      className="touch-effect-layer"
      aria-hidden="true"
    >
      {effects.map((effect) => (
        <span
          key={effect.id}
          className="touch-effect-item"
          style={{
            left: effect.x,
            top: effect.y,
          }}
          onAnimationEnd={() => onEffectComplete(effect.id)}
        >
          +{formatKoreanNumber(effect.amount)}
        </span>
      ))}
    </div>
  );
}
