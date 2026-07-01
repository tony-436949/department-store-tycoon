/**
 * Tailwind CSS 커스텀 테마 설정
 * 
 * 백화점 타이쿤 컬러 팔레트:
 * - 배경색: #1A162B (다크 네이비)
 * - 포인트색: #D4AF37 (골드)
 * - 보조색: #8E44AD (퍼플)
 * 
 * Note: Tailwind CSS v4에서는 테마 설정이 CSS @theme 지시어로 처리됩니다.
 * 이 파일은 테마 참조 문서 역할을 합니다.
 * 실제 테마 적용은 src/index.css의 @theme 블록에서 이루어집니다.
 */

export const theme = {
  colors: {
    'dark-navy': {
      DEFAULT: '#1A162B',
      light: '#2A2540',
    },
    'gold': {
      DEFAULT: '#D4AF37',
      light: '#E8C84A',
      dark: '#B8941F',
    },
    'purple': {
      DEFAULT: '#8E44AD',
      light: '#A855C7',
      dark: '#6C2D84',
    },
  },
} as const;

export default theme;
