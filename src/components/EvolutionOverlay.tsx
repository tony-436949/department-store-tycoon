import { useEffect, useRef, useCallback } from 'react';
import type { EvolutionEffectType } from '../types';

/**
 * EvolutionOverlay - 8종 진화 연출 컴포넌트
 *
 * CSS keyframes 기반 연출 (6종) + Canvas 2D 파티클 연출 (2종)
 * - dust-cloud: 먼지구름 (1→2단계)
 * - neon-sign: 네온간판 점등 (2→3단계)
 * - lens-flare: 렌즈플레어 (3→4단계)
 * - zoom-out: 줌아웃 (4→5단계)
 * - marble-wipe: 대리석 와이프 (5→6단계)
 * - panorama: 파노라마 (6→7단계)
 * - gold-particle: 골드 파티클 (7→8단계) [Canvas 2D]
 * - firework-hologram: 폭죽+홀로그램 (8→9단계) [Canvas 2D + CSS]
 *
 * Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 12.3
 */

interface EvolutionOverlayProps {
  effect: EvolutionEffectType;
  onComplete: () => void;
}

// 효과별 지속 시간 (ms)
const EFFECT_DURATIONS: Record<EvolutionEffectType, number> = {
  'dust-cloud': 1500,
  'neon-sign': 1500,
  'lens-flare': 1500,
  'zoom-out': 2000,
  'marble-wipe': 2000,
  'panorama': 2000,
  'gold-particle': 3000,
  'firework-hologram': 3000,
};

export function EvolutionOverlay({ effect, onComplete }: EvolutionOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, EFFECT_DURATIONS[effect]);

    return () => clearTimeout(timer);
  }, [effect, onComplete]);

  return (
    <div className="evolution-overlay">
      {effect === 'dust-cloud' && <DustCloudEffect />}
      {effect === 'neon-sign' && <NeonSignEffect />}
      {effect === 'lens-flare' && <LensFlareEffect />}
      {effect === 'zoom-out' && <ZoomOutEffect />}
      {effect === 'marble-wipe' && <MarbleWipeEffect />}
      {effect === 'panorama' && <PanoramaEffect />}
      {effect === 'gold-particle' && <GoldParticleEffect />}
      {effect === 'firework-hologram' && <FireworkHologramEffect />}
    </div>
  );
}

// ─── CSS-based Effects ──────────────────────────────────────────

/** 먼지구름 (1→2단계): Brown/tan 먼지 파티클 소용돌이 */
function DustCloudEffect() {
  return (
    <div className="evo-dust-cloud">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="evo-dust-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 0.4}s`,
            width: `${20 + Math.random() * 40}px`,
            height: `${20 + Math.random() * 40}px`,
            opacity: 0.4 + Math.random() * 0.4,
          }}
        />
      ))}
    </div>
  );
}

/** 네온간판 점등 (2→3단계): 네온 글로우 플리커링 */
function NeonSignEffect() {
  return (
    <div className="evo-neon-sign">
      <div className="evo-neon-text">OPEN</div>
      <div className="evo-neon-glow" />
    </div>
  );
}

/** 렌즈플레어 (3→4단계): 중앙에서 확장되는 밝은 빛 */
function LensFlareEffect() {
  return (
    <div className="evo-lens-flare">
      <div className="evo-flare-core" />
      <div className="evo-flare-ring" />
      <div className="evo-flare-streak" />
    </div>
  );
}

/** 줌아웃 (4→5단계): 스케일 다운 + 뷰포트 확장 느낌 */
function ZoomOutEffect() {
  return (
    <div className="evo-zoom-out">
      <div className="evo-zoom-frame" />
    </div>
  );
}

/** 대리석 와이프 (5→6단계): 대리석 텍스처 화면 쓸기 */
function MarbleWipeEffect() {
  return (
    <div className="evo-marble-wipe">
      <div className="evo-marble-surface" />
    </div>
  );
}

/** 파노라마 (6→7단계): 넓은 스위핑 파노라마 효과 */
function PanoramaEffect() {
  return (
    <div className="evo-panorama">
      <div className="evo-panorama-sweep" />
    </div>
  );
}

// ─── Canvas 2D Effects ──────────────────────────────────────────

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;
  gravity: number;
}

/** 골드 파티클 (7→8단계): Canvas 2D 골드 파티클 폭발/비 */
function GoldParticleEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const goldColors = ['#D4AF37', '#E8C84A', '#FFD700', '#B8941F', '#F0E68C'];

    // 초기 폭발 파티클 생성
    for (let i = 0; i < 80; i++) {
      const angle = (Math.PI * 2 * i) / 80 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        life: 1,
        maxLife: 1,
        color: goldColors[Math.floor(Math.random() * goldColors.length)],
        gravity: 0.05 + Math.random() * 0.05,
      });
    }

    // 비처럼 내리는 파티클 (지속 생성)
    let frameCount = 0;

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      frameCount++;

      // 매 3프레임마다 새 파티클 추가 (비 효과)
      if (frameCount % 3 === 0 && frameCount < 120) {
        particles.push({
          x: Math.random() * canvas!.width,
          y: -10,
          vx: (Math.random() - 0.5) * 1,
          vy: 2 + Math.random() * 3,
          size: 1.5 + Math.random() * 3,
          life: 1,
          maxLife: 1,
          color: goldColors[Math.floor(Math.random() * goldColors.length)],
          gravity: 0.02,
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.life -= 0.012;

        if (p.life <= 0 || p.y > canvas!.height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx!.globalAlpha = p.life;
        ctx!.fillStyle = p.color;
        ctx!.shadowColor = p.color;
        ctx!.shadowBlur = 6;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;

      if (particles.length > 0) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    draw();
  }, []);

  useEffect(() => {
    animate();
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="evo-canvas"
      aria-hidden="true"
    />
  );
}

/** 폭죽+홀로그램 (8→9단계): Canvas 폭죽 + CSS 홀로그램 shimmer */
function FireworkHologramEffect() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const fireworkColors = [
      '#D4AF37', '#E8C84A', '#FFD700',
      '#8E44AD', '#A855C7', '#C084FC',
      '#FF6B6B', '#4ECDC4', '#FFFFFF',
    ];

    // 여러 지점에서 폭죽 발사
    const launchPoints = [
      { x: canvas.width * 0.2, y: canvas.height * 0.3 },
      { x: canvas.width * 0.5, y: canvas.height * 0.25 },
      { x: canvas.width * 0.8, y: canvas.height * 0.35 },
      { x: canvas.width * 0.35, y: canvas.height * 0.4 },
      { x: canvas.width * 0.65, y: canvas.height * 0.2 },
    ];

    let currentLaunch = 0;
    let frameCount = 0;

    function launchFirework(cx: number, cy: number) {
      const count = 40 + Math.floor(Math.random() * 30);
      const baseColor = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
        const speed = 1.5 + Math.random() * 4;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.5 + Math.random() * 3,
          life: 1,
          maxLife: 1,
          color: baseColor,
          gravity: 0.03 + Math.random() * 0.02,
        });
      }
    }

    function draw() {
      ctx!.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      frameCount++;

      // 순차적으로 폭죽 발사
      if (frameCount % 30 === 0 && currentLaunch < launchPoints.length) {
        const pt = launchPoints[currentLaunch];
        launchFirework(pt.x, pt.y);
        currentLaunch++;
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.vx *= 0.98;
        p.life -= 0.015;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx!.globalAlpha = p.life;
        ctx!.fillStyle = p.color;
        ctx!.shadowColor = p.color;
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx!.fill();

        // 꼬리 효과
        ctx!.globalAlpha = p.life * 0.3;
        ctx!.beginPath();
        ctx!.arc(p.x - p.vx, p.y - p.vy, p.size * p.life * 0.6, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
      ctx!.shadowBlur = 0;

      if (particles.length > 0 || currentLaunch < launchPoints.length) {
        animRef.current = requestAnimationFrame(draw);
      }
    }

    // 첫 폭죽 즉시 발사
    launchFirework(launchPoints[0].x, launchPoints[0].y);
    currentLaunch = 1;
    draw();
  }, []);

  useEffect(() => {
    animate();
    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [animate]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="evo-canvas"
        aria-hidden="true"
      />
      {/* 홀로그램 shimmer 오버레이 */}
      <div className="evo-firework-hologram-shimmer" />
    </>
  );
}
