import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatTime, formatKoreanNumber } from '../utils';

/**
 * Property 13: 엔딩 결과 데이터 완전성
 * Validates: Requirements 8.3, 8.4, 8.5
 *
 * For any 게임 완료 상태에 대해, 결과 화면에는
 * 클리어 타임(MM:SS), 총 매출(한국어 숫자 포맷), 총 터치 횟수가 모두 포함되어야 한다.
 *
 * EndingPopup receives:
 * - clearTime: number (seconds)
 * - totalEarned: number (total coins, >= 5 billion for game completion)
 * - touchCount: number (total touches)
 *
 * Tests verify the underlying formatting logic produces valid, non-empty results
 * for any valid game completion state.
 */
describe('Property 13: 엔딩 결과 데이터 완전성', () => {
  // Generators for valid game completion state
  const clearTimeArb = fc.double({ min: 0, max: 100_000, noNaN: true, noDefaultInfinity: true });
  const totalEarnedArb = fc.double({ min: 5_000_000_000, max: 1e15, noNaN: true, noDefaultInfinity: true });
  const touchCountArb = fc.nat({ max: 10_000_000 });

  it('formatTime(clearTime)은 항상 유효한 MM:SS 형식을 반환한다', () => {
    fc.assert(
      fc.property(clearTimeArb, (clearTime) => {
        const result = formatTime(clearTime);
        expect(result).toMatch(/^\d{2,}:\d{2}$/);
      })
    );
  });

  it('formatKoreanNumber(totalEarned)은 "원"으로 끝나는 비어있지 않은 문자열을 반환한다', () => {
    fc.assert(
      fc.property(totalEarnedArb, (totalEarned) => {
        const result = formatKoreanNumber(totalEarned);
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/원$/);
      })
    );
  });

  it('formatKoreanNumber(totalEarned)은 게임 완료 수준(50억 이상)에서 "억원"으로 끝난다', () => {
    fc.assert(
      fc.property(totalEarnedArb, (totalEarned) => {
        const result = formatKoreanNumber(totalEarned);
        expect(result).toMatch(/억원$/);
      })
    );
  });

  it('touchCount 포맷은 항상 "회"로 끝나는 비어있지 않은 문자열을 생성한다', () => {
    fc.assert(
      fc.property(touchCountArb, (touchCount) => {
        const result = touchCount.toLocaleString('ko-KR') + '회';
        expect(result.length).toBeGreaterThan(0);
        expect(result).toMatch(/회$/);
      })
    );
  });

  it('모든 결과 데이터가 유효한 게임 완료 상태에 대해 정의되고 비어있지 않다', () => {
    fc.assert(
      fc.property(clearTimeArb, totalEarnedArb, touchCountArb, (clearTime, totalEarned, touchCount) => {
        const timeStr = formatTime(clearTime);
        const revenueStr = formatKoreanNumber(totalEarned);
        const touchStr = touchCount.toLocaleString('ko-KR') + '회';

        // All three pieces of data must be defined and non-empty
        expect(timeStr).toBeDefined();
        expect(timeStr.length).toBeGreaterThan(0);

        expect(revenueStr).toBeDefined();
        expect(revenueStr.length).toBeGreaterThan(0);

        expect(touchStr).toBeDefined();
        expect(touchStr.length).toBeGreaterThan(0);

        // Verify format correctness
        expect(timeStr).toMatch(/^\d{2,}:\d{2}$/);
        expect(revenueStr).toMatch(/원$/);
        expect(touchStr).toMatch(/회$/);
      })
    );
  });
});
