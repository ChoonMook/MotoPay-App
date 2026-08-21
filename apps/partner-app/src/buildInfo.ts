// 웹 번들 빌드 시각 - vite.config.ts의 define으로 빌드 시점에 자동 삽입됨(내 정보 "빌드버전" 표시용)
declare const __BUILD_TIME__: string;

export const BUILD_TIME = __BUILD_TIME__;
