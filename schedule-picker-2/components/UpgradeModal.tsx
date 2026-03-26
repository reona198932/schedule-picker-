'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';

interface UpgradeModalProps {
  show: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ show, onClose }: UpgradeModalProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  if (!show) return null;

  async function handleUpgrade() {
    if (!user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px',
          width: '90%', textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✨</div>
        <h2 style={{ fontSize: '22px', marginBottom: '8px', fontWeight: 700 }}>{t.upgradeTitle}</h2>
        <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>{t.upgradeDesc}</p>

        <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, marginBottom: '24px' }}>
          {t.upgradeBenefits.map((b, i) => (
            <li key={i} style={{ padding: '6px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#34a853', fontWeight: 700 }}>✓</span> {b}
            </li>
          ))}
        </ul>

        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            background: '#4285f4', color: '#fff', border: 'none', borderRadius: '8px',
            padding: '14px 32px', fontSize: '16px', fontWeight: 600, cursor: 'pointer',
            width: '100%', opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? '...' : t.upgradeBtn}
        </button>

        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#999', marginTop: '12px',
            cursor: 'pointer', fontSize: '13px',
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
