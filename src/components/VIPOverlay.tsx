import { useState, useEffect, useRef } from 'react';
import type { VIPState } from '../types';
import { VIP_LIFETIME_MS, VIP_REWARD_MULTIPLIER } from '../constants';
import { formatKoreanNumber } from '../utils';

interface VIPOverlayProps {
  vipState: VIPState;
  onVipClick: () => void;
  currentCps: number;
}

/**
 * VIPOverlay - VIP 돌발 이벤트 오버레이 컴포넌트
 *
 * - VIP 캐릭터를 골드 글로우 애니메이션과 함께 표시
 * - 5초 카운트다운 타이머 UI (원형 프로그레스)
 * - 터치 시 handleVipClick 호출, 골드 이펙트 + 보너스 금액 표시
 *
 * Requirements: 6.2, 6.4, 6.5
 */
export function VIPOverlay({ vipState, onVipClick, currentCps }: VIPOverlayProps) {
  const [showReward, setShowReward] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(VIP_LIFETIME_MS);
  const timerRef = useRef<number>(0);

  // 5초 카운트다운 타이머
  useEffect(() => {
    if (!vipState.isActive) {
      setTimeRemaining(VIP_LIFETIME_MS);
      return;
    }

    const startTime = performance.now();

    const updateTimer = () => {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, VIP_LIFETIME_MS - elapsed);
      setTimeRemaining(remaining);

      if (remaining > 0) {
        timerRef.current = requestAnimationFrame(updateTimer);
      }
    };

    timerRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [vipState.isActive, vipState.spawnTime]);

  // 보상 이펙트 표시 후 자동 숨김
  useEffect(() => {
    if (showReward) {
      const timeout = setTimeout(() => {
        setShowReward(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [showReward]);

  const handleClick = () => {
    if (!vipState.isActive) return;

    // 보상 금액 계산: CPS × VIP_REWARD_MULTIPLIER (100)
    const reward = currentCps * VIP_REWARD_MULTIPLIER;
    onVipClick();

    if (reward > 0) {
      setRewardAmount(reward);
      setShowReward(true);
    }
  };

  // VIP 비활성이고 보상도 없으면 렌더링 안 함
  if (!vipState.isActive && !showReward) {
    return null;
  }

  // 카운트다운 진행률 (0~1, 1=시작, 0=시간만료)
  const progress = timeRemaining / VIP_LIFETIME_MS;
  // 원형 프로그레스 SVG 관련 (반지름 22, 둘레 = 2*PI*22 ≈ 138.2)
  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className="vip-overlay"
      aria-label="VIP 이벤트"
    >
      {/* VIP 캐릭터 */}
      {vipState.isActive && (
        <button
          className="vip-character"
          style={{
            left: `${vipState.position.x}%`,
            top: `${vipState.position.y}%`,
          }}
          onClick={handleClick}
          onTouchStart={(e) => {
            e.preventDefault();
            handleClick();
          }}
          aria-label="VIP 캐릭터 터치하여 보상 획득"
        >
          {/* VIP 라벨 */}
          <span className="vip-label">VIP!</span>

          {/* 원형 카운트다운 타이머 */}
          <svg className="vip-timer-ring" viewBox="0 0 52 52">
            {/* 배경 링 */}
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="rgba(212, 175, 55, 0.2)"
              strokeWidth="3"
            />
            {/* 프로그레스 링 */}
            <circle
              cx="26"
              cy="26"
              r="22"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 26 26)"
            />
          </svg>

          {/* 캐릭터 아이콘 */}
          <span className="vip-icon">👑</span>

          {/* 남은 시간 텍스트 */}
          <span className="vip-timer-text">
            {Math.ceil(timeRemaining / 1000)}s
          </span>
        </button>
      )}

      {/* 골드 이펙트 보너스 금액 표시 */}
      {showReward && (
        <div
          className="vip-reward-effect"
          style={{
            left: `${vipState.position.x}%`,
            top: `${vipState.position.y}%`,
          }}
        >
          <span className="vip-reward-text">
            +{formatKoreanNumber(rewardAmount)}
          </span>
        </div>
      )}
    </div>
  );
}
