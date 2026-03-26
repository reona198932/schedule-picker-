import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SchedulePicker - スケジュール調整ツール',
  description: 'ドラッグで空き時間を選んでテキスト化。Google Calendarと連携してスケジュール調整を簡単に。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <html lang="ja">
      <head>
        {adsenseId && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
