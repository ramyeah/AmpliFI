// components/ContentBlocks.js
import React, { useEffect, useRef, useState, useCallback  } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ActivityIndicator, TextInput, ScrollView, TouchableWithoutFeedback, PanResponder, Dimensions
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Svg, G, Path, Text as SvgText } from 'react-native-svg';
import { getBotFact } from '../lib/api';

// ─── Animated wrapper ─────────────────────────────────
export function AnimatedBlock({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
      const anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
        Animated.timing(ty, { toValue: 0, duration: 380, delay, useNativeDriver: true }),
      ]);
      anim.start();
      return () => anim.stop();
    }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY: ty }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Text ─────────────────────────────────────────────
export function TextBlock({ text }) {
  return <Text style={s.text}>{text}</Text>;
}

// ─── Key Term (tap to expand) ─────────────────────────
export function KeyTermBlock({ term, definition }) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const toggle = () => {
    Animated.timing(anim, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: false }).start();
    setOpen(!open);
  };
  const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 100] });
  return (
    <TouchableOpacity style={s.keytermBox} onPress={toggle} activeOpacity={0.85}>
      <View style={s.keytermRow}>
        <View style={s.keytermPill}><Text style={s.keytermPillText}>KEY TERM</Text></View>
        <Text style={s.keytermTerm}>{term}</Text>
        <Text style={s.chevron}>{open ? '▲' : '▼'}</Text>
      </View>
      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <Text style={s.keytermDef}>{definition}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Smart Table — auto-picks the right layout ────────
export function SmartTable({ headers, rows }) {
  const colCount = headers.length;
  const rowCount = rows.length;
  if (colCount === 2) return <PillTable headers={headers} rows={rows} />;
  if (colCount === 3 && rowCount <= 3) return <IconRowCards headers={headers} rows={rows} />;
  return <ScrollTable headers={headers} rows={rows} />;
}

// ─── 1. Pill layout (2 columns) ───────────────────────
function PillTable({ headers, rows }) {
  return (
    <View style={t.pillWrapper}>
      <View style={t.pillHeaderRow}>
        <View style={[t.pillHeaderCell, { backgroundColor: '#4F46E5' }]}>
          <Text style={t.pillHeaderText}>{headers[0]}</Text>
        </View>
        <View style={[t.pillHeaderCell, { backgroundColor: '#059669' }]}>
          <Text style={t.pillHeaderText}>{headers[1]}</Text>
        </View>
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[t.pillRow, i % 2 === 1 && t.pillRowAlt]}>
          <Text style={[t.pillCell, t.pillCellLeft]}>{row[0]}</Text>
          <View style={t.pillDivider} />
          <Text style={[t.pillCell, t.pillCellRight]}>{row[1]}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── 2. Icon row cards (3 cols, ≤3 rows) ─────────────
function IconRowCards({ headers, rows }) {
  const colors = ['#4F46E5', '#059669', '#F59E0B', '#DC2626'];
  const lightBg = (color) =>
    color === '#4F46E5' ? '#EEF2FF' :
    color === '#059669' ? '#ECFDF5' :
    color === '#F59E0B' ? '#FFFBEB' : '#FEF2F2';

  return (
    <View style={t.iconCardsWrapper}>
      {rows.map((row, i) => (
        <View key={i} style={[t.iconCard, { borderLeftColor: colors[i % colors.length] }]}>
          <View style={[t.iconCardAccent, { backgroundColor: lightBg(colors[i % colors.length]) }]}>
            <Text style={[t.iconCardLabel, { color: colors[i % colors.length] }]}>{headers[0]}</Text>
            <Text style={[t.iconCardPrimary, { color: colors[i % colors.length] }]}>{row[0]}</Text>
          </View>
          <View style={t.iconCardBody}>
            {headers.slice(1).map((header, ci) => (
              <View key={ci} style={t.iconCardRow}>
                <Text style={t.iconCardSubLabel}>{header}</Text>
                <Text style={t.iconCardSubValue}>{row[ci + 1]}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── 3. Horizontal scroll table (3+ cols, 4+ rows) ────
function ScrollTable({ headers, rows }) {
  const colWidth = 130;
  return (
    <View style={t.scrollTableWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={t.scrollTableHeaderRow}>
            {headers.map((h, i) => (
              <View key={i} style={[t.scrollTableHeaderCell, { width: colWidth }]}>
                <Text style={t.scrollTableHeaderText}>{h}</Text>
              </View>
            ))}
          </View>
          {rows.map((row, ri) => (
            <View key={ri} style={[t.scrollTableRow, ri % 2 === 1 && t.scrollTableRowAlt]}>
              {row.map((cell, ci) => (
                <View key={ci} style={[t.scrollTableCell, { width: colWidth }, ci === 0 && t.scrollTableCellFirst]}>
                  <Text style={[t.scrollTableCellText, ci === 0 && t.scrollTableCellTextFirst]}>
                    {cell}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={t.scrollFade} pointerEvents="none" />
    </View>
  );
}

// ─── Steps (tap to reveal one by one) ─────────────────
export function StepsBlock({ title, steps }) {
  const [revealed, setRevealed] = useState(1);
  const allDone = revealed >= steps.length;
  return (
    <View style={s.stepsBox}>
      {title && <Text style={s.stepsTitle}>{title}</Text>}
      {steps.slice(0, revealed).map((step, i) => (
        <AnimatedBlock key={i} delay={0}>
          <View style={s.stepRow}>
            <View style={[s.stepNum, i < revealed - 1 ? s.stepNumDone : s.stepNumActive]}>
              <Text style={s.stepNumText}>{i < revealed - 1 ? '✓' : i + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        </AnimatedBlock>
      ))}
      {!allDone
        ? <TouchableOpacity style={s.revealBtn} onPress={() => setRevealed(r => r + 1)}>
            <Text style={s.revealBtnText}>Next step →</Text>
          </TouchableOpacity>
        : <View style={s.allDoneRow}><Text style={s.allDoneText}>✅ All steps revealed</Text></View>
      }
    </View>
  );
}

// ─── Goal Picker ──────────────────────────────────────
export function GoalPicker({ title, goals }) {
  // goals: [{ icon, label, monthlySaving, months, tip }]
  const [selected, setSelected] = useState({});

  const toggle = (i) => setSelected(s => ({ ...s, [i]: !s[i] }));
  const anySelected = Object.values(selected).some(Boolean);

  return (
    <View style={gp.wrapper}>
      {title && <Text style={gp.title}>{title}</Text>}
      <Text style={gp.subtitle}>Tap the goals that apply to you.</Text>
      {goals.map((goal, i) => {
        const isSelected = selected[i];
        return (
          <TouchableOpacity
            key={i}
            style={[gp.goalCard, isSelected && gp.goalCardSelected]}
            onPress={() => toggle(i)}
            activeOpacity={0.8}
          >
            <View style={gp.goalRow}>
              <Text style={gp.goalIcon}>{goal.icon}</Text>
              <Text style={[gp.goalLabel, isSelected && gp.goalLabelSelected]}>
                {goal.label}
              </Text>
              <View style={[gp.checkbox, isSelected && gp.checkboxSelected]}>
                {isSelected && <Text style={gp.checkmark}>✓</Text>}
              </View>
            </View>
            {isSelected && (
              <AnimatedBlock delay={0}>
                <View style={gp.goalDetail}>
                  <View style={gp.goalDetailRow}>
                    <View style={gp.detailPill}>
                      <Text style={gp.detailPillText}>💰 Save ${goal.monthlySaving}/month</Text>
                    </View>
                    <View style={gp.detailPill}>
                      <Text style={gp.detailPillText}>📅 {goal.months} months</Text>
                    </View>
                  </View>
                  {goal.tip && (
                    <Text style={gp.goalTip}>{goal.tip}</Text>
                  )}
                </View>
              </AnimatedBlock>
            )}
          </TouchableOpacity>
        );
      })}
      {anySelected && (
        <AnimatedBlock delay={0}>
          <View style={gp.summary}>
            <Text style={gp.summaryTitle}>Your selected goals 🎯</Text>
            {goals.filter((_, i) => selected[i]).map((goal, i) => (
              <View key={i} style={gp.summaryRow}>
                <Text style={gp.summaryIcon}>{goal.icon}</Text>
                <Text style={gp.summaryLabel}>{goal.label}</Text>
                <Text style={gp.summaryAmount}>${goal.monthlySaving}/mo</Text>
              </View>
            ))}
            <View style={gp.summaryDivider} />
            <View style={gp.summaryRow}>
              <Text style={[gp.summaryLabel, { fontWeight: '800', color: '#111827' }]}>
                Total monthly saving needed:
              </Text>
              <Text style={gp.summaryTotal}>
                ${goals.filter((_, i) => selected[i]).reduce((acc, g) => acc + g.monthlySaving, 0)}/mo
              </Text>
            </View>
          </View>
        </AnimatedBlock>
      )}
    </View>
  );
}

const gp = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B7280', marginBottom: 14 },
  goalCard: { borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  goalCardSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: { fontSize: 22 },
  goalLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151' },
  goalLabelSelected: { color: '#3730A3' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkmark: { fontSize: 13, color: '#fff', fontWeight: '800' },
  goalDetail: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#C7D2FE' },
  goalDetailRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  detailPill: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: '#C7D2FE' },
  detailPillText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  goalTip: { fontSize: 12, color: '#6B7280', lineHeight: 18, fontStyle: 'italic' },
  summary: { backgroundColor: '#EEF2FF', borderRadius: 14, padding: 16, marginTop: 4 },
  summaryTitle: { fontSize: 14, fontWeight: '800', color: '#3730A3', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  summaryIcon: { fontSize: 18 },
  summaryLabel: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  summaryAmount: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  summaryDivider: { height: 1, backgroundColor: '#C7D2FE', marginVertical: 8 },
  summaryTotal: { fontSize: 16, fontWeight: '900', color: '#4F46E5' },
});

// ─── Callout ──────────────────────────────────────────
export function CalloutBlock({ variant, text }) {
  const cfg = {
    tip:     { bg: '#FFFBEB', border: '#F59E0B', icon: '💡', label: 'Singapore Tip' },
    warning: { bg: '#FFF1F2', border: '#F43F5E', icon: '⚠️', label: 'Watch Out' },
    fact:    { bg: '#EFF6FF', border: '#3B82F6', icon: '📊', label: 'Did You Know?' },
  };
  const c = cfg[variant] || cfg.tip;
  return (
    <View style={[s.callout, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
      <Text style={s.calloutLabel}>{c.icon} {c.label}</Text>
      <Text style={s.calloutText}>{text}</Text>
    </View>
  );
}

// ─── Bullets ──────────────────────────────────────────
export function BulletsBlock({ title, items }) {
  return (
    <View style={s.bulletsBox}>
      {title && <Text style={s.bulletsTitle}>{title}</Text>}
      {items.map((item, i) => (
        <View key={i} style={s.bulletRow}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Bot Chip ─────────────────────────────────────────
export function BotChip({ label, prompt }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = async () => {
    setOpen(true);
    if (answer) return;
    setLoading(true);
    try {
      const r = await getBotFact(label, prompt);
      setAnswer(r?.answer || 'Unable to fetch right now.');
    } catch {
      setAnswer('Unable to fetch right now.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return (
    <TouchableOpacity style={s.botChip} onPress={handleOpen} activeOpacity={0.85}>
      <Text style={s.botChipIcon}>🤖</Text>
      <Text style={s.botChipText}>{label}</Text>
      <Text style={s.botArrow}>→</Text>
    </TouchableOpacity>
  );

  return (
    <View style={s.botOpen}>
      <View style={s.botHeader}>
        <Text style={s.botHeaderIcon}>🤖</Text>
        <Text style={s.botHeaderLabel}>AmpliFI Bot</Text>
        <TouchableOpacity onPress={() => setOpen(false)}>
          <Text style={s.botClose}>✕</Text>
        </TouchableOpacity>
      </View>
      {loading
        ? <View style={s.botLoading}>
            <ActivityIndicator size="small" color="#4F46E5" />
            <Text style={s.botLoadingText}>Checking knowledge base...</Text>
          </View>
        : <Text style={s.botAnswer}>{answer}</Text>
      }
    </View>
  );
}

// ─── Before / After Cards ─────────────────────────────
export function BeforeAfterCards({ title, items }) {
  return (
    <View style={ba.wrapper}>
      {title && <Text style={ba.title}>{title}</Text>}
      {items.map((item, i) => (
        <View key={i} style={ba.card}>
          <View style={ba.labelRow}>
            <View style={ba.labelPill}>
              <Text style={ba.labelText}>{item.label}</Text>
            </View>
          </View>
          <View style={ba.row}>
            <View style={[ba.side, ba.sideBefore]}>
              <Text style={ba.sideTag}>❌ Before</Text>
              <Text style={ba.sideText}>{item.before}</Text>
            </View>
            <Text style={ba.arrow}>→</Text>
            <View style={[ba.side, ba.sideAfter]}>
              <Text style={ba.sideTag}>✅ After</Text>
              <Text style={ba.sideText}>{item.after}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Checklist Block ──────────────────────────────────
export function ChecklistBlock({ title, items }) {
  const [checked, setChecked] = useState({});
  const allDone = Object.values(checked).filter(Boolean).length === items.length;

  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }));

  return (
    <View style={cl.wrapper}>
      {title && <Text style={cl.title}>{title}</Text>}
      {items.map((item, i) => {
        const isChecked = checked[i];
        return (
          <TouchableOpacity
            key={i}
            style={[cl.item, isChecked && cl.itemChecked]}
            onPress={() => toggle(i)}
            activeOpacity={0.8}
          >
            <View style={[cl.box, isChecked && cl.boxChecked]}>
              {isChecked && <Text style={cl.tick}>✓</Text>}
            </View>
            <Text style={[cl.itemText, isChecked && cl.itemTextChecked]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
      {allDone && (
        <AnimatedBlock delay={0}>
          <View style={cl.completeBanner}>
            <Text style={cl.completeBannerText}>🎉 All benefits unlocked — budget away!</Text>
          </View>
        </AnimatedBlock>
      )}
    </View>
  );
}

const cl = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: '#F9FAFB', borderWidth: 1.5, borderColor: '#E5E7EB' },
  itemChecked: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  boxChecked: { backgroundColor: '#059669', borderColor: '#059669' },
  tick: { fontSize: 13, color: '#fff', fontWeight: '800' },
  itemText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  itemTextChecked: { color: '#065F46', fontWeight: '600', textDecorationLine: 'line-through' },
  completeBanner: { backgroundColor: '#DCFCE7', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  completeBannerText: { fontSize: 14, fontWeight: '700', color: '#059669' },
});

// ─── Bias Reveal Cards ────────────────────────────────
export function BiasRevealCards({ title, biases }) {
  // biases: [{ icon, name, color, tagline, definition, example, singaporeTip }]
  const [expanded, setExpanded] = useState(null);
  const SW = Dimensions.get('window').width - 48;

  return (
    <View style={br.wrapper}>
      {title && <Text style={br.title}>{title}</Text>}
      <Text style={br.hint}>Tap a bias to learn more</Text>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
      >
        {biases.map((bias, i) => {
          const isOpen = expanded === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                br.card,
                { width: SW, borderColor: bias.color },
                isOpen && { backgroundColor: bias.color },
              ]}
              onPress={() => setExpanded(isOpen ? null : i)}
              activeOpacity={0.9}
            >
              {/* Header — always visible */}
              <View style={br.cardHeader}>
                <Text style={br.cardIcon}>{bias.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[br.cardName, isOpen && br.cardNameOpen]}>
                    {bias.name}
                  </Text>
                  <Text style={[br.cardTagline, isOpen && br.cardTaglineOpen]}>
                    {bias.tagline}
                  </Text>
                </View>
                <View style={[br.chevron, isOpen && { transform: [{ rotate: '180deg' }] }]}>
                  <Text style={[br.chevronText, isOpen && br.chevronTextOpen]}>↓</Text>
                </View>
              </View>

              {/* Expanded content */}
              {isOpen && (
                <AnimatedBlock delay={0}>
                  <View style={br.divider} />
                  <Text style={br.sectionLabel}>WHAT IT IS</Text>
                  <Text style={br.definition}>{bias.definition}</Text>
                  <Text style={br.sectionLabel}>IN REAL LIFE</Text>
                  <Text style={br.example}>{bias.example}</Text>
                  {bias.singaporeTip && (
                    <View style={br.sgTip}>
                      <Text style={br.sgTipIcon}>🇸🇬</Text>
                      <Text style={br.sgTipText}>{bias.singaporeTip}</Text>
                    </View>
                  )}
                </AnimatedBlock>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dot indicators */}
      <View style={br.dots}>
        {biases.map((_, i) => (
          <View key={i} style={[br.dot, expanded === i && br.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const br = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  card: {
    borderRadius: 18, padding: 18, borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 32 },
  cardName: { fontSize: 17, fontWeight: '800', color: '#111827', marginBottom: 2 },
  cardNameOpen: { color: '#fff' },
  cardTagline: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  cardTaglineOpen: { color: 'rgba(255,255,255,0.8)' },
  chevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  chevronText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  chevronTextOpen: { color: '#fff' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, marginBottom: 6 },
  definition: { fontSize: 14, color: '#fff', lineHeight: 21, marginBottom: 14, fontWeight: '500' },
  example: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20, marginBottom: 14, fontStyle: 'italic' },
  sgTip: { flexDirection: 'row', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, alignItems: 'flex-start' },
  sgTipIcon: { fontSize: 16 },
  sgTipText: { flex: 1, fontSize: 12, color: '#fff', lineHeight: 18, fontWeight: '500' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { width: 18, backgroundColor: '#4F46E5' },
});

// ─── Tinder True/False ────────────────────────────────
export function TinderTrueFalse({ title, instruction, statements }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentIndexRef = useRef(0);
  const resultsRef = useRef([]);
  const position = useRef(new Animated.ValueXY()).current;
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
      position.stopAnimation();
      position.removeAllListeners();
    };
  }, []);

  const SW = Dimensions.get('window').width - 48;

  const rotate = position.x.interpolate({
    inputRange: [-SW / 2, 0, SW / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const cardColor = position.x.interpolate({
    inputRange: [-SW / 2, 0, SW / 2],
    outputRange: ['#FEE2E2', '#FFFFFF', '#DCFCE7'],
    extrapolate: 'clamp',
  });

  const swipeOut = useCallback((direction) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const toX = direction === 'right' ? SW * 1.5 : -SW * 1.5;

    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (!isMounted.current) return;
      const idx = currentIndexRef.current;
      const statement = statements[idx];
      const isCorrect =
        (direction === 'right' && statement.isTrue) ||
        (direction === 'left' && !statement.isTrue);

      const newResults = [...resultsRef.current, { direction, isCorrect, statement }];
      resultsRef.current = newResults;

      position.setValue({ x: 0, y: 0 });

      const nextIndex = idx + 1;
      if (nextIndex >= statements.length) {
        setResults(newResults);
        setDone(true);
      } else {
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
      }
      setIsAnimating(false);
    });
  }, [isAnimating, statements, position, SW]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.15 });
      },
      onPanResponderRelease: (_, gesture) => {
        const threshold = SW / 4;
        if (gesture.dx > threshold) {
          swipeOut('right');
        } else if (gesture.dx < -threshold) {
          swipeOut('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 80,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleReset = () => {
    currentIndexRef.current = 0;
    resultsRef.current = [];
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(0);
    setResults([]);
    setDone(false);
    setIsAnimating(false);
  };

  if (done) {
    const score = results.filter(r => r.isCorrect).length;
    const perfect = score === statements.length;
    return (
      <View style={tt.wrapper}>
        <View style={tt.header}>
          <Text style={tt.headerIcon}>🧠</Text>
          <View>
            <Text style={tt.headerLabel}>RESULTS</Text>
            <Text style={tt.headerTitle}>{title}</Text>
          </View>
        </View>
        <AnimatedBlock delay={0}>
          <View style={tt.scoreScreen}>
            <Text style={tt.scoreBig}>{score}/{statements.length}</Text>
            <Text style={tt.scoreEmoji}>{perfect ? '🏆' : score >= statements.length / 2 ? '💪' : '📚'}</Text>
            <Text style={tt.scoreMsg}>
              {perfect ? 'Perfect score — no myths fooled you.' :
               score >= statements.length / 2 ? 'Good effort — check the ones you missed.' :
               'Review the lesson and try again.'}
            </Text>
            <View style={tt.resultsList}>
              {results.map((r, i) => (
                <View key={i} style={[tt.resultRow, r.isCorrect ? tt.resultCorrect : tt.resultWrong]}>
                  <Text style={tt.resultIcon}>{r.isCorrect ? '✓' : '✗'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={tt.resultStatement}>{r.statement.text}</Text>
                    <Text style={tt.resultExplanation}>{r.statement.explanation}</Text>
                  </View>
                  <View style={[tt.badge, r.statement.isTrue ? tt.badgeTrue : tt.badgeFalse]}>
                    <Text style={tt.badgeText}>{r.statement.isTrue ? 'TRUE' : 'FALSE'}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={tt.retryBtn} onPress={handleReset}>
              <Text style={tt.retryBtnText}>↩ Try Again</Text>
            </TouchableOpacity>
          </View>
        </AnimatedBlock>
      </View>
    );
  }

  if (currentIndex >= statements.length) return null;

  const statement = statements[currentIndex];
  const nextStatement = statements[currentIndex + 1];

  return (
    <View style={tt.wrapper}>
      <View style={tt.header}>
        <Text style={tt.headerIcon}>🧠</Text>
        <View style={{ flex: 1 }}>
          <Text style={tt.headerLabel}>TRUE OR FALSE</Text>
          <Text style={tt.headerTitle}>{title}</Text>
        </View>
        <Text style={tt.counter}>{currentIndex + 1}/{statements.length}</Text>
      </View>

      <View style={tt.progressTrack}>
        {statements.map((_, i) => (
          <View key={i} style={[
            tt.progressSegment,
            i < currentIndex && tt.progressDone,
            i === currentIndex && tt.progressActive,
          ]} />
        ))}
      </View>

      {instruction && <Text style={tt.instruction}>{instruction}</Text>}

      <View style={tt.swipeHints}>
        <Text style={tt.hintLeft}>← FALSE</Text>
        <Text style={tt.hintRight}>TRUE →</Text>
      </View>

      <View style={tt.cardStack}>
        {nextStatement && (
          <View style={[tt.card, tt.cardBehind]}>
            <Text style={tt.cardText}>{nextStatement.text}</Text>
          </View>
        )}
        <Animated.View
          style={[tt.card, {
            backgroundColor: cardColor,
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate },
            ],
          }]}
          {...panResponder.panHandlers}
        >
          <Text style={tt.cardText}>{statement.text}</Text>
        </Animated.View>
      </View>

      <View style={tt.btnRow}>
        <TouchableOpacity style={tt.btnLeft} onPress={() => swipeOut('left')} disabled={isAnimating}>
          <Text style={tt.btnLeftText}>✗  False</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tt.btnRight} onPress={() => swipeOut('right')} disabled={isAnimating}>
          <Text style={tt.btnRightText}>True  ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const tt = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerIcon: { fontSize: 28 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  counter: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  progressTrack: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  progressDone: { backgroundColor: '#059669' },
  progressActive: { backgroundColor: '#4F46E5' },
  instruction: { fontSize: 13, color: '#6B7280', marginBottom: 10, textAlign: 'center' },
  swipeHints: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  hintLeft: { fontSize: 12, fontWeight: '700', color: '#DC2626', opacity: 0.5 },
  hintRight: { fontSize: 12, fontWeight: '700', color: '#059669', opacity: 0.5 },
  cardStack: { height: 170, marginBottom: 16 },
  card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, justifyContent: 'center' },
  cardBehind: { top: 8, left: 4, right: 4, backgroundColor: '#F5F6FF', borderColor: '#C7D2FE', shadowOpacity: 0.04, elevation: 1 },
  cardText: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 24, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnLeft: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' },
  btnLeftText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  btnRight: { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#BBF7D0' },
  btnRightText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  scoreScreen: { alignItems: 'center', paddingVertical: 8 },
  scoreBig: { fontSize: 52, fontWeight: '900', color: '#4F46E5', lineHeight: 60 },
  scoreEmoji: { fontSize: 36, marginBottom: 10 },
  scoreMsg: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  resultsList: { width: '100%', gap: 8, marginBottom: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1.5 },
  resultCorrect: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  resultWrong: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  resultIcon: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  resultStatement: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 3 },
  resultExplanation: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', flexShrink: 0 },
  badgeTrue: { backgroundColor: '#DCFCE7' },
  badgeFalse: { backgroundColor: '#FEF2F2' },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#374151' },
  retryBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  retryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
});

// ─── App Cards (horizontal swipeable, tap to expand) ──
export function AppCards({ title, apps }) {
  // apps: [{ icon, name, color, tagline, cost, rating, keyFeature, bestFor, singaporeTip }]
  const [expanded, setExpanded] = useState(null);
  const SW = Dimensions.get('window').width - 48;

  return (
    <View style={ac.wrapper}>
      {title && <Text style={ac.title}>{title}</Text>}
      <Text style={ac.hint}>Tap an app to learn more · Swipe for next</Text>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12 }}
      >
        {apps.map((app, i) => {
          const isOpen = expanded === i;
          return (
            <TouchableOpacity
              key={i}
              style={[ac.card, { width: SW, borderColor: app.color }]}
              onPress={() => setExpanded(isOpen ? null : i)}
              activeOpacity={0.9}
            >
              {/* Header — always visible */}
              <View style={ac.cardHeader}>
                <View style={[ac.iconBg, { backgroundColor: app.color }]}>
                  <Text style={ac.icon}>{app.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ac.appName}>{app.name}</Text>
                  <Text style={ac.tagline}>{app.tagline}</Text>
                </View>
                <View style={ac.chevron}>
                  <Text style={[ac.chevronText, { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }]}>↓</Text>
                </View>
              </View>

              {/* Pills — always visible */}
              <View style={ac.pillRow}>
                <View style={[ac.pill, { backgroundColor: app.color }]}>
                  <Text style={ac.pillText}>{app.cost}</Text>
                </View>
                <View style={ac.pillOutline}>
                  <Text style={[ac.pillOutlineText, { color: app.color }]}>{'⭐'.repeat(Math.round(app.rating))} {app.rating}/5</Text>
                </View>
              </View>

              {/* Expanded content */}
              {isOpen && (
                <AnimatedBlock delay={0}>
                  <View style={[ac.divider, { backgroundColor: app.color }]} />
                  <View style={ac.section}>
                    <Text style={[ac.sectionLabel, { color: app.color }]}>KEY FEATURE</Text>
                    <Text style={ac.sectionText}>{app.keyFeature}</Text>
                  </View>
                  <View style={ac.section}>
                    <Text style={[ac.sectionLabel, { color: app.color }]}>BEST FOR</Text>
                    <Text style={ac.sectionText}>{app.bestFor}</Text>
                  </View>
                  {app.singaporeTip && (
                    <View style={[ac.sgTip, { borderColor: app.color }]}>
                      <Text style={ac.sgTipIcon}>🇸🇬</Text>
                      <Text style={ac.sgTipText}>{app.singaporeTip}</Text>
                    </View>
                  )}
                </AnimatedBlock>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dot indicators */}
      <View style={ac.dots}>
        {apps.map((_, i) => (
          <View key={i} style={[ac.dot, expanded === i && ac.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const ac = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  card: {
    borderRadius: 18, padding: 18, borderWidth: 2,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon: { fontSize: 22 },
  appName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  tagline: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  chevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  chevronText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  pill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  pillOutline: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: '#E5E7EB' },
  pillOutlineText: { fontSize: 12, fontWeight: '700' },
  divider: { height: 1.5, marginVertical: 14, opacity: 0.2 },
  section: { marginBottom: 12 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  sectionText: { fontSize: 14, color: '#374151', lineHeight: 21 },
  sgTip: { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'flex-start', marginTop: 4 },
  sgTipIcon: { fontSize: 16 },
  sgTipText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { width: 18, backgroundColor: '#4F46E5' },
});

// ─── Swipe Judge (drag left/right to judge cards) ─────
export function SwipeJudge({ title, instruction, cards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentIndexRef = useRef(0);
  const resultsRef = useRef([]);
  const position = useRef(new Animated.ValueXY()).current;
  useEffect(() => {
    return () => {
      position.stopAnimation();
      position.setValue({ x: 0, y: 0 });
    };
  }, []);
  const SW = Dimensions.get('window').width - 48;

  const rotate = position.x.interpolate({
    inputRange: [-SW / 2, 0, SW / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });

  const cardColor = position.x.interpolate({
    inputRange: [-SW / 2, 0, SW / 2],
    outputRange: ['#FEE2E2', '#FFFFFF', '#DCFCE7'],
    extrapolate: 'clamp',
  });

  const swipeOut = useCallback((direction) => {
    if (isAnimating) return;
    setIsAnimating(true);

    const toX = direction === 'right' ? SW * 1.5 : -SW * 1.5;

    Animated.timing(position, {
      toValue: { x: toX, y: 0 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      const idx = currentIndexRef.current;
      const card = cards[idx];
      const isCorrect =
        (direction === 'right' && card.isSMART) ||
        (direction === 'left' && !card.isSMART);

      const newResults = [...resultsRef.current, { direction, isCorrect, card }];
      resultsRef.current = newResults;

      position.setValue({ x: 0, y: 0 });

      const nextIndex = idx + 1;
      if (nextIndex >= cards.length) {
        setResults(newResults);
        setDone(true);
      } else {
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
      }
      setIsAnimating(false);
    });
  }, [isAnimating, cards, position, SW]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.15 });
      },
      onPanResponderRelease: (_, gesture) => {
        const threshold = SW / 4;
        if (gesture.dx > threshold) {
          swipeOut('right');
        } else if (gesture.dx < -threshold) {
          swipeOut('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 80,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleReset = () => {
    currentIndexRef.current = 0;
    resultsRef.current = [];
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(0);
    setResults([]);
    setDone(false);
    setIsAnimating(false);
  };

  // ── Done screen ──
  if (done) {
    const score = results.filter(r => r.isCorrect).length;
    const perfect = score === cards.length;
    return (
      <View style={sj.wrapper}>
        <View style={sj.header}>
          <Text style={sj.headerIcon}>🎯</Text>
          <View>
            <Text style={sj.headerLabel}>RESULTS</Text>
            <Text style={sj.headerTitle}>{title}</Text>
          </View>
        </View>
        <AnimatedBlock delay={0}>
          <View style={sj.scoreScreen}>
            <Text style={sj.scoreBig}>{score}/{cards.length}</Text>
            <Text style={sj.scoreEmoji}>{perfect ? '🏆' : score >= cards.length / 2 ? '💪' : '📚'}</Text>
            <Text style={sj.scoreMsg}>
              {perfect ? 'Perfect! You can identify a SMART goal.' :
               score >= cards.length / 2 ? 'Good effort — review the ones below.' :
               'Review the SMART framework and try again.'}
            </Text>
            <View style={sj.resultsList}>
              {results.map((r, i) => (
                <View key={i} style={[sj.resultRow, r.isCorrect ? sj.resultCorrect : sj.resultWrong]}>
                  <Text style={sj.resultIcon}>{r.isCorrect ? '✓' : '✗'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={sj.resultStatement}>{r.card.statement}</Text>
                    <Text style={sj.resultExplanation}>{r.card.explanation}</Text>
                  </View>
                  <View style={[sj.smartBadge, r.card.isSMART ? sj.smartBadgeYes : sj.smartBadgeNo]}>
                    <Text style={sj.smartBadgeText}>{r.card.isSMART ? 'SMART' : 'NOT SMART'}</Text>
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={sj.retryBtn} onPress={handleReset}>
              <Text style={sj.retryBtnText}>↩ Try Again</Text>
            </TouchableOpacity>
          </View>
        </AnimatedBlock>
      </View>
    );
  }

  if (currentIndex >= cards.length) return null;

  const card = cards[currentIndex];
  const nextCard = cards[currentIndex + 1];

  return (
    <View style={sj.wrapper}>
      <View style={sj.header}>
        <Text style={sj.headerIcon}>🎯</Text>
        <View style={{ flex: 1 }}>
          <Text style={sj.headerLabel}>EXERCISE</Text>
          <Text style={sj.headerTitle}>{title}</Text>
        </View>
        <Text style={sj.counter}>{currentIndex + 1}/{cards.length}</Text>
      </View>

      <View style={sj.progressTrack}>
        {cards.map((_, i) => (
          <View key={i} style={[
            sj.progressSegment,
            i < currentIndex && sj.progressDone,
            i === currentIndex && sj.progressActive,
          ]} />
        ))}
      </View>

      <Text style={sj.instruction}>{instruction}</Text>

      <View style={sj.swipeHints}>
        <Text style={sj.hintLeft}>← NOT SMART</Text>
        <Text style={sj.hintRight}>SMART →</Text>
      </View>

      <View style={[sj.cardStack, { height: 160 }]}>
        {/* Next card underneath — plain View, no animation */}
        {nextCard && (
          <View style={[sj.card, sj.cardBehind, { width: SW }]}>
            <Text style={sj.cardText}>{nextCard.statement}</Text>
          </View>
        )}

        {/* Current draggable card — Animated.View with cardColor */}
        <Animated.View
          style={[
            sj.card,
            {
              width: SW,
              backgroundColor: cardColor,
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Text style={sj.cardText}>{card.statement}</Text>
          {card.tip && <Text style={sj.cardTip}>{card.tip}</Text>}
        </Animated.View>
      </View>

      <View style={sj.btnRow}>
        <TouchableOpacity
          style={sj.btnLeft}
          onPress={() => swipeOut('left')}
          disabled={isAnimating}
        >
          <Text style={sj.btnLeftText}>✗  Not SMART</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={sj.btnRight}
          onPress={() => swipeOut('right')}
          disabled={isAnimating}
        >
          <Text style={sj.btnRightText}>SMART  ✓</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const sj = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerIcon: { fontSize: 28 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  counter: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  progressTrack: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  progressDone: { backgroundColor: '#059669' },
  progressActive: { backgroundColor: '#4F46E5' },
  instruction: { fontSize: 13, color: '#6B7280', marginBottom: 10, textAlign: 'center' },
  swipeHints: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  hintLeft: { fontSize: 12, fontWeight: '700', color: '#DC2626', opacity: 0.5 },
  hintRight: { fontSize: 12, fontWeight: '700', color: '#059669', opacity: 0.5 },
  cardStack: { position: 'relative', alignItems: 'center', marginBottom: 16 },
  card: {
    position: 'absolute', top: 0, left: 0,
    borderRadius: 16, padding: 20,
    borderWidth: 1.5, borderColor: '#E0E7FF',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
    justifyContent: 'center', height: 150,
  },
  cardBehind: {
    top: 8, transform: [{ scale: 0.96 }],
    backgroundColor: '#F5F6FF', borderColor: '#C7D2FE',
    shadowOpacity: 0.04, elevation: 1,
  },
  cardText: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 24, textAlign: 'center' },
  cardTip: { fontSize: 12, color: '#9CA3AF', marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnLeft: { flex: 1, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FECACA' },
  btnLeftText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  btnRight: { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#BBF7D0' },
  btnRightText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  scoreScreen: { alignItems: 'center', paddingVertical: 8 },
  scoreBig: { fontSize: 52, fontWeight: '900', color: '#4F46E5', lineHeight: 60 },
  scoreEmoji: { fontSize: 36, marginBottom: 10 },
  scoreMsg: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  resultsList: { width: '100%', gap: 8, marginBottom: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1.5 },
  resultCorrect: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  resultWrong: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  resultIcon: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  resultStatement: { fontSize: 13, fontWeight: '600', color: '#111827', marginBottom: 3 },
  resultExplanation: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  smartBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', flexShrink: 0 },
  smartBadgeYes: { backgroundColor: '#DCFCE7' },
  smartBadgeNo: { backgroundColor: '#FEF2F2' },
  smartBadgeText: { fontSize: 10, fontWeight: '800', color: '#374151' },
  retryBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  retryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
});

// ─── Topic Cards (expandable, icon right) ────────────
export function TopicCards({ title, cards }) {
  const [openIndex, setOpenIndex] = useState(null);
  return (
    <View style={tc.wrapper}>
      {title && <Text style={tc.title}>{title}</Text>}
      {cards.map((card, i) => (
        <TopicCard
          key={i}
          card={card}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </View>
  );
}

function TopicCard({ card, isOpen, onToggle }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
      const a = Animated.spring(anim, {
        toValue: isOpen ? 1 : 0,
        friction: 8,
        tension: 60,
        useNativeDriver: false,
      });
      a.start();
      return () => a.stop();
    }, [isOpen]);

  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 400] });

  const bgColor =
    card.color === '#4F46E5' ? '#F5F6FF' :
    card.color === '#F59E0B' ? '#FFFDF5' :
    card.color === '#059669' ? '#F5FFFA' : '#fff';

  const iconBgColor =
    card.color === '#4F46E5' ? '#EEF2FF' :
    card.color === '#F59E0B' ? '#FFFBEB' :
    card.color === '#059669' ? '#ECFDF5' : '#F3F4F6';

  return (
    <TouchableOpacity
      style={[tc.card, { borderColor: card.color, backgroundColor: bgColor }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={tc.row}>
        <View style={tc.textSide}>
          <Text style={[tc.label, { color: card.color }]}>{card.label}</Text>
          <Text style={tc.desc}>{card.description}</Text>
          {!isOpen && (
            <Text style={[tc.tapHint, { color: card.color }]}>Tap to learn more →</Text>
          )}
        </View>
        <View style={[tc.iconBg, { backgroundColor: iconBgColor }]}>
          <Text style={tc.icon}>{card.icon}</Text>
        </View>
      </View>

      <Animated.View style={{ maxHeight, overflow: 'hidden' }}>
        <View style={[tc.expanded, { borderTopColor: card.color }]}>
          {card.details && card.details.map((point, i) => (
            <View key={i} style={tc.detailRow}>
              <View style={[tc.detailDot, { backgroundColor: card.color }]} />
              <Text style={tc.detailText}>{point}</Text>
            </View>
          ))}
          {card.example && (
            <View style={[tc.example, { borderLeftColor: card.color }]}>
              <Text style={[tc.exampleLabel, { color: card.color }]}>💡 Example</Text>
              <Text style={tc.exampleText}>{card.example}</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Multi-Step MCQ (sequential scored challenge) ─────
export function MultiStepMCQ({ icon, title, subtitle, questions }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState([]);
  const [done, setDone] = useState(false);

  const q = questions[currentQ];
  const isCorrect = selected === q.correctIndex;
  const totalScore = scores.filter(Boolean).length;

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    setScores(s => [...s, selected === q.correctIndex]);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setSubmitted(false);
    } else {
      setDone(true);
    }
  };

  const handleReset = () => {
    setCurrentQ(0);
    setSelected(null);
    setSubmitted(false);
    setScores([]);
    setDone(false);
  };

  // ── Final score screen ──
  if (done) {
    const perfect = totalScore === questions.length;
    const good = totalScore >= Math.ceil(questions.length / 2);
    return (
      <View style={ms.wrapper}>
        <View style={ms.header}>
          <Text style={ms.headerIcon}>{icon}</Text>
          <View>
            <Text style={ms.headerLabel}>CHALLENGE COMPLETE</Text>
            <Text style={ms.headerTitle}>{title}</Text>
          </View>
        </View>

        <AnimatedBlock delay={0}>
          <View style={ms.scoreScreen}>
            <Text style={ms.scoreBig}>
              {totalScore}/{questions.length}
            </Text>
            <Text style={ms.scoreEmoji}>
              {perfect ? '🏆' : good ? '💪' : '📚'}
            </Text>
            <Text style={ms.scoreMsg}>
              {perfect
                ? 'Perfect score! You understand all three Big Three concepts.'
                : good
                ? 'Good effort! Review the ones you missed above.'
                : 'Keep going — these concepts are worth mastering.'}
            </Text>

            {/* Per-question result summary */}
            <View style={ms.scoreSummary}>
              {questions.map((q, i) => (
                <View key={i} style={ms.scoreSummaryRow}>
                  <Text style={[ms.scoreSummaryDot, { color: scores[i] ? '#059669' : '#DC2626' }]}>
                    {scores[i] ? '✓' : '✗'}
                  </Text>
                  <Text style={ms.scoreSummaryText}>{q.concept}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={ms.retryBtn} onPress={handleReset}>
              <Text style={ms.retryBtnText}>↩ Try Again</Text>
            </TouchableOpacity>
          </View>
        </AnimatedBlock>
      </View>
    );
  }

  // ── Active question screen ──
  return (
    <View style={ms.wrapper}>
      {/* Header */}
      <View style={ms.header}>
        <Text style={ms.headerIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={ms.headerLabel}>CHALLENGE</Text>
          <Text style={ms.headerTitle}>{title}</Text>
        </View>
        <Text style={ms.counter}>{currentQ + 1}/{questions.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={ms.progressTrack}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[
              ms.progressSegment,
              i < currentQ && ms.progressDone,
              i === currentQ && ms.progressActive,
            ]}
          />
        ))}
      </View>

      {/* Concept label */}
      {q.concept && (
        <View style={ms.conceptPill}>
          <Text style={ms.conceptText}>{q.concept}</Text>
        </View>
      )}

      {/* Question */}
      <Text style={ms.question}>{q.question}</Text>

      {/* Options */}
      {q.options.map((opt, i) => {
        let style = ms.option;
        let textStyle = ms.optionText;
        if (submitted) {
          if (i === q.correctIndex) {
            style = [ms.option, ms.optionCorrect];
            textStyle = [ms.optionText, ms.optionTextCorrect];
          } else if (i === selected) {
            style = [ms.option, ms.optionWrong];
          }
        } else if (selected === i) {
          style = [ms.option, ms.optionSelected];
        }
        return (
          <TouchableOpacity
            key={i}
            style={style}
            onPress={() => !submitted && setSelected(i)}
            activeOpacity={0.8}
          >
            <View style={ms.optionDot}>
              <Text style={ms.optionDotText}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={[textStyle, { flex: 1 }]}>{opt}</Text>
            {submitted && i === q.correctIndex && <Text style={ms.tick}>✓</Text>}
            {submitted && i === selected && i !== q.correctIndex && <Text style={ms.cross}>✗</Text>}
          </TouchableOpacity>
        );
      })}

      {/* Explanation + next */}
      {!submitted ? (
        <TouchableOpacity
          style={[ms.submitBtn, selected === null && ms.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={selected === null}
        >
          <Text style={ms.submitBtnText}>Check Answer</Text>
        </TouchableOpacity>
      ) : (
        <AnimatedBlock delay={0}>
          <View style={[ms.feedback, isCorrect ? ms.feedbackCorrect : ms.feedbackWrong]}>
            <Text style={ms.feedbackIcon}>{isCorrect ? '🎉' : '💪'}</Text>
            <Text style={ms.feedbackText}>
              {isCorrect ? 'Correct!' : 'Not quite.'}
            </Text>
          </View>
          <Text style={ms.explanation}>{q.explanation}</Text>
          <TouchableOpacity style={ms.nextBtn} onPress={handleNext}>
            <Text style={ms.nextBtnText}>
              {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results →'}
            </Text>
          </TouchableOpacity>
        </AnimatedBlock>
      )}
    </View>
  );
}

const ms = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerIcon: { fontSize: 28 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  counter: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  progressTrack: { flexDirection: 'row', gap: 4, marginBottom: 16 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' },
  progressDone: { backgroundColor: '#059669' },
  progressActive: { backgroundColor: '#4F46E5' },
  conceptPill: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  conceptText: { fontSize: 11, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.3 },
  question: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 22, marginBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionCorrect: { borderColor: '#059669', backgroundColor: '#DCFCE7' },
  optionWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  optionDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  optionDotText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  optionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  optionTextCorrect: { color: '#065F46', fontWeight: '600' },
  tick: { fontSize: 16, color: '#059669' },
  cross: { fontSize: 16, color: '#DC2626' },
  submitBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { backgroundColor: '#C7D2FE' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  feedback: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 6 },
  feedbackCorrect: { backgroundColor: '#DCFCE7' },
  feedbackWrong: { backgroundColor: '#FEF2F2' },
  feedbackIcon: { fontSize: 18 },
  feedbackText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  explanation: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 10, fontStyle: 'italic' },
  nextBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  scoreScreen: { alignItems: 'center', paddingVertical: 8 },
  scoreBig: { fontSize: 52, fontWeight: '900', color: '#4F46E5', lineHeight: 60 },
  scoreEmoji: { fontSize: 36, marginBottom: 10 },
  scoreMsg: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  scoreSummary: { width: '100%', gap: 8, marginBottom: 20 },
  scoreSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 12 },
  scoreSummaryDot: { fontSize: 16, fontWeight: '800' },
  scoreSummaryText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  retryBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  retryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
});

// ─── Pie Chart Block ──────────────────────────────────
export function PieChartBlock({ title, slices, note }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const innerRadius = 48;

  const lightBg = (color) =>
    color === '#4F46E5' ? '#EEF2FF' :
    color === '#F59E0B' ? '#FFFBEB' :
    color === '#059669' ? '#ECFDF5' : '#F3F4F6';

  const getPaths = () => {
    let startAngle = -90;
    return slices.map((slice) => {
      const angle = (slice.percentage / 100) * 360;
      const endAngle = startAngle + angle;
      const toRad = (deg) => (deg * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(toRad(startAngle));
      const y1 = cy + radius * Math.sin(toRad(startAngle));
      const x2 = cx + radius * Math.cos(toRad(endAngle));
      const y2 = cy + radius * Math.sin(toRad(endAngle));
      const ix1 = cx + innerRadius * Math.cos(toRad(startAngle));
      const iy1 = cy + innerRadius * Math.sin(toRad(startAngle));
      const ix2 = cx + innerRadius * Math.cos(toRad(endAngle));
      const iy2 = cy + innerRadius * Math.sin(toRad(endAngle));
      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M ${ix1} ${iy1}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
        'Z',
      ].join(' ');

      startAngle = endAngle;
      return { path };
    });
  };

  const paths = getPaths();
  const active = activeIndex !== null ? slices[activeIndex] : null;

  return (
    <View style={pc.wrapper}>
      {title && <Text style={pc.title}>{title}</Text>}

      <View style={pc.chartRow}>
        <TouchableWithoutFeedback onPress={() => setActiveIndex(null)}>
          <View>
            <Svg width={size} height={size}>
              <G>
                {paths.map((p, i) => (
                  <Path
                    key={i}
                    d={p.path}
                    fill={slices[i].color}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                    onPress={() => setActiveIndex(activeIndex === i ? null : i)}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
                {active ? (
                  <>
                    <SvgText
                      x={cx}
                      y={cy - 2}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontSize="20"
                      fontWeight="800"
                      fill={active.color}
                    >
                      {active.percentage}%
                    </SvgText>
                    <SvgText
                      x={cx}
                      y={cy + 18}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fontSize="11"
                      fill="#6B7280"
                    >
                      {active.label}
                    </SvgText>
                  </>
                ) : (
                  <SvgText
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fontSize="12"
                    fill="#9CA3AF"
                  >
                    Tap a slice
                  </SvgText>
                )}
              </G>
            </Svg>
          </View>
        </TouchableWithoutFeedback>
      </View>

      <View style={pc.legendWrapper}>
        {slices.map((slice, i) => (
          <TouchableOpacity
            key={i}
            style={[
              pc.legendCard,
              { borderLeftColor: slice.color },
              activeIndex === i && { backgroundColor: lightBg(slice.color) },
            ]}
            onPress={() => setActiveIndex(activeIndex === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={pc.legendTop}>
              <Text style={pc.legendIcon}>{slice.icon}</Text>
              <View style={pc.legendMeta}>
                <Text style={[pc.legendPct, { color: slice.color }]}>{slice.percentage}%</Text>
                <Text style={pc.legendLabel}>{slice.label}</Text>
              </View>
              {slice.amount && (
                <Text style={[pc.legendAmount, { color: slice.color }]}>{slice.amount}</Text>
              )}
            </View>
            {activeIndex === i && (
              <Text style={pc.legendDesc}>{slice.description}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {note && <Text style={pc.note}>{note}</Text>}
    </View>
  );
}

// ─── Flip Card Deck (swipeable, tap to flip) ──────────
export function FlipCardDeck({ title, cards }) {
  // cards: [{ front, back, backLabel }]
  const SW = Dimensions.get('window').width - 48;
  const [flipped, setFlipped] = useState({});
  const anims = useRef(cards.map(() => new Animated.Value(0))).current;
  const scrollRef = useRef(null);

  useEffect(() => {
    return () => {
      anims.forEach(anim => {
        anim.stopAnimation();
        anim.removeAllListeners();
      });
    };
  }, []);

  const flip = (i) => {
    const toValue = flipped[i] ? 0 : 1;
    const a = Animated.spring(anims[i], {
      toValue,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    });
    a.start();
    setFlipped(f => ({ ...f, [i]: !f[i] }));
  };

  return (
    <View style={fd.wrapper}>
      {title && <Text style={fd.title}>{title}</Text>}
      <Text style={fd.hint}>Tap to flip · Swipe for next</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 16}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 16, paddingHorizontal: 0 }}
        style={{ overflow: 'visible' }}
      >
        {cards.map((card, i) => {
          const frontRotate = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          });
          const backRotate = anims[i].interpolate({
            inputRange: [0, 1],
            outputRange: ['180deg', '360deg'],
          });
          const frontOpacity = anims[i].interpolate({
            inputRange: [0, 0.5, 0.5, 1],
            outputRange: [1, 1, 0, 0],
          });
          const backOpacity = anims[i].interpolate({
            inputRange: [0, 0.5, 0.5, 1],
            outputRange: [0, 0, 1, 1],
          });

          return (
            <TouchableOpacity
              key={i}
              onPress={() => flip(i)}
              activeOpacity={1}
              style={[fd.cardContainer, { width: SW }]}
            >
              {/* Front — Fixed mindset */}
              <Animated.View style={[
                fd.card, fd.cardFront,
                { width: SW, opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }
              ]}>
                <View style={fd.cardTopRow}>
                  <View style={fd.badgeFront}><Text style={fd.badgeText}>{card.frontLabel || '❌ Fixed'}</Text></View>
                  <Text style={fd.cardNum}>{i + 1}/{cards.length}</Text>
                </View>
                <Text style={fd.cardTextFront}>{card.front}</Text>
                <Text style={fd.tapHintFront}>Tap to see the reframe →</Text>
              </Animated.View>

              {/* Back — Growth mindset */}
              <Animated.View style={[
                fd.card, fd.cardBack,
                { width: SW, opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] }
              ]}>
                <View style={fd.cardTopRow}>
                  <View style={fd.badgeBack}><Text style={fd.badgeText}>{card.backLabel || '✅ Growth'}</Text></View>
                  <Text style={fd.cardNum}>{i + 1}/{cards.length}</Text>
                </View>
                <Text style={fd.cardTextBack}>{card.back}</Text>
                {card.tag && (
                  <View style={fd.backLabel}>
                    <Text style={fd.backLabelText}>{card.tag}</Text>
                  </View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Dot indicators */}
      <View style={fd.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[fd.dot, flipped[i] && fd.dotFlipped]} />
        ))}
      </View>
    </View>
  );
}

const fd = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  cardContainer: { position: 'relative', height: 180 },
  card: {
    position: 'absolute', top: 0, left: 0,
    height: 180, borderRadius: 18, padding: 20,
    justifyContent: 'space-between',
    backfaceVisibility: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  cardFront: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#FECACA' },
  cardBack: { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: '#BBF7D0' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeFront: { backgroundColor: '#DC2626', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeBack: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  cardNum: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  cardTextFront: { fontSize: 16, fontWeight: '700', color: '#991B1B', lineHeight: 24, flex: 1, paddingVertical: 10 },
  cardTextBack: { fontSize: 16, fontWeight: '700', color: '#065F46', lineHeight: 24, flex: 1, paddingVertical: 10 },
  tapHintFront: { fontSize: 12, color: '#DC2626', fontWeight: '600', opacity: 0.7 },
  backLabel: { alignSelf: 'flex-start', backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  backLabelText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotFlipped: { backgroundColor: '#059669' },
});

// ─── Timeline Block ───────────────────────────────────
export function TimelineBlock({ title, nodes }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  const isMounted = useRef(true);
  const { width: SCREEN } = Dimensions.get('window');
  const PANEL = SCREEN - 32;
  const STEP = PANEL + 16;

  useEffect(() => {
    return () => {
      isMounted.current = false;
      scrollRef.current = null;
    };
  }, []);

  const handleNodePress = (i) => {
    if (!isMounted.current) return;
    setActive(i);
    scrollRef.current?.scrollTo({ x: i * STEP, animated: true });
  };

  const handleScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / STEP);
    if (i >= 0 && i < nodes.length && isMounted.current) setActive(i);
  };

  return (
    <View style={tl.wrapper}>
      {title && <Text style={tl.title}>{title}</Text>}

      {/* Node row */}
      <View style={tl.nodeRow}>
        {nodes.map((node, i) => {
          const isActive = active === i;
          const isPast = i < active;
          const isLast = i === nodes.length - 1;
          return (
            <React.Fragment key={i}>
              <TouchableOpacity style={tl.nodeCol} onPress={() => handleNodePress(i)} activeOpacity={0.8}>
                <View style={[
                  tl.nodeCircle,
                  isActive && { backgroundColor: node.color, borderColor: node.color },
                  isPast && { backgroundColor: '#D1D5DB', borderColor: '#D1D5DB' },
                  !isActive && !isPast && { backgroundColor: '#fff', borderColor: '#D1D5DB' },
                ]}>
                  <Text style={[tl.nodeIcon, { color: isActive ? '#fff' : '#9CA3AF' }]}>
                    {node.icon}
                  </Text>
                </View>
                <Text
                  style={[tl.nodeLabel, {
                    color: isActive ? node.color : '#9CA3AF',
                    fontWeight: isActive ? '700' : '500',
                  }]}
                  numberOfLines={2}
                >
                  {node.label}
                </Text>
              </TouchableOpacity>
              {!isLast && <View style={tl.connector} />}
            </React.Fragment>
          );
        })}
      </View>

      {/* Swipeable panels */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={STEP}
        snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
      >
        {nodes.map((node, i) => (
          <View key={i} style={[tl.panel, { width: PANEL, borderColor: node.color }]}>
            <View style={[tl.panelHeader, { backgroundColor: node.color }]}>
              <Text style={tl.panelIcon}>{node.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={tl.panelLabel}>{node.label}</Text>
                <Text style={tl.panelSublabel}>{node.sublabel}</Text>
              </View>
            </View>
            <View style={tl.panelBody}>
              {node.examples && (
                <>
                  <Text style={[tl.sectionLabel, { color: node.color }]}>EXAMPLES</Text>
                  <View style={tl.exampleRow}>
                    {node.examples.map((ex, j) => (
                      <View key={j} style={[tl.examplePill, { borderColor: node.color }]}>
                        <Text style={[tl.exampleText, { color: node.color }]}>{ex}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {node.details && node.details.map((d, j) => (
                <View key={j} style={tl.detailRow}>
                  <View style={[tl.detailDot, { backgroundColor: node.color }]} />
                  <Text style={tl.detailText}>{d}</Text>
                </View>
              ))}
              {node.tip && (
                <View style={[tl.tip, { borderColor: node.color }]}>
                  <Text style={tl.tipIcon}>💡</Text>
                  <Text style={tl.tipText}>{node.tip}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Dots + hint outside panel */}
      <View style={tl.navDots}>
        {nodes.map((n, i) => (
          <View key={i} style={[tl.navDot, active === i && { backgroundColor: nodes[active].color, width: 14 }]} />
        ))}
      </View>
      <Text style={tl.swipeHint}>
        {active < nodes.length - 1 ? 'Swipe for next →' : '✓ All steps explored'}
      </Text>
    </View>
  );
}

const tl = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  nodeRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  nodeCol: { alignItems: 'center', flex: 1 },
  nodeCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  nodeIcon: { fontSize: 18 },
  nodeLabel: { fontSize: 10, textAlign: 'center', paddingHorizontal: 2 },
  connector: { height: 2, flex: 1, backgroundColor: '#D1D5DB', marginTop: 21 },
  panel: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  panelHeader: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelIcon: { fontSize: 28 },
  panelLabel: { fontSize: 16, fontWeight: '800', color: '#fff' },
  panelSublabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  panelBody: { padding: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  exampleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  examplePill: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5 },
  exampleText: { fontSize: 12, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  detailDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  detailText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 21 },
  tip: { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'flex-start', marginTop: 4 },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
  navDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 4 },
  navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  swipeHint: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
});


// ─── Scenario Swipe Cards (swipeable, pick reaction, reveal bias) ──
export function ScenarioCards({ title, scenarios }) {
  // scenarios: [{ situation, options: [{ text, biasLabel, biasExplanation, isIdeal }], icon }]
  const SW = Dimensions.get('window').width - 48;
  const [answers, setAnswers] = useState({});
  const scrollRef = useRef(null);

  const handlePick = (si, oi) => {
    if (answers[si] !== undefined) return;
    setAnswers(a => ({ ...a, [si]: oi }));
  };

  return (
    <View style={sc.wrapper}>
      {title && <Text style={sc.title}>{title}</Text>}
      <Text style={sc.hint}>Pick your reaction · Swipe for next</Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 16}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 16 }}
      >
        {scenarios.map((scenario, si) => {
          const picked = answers[si];
          const isDone = picked !== undefined;

          return (
            <View key={si} style={[sc.card, { width: SW }]}>
              {/* Scenario header */}
              <View style={sc.cardHeader}>
                <Text style={sc.cardIcon}>{scenario.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={sc.cardLabel}>SCENARIO {si + 1}/{scenarios.length}</Text>
                  <Text style={sc.cardSituation}>{scenario.situation}</Text>
                </View>
              </View>

              <Text style={sc.pickLabel}>
                {isDone ? 'Here\'s what your choice reveals:' : 'What do you do?'}
              </Text>

              {/* Options */}
              {scenario.options.map((opt, oi) => {
                const isSelected = picked === oi;
                const isIdeal = opt.isIdeal;
                const showResult = isDone;

                return (
                  <TouchableOpacity
                    key={oi}
                    style={[
                      sc.option,
                      !isDone && sc.optionActive,
                      showResult && isSelected && isIdeal && sc.optionIdeal,
                      showResult && isSelected && !isIdeal && sc.optionBias,
                      showResult && !isSelected && sc.optionDimmed,
                    ]}
                    onPress={() => handlePick(si, oi)}
                    disabled={isDone}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      sc.optionText,
                      showResult && isSelected && isIdeal && sc.optionTextIdeal,
                      showResult && isSelected && !isIdeal && sc.optionTextBias,
                    ]}>
                      {opt.text}
                    </Text>
                    {showResult && isSelected && (
                      <AnimatedBlock delay={0}>
                        <View style={[sc.biasTag, isIdeal ? sc.biasTagIdeal : sc.biasTagBias]}>
                          <Text style={[sc.biasTagText, isIdeal ? sc.biasTagTextIdeal : sc.biasTagTextBias]}>
                            {isIdeal ? '✅ ' : '🧠 '}{opt.biasLabel}
                          </Text>
                        </View>
                        <Text style={sc.biasExplanation}>{opt.biasExplanation}</Text>
                      </AnimatedBlock>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      {/* Progress dots */}
      <View style={sc.dots}>
        {scenarios.map((_, i) => (
          <View key={i} style={[sc.dot, answers[i] !== undefined && sc.dotDone]} />
        ))}
      </View>
    </View>
  );
}

const sc = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: '#E0E7FF',
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  cardIcon: { fontSize: 28 },
  cardLabel: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.5, marginBottom: 4 },
  cardSituation: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 20 },
  pickLabel: { fontSize: 13, color: '#6B7280', marginBottom: 10, fontWeight: '500' },
  option: { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  optionActive: { borderColor: '#C7D2FE', backgroundColor: '#F5F6FF' },
  optionIdeal: { borderColor: '#059669', backgroundColor: '#F0FDF4' },
  optionBias: { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' },
  optionDimmed: { opacity: 0.4 },
  optionText: { fontSize: 13, color: '#374151', fontWeight: '500', lineHeight: 19 },
  optionTextIdeal: { color: '#065F46', fontWeight: '600' },
  optionTextBias: { color: '#92400E', fontWeight: '600' },
  biasTag: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8, marginBottom: 4 },
  biasTagIdeal: { backgroundColor: '#DCFCE7' },
  biasTagBias: { backgroundColor: '#FEF3C7' },
  biasTagText: { fontSize: 11, fontWeight: '800' },
  biasTagTextIdeal: { color: '#059669' },
  biasTagTextBias: { color: '#D97706' },
  biasExplanation: { fontSize: 12, color: '#6B7280', lineHeight: 18, fontStyle: 'italic' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotDone: { backgroundColor: '#4F46E5' },
});

// ─── Single Bucket Item (extracted for hooks compliance) ──
function BucketItem({ bucket, index, isOpen, onToggle }) {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(fillAnim, {
      toValue: bucket.fillPercent / 100,
      duration: 800,
      delay: index * 150,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, []);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${bucket.fillPercent}%`],
  });

  return (
    <TouchableOpacity
      style={[bk.bucket, { borderColor: bucket.color }, isOpen && { backgroundColor: '#FAFAFA' }]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={bk.topRow}>
        <View style={[bk.iconBg, { backgroundColor: bucket.color }]}>
          <Text style={bk.icon}>{bucket.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={bk.bucketName}>{bucket.name}</Text>
          <Text style={bk.bucketSub}>{bucket.subtitle}</Text>
        </View>
        <View style={[bk.priorityBadge, { backgroundColor: bucket.color }]}>
          <Text style={bk.priorityText}>#{index + 1}</Text>
        </View>
      </View>

      <View style={bk.fillTrack}>
        <Animated.View style={[bk.fillBar, { width: fillWidth, backgroundColor: bucket.color }]} />
      </View>
      <Text style={[bk.fillLabel, { color: bucket.color }]}>
        {bucket.fillPercent}% priority
      </Text>

      {isOpen && (
        <AnimatedBlock delay={0}>
          <View style={[bk.divider, { backgroundColor: bucket.color }]} />
          {bucket.details.map((d, di) => (
            <View key={di} style={bk.detailRow}>
              <View style={[bk.detailDot, { backgroundColor: bucket.color }]} />
              <Text style={bk.detailText}>{d}</Text>
            </View>
          ))}
          {bucket.tip && (
            <View style={[bk.tip, { borderColor: bucket.color }]}>
              <Text style={bk.tipIcon}>💡</Text>
              <Text style={bk.tipText}>{bucket.tip}</Text>
            </View>
          )}
        </AnimatedBlock>
      )}
    </TouchableOpacity>
  );
}

// ─── Bucket Block (visual savings buckets) ────────────
export function BucketBlock({ title, buckets }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <View style={bk.wrapper}>
      {title && <Text style={bk.title}>{title}</Text>}
      <Text style={bk.hint}>Tap a bucket to learn more</Text>
      {buckets.map((bucket, i) => (
        <BucketItem
          key={i}
          bucket={bucket}
          index={i}
          isOpen={expanded === i}
          onToggle={() => setExpanded(expanded === i ? null : i)}
        />
      ))}
    </View>
  );
}

const bk = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  hint: { fontSize: 12, color: '#9CA3AF', marginBottom: 10 },
  bucket: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon: { fontSize: 22 },
  bucketName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 2 },
  bucketSub: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  priorityBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  priorityText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  fillTrack: { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, marginBottom: 4, overflow: 'hidden' },
  fillBar: { height: 8, borderRadius: 4 },
  fillLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  divider: { height: 1.5, marginVertical: 12, opacity: 0.2 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  detailDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  detailText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 21 },
  tip: { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'flex-start', marginTop: 4 },
  tipIcon: { fontSize: 16 },
  tipText: { flex: 1, fontSize: 12, color: '#374151', lineHeight: 18 },
});
// ═══════════════════════════════════════════════════════
// INLINE EXERCISES
// ═══════════════════════════════════════════════════════

function ExerciseWrapper({ icon, title, children }) {
  return (
    <View style={ex.wrapper}>
      <View style={ex.header}>
        <Text style={ex.headerIcon}>{icon}</Text>
        <View>
          <Text style={ex.headerLabel}>EXERCISE</Text>
          <Text style={ex.headerTitle}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

function ResultBanner({ correct, message }) {
  const anim = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    const a = Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, []);
  return (
    <Animated.View style={[ex.result, correct ? ex.resultCorrect : ex.resultWrong, { transform: [{ scale: anim }] }]}>
      <Text style={ex.resultIcon}>{correct ? '🎉' : '💪'}</Text>
      <Text style={ex.resultText}>{message}</Text>
    </Animated.View>
  );
}

// ─── MCQ ──────────────────────────────────────────────
export function MCQExercise({ icon, title, question, options, correctIndex, explanation }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = selected === correctIndex;
  const reset = () => { setSelected(null); setSubmitted(false); };

  return (
    <ExerciseWrapper icon={icon} title={title}>
      <Text style={ex.question}>{question}</Text>
      {options.map((opt, i) => {
        let style = ex.option;
        let textStyle = ex.optionText;
        if (submitted) {
          if (i === correctIndex) { style = [ex.option, ex.optionCorrect]; textStyle = [ex.optionText, ex.optionTextCorrect]; }
          else if (i === selected) { style = [ex.option, ex.optionWrong]; }
        } else if (selected === i) {
          style = [ex.option, ex.optionSelected];
        }
        return (
          <TouchableOpacity key={i} style={style} onPress={() => !submitted && setSelected(i)} activeOpacity={0.8}>
            <View style={ex.optionDot}><Text style={ex.optionDotText}>{String.fromCharCode(65 + i)}</Text></View>
            <Text style={[textStyle, { flex: 1 }]}>{opt}</Text>
            {submitted && i === correctIndex && <Text style={ex.tick}>✓</Text>}
            {submitted && i === selected && i !== correctIndex && <Text style={ex.cross}>✗</Text>}
          </TouchableOpacity>
        );
      })}
      {!submitted
        ? <TouchableOpacity
            style={[ex.submitBtn, selected === null && ex.submitBtnDisabled]}
            onPress={() => selected !== null && setSubmitted(true)}
            disabled={selected === null}
          >
            <Text style={ex.submitBtnText}>Check Answer</Text>
          </TouchableOpacity>
        : <>
            <ResultBanner correct={correct} message={correct ? 'Correct! Well done.' : 'Not quite — see the correct answer above.'} />
            <Text style={ex.explanation}>{explanation}</Text>
            <TouchableOpacity style={ex.retryBtn} onPress={reset}>
              <Text style={ex.retryBtnText}>↩ Try Again</Text>
            </TouchableOpacity>
          </>
      }
    </ExerciseWrapper>
  );
}

// ─── True / False ─────────────────────────────────────
export function TrueFalseExercise({ icon, title, statements }) {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const allDone = Object.keys(revealed).length === statements.length;
  const score = statements.filter((st, i) => answers[i] === st.isTrue).length;

  const answer = (i, val) => {
    if (revealed[i]) return;
    setAnswers(a => ({ ...a, [i]: val }));
    setRevealed(r => ({ ...r, [i]: true }));
  };

  return (
    <ExerciseWrapper icon={icon} title={title}>
      <Text style={ex.tfIntro}>True or False? Tap your answer.</Text>
      {statements.map((stmt, i) => {
        const done = revealed[i];
        const correct = answers[i] === stmt.isTrue;
        return (
          <View key={i} style={[ex.tfCard, done && (correct ? ex.tfCardCorrect : ex.tfCardWrong)]}>
            <Text style={ex.tfText}>{stmt.text}</Text>
            {!done
              ? <View style={ex.tfButtons}>
                  <TouchableOpacity style={[ex.tfBtn, ex.tfBtnTrue]} onPress={() => answer(i, true)}>
                    <Text style={ex.tfBtnText}>TRUE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[ex.tfBtn, ex.tfBtnFalse]} onPress={() => answer(i, false)}>
                    <Text style={ex.tfBtnText}>FALSE</Text>
                  </TouchableOpacity>
                </View>
              : <AnimatedBlock delay={0}>
                  <Text style={[ex.tfResult, correct ? ex.tfResultCorrect : ex.tfResultWrong]}>
                    {correct ? '✓ Correct!' : `✗ Actually ${stmt.isTrue ? 'TRUE' : 'FALSE'}`}
                  </Text>
                  <Text style={ex.explanation}>{stmt.explanation}</Text>
                </AnimatedBlock>
            }
          </View>
        );
      })}
      {allDone && (
        <AnimatedBlock delay={0}>
          <View style={ex.scoreCard}>
            <Text style={ex.scoreText}>Score: {score}/{statements.length}</Text>
            <Text style={ex.scoreSubtext}>
              {score === statements.length ? '🎉 Perfect score!' :
               score >= Math.ceil(statements.length / 2) ? '💪 Good effort!' :
               '📚 Review above and try again!'}
            </Text>
          </View>
        </AnimatedBlock>
      )}
    </ExerciseWrapper>
  );
}

// ─── Slider Calculator ────────────────────────────────
export function SliderExercise({ icon, title, description, min, max, step, initialValue, prefix, calculateResult }) {
  const [value, setValue] = useState(initialValue);
  const result = calculateResult(value);

  const lightBg = (color) =>
    color === '#4F46E5' ? '#EEF2FF' :
    color === '#F59E0B' ? '#FFFBEB' :
    color === '#059669' ? '#ECFDF5' : '#F3F4F6';

  return (
    <ExerciseWrapper icon={icon} title={title}>
      <Text style={ex.question}>{description}</Text>
      <View style={ex.sliderValueRow}>
        <Text style={ex.sliderValueLabel}>Monthly Income</Text>
        <Text style={ex.sliderValue}>{prefix || '$'}{value.toLocaleString()}</Text>
      </View>
      <Slider
        style={ex.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={v => setValue(Math.round(v / step) * step)}
        minimumTrackTintColor="#4F46E5"
        maximumTrackTintColor="#E5E7EB"
        thumbTintColor="#4F46E5"
      />
      <View style={ex.sliderMinMax}>
        <Text style={ex.sliderMinMaxText}>{prefix}${min.toLocaleString()}</Text>
        <Text style={ex.sliderMinMaxText}>{prefix}${max.toLocaleString()}</Text>
      </View>
      <View style={ex.sliderResult}>
        {result.map((row, i) => (
          <View key={i} style={[ex.sliderResultRow, { backgroundColor: lightBg(row.color), borderLeftColor: row.color }]}>
            <Text style={ex.sliderResultLabel}>{row.label}</Text>
            <Text style={[ex.sliderResultValue, { color: row.color }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </ExerciseWrapper>
  );
}

// ─── Match ────────────────────────────────────────────
export function MatchExercise({ icon, title, instruction, pairs }) {
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [matched, setMatched] = useState({});
  const [wrong, setWrong] = useState(null);
  const allMatched = Object.keys(matched).length === pairs.length;

  const shuffledRight = useRef(
    [...pairs.map((p, i) => ({ text: p.right, index: i }))].sort(() => Math.random() - 0.5)
  ).current;

  const handleLeft = (i) => { if (matched[i] === undefined) setSelectedLeft(i); };
  const handleRight = (item) => {
    if (selectedLeft === null) return;
    if (Object.values(matched).includes(item.index)) return;
    if (item.index === selectedLeft) {
      setMatched(m => ({ ...m, [selectedLeft]: item.index }));
      setSelectedLeft(null);
    } else {
      setWrong(item.index);
      setTimeout(() => setWrong(null), 600);
      setSelectedLeft(null);
    }
  };

  return (
    <ExerciseWrapper icon={icon} title={title}>
      <Text style={ex.question}>{instruction}</Text>
      <View style={ex.matchGrid}>
        <View style={ex.matchCol}>
          {pairs.map((p, i) => (
            <TouchableOpacity
              key={i}
              style={[
                ex.matchItem, ex.matchItemLeft,
                matched[i] !== undefined && ex.matchItemDone,
                selectedLeft === i && ex.matchItemSelected,
              ]}
              onPress={() => handleLeft(i)}
            >
              <Text style={ex.matchText}>{p.left}</Text>
              {matched[i] !== undefined && <Text style={ex.matchTick}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
        <View style={ex.matchCol}>
          {shuffledRight.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={[
                ex.matchItem, ex.matchItemRight,
                Object.values(matched).includes(item.index) && ex.matchItemDone,
                wrong === item.index && ex.matchItemWrong,
              ]}
              onPress={() => handleRight(item)}
            >
              <Text style={ex.matchText}>{item.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {allMatched && (
        <AnimatedBlock delay={0}>
          <View style={ex.scoreCard}>
            <Text style={ex.scoreText}>🎉 All matched!</Text>
            <Text style={ex.scoreSubtext}>Great work connecting the concepts.</Text>
          </View>
        </AnimatedBlock>
      )}
    </ExerciseWrapper>
  );
}

// ─── Fill in the Blank ────────────────────────────────
export function FillBlankExercise({ icon, title, prompt, blanks, hint }) {
  const [inputs, setInputs] = useState(blanks.map(() => ''));
  const [submitted, setSubmitted] = useState(false);
  const correct = blanks.every((b, i) => inputs[i].trim().toLowerCase() === b.answer.toLowerCase());
  const parts = prompt.split('___');

  return (
    <ExerciseWrapper icon={icon} title={title}>
      <View style={ex.fillRow}>
        {parts.map((part, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={ex.fillText}>{part}</Text>
            {i < blanks.length && (
              <TextInput
                style={[
                  ex.fillInput,
                  submitted && (
                    inputs[i].trim().toLowerCase() === blanks[i].answer.toLowerCase()
                      ? ex.fillInputCorrect
                      : ex.fillInputWrong
                  ),
                ]}
                placeholder={blanks[i].placeholder}
                value={inputs[i]}
                onChangeText={t => { const u = [...inputs]; u[i] = t; setInputs(u); }}
                editable={!submitted}
              />
            )}
          </View>
        ))}
      </View>
      {hint && !submitted && <Text style={ex.hint}>💡 Hint: {hint}</Text>}
      {!submitted
        ? <TouchableOpacity style={ex.submitBtn} onPress={() => setSubmitted(true)}>
            <Text style={ex.submitBtnText}>Check Answer</Text>
          </TouchableOpacity>
        : <>
            <ResultBanner
              correct={correct}
              message={correct ? 'Correct! 🎉' : `Answer: ${blanks.map(b => b.answer).join(', ')}`}
            />
            <TouchableOpacity
              style={ex.retryBtn}
              onPress={() => { setInputs(blanks.map(() => '')); setSubmitted(false); }}
            >
              <Text style={ex.retryBtnText}>↩ Try Again</Text>
            </TouchableOpacity>
          </>
      }
    </ExerciseWrapper>
  );
}

// ─── Block dispatcher ─────────────────────────────────
export function renderBlock(block, i) {
  const delay = Math.min(i * 60, 300);
  const wrap = (child) => <AnimatedBlock key={i} delay={delay}>{child}</AnimatedBlock>;
  switch (block.type) {
    case 'text':        return wrap(<TextBlock {...block} />);
    case 'keyterm':     return wrap(<KeyTermBlock {...block} />);
    case 'table':       return wrap(<SmartTable headers={block.headers} rows={block.rows} />);
    case 'steps':       return wrap(<StepsBlock {...block} />);
    case 'callout':     return wrap(<CalloutBlock {...block} />);
    case 'bullets':     return wrap(<BulletsBlock {...block} />);
    case 'bot':         return wrap(<BotChip {...block} />);
    case 'mcq':         return wrap(<MCQExercise {...block} />);
    case 'truefalse':   return wrap(<TrueFalseExercise {...block} />);
    case 'slider':      return wrap(<SliderExercise {...block} />);
    case 'match':       return wrap(<MatchExercise {...block} />);
    case 'fillblank':   return wrap(<FillBlankExercise {...block} />);
    case 'beforeafter': return wrap(<BeforeAfterCards {...block} />);
    case 'topiccards':  return wrap(<TopicCards {...block} />);
    case 'piechart':    return wrap(<PieChartBlock {...block} />);
    case 'multistepmcq': return wrap(<MultiStepMCQ {...block} />);
    case 'flipcards':   return wrap(<FlipCardDeck {...block} />);
    case 'scenarios':   return wrap(<ScenarioCards {...block} />);
    case 'swipejudge': return wrap(<SwipeJudge {...block} />);
    case 'goalpicker': return wrap(<GoalPicker {...block} />);
    case 'checklist':       return wrap(<ChecklistBlock {...block} />);
    case 'tindertruefalse': return wrap(<TinderTrueFalse {...block} />);
    case 'biasreveal': return wrap(<BiasRevealCards {...block} />);
    case 'appcards': return wrap(<AppCards {...block} />);
    case 'buckets': return wrap(<BucketBlock {...block} />);
    case 'timeline': return wrap(<TimelineBlock {...block} />);
    default:            return null;
  }
}

// ═══════════════════════════════════════════════════════
// STYLESHEETS
// ═══════════════════════════════════════════════════════

const s = StyleSheet.create({
  text: { fontSize: 15, lineHeight: 26, color: '#374151', marginBottom: 14 },
  keytermBox: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#4F46E5' },
  keytermRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keytermPill: { backgroundColor: '#4F46E5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  keytermPillText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  keytermTerm: { flex: 1, fontSize: 15, fontWeight: '800', color: '#3730A3' },
  chevron: { fontSize: 11, color: '#6B7280' },
  keytermDef: { fontSize: 14, color: '#374151', lineHeight: 22, marginTop: 10 },
  stepsBox: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  stepsTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumActive: { backgroundColor: '#4F46E5' },
  stepNumDone: { backgroundColor: '#059669' },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  revealBtn: { backgroundColor: '#EEF2FF', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  revealBtnText: { fontSize: 14, fontWeight: '700', color: '#4F46E5' },
  allDoneRow: { alignItems: 'center', marginTop: 8 },
  allDoneText: { fontSize: 13, color: '#059669', fontWeight: '600' },
  callout: { borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4 },
  calloutLabel: { fontSize: 12, fontWeight: '800', color: '#374151', marginBottom: 6, letterSpacing: 0.3 },
  calloutText: { fontSize: 14, color: '#374151', lineHeight: 22 },
  bulletsBox: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 14 },
  bulletsTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 10 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bulletDot: { fontSize: 16, color: '#4F46E5', lineHeight: 22 },
  bulletText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  botChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 12, padding: 14, marginBottom: 14, gap: 10, borderWidth: 1, borderColor: '#C7D2FE' },
  botChipIcon: { fontSize: 20 },
  botChipText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  botArrow: { fontSize: 16, color: '#4F46E5' },
  botOpen: { backgroundColor: '#F0F4FF', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: '#C7D2FE' },
  botHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  botHeaderIcon: { fontSize: 18 },
  botHeaderLabel: { flex: 1, fontSize: 13, fontWeight: '800', color: '#4F46E5' },
  botClose: { fontSize: 16, color: '#6B7280' },
  botLoading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botLoadingText: { fontSize: 13, color: '#6B7280' },
  botAnswer: { fontSize: 14, color: '#374151', lineHeight: 22 },
});

const t = StyleSheet.create({
  pillWrapper: { marginBottom: 14, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  pillHeaderRow: { flexDirection: 'row' },
  pillHeaderCell: { flex: 1, padding: 10, alignItems: 'center' },
  pillHeaderText: { fontSize: 12, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  pillRow: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'stretch' },
  pillRowAlt: { backgroundColor: '#F9FAFB' },
  pillCell: { flex: 1, fontSize: 13, color: '#374151', padding: 12, lineHeight: 18 },
  pillCellLeft: { borderRightWidth: 1, borderRightColor: '#E5E7EB', color: '#DC2626' },
  pillCellRight: { color: '#059669' },
  pillDivider: { width: 1, backgroundColor: '#E5E7EB' },
  iconCardsWrapper: { marginBottom: 14, gap: 8 },
  iconCard: { backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconCardAccent: { paddingHorizontal: 14, paddingVertical: 10 },
  iconCardLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  iconCardPrimary: { fontSize: 16, fontWeight: '800' },
  iconCardBody: { paddingHorizontal: 14, paddingBottom: 12, gap: 4 },
  iconCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  iconCardSubLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', flex: 1 },
  iconCardSubValue: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 2, textAlign: 'right' },
  scrollTableWrapper: { marginBottom: 14, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', position: 'relative' },
  scrollTableHeaderRow: { flexDirection: 'row', backgroundColor: '#4F46E5' },
  scrollTableHeaderCell: { padding: 10 },
  scrollTableHeaderText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  scrollTableRow: { flexDirection: 'row', backgroundColor: '#fff' },
  scrollTableRowAlt: { backgroundColor: '#F9FAFB' },
  scrollTableCell: { padding: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  scrollTableCellFirst: { backgroundColor: '#EEF2FF' },
  scrollTableCellText: { fontSize: 12, color: '#374151', lineHeight: 18 },
  scrollTableCellTextFirst: { fontWeight: '700', color: '#3730A3' },
  scrollFade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 32, backgroundColor: 'transparent' },
});

const tc = StyleSheet.create({
  wrapper: { marginBottom: 14, gap: 10 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  card: { borderRadius: 18, padding: 16, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textSide: { flex: 1 },
  label: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  desc: { fontSize: 13, color: '#6B7280', lineHeight: 19 },
  tapHint: { fontSize: 12, fontWeight: '600', marginTop: 6, opacity: 0.8 },
  iconBg: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon: { fontSize: 34 },
  expanded: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  detailText: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 22 },
  example: { borderRadius: 10, padding: 12, backgroundColor: '#F9FAFB', borderLeftWidth: 3, marginTop: 4 },
  exampleLabel: { fontSize: 11, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 },
  exampleText: { fontSize: 13, color: '#374151', lineHeight: 20 },
});

const ba = StyleSheet.create({
  wrapper: { marginBottom: 14, gap: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  labelRow: { marginBottom: 10 },
  labelPill: { alignSelf: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  labelText: { fontSize: 11, fontWeight: '800', color: '#4F46E5', letterSpacing: 0.3 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side: { flex: 1, borderRadius: 10, padding: 10 },
  sideBefore: { backgroundColor: '#FEF2F2' },
  sideAfter: { backgroundColor: '#F0FDF4' },
  sideTag: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  sideText: { fontSize: 13, color: '#374151', lineHeight: 18, fontWeight: '500' },
  arrow: { fontSize: 18, color: '#9CA3AF' },
});

const pc = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  chartRow: { alignItems: 'center', marginBottom: 12 },
  legendWrapper: { gap: 8 },
  legendCard: { backgroundColor: '#fff', borderRadius: 14, borderLeftWidth: 4, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  legendTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendIcon: { fontSize: 22 },
  legendMeta: { flex: 1 },
  legendPct: { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  legendLabel: { fontSize: 13, color: '#374151', fontWeight: '600' },
  legendAmount: { fontSize: 14, fontWeight: '700' },
  legendDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 8 },
  note: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});

const ex = StyleSheet.create({
  wrapper: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerIcon: { fontSize: 28 },
  headerLabel: { fontSize: 10, fontWeight: '800', color: '#4F46E5', letterSpacing: 1 },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  question: { fontSize: 15, fontWeight: '600', color: '#111827', lineHeight: 22, marginBottom: 14 },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1.5, borderColor: '#E5E7EB' },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optionCorrect: { borderColor: '#059669', backgroundColor: '#DCFCE7' },
  optionWrong: { borderColor: '#DC2626', backgroundColor: '#FEF2F2' },
  optionDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  optionDotText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  optionText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  optionTextCorrect: { color: '#065F46', fontWeight: '600' },
  tick: { fontSize: 16, color: '#059669' },
  cross: { fontSize: 16, color: '#DC2626' },
  submitBtn: { backgroundColor: '#4F46E5', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { backgroundColor: '#C7D2FE' },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  retryBtn: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
  retryBtnText: { color: '#374151', fontSize: 14, fontWeight: '600' },
  result: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 8 },
  resultCorrect: { backgroundColor: '#DCFCE7' },
  resultWrong: { backgroundColor: '#FEF2F2' },
  resultIcon: { fontSize: 20 },
  resultText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#374151', lineHeight: 20 },
  explanation: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginTop: 4, marginBottom: 4, fontStyle: 'italic' },
  tfIntro: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  tfCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#E5E7EB' },
  tfCardCorrect: { backgroundColor: '#DCFCE7', borderColor: '#059669' },
  tfCardWrong: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  tfText: { fontSize: 14, color: '#111827', lineHeight: 20, marginBottom: 10, fontWeight: '500' },
  tfButtons: { flexDirection: 'row', gap: 8 },
  tfBtn: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  tfBtnTrue: { backgroundColor: '#DCFCE7', borderWidth: 1.5, borderColor: '#059669' },
  tfBtnFalse: { backgroundColor: '#FEF2F2', borderWidth: 1.5, borderColor: '#DC2626' },
  tfBtnText: { fontSize: 13, fontWeight: '800', color: '#374151' },
  tfResult: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tfResultCorrect: { color: '#059669' },
  tfResultWrong: { color: '#DC2626' },
  sliderValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sliderValueLabel: { fontSize: 14, color: '#6B7280' },
  sliderValue: { fontSize: 22, fontWeight: '800', color: '#4F46E5' },
  slider: { width: '100%', height: 40 },
  sliderMinMax: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sliderMinMaxText: { fontSize: 12, color: '#9CA3AF' },
  sliderResult: { gap: 6 },
  sliderResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, padding: 12, borderLeftWidth: 4 },
  sliderResultLabel: { fontSize: 14, color: '#374151', fontWeight: '500' },
  sliderResultValue: { fontSize: 16, fontWeight: '800' },
  matchGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  matchCol: { flex: 1, gap: 6 },
  matchItem: { borderRadius: 10, padding: 10, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', minHeight: 52, justifyContent: 'center' },
  matchItemLeft: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  matchItemRight: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  matchItemSelected: { borderColor: '#4F46E5', borderWidth: 2.5 },
  matchItemDone: { backgroundColor: '#DCFCE7', borderColor: '#059669', opacity: 0.8 },
  matchItemWrong: { backgroundColor: '#FEF2F2', borderColor: '#DC2626' },
  matchText: { fontSize: 12, color: '#374151', fontWeight: '500', lineHeight: 17 },
  matchTick: { fontSize: 11, color: '#059669', marginTop: 2 },
  fillRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 12, gap: 4 },
  fillText: { fontSize: 15, color: '#374151', lineHeight: 28 },
  fillInput: { borderBottomWidth: 2, borderBottomColor: '#4F46E5', fontSize: 15, fontWeight: '700', color: '#4F46E5', minWidth: 80, paddingVertical: 2, paddingHorizontal: 4, textAlign: 'center' },
  fillInputCorrect: { borderBottomColor: '#059669', color: '#059669' },
  fillInputWrong: { borderBottomColor: '#DC2626', color: '#DC2626' },
  hint: { fontSize: 13, color: '#6B7280', marginBottom: 12, fontStyle: 'italic' },
  scoreCard: { backgroundColor: '#EEF2FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  scoreText: { fontSize: 18, fontWeight: '800', color: '#4F46E5', marginBottom: 4 },
  scoreSubtext: { fontSize: 14, color: '#374151', textAlign: 'center' },
});
