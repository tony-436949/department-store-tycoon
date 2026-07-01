import { useState, useCallback, useRef } from 'react';
import { TouchArea } from './components/TouchArea';
import { TimerBar } from './components/TimerBar';
import { StorePanel } from './components/StorePanel';
import { BuildingDisplay } from './components/BuildingDisplay';
import { EvolutionDisplay } from './components/EvolutionDisplay';
import { TouchEffectLayer } from './components/TouchEffectLayer';
import { VIPOverlay } from './components/VIPOverlay';
import { EvolutionOverlay } from './components/EvolutionOverlay';
import EndingPopup from './components/EndingPopup';
import { useGameEngine } from './hooks/useGameEngine';
import { EVOLUTION_STAGES } from './constants';
import type { TouchEffect } from './types';

function getStageBackground(stage: number) {
  const bgs: Record<number, { gradient: string; pattern: string; patternSize: string }> = {
    1: { gradient: 'linear-gradient(180deg, #1A162B 0%, #0F0D1A 50%, #1A162B 100%)', pattern: 'radial-gradient(circle, rgba(212,175,55,0.08) 1px, transparent 1px)', patternSize: '30px 30px' },
    2: { gradient: 'linear-gradient(180deg, #1E1730 0%, #2A1F3D 40%, #1A162B 100%)', pattern: 'radial-gradient(circle, rgba(168,85,199,0.1) 2px, transparent 2px)', patternSize: '40px 40px' },
    3: { gradient: 'linear-gradient(180deg, #12102A 0%, #1A1540 50%, #0E0C20 100%)', pattern: 'linear-gradient(0deg, rgba(142,68,173,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(142,68,173,0.06) 1px, transparent 1px)', patternSize: '20px 20px' },
    4: { gradient: 'linear-gradient(180deg, #151228 0%, #201A3A 30%, #15122A 70%, #0D0B1A 100%)', pattern: 'radial-gradient(circle, rgba(212,175,55,0.06) 1px, transparent 1px)', patternSize: '50px 50px' },
    5: { gradient: 'linear-gradient(180deg, #1A1535 0%, #251D45 30%, #1A1540 60%, #12102A 100%)', pattern: 'radial-gradient(circle, rgba(212,175,55,0.1) 1.5px, transparent 1.5px)', patternSize: '60px 60px' },
    6: { gradient: 'linear-gradient(160deg, #1E1A35 0%, #252040 30%, #1A1630 60%, #151230 100%)', pattern: 'linear-gradient(135deg, rgba(212,175,55,0.04) 25%, transparent 25%, transparent 50%, rgba(212,175,55,0.04) 50%)', patternSize: '40px 40px' },
    7: { gradient: 'linear-gradient(180deg, #1A1838 0%, #221E42 25%, #1E1A3D 50%, #151230 100%)', pattern: 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 50%)', patternSize: '80px 80px' },
    8: { gradient: 'linear-gradient(180deg, #1E1A30 0%, #2A2345 20%, #1E1835 50%, #181530 80%, #121028 100%)', pattern: 'radial-gradient(circle, rgba(212,175,55,0.12) 1px, transparent 1px)', patternSize: '50px 50px' },
    9: { gradient: 'linear-gradient(180deg, #1A1535 0%, #2B2250 20%, #221D45 40%, #1A1540 60%, #0E0C25 100%)', pattern: 'radial-gradient(circle, rgba(232,200,74,0.15) 1px, transparent 1px)', patternSize: '50px 50px' },
  };
  return bgs[stage] ?? bgs[1];
}

function App() {
  const {
    stateRef, handleTouch, purchaseFacility, purchaseBuff, handleVipClick,
    resetGame, coinsDisplayRef, cpsDisplayRef, evolutionEffect, clearEvolutionEffect, vipState,
  } = useGameEngine();

  const [touchEffects, setTouchEffects] = useState<TouchEffect[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const shakeTimeoutRef = useRef<number>(0);
  const [shaking, setShaking] = useState(false);
  const currentStage = EVOLUTION_STAGES[stateRef.current.evolutionStage - 1];

  const onTouch = useCallback((x: number, y: number) => {
    const touchPower = stateRef.current.touchPower;
    handleTouch(x, y);
    setTouchEffects((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, x, y, amount: touchPower }]);
    setShaking(true);
    if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    shakeTimeoutRef.current = window.setTimeout(() => setShaking(false), 50);
    if (stateRef.current.isGameOver && !isGameOver) setIsGameOver(true);
  }, [handleTouch, stateRef, isGameOver]);

  const handleEffectComplete = useCallback((id: string) => {
    setTouchEffects((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleEvolutionComplete = useCallback(() => {
    clearEvolutionEffect();
    if (stateRef.current.isGameOver && !isGameOver) setIsGameOver(true);
  }, [clearEvolutionEffect, stateRef, isGameOver]);

  const handleReset = useCallback(() => {
    resetGame(); setIsGameOver(false); setTouchEffects([]);
  }, [resetGame]);

  const stageBg = getStageBackground(stateRef.current.evolutionStage);

  return (
    <div
      className={`h-[100dvh] w-full flex flex-col overflow-hidden relative${shaking ? ' shake' : ''}`}
      style={{ background: stageBg.gradient, transition: 'background 1.5s ease-in-out' }}
    >
      {/* 배경 패턴 */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }}>
        <div className="absolute inset-0" style={{ backgroundImage: stageBg.pattern, backgroundSize: stageBg.patternSize }} />
      </div>

      {/* ═══ 섹션 1: 인포 바 (약 8%) ═══ */}
      <section className="relative z-10 flex-shrink-0 px-4 pt-3 pb-1">
        {/* 메인 인포 라인 */}
        <div className="flex items-center justify-between">
          <TimerBar stateRef={stateRef} />
          <div className="flex items-center gap-1">
            <span className="text-purple-light text-sm font-medium">{currentStage?.stage ?? 1}단계</span>
            <span className="text-gold font-bold text-lg">{currentStage?.name ?? '노점'}</span>
          </div>
          <div className="text-gold-light text-sm font-medium">
            <span ref={cpsDisplayRef}>0원</span>/초
          </div>
        </div>
        {/* 진행률 */}
        <div className="mt-1">
          <EvolutionDisplay stateRef={stateRef} />
        </div>
      </section>

      {/* ═══ 섹션 2: 게임 화면 (약 45%) ═══ */}
      <section className="relative z-10" style={{ height: '45%' }}>
        <TouchArea onTouch={onTouch}>
          {/* 건물 풍경 - 전체 영역 (여백 살짝) */}
          <div className="absolute inset-2 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
            <BuildingDisplay evolutionStage={stateRef.current.evolutionStage} />
          </div>

          {/* 재화 표시 - 하단에 배경 박스로 분리하여 겹침 방지 */}
          <div className="absolute bottom-5 left-0 right-0 flex flex-col items-center pointer-events-none z-20">
            <div className="bg-dark-navy/75 backdrop-blur-sm px-6 py-2 rounded-full border border-gold/30 shadow-lg">
              <p className="text-gold text-3xl font-extrabold drop-shadow-lg leading-none text-center">
                <span ref={coinsDisplayRef}>0원</span>
              </p>
            </div>
            <p className="text-purple-light text-sm mt-1.5 opacity-80 text-center">
              터치하여 매출을 올리세요!
            </p>
          </div>

          <TouchEffectLayer effects={touchEffects} onEffectComplete={handleEffectComplete} />
          <VIPOverlay vipState={vipState} onVipClick={handleVipClick} currentCps={stateRef.current.cps} />
        </TouchArea>
      </section>

      {/* ═══ 섹션 3: 하단 상점 메뉴 (약 47%) ═══ */}
      <section className="relative z-10 flex-1 min-h-0 bg-dark-navy-light/60 border-t border-purple/20 backdrop-blur-sm">
        <div className="px-4 py-3 h-full">
          <StorePanel stateRef={stateRef} purchaseFacility={purchaseFacility} purchaseBuff={purchaseBuff} />
        </div>
      </section>

      {/* 오버레이들 */}
      {evolutionEffect && <EvolutionOverlay effect={evolutionEffect} onComplete={handleEvolutionComplete} />}
      {isGameOver && (
        <EndingPopup clearTime={stateRef.current.elapsedTime} totalEarned={stateRef.current.totalEarned} touchCount={stateRef.current.touchCount} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
