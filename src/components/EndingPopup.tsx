import { formatTime, formatKoreanNumber } from '../utils';

interface EndingPopupProps {
  clearTime: number;    // seconds (elapsedTime from game state)
  totalEarned: number;  // total coins earned
  touchCount: number;   // total touch count
  onReset?: () => void; // optional restart handler
}

/**
 * 홀로그램 스타일 결과 팝업 컴포넌트
 * 9단계 복합쇼핑몰 진화 완료 시 표시
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
export default function EndingPopup({
  clearTime,
  totalEarned,
  touchCount,
  onReset,
}: EndingPopupProps) {
  return (
    <div className="ending-overlay">
      <div className="ending-popup">
        {/* 홀로그램 shimmer 오버레이 */}
        <div className="ending-hologram-shimmer" />

        {/* 타이틀 */}
        <h1 className="ending-title">경영의 신이 되셨습니다!</h1>

        {/* 결과 통계 */}
        <ul className="ending-stats">
          <li className="ending-stat-item">
            <span className="ending-stat-label">클리어 타임</span>
            <span className="ending-stat-value ending-stat-time">
              {formatTime(clearTime)}
            </span>
          </li>
          <li className="ending-stat-item">
            <span className="ending-stat-label">총 매출</span>
            <span className="ending-stat-value ending-stat-revenue">
              {formatKoreanNumber(totalEarned)}
            </span>
          </li>
          <li className="ending-stat-item">
            <span className="ending-stat-label">터치 횟수</span>
            <span className="ending-stat-value ending-stat-touch">
              {touchCount.toLocaleString('ko-KR')}회
            </span>
          </li>
        </ul>

        {/* 다시 시작 버튼 */}
        {onReset && (
          <button className="ending-restart-btn" onClick={onReset}>
            다시 시작
          </button>
        )}
      </div>
    </div>
  );
}
