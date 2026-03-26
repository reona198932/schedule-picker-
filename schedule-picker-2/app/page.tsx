'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import Header from '@/components/Header';
import Calendar, { Selection } from '@/components/Calendar';
import SelectionList from '@/components/SelectionList';
import TextGenerator from '@/components/TextGenerator';
import AdBanner from '@/components/AdBanner';
import Interstitial from '@/components/Interstitial';
import UpgradeModal from '@/components/UpgradeModal';

function SchedulePickerApp() {
  const { user, userData, signIn } = useAuth();
  const { t } = useLocale();

  const [selections, setSelections] = useState<Selection[]>([]);
  const [defaultMeetingType, setDefaultMeetingType] = useState<'online' | 'inperson'>('online');
  const [weekOffset, setWeekOffset] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Interstitial trigger counters
  const navCount = useRef(0);
  const selectionCount = useRef(0);

  const plan = userData?.plan || 'free';
  const showAds = !userData || plan === 'free';

  // Interstitial: 15秒後に表示（Freeユーザーのみ）
  useEffect(() => {
    if (!showAds) return;
    const timer = setTimeout(() => setShowInterstitial(true), 15000);
    return () => clearTimeout(timer);
  }, [showAds]);

  // Navigation時のInterstitialトリガー
  function handleWeekChange(offset: number) {
    setWeekOffset(offset);
    if (showAds) {
      navCount.current++;
      if (navCount.current % 2 === 0) {
        setShowInterstitial(true);
      }
    }
  }

  // 選択変更時のInterstitialトリガー
  function handleSelectionsChange(newSel: Selection[]) {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    setSelections(newSel);
    if (showAds && newSel.length > selections.length) {
      selectionCount.current++;
      if (selectionCount.current % 3 === 0) {
        setShowInterstitial(true);
      }
    }
  }

  function handleRemoveSelection(id: string) {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  }

  function handleToggleType(id: string) {
    setSelections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, meetingType: s.meetingType === 'online' ? 'inperson' : 'online' } : s
      )
    );
  }

  function handleClearAll() {
    setSelections([]);
  }

  // 今日に戻る
  function handleToday() {
    setWeekOffset(0);
  }

  // 週のラベル
  function getWeekLabel(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1 + weekOffset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
    return t.weekLabel.replace('{start}', fmt(monday)).replace('{end}', fmt(sunday));
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: showAds ? '70px' : '0' }}>
      <Header onUpgradeClick={() => setShowUpgrade(true)} />

      {/* Top ad banner */}
      {showAds && (
        <AdBanner slot="top-banner" format="horizontal" style={{ maxHeight: '90px' }} />
      )}

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px' }}>
        {/* Left: Calendar */}
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #dadce0', overflow: 'hidden' }}>
          {/* Calendar toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #eee',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleToday}
                style={{
                  background: '#fff', border: '1px solid #dadce0', borderRadius: '6px',
                  padding: '4px 12px', fontSize: '13px', cursor: 'pointer',
                }}
              >
                {t.today}
              </button>
              <button
                onClick={() => handleWeekChange(weekOffset - 1)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}
              >
                ‹
              </button>
              <button
                onClick={() => handleWeekChange(weekOffset + 1)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#666' }}
              >
                ›
              </button>
              <span style={{ fontSize: '15px', fontWeight: 600 }}>{getWeekLabel()}</span>
            </div>

            {/* Default meeting type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#666' }}>{t.defaultMeetingType}:</span>
              <button
                onClick={() => setDefaultMeetingType('online')}
                style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: defaultMeetingType === 'online' ? 'rgba(26,115,232,0.15)' : '#f1f3f4',
                  color: defaultMeetingType === 'online' ? '#1a73e8' : '#666',
                }}
              >
                {t.online}
              </button>
              <button
                onClick={() => setDefaultMeetingType('inperson')}
                style={{
                  padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: defaultMeetingType === 'inperson' ? 'rgba(232,113,10,0.15)' : '#f1f3f4',
                  color: defaultMeetingType === 'inperson' ? '#e8710a' : '#666',
                }}
              >
                {t.inPerson}
              </button>
            </div>
          </div>

          <Calendar
            selections={selections}
            onSelectionsChange={handleSelectionsChange}
            defaultMeetingType={defaultMeetingType}
            weekOffset={weekOffset}
          />
        </div>

        {/* Right: Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Side ad */}
          {showAds && (
            <AdBanner slot="sidebar-top" format="rectangle" style={{ minHeight: '100px' }} />
          )}

          {/* Selection list */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #dadce0' }}>
            <SelectionList
              selections={selections}
              onRemove={handleRemoveSelection}
              onToggleType={handleToggleType}
              onClear={handleClearAll}
            />
          </div>

          {/* Middle ad */}
          {showAds && (
            <AdBanner slot="sidebar-mid" format="rectangle" style={{ minHeight: '80px' }} />
          )}

          {/* Text generator */}
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #dadce0' }}>
            <TextGenerator selections={selections} />
          </div>

          {/* Bottom ad */}
          {showAds && (
            <AdBanner slot="sidebar-bottom" format="rectangle" style={{ minHeight: '100px' }} />
          )}
        </div>
      </main>

      {/* Sticky bottom ad + CTA */}
      {showAds && (
        <div className="ad-bottom-sticky">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <AdBanner slot="bottom-sticky" format="horizontal" style={{ flex: 1, maxWidth: '500px', maxHeight: '50px' }} />
            <button
              className="cta-btn"
              onClick={() => setShowUpgrade(true)}
              style={{
                background: '#4285f4', color: '#fff', border: 'none', borderRadius: '20px',
                padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t.upgrade} ✨
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <UpgradeModal show={showUpgrade} onClose={() => setShowUpgrade(false)} />
      <Interstitial
        show={showInterstitial}
        onClose={() => setShowInterstitial(false)}
        onUpgrade={() => { setShowInterstitial(false); setShowUpgrade(true); }}
      />

      {/* Login prompt */}
      {showLoginPrompt && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowLoginPrompt(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: '16px', padding: '32px',
              maxWidth: '360px', width: '90%', textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>{t.loginRequired}</h2>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>{t.loginDesc}</p>
            <button
              onClick={() => { setShowLoginPrompt(false); signIn(); }}
              style={{
                background: '#fff', border: '1px solid #dadce0', borderRadius: '8px',
                padding: '12px 24px', fontSize: '15px', cursor: 'pointer', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: '10px', margin: '0 auto',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {t.login}
            </button>
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          main {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function Page() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <SchedulePickerApp />
      </AuthProvider>
    </LocaleProvider>
  );
}
