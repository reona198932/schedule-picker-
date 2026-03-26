'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';

interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
}

export interface Selection {
  id: string;
  day: number; // 0-6
  startSlot: number;
  endSlot: number;
  meetingType: 'online' | 'inperson';
  date: Date;
}

interface CalendarProps {
  selections: Selection[];
  onSelectionsChange: (sel: Selection[]) => void;
  defaultMeetingType: 'online' | 'inperson';
  weekOffset: number;
}

const START_HOUR = 8;
const END_HOUR = 22;
const SLOTS = (END_HOUR - START_HOUR) * 2; // 30min slots
const SLOT_HEIGHT = 28;

export default function Calendar({ selections, onSelectionsChange, defaultMeetingType, weekOffset }: CalendarProps) {
  const { t, locale } = useLocale();
  const { calendarAccessToken } = useAuth();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDay, setDragDay] = useState(-1);
  const [dragStart, setDragStart] = useState(-1);
  const [dragEnd, setDragEnd] = useState(-1);
  const gridRef = useRef<HTMLDivElement>(null);

  const dayNames = [t.sun, t.mon, t.tue, t.wed, t.thu, t.fri, t.sat];

  // 週の日付を計算
  const getWeekDates = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1 + weekOffset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const weekDates = getWeekDates();

  // Calendar APIからイベント取得
  useEffect(() => {
    if (!calendarAccessToken) return;
    const timeMin = weekDates[0].toISOString();
    const lastDay = new Date(weekDates[6]);
    lastDay.setHours(23, 59, 59);
    const timeMax = lastDay.toISOString();

    fetch(`/api/calendar?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`, {
      headers: { 'X-Google-Access-Token': calendarAccessToken },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.events) setCalendarEvents(data.events);
      })
      .catch(console.error);
  }, [calendarAccessToken, weekOffset]);

  // 特定のスロットにイベントがあるか
  function getEventAtSlot(dayIndex: number, slotIndex: number): CalendarEvent | null {
    const date = weekDates[dayIndex];
    const slotTime = new Date(date);
    slotTime.setHours(START_HOUR + Math.floor(slotIndex / 2), (slotIndex % 2) * 30, 0, 0);
    const slotEnd = new Date(slotTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    for (const event of calendarEvents) {
      const evStart = new Date(event.start);
      const evEnd = new Date(event.end);
      if (slotTime < evEnd && slotEnd > evStart) return event;
    }
    return null;
  }

  // 選択中のスロットか
  function isSelected(dayIndex: number, slotIndex: number): Selection | null {
    return selections.find((s) =>
      s.day === dayIndex && slotIndex >= s.startSlot && slotIndex <= s.endSlot
    ) || null;
  }

  // ドラッグ中のスロットか
  function isDragSelected(dayIndex: number, slotIndex: number): boolean {
    if (!isDragging || dayIndex !== dragDay) return false;
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);
    return slotIndex >= min && slotIndex <= max;
  }

  function getSlotFromY(clientY: number): number {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(0, Math.min(SLOTS - 1, Math.floor(y / SLOT_HEIGHT)));
  }

  function handleMouseDown(dayIndex: number, slotIndex: number, e: React.MouseEvent) {
    e.preventDefault();
    setIsDragging(true);
    setDragDay(dayIndex);
    setDragStart(slotIndex);
    setDragEnd(slotIndex);
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    const slot = getSlotFromY(e.clientY);
    setDragEnd(slot);
  }

  function handleMouseUp() {
    if (!isDragging) return;
    setIsDragging(false);
    const min = Math.min(dragStart, dragEnd);
    const max = Math.max(dragStart, dragEnd);

    const newSel: Selection = {
      id: `${Date.now()}-${Math.random()}`,
      day: dragDay,
      startSlot: min,
      endSlot: max,
      meetingType: defaultMeetingType,
      date: weekDates[dragDay],
    };

    onSelectionsChange([...selections, newSel]);
  }

  function formatTime(slot: number): string {
    const h = START_HOUR + Math.floor(slot / 2);
    const m = (slot % 2) * 30;
    return `${h}:${m.toString().padStart(2, '0')}`;
  }

  function formatDateHeader(date: Date, dayIndex: number): string {
    const dayName = dayNames[(dayIndex + 1) % 7]; // Monday start
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}(${dayName})`;
  }

  // Touch support
  function handleTouchStart(dayIndex: number, slotIndex: number, e: React.TouchEvent) {
    e.preventDefault();
    setIsDragging(true);
    setDragDay(dayIndex);
    setDragStart(slotIndex);
    setDragEnd(slotIndex);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const slot = getSlotFromY(touch.clientY);
    setDragEnd(slot);
  }

  function handleTouchEnd() {
    handleMouseUp();
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, 1fr)`, gap: 0 }}>
        <div style={{ padding: '8px 4px', fontSize: '12px', color: '#999' }} />
        {weekDates.map((date, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              style={{
                padding: '8px 4px', textAlign: 'center', fontSize: '12px', fontWeight: 600,
                color: isToday ? '#4285f4' : '#333',
                borderBottom: isToday ? '2px solid #4285f4' : '1px solid #eee',
              }}
            >
              {formatDateHeader(date, i)}
            </div>
          );
        })}
      </div>

      {/* Time grid */}
      <div
        ref={gridRef}
        style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, 1fr)`, position: 'relative', userSelect: 'none' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {Array.from({ length: SLOTS }, (_, slotIdx) => (
          <>
            {/* Time label */}
            <div
              key={`t-${slotIdx}`}
              style={{
                height: SLOT_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                paddingRight: '8px', fontSize: '11px', color: '#999',
                borderTop: slotIdx % 2 === 0 ? '1px solid #eee' : 'none',
              }}
            >
              {slotIdx % 2 === 0 ? formatTime(slotIdx) : ''}
            </div>
            {/* Day columns */}
            {Array.from({ length: 7 }, (_, dayIdx) => {
              const event = getEventAtSlot(dayIdx, slotIdx);
              const sel = isSelected(dayIdx, slotIdx);
              const dragSel = isDragSelected(dayIdx, slotIdx);
              const isOnline = sel?.meetingType === 'online';

              let bg = '#fff';
              let borderLeft = 'none';
              if (event) {
                bg = 'rgba(234, 67, 53, 0.08)';
                borderLeft = '3px solid #ea4335';
              } else if (sel) {
                bg = isOnline ? 'rgba(26, 115, 232, 0.12)' : 'rgba(232, 113, 10, 0.12)';
                borderLeft = isOnline ? '3px solid #1a73e8' : '3px solid #e8710a';
              } else if (dragSel) {
                bg = defaultMeetingType === 'online'
                  ? 'rgba(26, 115, 232, 0.08)'
                  : 'rgba(232, 113, 10, 0.08)';
              }

              return (
                <div
                  key={`${slotIdx}-${dayIdx}`}
                  style={{
                    height: SLOT_HEIGHT, background: bg, borderLeft,
                    borderTop: slotIdx % 2 === 0 ? '1px solid #f0f0f0' : '1px solid #f8f8f8',
                    borderRight: '1px solid #f8f8f8', cursor: event ? 'not-allowed' : 'crosshair',
                    position: 'relative', transition: 'background 0.1s',
                  }}
                  onMouseDown={(e) => !event && handleMouseDown(dayIdx, slotIdx, e)}
                  onTouchStart={(e) => !event && handleTouchStart(dayIdx, slotIdx, e)}
                >
                  {event && slotIdx === 0 && (
                    <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '10px', color: '#ea4335', fontWeight: 500 }}>
                      {event.summary}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
