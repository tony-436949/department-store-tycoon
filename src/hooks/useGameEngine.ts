import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameState, FacilityId, BuffId, EvolutionEffectType, VIPState } from '../types';
import { EVOLUTION_STAGES, FACILITIES, BUFFS, VIP_SPAWN_MIN_MS, VIP_SPAWN_MAX_MS, VIP_LIFETIME_MS, VIP_REWARD_MULTIPLIER, SAVE_DEBOUNCE_MS, STORAGE_KEY } from '../constants';
import { formatKoreanNumber, calculateFacilityCost, applyBuffMultipliers } from '../utils';
import { saveGameState, loadGameState, getInitialGameState } from '../utils/persistence';

/**
 * VIP 스폰 딜레이 생성 (60000~120000ms 랜덤)
 * Requirements: 6.1
 */
export function generateVipSpawnDelay(): number {
  return VIP_SPAWN_MIN_MS + Math.random() * (VIP_SPAWN_MAX_MS - VIP_SPAWN_MIN_MS);
}

/**
 * VIP 위치 랜덤 생성 (화면 내 안전 영역)
 */
function generateVipPosition(): { x: number; y: number } {
  // 10%~90% 범위 내 랜덤 위치 (패딩 확보)
  return {
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 60,
  };
}

/**
 * 진화 조건 체크 함수
 * - totalEarned >= 다음 단계 threshold 확인
 * - evolutionStage 증가
 * - 9단계 도달 시 isGameOver = true
 *
 * Requirements: 5.1, 5.2, 8.6
 */
function checkEvolution(state: GameState): EvolutionEffectType | null {
  // Already at max stage (9) or game over
  if (state.evolutionStage >= 9 || state.isGameOver) return null;

  // Find the next stage threshold
  // EVOLUTION_STAGES is 0-indexed: stage 1 = index 0, so next stage = index [current]
  const nextStage = EVOLUTION_STAGES[state.evolutionStage];
  if (!nextStage) return null;

  // Check if totalEarned meets threshold
  if (state.totalEarned >= nextStage.threshold) {
    state.evolutionStage = nextStage.stage;

    // If reached stage 9, game over
    if (state.evolutionStage >= 9) {
      state.isGameOver = true;
    }

    return nextStage.effect;
  }

  return null;
}

/**
 * useGameEngine - 게임 루프 커스텀 훅
 *
 * requestAnimationFrame 기반 메인 루프로 CPS 적용, 경과 시간 추적,
 * Direct DOM 업데이트를 수행한다.
 *
 * Requirements: 2.1, 2.2, 11.1
 */
export function useGameEngine() {
  // Mutable 게임 상태 (React 리렌더링 없이 관리)
  // 마운트 시 localStorage에서 복원 시도, 실패 시 초기 상태 사용
  const stateRef = useRef<GameState>(loadGameState() ?? getInitialGameState());

  // 5초 디바운스 저장용 마지막 저장 시간 추적 (ms)
  const lastSaveTimeRef = useRef<number>(0);

  // 진화 연출 이펙트 상태 (UI에서 반응하기 위해 useState 사용)
  const [evolutionEffect, setEvolutionEffect] = useState<EvolutionEffectType | null>(null);

  // VIP 이벤트 상태 (UI에서 반응하기 위해 useState 사용)
  const [vipState, setVipState] = useState<VIPState>({
    isActive: false,
    position: { x: 0, y: 0 },
    spawnTime: 0,
    nextSpawnDelay: generateVipSpawnDelay(),
  });

  // VIP 타이머 추적용 refs (게임 루프에서 사용)
  const vipElapsedSinceLastEventRef = useRef<number>(0); // 마지막 VIP 이벤트 이후 경과 시간(ms)
  const vipNextSpawnDelayRef = useRef<number>(generateVipSpawnDelay()); // 다음 VIP 스폰까지 필요 시간(ms)
  const vipSpawnedAtRef = useRef<number>(0); // VIP 스폰 타임스탬프 (0 = 비활성)
  const vipActiveRef = useRef<boolean>(false); // VIP 현재 활성 여부 (ref로 게임 루프에서 체크)

  // Direct DOM 업데이트용 refs
  const coinsDisplayRef = useRef<HTMLSpanElement>(null);
  const cpsDisplayRef = useRef<HTMLSpanElement>(null);

  // requestAnimationFrame ID 추적용
  const rafIdRef = useRef<number>(0);
  // 이전 프레임 타임스탬프
  const lastTimeRef = useRef<number>(0);

  /**
   * Direct DOM 업데이트: 재화 및 CPS 표시를 React를 우회하여 갱신
   */
  const updateDOM = useCallback(() => {
    const state = stateRef.current;
    if (coinsDisplayRef.current) {
      coinsDisplayRef.current.innerText = formatKoreanNumber(state.coins);
    }
    if (cpsDisplayRef.current) {
      cpsDisplayRef.current.innerText = formatKoreanNumber(state.cps);
    }
  }, []);

  /**
   * 게임 루프 (requestAnimationFrame 기반)
   * - deltaTime 계산
   * - CPS 적용: coins += cps * (deltaMs / 1000)
   * - totalEarned 누적
   * - elapsedTime 추적
   * - Direct DOM 업데이트
   */
  const gameLoop = useCallback(
    (timestamp: number) => {
      // 첫 프레임은 deltaTime 0으로 처리
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const state = stateRef.current;

      // 게임 종료 시 루프 로직 스킵 (rAF는 계속 유지하되 상태 변경 안함)
      if (!state.isGameOver) {
        // CPS 적용: 매 프레임 deltaTime 기반 재화 증가
        if (state.cps > 0) {
          const earned = state.cps * (deltaMs / 1000);
          state.coins += earned;
          state.totalEarned += earned;
        }

        // 경과 시간 추적 (초 단위)
        state.elapsedTime += deltaMs / 1000;

        // 진화 조건 체크 (CPS 적용 후)
        const effect = checkEvolution(state);
        if (effect) {
          setEvolutionEffect(effect);
        }

        // VIP 이벤트 타이머 로직
        // Requirements: 6.1, 6.2, 6.4
        if (vipActiveRef.current) {
          // VIP가 활성 상태: 5초 생존 타이머 체크
          const vipAliveTime = timestamp - vipSpawnedAtRef.current;
          if (vipAliveTime >= VIP_LIFETIME_MS) {
            // 5초 경과 → VIP 소멸
            vipActiveRef.current = false;
            vipSpawnedAtRef.current = 0;
            // 스폰 타이머 리셋 (새 랜덤 딜레이)
            vipElapsedSinceLastEventRef.current = 0;
            vipNextSpawnDelayRef.current = generateVipSpawnDelay();
            setVipState({
              isActive: false,
              position: { x: 0, y: 0 },
              spawnTime: 0,
              nextSpawnDelay: vipNextSpawnDelayRef.current,
            });
          }
        } else {
          // VIP 비활성: 스폰 타이머 누적
          vipElapsedSinceLastEventRef.current += deltaMs;
          if (vipElapsedSinceLastEventRef.current >= vipNextSpawnDelayRef.current) {
            // 스폰 타이머 만료 → VIP 스폰
            const position = generateVipPosition();
            vipActiveRef.current = true;
            vipSpawnedAtRef.current = timestamp;
            setVipState({
              isActive: true,
              position,
              spawnTime: timestamp,
              nextSpawnDelay: vipNextSpawnDelayRef.current,
            });
          }
        }
      }

      // 5초 디바운스 자동 저장 (시간 기반)
      // Requirements: 10.1, 10.2
      lastSaveTimeRef.current += deltaMs;
      if (lastSaveTimeRef.current >= SAVE_DEBOUNCE_MS) {
        lastSaveTimeRef.current = 0;
        saveGameState(stateRef.current);
      }

      // Direct DOM 업데이트
      updateDOM();

      // 다음 프레임 예약
      rafIdRef.current = requestAnimationFrame(gameLoop);
    },
    [updateDOM]
  );

  /**
   * 게임 루프 시작/정리 (useEffect)
   */
  useEffect(() => {
    lastTimeRef.current = 0;
    rafIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [gameLoop]);

  /**
   * 터치 핸들러
   * - 재화 += touchPower
   * - touchCount++
   * - totalEarned += touchPower
   * - 햅틱 피드백 (navigator.vibrate)
   * - 진화 조건 체크
   * - DOM 업데이트
   *
   * Requirements: 1.1, 1.4, 1.6
   */
  const handleTouch = useCallback((_x: number, _y: number) => {
    const state = stateRef.current;

    // 재화 증가
    state.coins += state.touchPower;
    // 터치 카운트 증가
    state.touchCount++;
    // 누적 수익 증가
    state.totalEarned += state.touchPower;

    // 햅틱 피드백 (미지원 브라우저 silent fail)
    try {
      navigator.vibrate(10);
    } catch {
      // vibrate 미지원 시 무시
    }

    // 진화 조건 체크
    const effect = checkEvolution(state);
    if (effect) {
      setEvolutionEffect(effect);
    }

    // DOM 즉시 갱신
    updateDOM();
  }, [updateDOM]);

  /**
   * 시설 구매
   * - 보유 재화 >= 비용 확인 후 재화 차감
   * - 시설 보유 수량 증가, CPS 재계산
   * - calculateFacilityCost로 다음 비용 산출
   *
   * Requirements: 3.2, 3.3, 3.4, 2.3, 13.1, 13.2
   */
  const purchaseFacility = useCallback((facilityId: FacilityId): boolean => {
    const state = stateRef.current;
    const config = FACILITIES[facilityId];

    // 현재 비용 계산 (인플레이션 적용, 소수점 이하 버림)
    const cost = calculateFacilityCost(config, state.facilities[facilityId]);

    // 보유 재화 부족 시 구매 실패
    if (state.coins < cost) {
      return false;
    }

    // 재화 차감
    state.coins -= cost;

    // 시설 보유 수량 증가
    state.facilities[facilityId]++;

    // CPS 재계산: 모든 시설의 기본 CPS 합산
    const baseCPS = (Object.entries(state.facilities) as [FacilityId, number][]).reduce(
      (sum, [id, count]) => sum + FACILITIES[id].cpsIncrease * count,
      0
    );

    // 버프 배수 적용
    const result = applyBuffMultipliers(state.baseTouchPower, baseCPS, state.buffs);
    state.cps = result.cps;
    state.touchPower = result.touchPower;

    // DOM 업데이트
    updateDOM();

    return true;
  }, [updateDOM]);

  /**
   * 버프 구매
   * - 중복 구매 방지
   * - 보유 재화 >= 비용 확인 후 재화 차감
   * - buffs 상태 변경
   * - applyBuffMultipliers로 touchPower/CPS 재계산
   *
   * Requirements: 4.2, 4.3, 4.4
   */
  const purchaseBuff = useCallback((buffId: BuffId): boolean => {
    const state = stateRef.current;
    const config = BUFFS[buffId];

    // 중복 구매 방지
    if (state.buffs[buffId]) {
      return false;
    }

    // 보유 재화 확인
    if (state.coins < config.cost) {
      return false;
    }

    // 재화 차감
    state.coins -= config.cost;

    // 버프 구매 상태 반영
    state.buffs[buffId] = true;

    // 시설 기반 baseCPS 재계산
    const baseCPS = Object.entries(state.facilities).reduce(
      (sum, [id, count]) => sum + FACILITIES[id as FacilityId].cpsIncrease * count,
      0
    );

    // 버프 배수 적용하여 touchPower/CPS 재계산
    const { touchPower, cps } = applyBuffMultipliers(state.baseTouchPower, baseCPS, state.buffs);
    state.touchPower = touchPower;
    state.cps = cps;

    // DOM 즉시 갱신
    updateDOM();

    return true;
  }, [updateDOM]);

  /**
   * VIP 클릭 핸들러
   * - VIP 활성 상태일 때만 동작
   * - 보상 지급: CPS × 100
   * - VIP 상태 리셋
   * - 스폰 타이머 새 랜덤 딜레이로 리셋
   *
   * Requirements: 6.3, 6.4
   */
  const handleVipClick = useCallback(() => {
    // VIP가 활성 상태가 아니면 무시
    if (!vipActiveRef.current) return;

    const state = stateRef.current;

    // 보상 지급: CPS × VIP_REWARD_MULTIPLIER (100)
    const reward = state.cps * VIP_REWARD_MULTIPLIER;
    state.coins += reward;
    state.totalEarned += reward;

    // VIP 상태 리셋
    vipActiveRef.current = false;
    vipSpawnedAtRef.current = 0;

    // 스폰 타이머 리셋 (새 랜덤 딜레이)
    vipElapsedSinceLastEventRef.current = 0;
    vipNextSpawnDelayRef.current = generateVipSpawnDelay();

    // UI 상태 업데이트
    setVipState({
      isActive: false,
      position: { x: 0, y: 0 },
      spawnTime: 0,
      nextSpawnDelay: vipNextSpawnDelayRef.current,
    });

    // 진화 조건 체크 (보상으로 진화 가능할 수 있음)
    const effect = checkEvolution(state);
    if (effect) {
      setEvolutionEffect(effect);
    }

    // DOM 즉시 갱신
    updateDOM();

    return reward;
  }, [updateDOM]);

  /**
   * 게임 리셋
   */
  const resetGame = useCallback(() => {
    stateRef.current = getInitialGameState();
    lastTimeRef.current = 0;
    lastSaveTimeRef.current = 0;

    // localStorage 초기화
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // 무시
    }

    // VIP 상태 리셋
    vipActiveRef.current = false;
    vipSpawnedAtRef.current = 0;
    vipElapsedSinceLastEventRef.current = 0;
    vipNextSpawnDelayRef.current = generateVipSpawnDelay();
    setVipState({
      isActive: false,
      position: { x: 0, y: 0 },
      spawnTime: 0,
      nextSpawnDelay: vipNextSpawnDelayRef.current,
    });

    updateDOM();
  }, [updateDOM]);

  return {
    stateRef,
    handleTouch,
    purchaseFacility,
    purchaseBuff,
    handleVipClick,
    resetGame,
    coinsDisplayRef,
    cpsDisplayRef,
    evolutionEffect,
    clearEvolutionEffect: () => setEvolutionEffect(null),
    vipState,
  };
}
