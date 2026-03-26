'use client';

import { useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Selection } from './Calendar';

interface TextGeneratorProps {
  selections: Selection[];
}

type Template = 'standard' | 'polite' | 'simple' | 'english';
const START_HOUR = 8;

function formatTime(slot: number): string {
  const h = START_HOUR + Math.floor(slot / 2);
  const m = (slot % 2) * 30;
  return `${h}:${m.toString().padStart(2, '0')}`;
}

export default function TextGenerator({ selections }: TextGeneratorProps) {
  const { t, locale } = useLocale();
  const [template, setTemplate] = useState<Template>('standard');
  const [copied, setCopied] = useState(false);

  const dayNamesJa = ['日', '月', '火', '水', '木', '金', '土'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function generateText(): string {
    if (selections.length === 0) return '';

    const sorted = [...selections].sort((a, b) => {
      if (a.date.getTime() !== b.date.getTime()) return a.date.getTime() - b.date.getTime();
      return a.startSlot - b.startSlot;
    });

    // 日付でグループ化
    const grouped = new Map<string, Selection[]>();
    for (const sel of sorted) {
      const key = sel.date.toDateString();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(sel);
    }

    const lines: string[] = [];

    switch (template) {
      case 'standard':
        lines.push('以下の日程で調整可能です：', '');
      for (const [, sels] of Array.from(grouped)) {
          const date = sels[0].date;
          const m = date.getMonth() + 1;
          const d = date.getDate();
          const dayName = dayNamesJa[date.getDay()];
          for (const s of sels) {
            const typeLabel = s.meetingType === 'online' ? '【オンライン】' : '【対面】';
            lines.push(`・${m}月${d}日(${dayName}) ${formatTime(s.startSlot)}〜${formatTime(s.endSlot + 1)} ${typeLabel}`);
          }
        }
        lines.push('', 'ご都合の良い日時をお知らせください。');
        break;

      case 'polite':
        lines.push('お忙しいところ恐れ入ります。', '下記の日程にて、ご都合いかがでしょうか。', '');
        for (const [, sels] of Array.from(grouped)) {
          const date = sels[0].date;
          const m = date.getMonth() + 1;
          const d = date.getDate();
          const dayName = dayNamesJa[date.getDay()];
          for (const s of sels) {
            const typeLabel = s.meetingType === 'online' ? '（オンライン）' : '（対面）';
            lines.push(`　${m}月${d}日(${dayName}) ${formatTime(s.startSlot)}〜${formatTime(s.endSlot + 1)} ${typeLabel}`);
          }
        }
        lines.push('', 'お手数ですが、ご確認のほどよろしくお願いいたします。');
        break;

      case 'simple':
        for (const [, sels] of Array.from(grouped)) {
          const date = sels[0].date;
          const m = date.getMonth() + 1;
          const d = date.getDate();
          const dayName = dayNamesJa[date.getDay()];
          for (const s of sels) {
            const type = s.meetingType === 'online' ? 'オンライン' : '対面';
            lines.push(`${m}/${d}(${dayName}) ${formatTime(s.startSlot)}-${formatTime(s.endSlot + 1)} [${type}]`);
          }
        }
        break;

      case 'english':
        lines.push('I am available at the following times:', '');
        for (const [, sels] of Array.from(grouped)) {
          const date = sels[0].date;
          const dayName = dayNamesEn[date.getDay()];
          const monthName = monthNamesEn[date.getMonth()];
          const d = date.getDate();
          for (const s of sels) {
            const type = s.meetingType === 'online' ? '[Online]' : '[In-Person]';
            lines.push(`- ${dayName}, ${monthName} ${d}: ${formatTime(s.startSlot)} - ${formatTime(s.endSlot + 1)} ${type}`);
          }
        }
        lines.push('', 'Please let me know which time works best for you.');
        break;
    }

    return lines.join('\n');
  }

  const text = generateText();

  async function handleCopy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const templates: { key: Template; label: string }[] = [
    { key: 'standard', label: t.templateStandard },
    { key: 'polite', label: t.templatePolite },
    { key: 'simple', label: t.templateSimple },
    { key: 'english', label: t.templateEnglish },
  ];

  return (
    <div>
      <h3 style={{ fontSize: '14px', fontWeight: 600, padding: '8px 12px', borderBottom: '1px solid #eee' }}>
        {t.generatedText}
      </h3>

      {/* Template tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', flexWrap: 'wrap' }}>
        {templates.map((tmpl) => (
          <button
            key={tmpl.key}
            onClick={() => setTemplate(tmpl.key)}
            style={{
              padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: template === tmpl.key ? '#4285f4' : '#f1f3f4',
              color: template === tmpl.key ? '#fff' : '#333',
            }}
          >
            {tmpl.label}
          </button>
        ))}
      </div>

      {/* Generated text */}
      <div style={{ padding: '8px 12px' }}>
        <pre style={{
          background: '#f8f9fa', borderRadius: '8px', padding: '12px',
          fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
          minHeight: '100px', color: text ? '#333' : '#999',
        }}>
          {text || t.noSelection}
        </pre>
      </div>

      {/* Copy button */}
      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={handleCopy}
          disabled={!text}
          style={{
            width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
            background: copied ? '#34a853' : text ? '#4285f4' : '#ddd',
            color: '#fff', fontSize: '14px', fontWeight: 600, cursor: text ? 'pointer' : 'default',
            transition: 'background 0.2s',
          }}
        >
          {copied ? t.copied : t.copy}
        </button>
      </div>
    </div>
  );
}
