'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';

interface InterstitialProps {
  show: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function Interstitial({ show, onClose, onUpgrade }: InterstitialProps) {
  const [countdown, setCountdown] = useState(5);
  const { t } = useLocale();

  useEffect(() => {
    if (!show) {
      setCountdown(5);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [show]);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px', textAlign: 'center',
        maxWidth: '400px', width: '90%',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚡</div>
        <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>{t.interstitialTitle}</h2>
        <p style={{ color: '#666', marginBottom: '24px' }}>{t.upgradeDesc}</p>
        <button
          onClick={onUpgrade}
          style={{
            background: '#4285f4', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '12px 32px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            marginBottom: '16px', width: '100%',
          }}
        >
          {t.interstitialUpgrade}
        </button>
        <div>
          {countdown > 0 ? (
            <span style={{ color: '#999', fontSize: '14px' }}>
              {countdown}{t.interstitialSkip}
            </span>
          ) : (
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: '#666', cursor: 'pointer',
                fontSize: '14px', textDecoration: 'underline',
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
