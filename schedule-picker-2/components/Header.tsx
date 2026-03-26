'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';

interface HeaderProps {
  onUpgradeClick: () => void;
}

export default function Header({ onUpgradeClick }: HeaderProps) {
  const { user, userData, loading, signIn, signOutUser } = useAuth();
  const { t, locale, setLocale } = useLocale();

  const plan = userData?.plan || 'free';
  const usage = userData?.monthlyUsage || 0;

  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid #dadce0', padding: '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap', gap: '8px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color: '#4285f4', letterSpacing: '-0.5px' }}>
          {t.appName}<span style={{ color: '#333', fontWeight: 400 }}> </span>
        </span>
        {user && (
          <span style={{
            background: plan === 'admin' ? '#e8f5e9' : plan === 'premium' ? '#e8f0fe' : '#fef7e0',
            color: plan === 'admin' ? '#2e7d32' : plan === 'premium' ? '#1a73e8' : '#b06000',
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
          }}>
            {plan === 'admin' ? t.adminPlan : plan === 'premium' ? t.premiumPlan : t.freePlan}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {/* 使用量表示 */}
        {user && plan === 'free' && (
          <span style={{ fontSize: '12px', color: '#666' }}>
            {t.usageCount.replace('{used}', String(usage)).replace('{limit}', '5')}
          </span>
        )}
        {user && plan !== 'free' && (
          <span style={{ fontSize: '12px', color: '#34a853' }}>
            {t.unlimited}
          </span>
        )}

        {/* Language toggle */}
        <button
          onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
          style={{
            background: '#f1f3f4', border: 'none', borderRadius: '16px',
            padding: '4px 12px', fontSize: '12px', cursor: 'pointer', fontWeight: 500,
          }}
        >
          {locale === 'ja' ? 'EN' : 'JA'}
        </button>

        {/* Upgrade button */}
        {user && plan === 'free' && (
          <button
            onClick={onUpgradeClick}
            style={{
              background: '#4285f4', color: '#fff', border: 'none', borderRadius: '20px',
              padding: '6px 16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t.upgrade}
          </button>
        )}

        {/* Auth button */}
        {loading ? null : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>{user.displayName}</span>
            <button
              onClick={signOutUser}
              style={{
                background: 'none', border: '1px solid #dadce0', borderRadius: '20px',
                padding: '4px 12px', fontSize: '12px', cursor: 'pointer', color: '#666',
              }}
            >
              {t.logout}
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            style={{
              background: '#fff', border: '1px solid #dadce0', borderRadius: '20px',
              padding: '6px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {t.login}
          </button>
        )}
      </div>
    </header>
  );
}
