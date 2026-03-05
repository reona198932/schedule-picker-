'use client';

import { useLocale } from '@/contexts/LocaleContext';
import { Selection } from './Calendar';

interface SelectionListProps {
  selections: Selection[];
  onRemove: (id: string) => void;
  onToggleType: (id: string) => void;
  onClear: () => void;
}

const START_HOUR = 8;

function formatTime(slot: number): string {
  const h = START_HOUR + Math.floor(slot / 2);
  const m = (slot % 2) * 30;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export default function SelectionList({ selections, onRemove, onToggleType, onClear }: SelectionListProps) {
  const { t, locale } = useLocale();
  const dayNames = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  if (selections.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
        {t.noSelection}
      </div>
    );
  }

  // 日付でソート
  const sorted = [...selections].sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
    return a.startSlot - b.startSlot;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
        <span style={{ fontWeight: 600, fontSize: '14px' }}>
          {t.selectedSlots} ({selections.length})
        </span>
        <button
          onClick={onClear}
          style={{
            background: 'none', border: 'none', color: '#ea4335', cursor: 'pointer',
            fontSize: '12px', fontWeight: 500,
          }}
        >
          {t.clearAll}
        </button>
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {sorted.map((sel) => {
          const date = sel.date;
          const m = date.getMonth() + 1;
          const d = date.getDate();
          const dayName = dayNames[date.getDay()];
          const isOnline = sel.meetingType === 'online';

          return (
            <div
              key={sel.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px',
                borderBottom: '1px solid #f0f0f0', fontSize: '13px',
              }}
            >
              <div style={{
                width: '4px', height: '24px', borderRadius: '2px',
                background: isOnline ? '#1a73e8' : '#e8710a',
              }} />
              <span style={{ flex: 1 }}>
                {m}/{d}({dayName}) {formatTime(sel.startSlot)}〜{formatTime(sel.endSlot + 1)}
              </span>
              <button
                onClick={() => onToggleType(sel.id)}
                style={{
                  background: isOnline ? 'rgba(26,115,232,0.1)' : 'rgba(232,113,10,0.1)',
                  color: isOnline ? '#1a73e8' : '#e8710a',
                  border: 'none', borderRadius: '4px', padding: '2px 8px',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {isOnline ? t.online : t.inPerson}
              </button>
              <button
                onClick={() => onRemove(sel.id)}
                style={{
                  background: 'none', border: 'none', color: '#999', cursor: 'pointer',
                  fontSize: '16px', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
