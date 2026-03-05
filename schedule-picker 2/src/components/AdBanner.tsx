'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';

interface AdBannerProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  style?: React.CSSProperties;
  className?: string;
}

export default function AdBanner({ slot, format = 'auto', style, className }: AdBannerProps) {
  const { userData } = useAuth();
  const { t } = useLocale();
  const adRef = useRef<HTMLDivElement>(null);

  const showAds = !userData || userData.plan === 'free';

  useEffect(() => {
    if (!showAds) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch {
      // AdSense not loaded
    }
  }, [showAds]);

  if (!showAds) return null;

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // AdSenseが設定されていない場合はプレースホルダー表示
  if (!clientId) {
    return (
      <div
        className={className}
        style={{
          background: '#f0f0f0',
          border: '1px dashed #ccc',
          padding: '8px',
          textAlign: 'center',
          color: '#999',
          fontSize: '12px',
          ...style,
        }}
      >
        {t.adLabel}
      </div>
    );
  }

  return (
    <div ref={adRef} className={className} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
