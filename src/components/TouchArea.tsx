import { useCallback, useRef } from 'react';

interface TouchAreaProps {
  onTouch: (x: number, y: number) => void;
  children: React.ReactNode;
}

/**
 * TouchArea 컴포넌트
 *
 * 게임 메인 터치 인터랙션 영역.
 * - touch-action: manipulation → 브라우저 기본 제스처 방지
 * - user-select: none → 텍스트 선택 방지
 * - onTouchStart + onClick 이벤트 핸들링
 * - 터치/클릭 좌표를 상위 컴포넌트에 전달
 *
 * Requirements: 11.2, 11.3, 12.1
 */
export function TouchArea({ onTouch, children }: TouchAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 터치/클릭 좌표를 요소 기준 상대 좌표로 변환하여 콜백 호출
   */
  const getRelativeCoords = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      onTouch(x, y);
    },
    [onTouch]
  );

  /**
   * 터치 이벤트 핸들러
   * - preventDefault로 브라우저 기본 동작 차단
   * - 첫 번째 터치 포인트의 좌표 추출
   */
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (touch) {
        getRelativeCoords(touch.clientX, touch.clientY);
      }
    },
    [getRelativeCoords]
  );

  /**
   * 클릭 이벤트 핸들러 (데스크톱 폴백)
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      getRelativeCoords(e.clientX, e.clientY);
    },
    [getRelativeCoords]
  );

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onClick={handleClick}
      className="w-full h-full flex-1 relative"
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}

export default TouchArea;
