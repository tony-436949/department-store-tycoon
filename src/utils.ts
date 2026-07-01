import type { FacilityConfig, BuffOwnership } from './types';

/**
 * 한국어 숫자 포맷팅 함수
 * - value < 10,000: 콤마 포맷 + "원" (예: "9,500원")
 * - 10,000 ≤ value < 100,000,000: 만 단위 변환 + "만원" (예: "1.5만원")
 * - value ≥ 100,000,000: 억 단위 변환 + "억원" (예: "1억원")
 * - Edge cases: 음수 → "0원", NaN → "0원"
 *
 * Requirements: 9.1, 9.2, 9.3
 */
export function formatKoreanNumber(value: number): string {
  // Edge cases: NaN or negative
  if (Number.isNaN(value) || value < 0) {
    return '0원';
  }

  // 1억 이상
  if (value >= 100_000_000) {
    const eok = value / 100_000_000;
    // 소수점 첫째 자리까지 표시, 불필요한 .0 제거
    const formatted = eok % 1 === 0
      ? eok.toFixed(0)
      : parseFloat(eok.toFixed(1)).toString();
    return `${formatted}억원`;
  }

  // 1만 이상
  if (value >= 10_000) {
    const man = value / 10_000;
    // 소수점 첫째 자리까지 표시, 불필요한 .0 제거
    const formatted = man % 1 === 0
      ? man.toFixed(0)
      : parseFloat(man.toFixed(1)).toString();
    return `${formatted}만원`;
  }

  // 1만 미만: 콤마 포맷 + "원"
  return `${Math.floor(value).toLocaleString('ko-KR')}원`;
}

/**
 * 시간 포맷팅 함수 (MM:SS 형식)
 * - MM = floor(seconds / 60) 2자리 zero-pad
 * - SS = seconds % 60 2자리 zero-pad
 * - Edge cases: 음수 → "00:00", NaN → "00:00"
 *
 * Requirements: 7.1
 */
export function formatTime(seconds: number): string {
  // Edge cases: NaN or negative
  if (Number.isNaN(seconds) || seconds < 0) {
    return '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const mm = Math.floor(totalSeconds / 60);
  const ss = totalSeconds % 60;

  return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
}

/**
 * 시설 비용 계산 함수 (인플레이션 적용)
 * - 공식: floor(baseCost × inflationRate ^ owned)
 * - inflationRate는 1.05~1.08 범위
 * - 결과는 항상 정수 (floor 처리)
 * - Edge cases: owned < 0 → baseCost 반환
 *
 * Requirements: 13.1, 13.2
 */
export function calculateFacilityCost(config: FacilityConfig, owned: number): number {
  // Edge case: owned < 0 → baseCost 반환
  if (owned < 0) {
    return config.baseCost;
  }

  return Math.floor(config.baseCost * Math.pow(config.inflationRate, owned));
}

/**
 * 버프 배수 적용 함수 (대규모 투자 프로젝트)
 * - 증자(capital-increase): 터치 수익 × 2
 * - 우수인력 채용(talent-recruit): CPS × 2
 * - PB브랜드 육성(pb-brand): CPS × 2
 * - 지점 확장(branch-expand): 전체 수익 × 3
 * - 전산장비 교체(it-upgrade): CPS × 3
 * - 물류센터 구축(logistics-center): 전체 수익 × 5
 * - 해외 진출(global-entry): 전체 수익 × 5
 * - 스마트스토어 전환(smart-store): 전체 수익 × 10
 * - ESG 경영 투자(eco-invest): 전체 수익 × 100
 * - 배수는 곱셈으로 누적 적용
 * - Edge cases: NaN 입력 → 0 반환
 */
export function applyBuffMultipliers(
  baseTouchPower: number,
  baseCPS: number,
  buffs: BuffOwnership
): { touchPower: number; cps: number } {
  if (Number.isNaN(baseTouchPower) || Number.isNaN(baseCPS)) {
    return { touchPower: 0, cps: 0 };
  }

  let touchPower = baseTouchPower;
  let cps = baseCPS;

  // 증자: 터치 수익 × 2
  if (buffs['capital-increase']) {
    touchPower *= 2;
  }

  // 우수인력 채용: CPS × 2
  if (buffs['talent-recruit']) {
    cps *= 2;
  }

  // PB브랜드 육성: CPS × 2
  if (buffs['pb-brand']) {
    cps *= 2;
  }

  // 지점 확장: 전체 × 3
  if (buffs['branch-expand']) {
    touchPower *= 3;
    cps *= 3;
  }

  // 전산장비 교체: CPS × 3
  if (buffs['it-upgrade']) {
    cps *= 3;
  }

  // 물류센터 구축: 전체 × 5
  if (buffs['logistics-center']) {
    touchPower *= 5;
    cps *= 5;
  }

  // 해외 진출: 전체 × 5
  if (buffs['global-entry']) {
    touchPower *= 5;
    cps *= 5;
  }

  // 스마트스토어 전환: 전체 × 10
  if (buffs['smart-store']) {
    touchPower *= 10;
    cps *= 10;
  }

  // ESG 경영 투자: 전체 × 100
  if (buffs['eco-invest']) {
    touchPower *= 100;
    cps *= 100;
  }

  return { touchPower, cps };
}
