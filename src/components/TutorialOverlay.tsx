import { useState } from 'react';

/**
 * TutorialOverlay - 게임 가이드/튜토리얼 팝업
 *
 * 최초 접속 시 게임 방법을 안내하는 스와이프 가능한 가이드 화면.
 * localStorage에 튜토리얼 완료 여부를 저장하여 다시 띄우지 않음.
 */

const TUTORIAL_KEY = 'dept-tycoon-tutorial-done';

interface TutorialOverlayProps {
  onComplete: () => void;
}

interface Slide {
  emoji: string;
  title: string;
  description: string;
  highlight?: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '👋',
    title: '백화점 타이쿤에 오신 것을 환영합니다!',
    description: '노점에서 시작하여 대형 복합쇼핑몰을 만들어보세요.',
    highlight: '터치 한 번으로 시작되는 성장 스토리',
  },
  {
    emoji: '👆',
    title: '화면을 터치하세요',
    description: '게임 화면을 터치하면 매출이 올라갑니다. 빠르게 터치할수록 빠르게 성장합니다!',
    highlight: '터치 = 매출 증가',
  },
  {
    emoji: '🎯',
    title: '마케팅에 투자하세요',
    description: '하단의 마케팅 탭에서 다양한 마케팅 활동을 구매하면 초당 자동 수익(CPS)이 올라갑니다.',
    highlight: '팝업행사, SNS광고, TV광고 등 9종',
  },
  {
    emoji: '📈',
    title: '대규모 투자 프로젝트',
    description: '투자 탭에서 증자, 지점확장, 해외진출 등 대규모 프로젝트를 실행하면 수익이 폭발적으로 증가합니다.',
    highlight: '1회 구매로 영구 배수 효과!',
  },
  {
    emoji: '🏬',
    title: '건물을 진화시키세요',
    description: '누적 매출이 목표치에 도달하면 자동으로 건물이 진화합니다. 노점 → 세븐일레븐 → 롯데마트 → 롯데백화점 → 롯데타운!',
    highlight: '총 9단계 진화',
  },
  {
    emoji: '👑',
    title: '준비 완료!',
    description: '최종 목표: 롯데타운 달성! 가장 빠른 시간 안에 클리어하세요. 행운을 빕니다!',
    highlight: '게임 시작!',
  },
];

export function TutorialOverlay({ onComplete }: TutorialOverlayProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      // 튜토리얼 완료
      try {
        localStorage.setItem(TUTORIAL_KEY, 'true');
      } catch {
        // ignore
      }
      onComplete();
    }
  };

  const handleSkip = () => {
    try {
      localStorage.setItem(TUTORIAL_KEY, 'true');
    } catch {
      // ignore
    }
    onComplete();
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div
        className="w-[400px] h-[400px] max-w-[95vw] max-h-[95vh] bg-gradient-to-b from-[#2A2540] to-[#1A162B] rounded-3xl border border-purple/30 shadow-2xl flex flex-col justify-between"
      >
        {/* 상단: 이모지 + 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 pt-6">
          <span className="text-5xl mb-4">{slide.emoji}</span>
          <h2 className="text-gold font-bold text-lg mb-2 leading-tight text-center">
            {slide.title}
          </h2>
          <p className="text-white/80 text-sm leading-relaxed text-center mb-3">
            {slide.description}
          </p>
          {slide.highlight && (
            <div className="inline-block bg-purple/20 border border-purple/40 rounded-full px-4 py-1.5">
              <span className="text-purple-light text-sm font-bold">{slide.highlight}</span>
            </div>
          )}
        </div>

        {/* 중간: 인디케이터 */}
        <div className="flex justify-center gap-2 py-4">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide
                  ? 'w-7 bg-gold'
                  : i < currentSlide
                    ? 'w-2 bg-gold/50'
                    : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* 하단: 버튼 */}
        <div className="px-6 pb-6 flex gap-4">
          {!isLast && (
            <button
              onClick={handleSkip}
              className="flex-1 py-3.5 rounded-xl border border-white/20 text-white/50 text-sm font-medium active:bg-white/5"
            >
              건너뛰기
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${isLast ? 'w-full' : 'flex-1'} py-3.5 rounded-xl bg-gradient-to-r from-gold to-gold-dark text-dark-navy text-base font-bold shadow-lg shadow-gold/20 active:scale-95 transition-transform`}
          >
            {isLast ? '🎮 게임 시작!' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** 튜토리얼 완료 여부 확인 */
export function isTutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === 'true';
  } catch {
    return false;
  }
}
