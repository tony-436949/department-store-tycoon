import { useEffect, useRef, useState } from 'react';

/**
 * BuildingDisplay - 진화 단계별 배경 이미지 표시
 *
 * public/stage-1.png ~ stage-9.png 이미지를 사용.
 * 단계 전환 시 페이드 트랜지션.
 */

interface BuildingDisplayProps {
  evolutionStage: number; // 1~9
}

export function BuildingDisplay({ evolutionStage }: BuildingDisplayProps) {
  const [displayStage, setDisplayStage] = useState(evolutionStage);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevStageRef = useRef(evolutionStage);

  useEffect(() => {
    if (evolutionStage !== prevStageRef.current) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayStage(evolutionStage);
        setIsTransitioning(false);
      }, 300);
      prevStageRef.current = evolutionStage;
      return () => clearTimeout(timer);
    }
  }, [evolutionStage]);

  return (
    <div className="w-full h-full relative">
      <img
        src={`/stage-${displayStage}.png`}
        alt={`${displayStage}단계`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transition: 'opacity 0.4s ease, transform 0.4s ease',
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(1.05)' : 'scale(1)',
        }}
      />
    </div>
  );
}
