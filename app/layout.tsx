import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'RandomTrip — 랜덤 여행지 추천',
  description: '어디 갈지 모르겠다면? 룰렛으로 여행지를 정해드립니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
