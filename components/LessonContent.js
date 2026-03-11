import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView
} from 'react-native';
import { getFlashcardAnswer } from '../lib/api';

// ── Bot Chip ──────────────────────────────────────────────────────────────────
function BotChip({ prompt, fact }) {
  const [state, setState] = useState('idle'); // idle | loading | done
  const [answer, setAnswer] = useState(null);

  const handleTap = async () => {
    if (state === 'done') { setState('idle'); setAnswer(null); return; }
    if (state === 'loading') return;
    setState('loading');
    try {
      const result = await getFlashcardAnswer(fact || prompt, prompt);
      if (!result.error) {
        setAnswer(result.answer);
        setState('done');
      } else {
        setState('idle');
      }
    } catch (e) {
      setState('idle');
    }
  };

  return (
    <View style={bot.wrapper}>
      <TouchableOpacity style={bot.chip} onPress={handleTap} activeOpacity={0.8}>
        <Text style={bot.avatar}>🤖</Text>
        <View style={bot.chipText}>
          <Text style={bot.chipLabel}>AmpliFI Bot</Text>
          <Text style={bot.chipPrompt} numberOfLines={state === 'done' ? undefined : 1}>
            {state === 'idle' && `💬 ${fact || 'Tap for a live fact'}`}
            {state === 'loading' && 'Fetching from knowledge base...'}
            {state === 'done' && answer}
          </Text>
        </View>
        {state === 'loading'
          ? <ActivityIndicator size="small" color="#4F46E5" />
          : <Text style={bot.arrow}>{state === 'done' ? '✕' : '›'}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

// ── Block Renderers ───────────────────────────────────────────────────────────
function TextBlock({ text }) {
  return <Text style={blocks.text}>{text}</Text>;
}

function KeyTermBlock({ term, definition }) {
  return (
    <View style={blocks.keytermRow}>
      <Text style={blocks.keytermTerm}>{term}</Text>
      <Text style={blocks.keytermDef}>{definition}</Text>
    </View>
  );
}

function BulletBlock({ items }) {
  return (
    <View style={blocks.bulletWrapper}>
      {items.map((item, i) => (
        <View key={i} style={blocks.bulletRow}>
          <Text style={blocks.bulletDot}>•</Text>
          <Text style={blocks.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function StepsBlock({ title, steps }) {
  return (
    <View style={blocks.stepsWrapper}>
      {title && <Text style={blocks.stepsTitle}>{title}</Text>}
      {steps.map((step, i) => (
        <View key={i} style={blocks.stepRow}>
          <View style={blocks.stepNum}>
            <Text style={blocks.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={blocks.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

function TableBlock({ headers, rows }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={blocks.tableScroll}>
      <View style={blocks.table}>
        {/* Header row */}
        <View style={blocks.tableHeaderRow}>
          {headers.map((h, i) => (
            <View key={i} style={blocks.tableHeaderCell}>
              <Text style={blocks.tableHeaderText}>{h}</Text>
            </View>
          ))}
        </View>
        {/* Data rows */}
        {rows.map((row, i) => (
          <View key={i} style={[blocks.tableRow, i % 2 === 1 && blocks.tableRowAlt]}>
            {row.map((cell, j) => (
              <View key={j} style={blocks.tableCell}>
                <Text style={blocks.tableCellText}>{cell}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function CalloutBlock({ variant, text }) {
  const config = {
    tip: { bg: '#FFFBEB', border: '#F59E0B', icon: '💡', label: 'Singapore Tip' },
    warning: { bg: '#FEF2F2', border: '#EF4444', icon: '⚠️', label: 'Watch Out' },
    info: { bg: '#EFF6FF', border: '#3B82F6', icon: 'ℹ️', label: 'Did You Know' },
    success: { bg: '#F0FDF4', border: '#22C55E', icon: '✅', label: 'Good Practice' },
  };
  const c = config[variant] || config.info;
  return (
    <View style={[blocks.callout, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
      <Text style={blocks.calloutIcon}>{c.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[blocks.calloutLabel, { color: c.border }]}>{c.label}</Text>
        <Text style={blocks.calloutText}>{text}</Text>
      </View>
    </View>
  );
}

function SectionHeadingBlock({ text }) {
  return <Text style={blocks.sectionHeading}>{text}</Text>;
}

// ── Main Renderer ─────────────────────────────────────────────────────────────
export default function LessonContent({ content }) {
  if (!content?.length) return (
    <Text style={{ color: '#9CA3AF', fontSize: 14, padding: 16 }}>
      No content available for this lesson yet.
    </Text>
  );

  return (
    <View style={{ gap: 12 }}>
      {content.map((block, i) => {
        switch (block.type) {
          case 'text':         return <TextBlock key={i} {...block} />;
          case 'keyterm':      return <KeyTermBlock key={i} {...block} />;
          case 'bullet':       return <BulletBlock key={i} {...block} />;
          case 'steps':        return <StepsBlock key={i} {...block} />;
          case 'table':        return <TableBlock key={i} {...block} />;
          case 'callout':      return <CalloutBlock key={i} {...block} />;
          case 'heading':      return <SectionHeadingBlock key={i} {...block} />;
          case 'bot':          return <BotChip key={i} {...block} />;
          default:             return null;
        }
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bot = StyleSheet.create({
  wrapper: { marginVertical: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#EEF2FF', borderRadius: 16,
    padding: 14, gap: 10, borderWidth: 1, borderColor: '#C7D2FE',
  },
  avatar: { fontSize: 22 },
  chipText: { flex: 1 },
  chipLabel: { fontSize: 10, fontWeight: '700', color: '#4F46E5', letterSpacing: 0.5, marginBottom: 2 },
  chipPrompt: { fontSize: 13, color: '#374151', lineHeight: 18 },
  arrow: { fontSize: 18, color: '#4F46E5', fontWeight: '700' },
});

const blocks = StyleSheet.create({
  // Text
  text: { fontSize: 15, lineHeight: 24, color: '#374151' },

  // Key term
  keytermRow: {
    backgroundColor: '#F8F7FF', borderRadius: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: '#4F46E5',
  },
  keytermTerm: { fontSize: 15, fontWeight: '800', color: '#111827', marginBottom: 4 },
  keytermDef: { fontSize: 14, color: '#4B5563', lineHeight: 20 },

  // Bullets
  bulletWrapper: { gap: 6 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bulletDot: { fontSize: 18, color: '#4F46E5', lineHeight: 24, marginTop: -2 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },

  // Steps
  stepsWrapper: { gap: 10 },
  stepsTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center',
    marginTop: 1,
  },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },

  // Table
  tableScroll: { marginVertical: 4 },
  table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#4F46E5' },
  tableHeaderCell: { padding: 10, minWidth: 100 },
  tableHeaderText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  tableRow: { flexDirection: 'row', backgroundColor: '#fff' },
  tableRowAlt: { backgroundColor: '#F8F7FF' },
  tableCell: { padding: 10, minWidth: 100 },
  tableCellText: { fontSize: 13, color: '#374151' },

  // Callout
  callout: {
    flexDirection: 'row', borderRadius: 12,
    padding: 14, gap: 10, borderLeftWidth: 4,
  },
  calloutIcon: { fontSize: 20, marginTop: 1 },
  calloutLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  calloutText: { fontSize: 14, color: '#374151', lineHeight: 20 },

  // Section heading
  sectionHeading: {
    fontSize: 17, fontWeight: '800', color: '#111827',
    marginTop: 8, marginBottom: 4,
    paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: '#EEF2FF',
  },
});