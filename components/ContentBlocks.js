// components/ContentBlocks.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity,
  ActivityIndicator, ScrollView, TouchableWithoutFeedback,
  PanResponder, Dimensions
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Svg, G, Path, Text as SvgText } from 'react-native-svg';
import { getBotFact } from '../lib/api';

// ═══════════════════════════════════════════════════════
// THEME — change colours here, they propagate everywhere
// ═══════════════════════════════════════════════════════
const C = {
  primary:       '#4F46E5',   // indigo  — main brand
  primaryLight:  '#EEF2FF',   // indigo  — backgrounds
  primaryMid:    '#C7D2FE',   // indigo  — borders
  primaryDark:   '#3730A3',   // indigo  — dark text
  success:       '#059669',   // green   — correct / done
  successLight:  '#DCFCE7',
  successMid:    '#BBF7D0',
  successDark:   '#065F46',
  warning:       '#F59E0B',   // amber   — warnings / bias
  warningLight:  '#FFFBEB',
  warningMid:    '#FEF3C7',
  danger:        '#DC2626',   // red     — wrong / false
  dangerLight:   '#FEF2F2',
  dangerMid:     '#FECACA',
  neutral1:      '#111827',   // text    — headings
  neutral2:      '#374151',   // text    — body
  neutral3:      '#6B7280',   // text    — secondary
  neutral4:      '#9CA3AF',   // text    — hints
  border:        '#E5E7EB',
  borderLight:   '#F3F4F6',
  cardBg:        '#F9FAFB',
  white:         '#ffffff',
};

// ─── Completed banner (shared by all earnable blocks) ─
function CompletedBanner({ onContinue }) {
  return (
    <View style={shared.completedBanner}>
      <Text style={shared.completedBannerText}>✅ Completed — FinCoins earned</Text>
      {onContinue && (
        <TouchableOpacity style={shared.continueBtn} onPress={onContinue}>
          <Text style={shared.continueBtnText}>Continue →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
function FailedBanner({ correct, total, onRetry }) {
  const needed = Math.ceil(total * 0.7);
  return (
    <View style={shared.failedBanner}>
      <View style={shared.failedBannerTop}>
        <Text style={shared.failedBannerIcon}>🎯</Text>
        <View style={shared.failedBannerMeta}>
          <Text style={shared.failedBannerTitle}>Not quite there yet</Text>
          <Text style={shared.failedBannerSub}>Need {needed}/{total} to earn FinCoins & continue</Text>
        </View>
      </View>
      <TouchableOpacity style={shared.failedRetryBtn} onPress={onRetry}>
        <Text style={shared.failedRetryBtnText}>↩ Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}
const shared = StyleSheet.create({
  completedBanner: {
    backgroundColor: C.successLight, borderRadius: 12,
    padding: 14, alignItems: 'center', width: '100%', marginTop: 8,
  },
  completedBannerText: { fontSize: 14, fontWeight: '700', color: C.success },

  continueBtn: {
  backgroundColor: C.primary, borderRadius: 10,
  paddingVertical: 10, paddingHorizontal: 20, marginTop: 8, alignItems: 'center', width: '100%',
},
continueBtnText: { fontSize: 14, fontWeight: '800', color: C.white },

  failedBanner: {
  borderRadius: 14, padding: 14, width: '100%', marginTop: 8,
  borderWidth: 1.5, borderColor: '#FCA5A5',
  backgroundColor: '#FFF5F5', gap: 12,
},
failedBannerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
failedBannerIcon: { fontSize: 32, lineHeight: 38 },failedBannerMeta: { flex: 1 },
failedBannerTitle: { fontSize: 13, fontWeight: '800', color: C.danger, marginBottom: 2 },
failedBannerSub: { fontSize: 12, color: '#7F1D1D', lineHeight: 17 },
failedRetryBtn: {
  backgroundColor: C.danger, borderRadius: 10,
  paddingVertical: 10, alignItems: 'center', width: '100%',
},
failedRetryBtnText: { fontSize: 13, fontWeight: '800', color: C.white },
});

// ─── Animated wrapper ─────────────────────────────────
export function AnimatedBlock({ children, delay = 0 }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 380, delay, useNativeDriver: true }),
      Animated.timing(ty,      { toValue: 0, duration: 380, delay, useNativeDriver: true }),
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

// ─── Section Heading ──────────────────────────────────
export function SectionHeading({ text }) {
  return <Text style={s.sectionHeading}>{text}</Text>;
}

// ─── Section Subheading ───────────────────────────────
export function SectionSubheading({ text }) {
  return <Text style={s.sectionSubheading}>{text}</Text>;
}

// ─── Key Term (tap to expand) ─────────────────────────
export function KeyTermBlock({ term, definition }) {
  const [open, setOpen] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;
  const hasMeasured = useRef(false);

  const toggle = () => {
    setOpen(o => !o);
    Animated.timing(anim, { toValue: open ? 0 : 1, duration: 220, useNativeDriver: false }).start();
  };

  const maxH = anim.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight || 200] });

  return (
    <TouchableOpacity style={s.keytermBox} onPress={toggle} activeOpacity={0.85}>
      <View style={s.keytermRow}>
        <View style={s.keytermPill}><Text style={s.keytermPillText}>KEY TERM</Text></View>
        <Text style={s.keytermTerm}>{term}</Text>
        <Text style={s.chevron}>{open ? '▲' : '▼'}</Text>
      </View>
      <Animated.View style={{ maxHeight: maxH, overflow: 'hidden' }}>
        <Text
          style={s.keytermDef}
          onLayout={e => {
            if (hasMeasured.current) return;
            hasMeasured.current = true;
            setMeasuredHeight(e.nativeEvent.layout.height);
          }}
        >
          {definition}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Smart Table ──────────────────────────────────────
export function SmartTable({ headers, rows, firstColAccent }) {
  const colCount = headers.length;
  const rowCount = rows.length;
  if (colCount === 2) return <PillTable headers={headers} rows={rows} firstColAccent={firstColAccent} />;
  if (colCount === 3 && rowCount <= 3) return <IconRowCards headers={headers} rows={rows} />;
  return <ScrollTable headers={headers} rows={rows} />;
}

function PillTable({ headers, rows, firstColAccent }) {
  return (
    <View style={t.pillWrapper}>
      <View style={t.pillHeaderRow}>
        <View style={[t.pillHeaderCell, { backgroundColor: C.primary }]}>
          <Text style={t.pillHeaderText}>{headers[0]}</Text>
        </View>
        <View style={[t.pillHeaderCell, { backgroundColor: C.success }]}>
          <Text style={t.pillHeaderText}>{headers[1]}</Text>
        </View>
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[t.pillRow, i % 2 === 1 && t.pillRowAlt]}>
          <Text style={[t.pillCell, t.pillCellLeft, firstColAccent && t.pillCellLeftAccent]}>{row[0]}</Text>
          <Text style={[t.pillCell]}>{row[1]}</Text>
        </View>
      ))}
    </View>
  );
}

function IconRowCards({ headers, rows }) {
  const colors = [C.primary, C.success, C.warning, C.danger];
  const lightBg = (color) =>
    color === C.primary ? C.primaryLight :
    color === C.success ? '#ECFDF5' :
    color === C.warning ? C.warningLight : C.dangerLight;

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
                  <Text style={[t.scrollTableCellText, ci === 0 && t.scrollTableCellTextFirst]}>{cell}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Steps ────────────────────────────────────────────
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

// ─── Callout ──────────────────────────────────────────
export function CalloutBlock({ variant, text }) {
  const cfg = {
    tip:     { bg: C.warningLight,  border: C.warning,  icon: '💡', label: 'Singapore Tip' },
    warning: { bg: '#FFF1F2',       border: '#F43F5E',  icon: '⚠️', label: 'Watch Out' },
    fact:    { bg: '#EFF6FF',       border: '#3B82F6',  icon: '📊', label: 'Did You Know?' },
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
            <ActivityIndicator size="small" color={C.primary} />
            <Text style={s.botLoadingText}>Checking knowledge base...</Text>
          </View>
        : <Text style={s.botAnswer}>{answer}</Text>
      }
    </View>
  );
}

// ─── Checklist ────────────────────────────────────────
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
            <Text style={[cl.itemText, isChecked && cl.itemTextChecked]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
      {allDone && (
        <AnimatedBlock delay={0}>
          <View style={cl.completeBanner}>
            <Text style={cl.completeBannerText}>🎉 All items checked!</Text>
          </View>
        </AnimatedBlock>
      )}
    </View>
  );
}

// ─── Goal Picker ──────────────────────────────────────
export function GoalPicker({ title, goals }) {
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
              <Text style={[gp.goalLabel, isSelected && gp.goalLabelSelected]}>{goal.label}</Text>
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
                  {goal.tip && <Text style={gp.goalTip}>{goal.tip}</Text>}
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
              <Text style={[gp.summaryLabel, { fontWeight: '800', color: C.neutral1 }]}>Total monthly saving needed:</Text>
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

// ─── Topic Cards ──────────────────────────────────────
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

  // animate both height and fade
  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // 0 → “auto”, we will use scaleY
  });
  const opacity = anim;

  const bgColor =
    card.color === C.primary ? '#F5F6FF' :
    card.color === C.warning ? '#FFFDF5' :
    card.color === C.success ? '#F5FFFA' : C.white;

  const iconBgColor =
    card.color === C.primary ? C.primaryLight :
    card.color === C.warning ? C.warningLight :
    card.color === C.success ? '#ECFDF5' : C.borderLight;

  return (
    <TouchableOpacity
      style={[tc.card, { borderColor: card.color, backgroundColor: bgColor }]}
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={tc.row}>
        <View style={tc.textSide}>
          <Text style={[tc.label, { color: card.color }]}>{card.label}</Text>
          <Text style={tc.desc}>{card.description}</Text>
          {!isOpen && (
            <Text style={[tc.tapHint, { color: card.color }]}>
              Tap to learn more →
            </Text>
          )}
        </View>
        <View style={[tc.iconBg, { backgroundColor: iconBgColor }]}>
          <Text style={tc.icon}>{card.icon}</Text>
        </View>
      </View>

      <Animated.View
        style={{
          transform: [{ scaleY: height }],
          opacity,
          transformOrigin: 'top',
        }}
      >
        {isOpen && (
          <View style={[tc.expanded, { borderTopColor: card.color }]}>
            {card.details?.map((point, i) => (
              <View key={i} style={tc.detailRow}>
                <View
                  style={[tc.detailDot, { backgroundColor: card.color }]}
                />
                <Text style={tc.detailText}>{point}</Text>
              </View>
            ))}
            {card.example && (
              <View style={[tc.example, { borderLeftColor: card.color }]}>
                <Text style={[tc.exampleLabel, { color: card.color }]}>
                  💡 Example
                </Text>
                <Text style={tc.exampleText}>{card.example}</Text>
              </View>
            )}
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}


// ─── App Cards ────────────────────────────────────────
export function AppCards({ title, apps }) {
  const [expanded, setExpanded] = useState(null);
  const SW = Dimensions.get('window').width - 48;

  return (
    <View style={ac.wrapper}>
      {title && <Text style={ac.title}>{title}</Text>}
      <Text style={ac.hint}>Tap an app to learn more · Swipe for next</Text>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 12} decelerationRate="fast"
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
              <View style={ac.pillRow}>
                <View style={[ac.pill, { backgroundColor: app.color }]}>
                  <Text style={ac.pillText}>{app.cost}</Text>
                </View>
                <View style={ac.pillOutline}>
                  <Text style={[ac.pillOutlineText, { color: app.color }]}>
                    {'⭐'.repeat(Math.round(app.rating))} {app.rating}/5
                  </Text>
                </View>
              </View>
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
      <View style={ac.dots}>
        {apps.map((_, i) => (
          <View key={i} style={[ac.dot, expanded === i && ac.dotActive]} />
        ))}
      </View>
    </View>
  );
}

// ─── Slider Exercise (non-earnable, no onComplete) ────
export function SliderExercise({ icon, title, description, min, max, step, initialValue, prefix, calculateResult }) {
  const [value, setValue] = useState(initialValue);
  const result = calculateResult(value);
  const lightBg = (color) =>
    color === C.primary ? C.primaryLight :
    color === C.warning ? C.warningLight :
    color === C.success ? '#ECFDF5' :
    color === C.danger  ? C.dangerLight : C.borderLight;

  return (
    <View style={ex.wrapper}>
      <View style={ex.header}>
        <Text style={ex.headerIcon}>{icon}</Text>
        <View><Text style={ex.headerLabel}>EXERCISE</Text><Text style={ex.headerTitle}>{title}</Text></View>
      </View>
      <Text style={ex.question}>{description}</Text>
      <View style={ex.sliderValueRow}>
        <Text style={ex.sliderValueLabel}>Amount</Text>
        <Text style={ex.sliderValue}>{prefix || '$'}{value.toLocaleString()}</Text>
      </View>
      <Slider
        style={ex.slider}
        minimumValue={min} maximumValue={max} step={step} value={value}
        onValueChange={v => setValue(Math.round(v / step) * step)}
        minimumTrackTintColor={C.primary} maximumTrackTintColor={C.border} thumbTintColor={C.primary}
      />
      <View style={ex.sliderMinMax}>
        <Text style={ex.sliderMinMaxText}>{prefix}{min.toLocaleString()}</Text>
        <Text style={ex.sliderMinMaxText}>{prefix}{max.toLocaleString()}</Text>
      </View>
      <View style={ex.sliderResult}>
        {result.map((row, i) => (
          <View key={i} style={[ex.sliderResultRow, { backgroundColor: lightBg(row.color), borderLeftColor: row.color }]}>
            <Text style={ex.sliderResultLabel}>{row.label}</Text>
            <Text style={[ex.sliderResultValue, { color: row.color }]}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Pie Chart ────────────────────────────────────────
export function PieChartBlock({ title, slices, note }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const size = 220; const cx = size / 2; const cy = size / 2;
  const radius = 80; const innerRadius = 48;

  const lightBg = (color) =>
    color === C.primary ? C.primaryLight :
    color === C.warning ? C.warningLight :
    color === C.success ? '#ECFDF5' : C.borderLight;

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
        `M ${ix1} ${iy1}`, `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix2} ${iy2}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`, 'Z',
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
                  <Path key={i} d={p.path} fill={slices[i].color}
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.3}
                    onPress={() => setActiveIndex(activeIndex === i ? null : i)}
                    stroke={C.white} strokeWidth={2}
                  />
                ))}
                {active ? (
                  <>
                    <SvgText x={cx} y={cy - 2} textAnchor="middle" alignmentBaseline="middle"
                      fontSize="20" fontWeight="800" fill={active.color}>{active.percentage}%</SvgText>
                    <SvgText x={cx} y={cy + 18} textAnchor="middle" alignmentBaseline="middle"
                      fontSize="11" fill={C.neutral3}>{active.label}</SvgText>
                  </>
                ) : (
                  <SvgText x={cx} y={cy + 4} textAnchor="middle" alignmentBaseline="middle"
                    fontSize="12" fill={C.neutral4}>Tap a slice</SvgText>
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
            style={[pc.legendCard, { borderLeftColor: slice.color }, activeIndex === i && { backgroundColor: lightBg(slice.color) }]}
            onPress={() => setActiveIndex(activeIndex === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={pc.legendTop}>
              <Text style={pc.legendIcon}>{slice.icon}</Text>
              <View style={pc.legendMeta}>
                <Text style={[pc.legendPct, { color: slice.color }]}>{slice.percentage}%</Text>
                <Text style={pc.legendLabel}>{slice.label}</Text>
              </View>
              {slice.amount && <Text style={[pc.legendAmount, { color: slice.color }]}>{slice.amount}</Text>}
            </View>
            {activeIndex === i && <Text style={pc.legendDesc}>{slice.description}</Text>}
          </TouchableOpacity>
        ))}
      </View>
      {note && <Text style={pc.note}>{note}</Text>}
    </View>
  );
}

// ─── Flip Card Deck ───────────────────────────────────
export function FlipCardDeck({ title, cards }) {
  const SW = Dimensions.get('window').width - 48;
  const [flipped, setFlipped] = useState({});
  const [cardHeight, setCardHeight] = useState(180);
  const measuredHeights = useRef({});
  const anims = useRef(cards.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    return () => { anims.forEach(a => { a.stopAnimation(); a.removeAllListeners(); }); };
  }, []);

  const flip = (i) => {
    const toValue = flipped[i] ? 0 : 1;
    Animated.spring(anims[i], { toValue, friction: 8, tension: 60, useNativeDriver: true }).start();
    setFlipped(f => ({ ...f, [i]: !f[i] }));
  };

  const onCardLayout = (e, key) => {
    const h = e.nativeEvent.layout.height;
    measuredHeights.current[key] = h;
    const allHeights = Object.values(measuredHeights.current);
    if (allHeights.length === cards.length * 2) setCardHeight(Math.max(...allHeights));
  };

  return (
    <View style={fd.wrapper}>
      {title && <Text style={fd.title}>{title}</Text>}
      <Text style={fd.hint}>Tap to flip · Swipe for next</Text>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 16} decelerationRate="fast"
        contentContainerStyle={{ gap: 16 }} style={{ overflow: 'visible' }}
      >
        {cards.map((card, i) => {
          const frontRotate = anims[i].interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
          const backRotate  = anims[i].interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
          const frontOpacity = anims[i].interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [1, 1, 0, 0] });
          const backOpacity  = anims[i].interpolate({ inputRange: [0, 0.5, 0.5, 1], outputRange: [0, 0, 1, 1] });

          return (
            <TouchableOpacity
              key={i} onPress={() => flip(i)} activeOpacity={1}
              style={[fd.cardContainer, { width: SW, height: cardHeight }]}
            >
              <Animated.View
                onLayout={(e) => onCardLayout(e, `front-${i}`)}
                style={[fd.card, fd.cardFront, { width: SW, minHeight: cardHeight, opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}
              >
                <View style={fd.cardTopRow}>
                  <View style={fd.badgeFront}><Text style={fd.badgeText}>{card.frontLabel || '❌ Fixed'}</Text></View>
                  <Text style={fd.cardNum}>{i + 1}/{cards.length}</Text>
                </View>
                <Text style={fd.cardTextFront}>{card.front}</Text>
                <Text style={fd.tapHintFront}>Tap to see the reframe →</Text>
              </Animated.View>
              <Animated.View
                onLayout={(e) => onCardLayout(e, `back-${i}`)}
                style={[fd.card, fd.cardBack, { width: SW, minHeight: cardHeight, opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}
              >
                <View style={fd.cardTopRow}>
                  <View style={fd.badgeBack}><Text style={fd.badgeText}>{card.backLabel || '✅ Growth'}</Text></View>
                  <Text style={fd.cardNum}>{i + 1}/{cards.length}</Text>
                </View>
                <Text style={fd.cardTextBack}>{card.back}</Text>
                {card.tag && (
                  <View style={fd.backLabel}><Text style={fd.backLabelText}>{card.tag}</Text></View>
                )}
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={fd.dots}>
        {cards.map((_, i) => (
          <View key={i} style={[fd.dot, flipped[i] && fd.dotFlipped]} />
        ))}
      </View>
    </View>
  );
}

// ─── Timeline ─────────────────────────────────────────
export function TimelineBlock({ title, nodes }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);
  const isMounted = useRef(true);
  const { width: SCREEN } = Dimensions.get('window');
  const PANEL = SCREEN - 32;
  const STEP = PANEL + 16;

  useEffect(() => { return () => { isMounted.current = false; scrollRef.current = null; }; }, []);

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
      <View style={tl.nodeRow}>
        {nodes.map((node, i) => {
          const isActive = active === i; const isPast = i < active; const isLast = i === nodes.length - 1;
          return (
            <React.Fragment key={i}>
              <TouchableOpacity style={tl.nodeCol} onPress={() => handleNodePress(i)} activeOpacity={0.8}>
                <View style={[
                  tl.nodeCircle,
                  isActive && { backgroundColor: node.color, borderColor: node.color },
                  isPast  && { backgroundColor: C.border, borderColor: C.border },
                  !isActive && !isPast && { backgroundColor: C.white, borderColor: C.border },
                ]}>
                  <Text style={[tl.nodeIcon, { color: isActive ? C.white : C.neutral4 }]}>{node.icon}</Text>
                </View>
                <Text style={[tl.nodeLabel, { color: isActive ? node.color : C.neutral4, fontWeight: isActive ? '700' : '500' }]} numberOfLines={2}>
                  {node.label}
                </Text>
              </TouchableOpacity>
              {!isLast && <View style={tl.connector} />}
            </React.Fragment>
          );
        })}
      </View>
      <ScrollView
        ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        decelerationRate="fast" snapToInterval={STEP} snapToAlignment="start"
        onMomentumScrollEnd={handleScroll}
        style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
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
      <View style={tl.navDots}>
        {nodes.map((n, i) => (
          <View key={i} style={[tl.navDot, active === i && { backgroundColor: nodes[active].color, width: 14 }]} />
        ))}
      </View>
      <Text style={tl.swipeHint}>{active < nodes.length - 1 ? 'Swipe for next →' : '✓ All steps explored'}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// EARNABLE EXERCISE BLOCKS
// ═══════════════════════════════════════════════════════

// ─── Tinder True/False ────────────────────────────────
export function TinderTrueFalse({ title, instruction, statements, onComplete, isCompleted }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const currentIndexRef = useRef(0);
  const resultsRef = useRef([]);
  const position = useRef(new Animated.ValueXY()).current;
  const isMounted = useRef(true);
  const SW = Dimensions.get('window').width - 48;

  useEffect(() => {
    return () => {
      isMounted.current = false;
      position.stopAnimation();
      position.removeAllListeners();
    };
  }, []);

  const rotate = position.x.interpolate({ inputRange: [-SW / 2, 0, SW / 2], outputRange: ['-12deg', '0deg', '12deg'], extrapolate: 'clamp' });
  const cardColor = position.x.interpolate({ inputRange: [-SW / 2, 0, SW / 2], outputRange: ['#FEE2E2', C.white, C.successLight], extrapolate: 'clamp' });

  const swipeOut = useCallback((direction) => {
    if (isAnimating) return;
    setIsAnimating(true);
    const toX = direction === 'right' ? SW * 1.5 : -SW * 1.5;
    Animated.timing(position, { toValue: { x: toX, y: 0 }, duration: 220, useNativeDriver: false }).start(() => {
      if (!isMounted.current) return;
      const idx = currentIndexRef.current;
      const statement = statements[idx];
      const isCorrect = (direction === 'right' && statement.isTrue) || (direction === 'left' && !statement.isTrue);
      const newResults = [...resultsRef.current, { direction, isCorrect, statement }];
      resultsRef.current = newResults;
      position.setValue({ x: 0, y: 0 });
      const nextIndex = idx + 1;
      if (nextIndex >= statements.length) {
        setResults(newResults);
        setDone(true);
        const correctCount = newResults.filter(r => r.isCorrect).length;
        const didPass = correctCount / statements.length >= 0.7;
        setPassed(didPass); // set BEFORE onComplete so it's ready when parent re-renders
        if (onComplete) onComplete(correctCount, statements.length);
      } else {
        currentIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
      }
      setIsAnimating(false);
    });
  }, [isAnimating, statements, position, SW, onComplete]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => { position.setValue({ x: g.dx, y: g.dy * 0.15 }); },
    onPanResponderRelease: (_, g) => {
      if (g.dx > SW / 4) swipeOut('right');
      else if (g.dx < -SW / 4) swipeOut('left');
      else Animated.spring(position, { toValue: { x: 0, y: 0 }, friction: 6, tension: 80, useNativeDriver: false }).start();
    },
  })).current;

  const handleReset = () => {
    currentIndexRef.current = 0; resultsRef.current = [];
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex(0); setResults([]); setDone(false); setPassed(false); setIsAnimating(false);
  };

  if (done) {
    const score = results.filter(r => r.isCorrect).length;
    const perfect = score === statements.length;
    const showPassed = passed || isCompleted; // ← internal flag OR parent already marked done
    return (
      <View style={tt.wrapper}>
        <View style={tt.header}>
          <Text style={tt.headerIcon}>🧠</Text>
          <View><Text style={tt.headerLabel}>RESULTS</Text><Text style={tt.headerTitle}>{title}</Text></View>
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
            {showPassed
              ? <CompletedBanner />
              : <FailedBanner correct={score} total={statements.length} onRetry={handleReset} />
            }
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
          <View key={i} style={[tt.progressSegment, i < currentIndex && tt.progressDone, i === currentIndex && tt.progressActive]} />
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
          style={[tt.card, { backgroundColor: cardColor, transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] }]}
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

// ─── Scenario Cards ───────────────────────────────────
// Always passes (1/1) — show CompletedBanner once all scenarios answered
// ─── Scenario Cards ───────────────────────────────────
export function ScenarioCards({ title, scenarios, onComplete, isCompleted }) {
  const SW = Dimensions.get('window').width - 48;
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false);
  const completedFired = useRef(false);

  const handlePick = (si, oi) => {
    if (answers[si] !== undefined) return;
    const newAnswers = { ...answers, [si]: oi };
    setAnswers(newAnswers);
    if (Object.keys(newAnswers).length === scenarios.length && onComplete && !completedFired.current) {
      completedFired.current = true;
      const correctCount = scenarios.filter((s, idx) => s.options[newAnswers[idx]]?.isIdeal).length;
      const didPass = correctCount / scenarios.length >= 0.7;
      setPassed(didPass);
      setDone(true);
      onComplete(correctCount, scenarios.length);
    }
  };

  const handleReset = () => {
    completedFired.current = false;
    setAnswers({});
    setDone(false);
    setPassed(false);
  };

  if (done) {
    const correctCount = scenarios.filter((s, idx) => s.options[answers[idx]]?.isIdeal).length;
    const perfect = correctCount === scenarios.length;
    const showPassed = passed || isCompleted;
    return (
      <View style={sc.wrapper}>
        <View style={sc.resultsHeader}>
          <Text style={sc.resultsHeaderIcon}>🎯</Text>
          <View><Text style={sc.resultsHeaderLabel}>RESULTS</Text><Text style={sc.resultsHeaderTitle}>{title}</Text></View>
        </View>
        <AnimatedBlock delay={0}>
          <View style={sc.scoreScreen}>
            <Text style={sc.scoreBig}>{correctCount}/{scenarios.length}</Text>
            <Text style={sc.scoreEmoji}>{perfect ? '🏆' : correctCount >= scenarios.length / 2 ? '💪' : '📚'}</Text>
            <Text style={sc.scoreMsg}>
              {perfect ? 'Perfect — ideal choices across the board.' :
               correctCount >= scenarios.length / 2 ? 'Good effort — review the scenarios you missed.' :
               'Review the lesson and try again.'}
            </Text>
            <View style={sc.resultsList}>
              {scenarios.map((scenario, i) => {
                const pickedOption = scenario.options[answers[i]];
                const isIdeal = pickedOption?.isIdeal;
                return (
                  <View key={i} style={[sc.resultRow, isIdeal ? sc.resultCorrect : sc.resultWrong]}>
                    <Text style={sc.resultIcon}>{isIdeal ? '✓' : '✗'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={sc.resultStatement}>{scenario.situation}</Text>
                      <Text style={sc.resultExplanation}>{pickedOption?.biasExplanation}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            {showPassed
              ? <CompletedBanner />
              : <FailedBanner correct={correctCount} total={scenarios.length} onRetry={handleReset} />
            }
          </View>
        </AnimatedBlock>
      </View>
    );
  }

  return (
    <View style={sc.wrapper}>
      {title && <Text style={sc.title}>{title}</Text>}
      <Text style={sc.hint}>Pick your reaction · Swipe for next</Text>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        snapToInterval={SW + 16} decelerationRate="fast"
        contentContainerStyle={{ gap: 16 }}
      >
        {scenarios.map((scenario, si) => {
          const picked = answers[si];
          const isDone = picked !== undefined;
          return (
            <View key={si} style={[sc.card, { width: SW }]}>
              <View style={sc.cardHeader}>
                <Text style={sc.cardIcon}>{scenario.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={sc.cardLabel}>SCENARIO {si + 1}/{scenarios.length}</Text>
                  <Text style={sc.cardSituation}>{scenario.situation}</Text>
                </View>
              </View>
              <Text style={sc.pickLabel}>{isDone ? "Here's what your choice reveals:" : 'What do you do?'}</Text>
              {scenario.options.map((opt, oi) => {
                const isSelected = picked === oi;
                const isIdeal = opt.isIdeal;
                return (
                  <TouchableOpacity
                    key={oi}
                    style={[
                      sc.option,
                      !isDone && sc.optionActive,
                      isDone && isSelected && isIdeal && sc.optionIdeal,
                      isDone && isSelected && !isIdeal && sc.optionBias,
                      isDone && !isSelected && sc.optionDimmed,
                    ]}
                    onPress={() => handlePick(si, oi)}
                    disabled={isDone} activeOpacity={0.8}
                  >
                    <Text style={[sc.optionText, isDone && isSelected && isIdeal && sc.optionTextIdeal, isDone && isSelected && !isIdeal && sc.optionTextBias]}>
                      {opt.text}
                    </Text>
                    {isDone && isSelected && (
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
      <View style={sc.dots}>
        {scenarios.map((_, i) => (
          <View key={i} style={[sc.dot, answers[i] !== undefined && sc.dotDone]} />
        ))}
      </View>
    </View>
  );
}

// ─── Multi-Step MCQ ───────────────────────────────────
export function MultiStepMCQ({ icon, title, questions, onComplete, isCompleted }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [scores, setScores] = useState([]);
  const [done, setDone] = useState(false);
  const [passed, setPassed] = useState(false); // ← internal pass flag

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
      setCurrentQ(c => c + 1); setSelected(null); setSubmitted(false);
    } else {
      setDone(true);
      const finalScore = scores.filter(Boolean).length + (selected === q.correctIndex ? 1 : 0);
      const didPass = finalScore / questions.length >= 0.7;
      setPassed(didPass); // ← set internal flag BEFORE calling onComplete
      if (onComplete) onComplete(finalScore, questions.length);
    }
  };

  const handleReset = () => {
    setCurrentQ(0); setSelected(null); setSubmitted(false); setScores([]); setDone(false); setPassed(false);
  };

  if (done) {
    const finalScore = scores.filter(Boolean).length;
    const perfect = finalScore === questions.length;
    const good = finalScore >= Math.ceil(questions.length / 2);
    return (
      <View style={ms.wrapper}>
        <View style={ms.header}>
          <Text style={ms.headerIcon}>{icon}</Text>
          <View><Text style={ms.headerLabel}>CHALLENGE COMPLETE</Text><Text style={ms.headerTitle}>{title}</Text></View>
        </View>
        <AnimatedBlock delay={0}>
          <View style={ms.scoreScreen}>
            <Text style={ms.scoreBig}>{finalScore}/{questions.length}</Text>
            <Text style={ms.scoreEmoji}>{perfect ? '🏆' : good ? '💪' : '📚'}</Text>
            <Text style={ms.scoreMsg}>
              {perfect ? 'Perfect score!' : good ? 'Good effort! Review the ones you missed.' : 'Keep going — these concepts are worth mastering.'}
            </Text>
            <View style={ms.scoreSummary}>
              {questions.map((q, i) => (
                <View key={i} style={ms.scoreSummaryRow}>
                  <Text style={[ms.scoreSummaryDot, { color: scores[i] ? C.success : C.danger }]}>{scores[i] ? '✓' : '✗'}</Text>
                  <Text style={ms.scoreSummaryText}>{q.concept}</Text>
                </View>
              ))}
            </View>
            {/* ← use internal `passed` flag */}
            {passed
              ? <CompletedBanner />
              : <FailedBanner correct={finalScore} total={questions.length} onRetry={handleReset} />
            }
          </View>
        </AnimatedBlock>
      </View>
    );
  }

  return (
    <View style={ms.wrapper}>
      <View style={ms.header}>
        <Text style={ms.headerIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={ms.headerLabel}>CHALLENGE</Text>
          <Text style={ms.headerTitle}>{title}</Text>
        </View>
        <Text style={ms.counter}>{currentQ + 1}/{questions.length}</Text>
      </View>
      <View style={ms.progressTrack}>
        {questions.map((_, i) => (
          <View key={i} style={[ms.progressSegment, i < currentQ && ms.progressDone, i === currentQ && ms.progressActive]} />
        ))}
      </View>
      {q.concept && <View style={ms.conceptPill}><Text style={ms.conceptText}>{q.concept}</Text></View>}
      <Text style={ms.question}>{q.question}</Text>
      {q.options.map((opt, i) => {
        let style = ms.option;
        let textStyle = ms.optionText;
        if (submitted) {
          if (i === q.correctIndex) { style = [ms.option, ms.optionCorrect]; textStyle = [ms.optionText, ms.optionTextCorrect]; }
          else if (i === selected) { style = [ms.option, ms.optionWrong]; }
        } else if (selected === i) { style = [ms.option, ms.optionSelected]; }
        return (
          <TouchableOpacity key={i} style={style} onPress={() => !submitted && setSelected(i)} activeOpacity={0.8}>
            <View style={ms.optionDot}><Text style={ms.optionDotText}>{String.fromCharCode(65 + i)}</Text></View>
            <Text style={[textStyle, { flex: 1 }]}>{opt}</Text>
            {submitted && i === q.correctIndex && <Text style={ms.tick}>✓</Text>}
            {submitted && i === selected && i !== q.correctIndex && <Text style={ms.cross}>✗</Text>}
          </TouchableOpacity>
        );
      })}
      {!submitted
        ? <TouchableOpacity style={[ms.submitBtn, selected === null && ms.submitBtnDisabled]} onPress={handleSubmit} disabled={selected === null}>
            <Text style={ms.submitBtnText}>Check Answer</Text>
          </TouchableOpacity>
        : <AnimatedBlock delay={0}>
            <View style={[ms.feedback, isCorrect ? ms.feedbackCorrect : ms.feedbackWrong]}>
              <Text style={ms.feedbackIcon}>{isCorrect ? '🎉' : '💪'}</Text>
              <Text style={ms.feedbackText}>{isCorrect ? 'Correct!' : 'Not quite.'}</Text>
            </View>
            <Text style={ms.explanation}>{q.explanation}</Text>
            <TouchableOpacity style={ms.nextBtn} onPress={handleNext}>
              <Text style={ms.nextBtnText}>{currentQ < questions.length - 1 ? 'Next Question →' : 'See Results →'}</Text>
            </TouchableOpacity>
          </AnimatedBlock>
      }
    </View>
  );
}

// ─── MCQ Exercise ─────────────────────────────────────
export function MCQExercise({ icon, title, question, options, correctIndex, explanation, onComplete, isCompleted }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [passed, setPassed] = useState(false); // ← internal pass flag
  const correct = selected === correctIndex;
  const reset = () => { setSelected(null); setSubmitted(false); setPassed(false); };

  const handleSubmit = () => {
    if (selected === null) return;
    const didPass = selected === correctIndex;
    setPassed(didPass); // ← set internal flag BEFORE calling onComplete
    setSubmitted(true);
    if (onComplete) onComplete(didPass ? 1 : 0, 1);
  };

  return (
    <View style={ex.wrapper}>
      <View style={ex.header}>
        <Text style={ex.headerIcon}>{icon}</Text>
        <View><Text style={ex.headerLabel}>EXERCISE</Text><Text style={ex.headerTitle}>{title}</Text></View>
      </View>
      <Text style={ex.question}>{question}</Text>
      {options.map((opt, i) => {
        let style = ex.option; let textStyle = ex.optionText;
        if (submitted) {
          if (i === correctIndex) { style = [ex.option, ex.optionCorrect]; textStyle = [ex.optionText, ex.optionTextCorrect]; }
          else if (i === selected) { style = [ex.option, ex.optionWrong]; }
        } else if (selected === i) { style = [ex.option, ex.optionSelected]; }
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
        ? <TouchableOpacity style={[ex.submitBtn, selected === null && ex.submitBtnDisabled]} onPress={handleSubmit} disabled={selected === null}>
            <Text style={ex.submitBtnText}>Check Answer</Text>
          </TouchableOpacity>
        : <>
            <Animated.View style={[ex.result, correct ? ex.resultCorrect : ex.resultWrong]}>
              <Text style={ex.resultIcon}>{correct ? '🎉' : '💪'}</Text>
              <Text style={ex.resultText}>{correct ? 'Correct! Well done.' : 'Not quite — see the correct answer above.'}</Text>
            </Animated.View>
            <Text style={ex.explanation}>{explanation}</Text>
            {/* ← use internal `passed` flag */}
            {passed
              ? <CompletedBanner />
              : <FailedBanner correct={correct ? 1 : 0} total={1} onRetry={reset} />
            }

          </>
      }
    </View>
  );
}

// ═══════════════════════════════════════════════════════
// BLOCK DISPATCHER
// ═══════════════════════════════════════════════════════
export function renderBlock(block, i) {
  const delay = Math.min(i * 60, 300);
  const wrap = (child) => <AnimatedBlock key={i} delay={delay}>{child}</AnimatedBlock>;
  switch (block.type) {
    case 'text':          return wrap(<TextBlock {...block} />);
    case 'heading':       return wrap(<SectionHeading {...block} />);
    case 'subheading':    return wrap(<SectionSubheading {...block} />);
    case 'keyterm':       return wrap(<KeyTermBlock {...block} />);
    case 'table':         return wrap(<SmartTable headers={block.headers} rows={block.rows} firstColAccent={block.firstColAccent} />);
    case 'steps':         return wrap(<StepsBlock {...block} />);
    case 'callout':       return wrap(<CalloutBlock {...block} />);
    case 'bullets':       return wrap(<BulletsBlock {...block} />);
    case 'bot':           return wrap(<BotChip {...block} />);
    case 'beforeafter':   return wrap(<BeforeAfterCards {...block} />);
    case 'topiccards':    return wrap(<TopicCards {...block} />);
    case 'appcards':      return wrap(<AppCards {...block} />);
    case 'piechart':      return wrap(<PieChartBlock {...block} />);
    case 'flipcards':     return wrap(<FlipCardDeck {...block} />);
    case 'timeline':      return wrap(<TimelineBlock {...block} />);
    case 'checklist':     return wrap(<ChecklistBlock {...block} />);
    case 'goalpicker':    return wrap(<GoalPicker {...block} />);
    case 'slider':        return wrap(<SliderExercise {...block} />);
    // ── earnable ──
    case 'tindertruefalse': return wrap(<TinderTrueFalse {...block} />);
    case 'scenarios':       return wrap(<ScenarioCards {...block} />);
    case 'multistepmcq':    return wrap(<MultiStepMCQ {...block} />);
    case 'mcq':             return wrap(<MCQExercise {...block} />);
    default: return null;
  }
}

// ═══════════════════════════════════════════════════════
// STYLESHEETS
// ═══════════════════════════════════════════════════════

const s = StyleSheet.create({
  text:            { fontSize: 15, lineHeight: 26, color: C.neutral2, marginBottom: 14 },
  sectionHeading:  { fontSize: 20, fontWeight: '800', color: C.neutral1, marginBottom: 8, marginTop: 8 },
  sectionSubheading:{ fontSize: 16, fontWeight: '700', color: C.neutral2, marginBottom: 6, marginTop: 6 },
  keytermBox:      { backgroundColor: C.primaryLight, borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: C.primary },
  keytermRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  keytermPill:     { backgroundColor: C.primary, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  keytermPillText: { fontSize: 9, fontWeight: '800', color: C.white, letterSpacing: 0.5 },
  keytermTerm:     { flex: 1, fontSize: 15, fontWeight: '800', color: C.primaryDark },
  chevron:         { fontSize: 11, color: C.neutral3 },
  keytermDef:      { fontSize: 14, color: C.neutral2, lineHeight: 22, marginTop: 10 },
  stepsBox:        { backgroundColor: C.white, borderRadius: 12, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  stepsTitle:      { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 12 },
  stepRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  stepNum:         { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  stepNumActive:   { backgroundColor: C.primary },
  stepNumDone:     { backgroundColor: C.success },
  stepNumText:     { fontSize: 13, fontWeight: '800', color: C.white },
  stepText:        { flex: 1, fontSize: 14, color: C.neutral2, lineHeight: 22 },
  revealBtn:       { backgroundColor: C.primaryLight, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  revealBtnText:   { fontSize: 14, fontWeight: '700', color: C.primary },
  allDoneRow:      { alignItems: 'center', marginTop: 8 },
  allDoneText:     { fontSize: 13, color: C.success, fontWeight: '600' },
  callout:         { borderRadius: 12, padding: 14, marginBottom: 14, borderLeftWidth: 4 },
  calloutLabel:    { fontSize: 12, fontWeight: '800', color: C.neutral2, marginBottom: 6, letterSpacing: 0.3 },
  calloutText:     { fontSize: 14, color: C.neutral2, lineHeight: 22 },
  bulletsBox:      { backgroundColor: C.white, borderRadius: 12, padding: 14, marginBottom: 14 },
  bulletsTitle:    { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 10 },
  bulletRow:       { flexDirection: 'row', gap: 8, marginBottom: 8 },
  bulletDot:       { fontSize: 16, color: C.primary, lineHeight: 22 },
  bulletText:      { flex: 1, fontSize: 14, color: C.neutral2, lineHeight: 22 },
  botChip:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4FF', borderRadius: 12, padding: 14, marginBottom: 14, gap: 10, borderWidth: 1, borderColor: C.primaryMid },
  botChipIcon:     { fontSize: 20 },
  botChipText:     { flex: 1, fontSize: 13, fontWeight: '600', color: C.primary },
  botArrow:        { fontSize: 16, color: C.primary },
  botOpen:         { backgroundColor: '#F0F4FF', borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.primaryMid },
  botHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  botHeaderIcon:   { fontSize: 18 },
  botHeaderLabel:  { flex: 1, fontSize: 13, fontWeight: '800', color: C.primary },
  botClose:        { fontSize: 16, color: C.neutral3 },
  botLoading:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  botLoadingText:  { fontSize: 13, color: C.neutral3 },
  botAnswer:       { fontSize: 14, color: C.neutral2, lineHeight: 22 },
});

const t = StyleSheet.create({
  pillWrapper:            { marginBottom: 14, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  pillHeaderRow:          { flexDirection: 'row' },
  pillHeaderCell:         { flex: 1, padding: 10, alignItems: 'center' },
  pillHeaderText:         { fontSize: 12, fontWeight: '800', color: C.white, letterSpacing: 0.3 },
  pillRow:                { flexDirection: 'row', backgroundColor: C.white, alignItems: 'stretch', borderTopWidth: 1, borderTopColor: C.border },
  pillRowAlt:             { backgroundColor: C.cardBg },
  pillCell:               { flex: 1, fontSize: 13, color: C.neutral2, padding: 12, lineHeight: 18 },
  pillCellLeft:           { borderRightWidth: 1, borderRightColor: C.border },
  pillCellLeftAccent:     { backgroundColor: C.primaryLight, fontWeight: '700', color: C.primaryDark },
  iconCardsWrapper:       { marginBottom: 14, gap: 8 },
  iconCard:               { backgroundColor: C.white, borderRadius: 12, borderLeftWidth: 4, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  iconCardAccent:         { paddingHorizontal: 14, paddingVertical: 10 },
  iconCardLabel:          { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  iconCardPrimary:        { fontSize: 16, fontWeight: '800' },
  iconCardBody:           { paddingHorizontal: 14, paddingBottom: 12, gap: 4 },
  iconCardRow:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  iconCardSubLabel:       { fontSize: 12, color: C.neutral3, fontWeight: '600', flex: 1 },
  iconCardSubValue:       { fontSize: 13, color: C.neutral1, fontWeight: '500', flex: 2, textAlign: 'right' },
  scrollTableWrapper:     { marginBottom: 14, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  scrollTableHeaderRow:   { flexDirection: 'row', backgroundColor: C.primary },
  scrollTableHeaderCell:  { padding: 10 },
  scrollTableHeaderText:  { fontSize: 12, fontWeight: '700', color: C.white },
  scrollTableRow:         { flexDirection: 'row', backgroundColor: C.white },
  scrollTableRowAlt:      { backgroundColor: C.cardBg },
  scrollTableCell:        { padding: 10, borderTopWidth: 1, borderTopColor: C.borderLight },
  scrollTableCellFirst:   { backgroundColor: C.primaryLight },
  scrollTableCellText:    { fontSize: 12, color: C.neutral2, lineHeight: 18 },
  scrollTableCellTextFirst:{ fontWeight: '700', color: C.primaryDark },
});

const tc = StyleSheet.create({
  wrapper:    { marginBottom: 14, gap: 10 },
  title:      { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 6 },

  card: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.3,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  row:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textSide:  { flex: 1 },

  label:     { fontSize: 16, fontWeight: '800', marginBottom: 3 },
  desc:      { fontSize: 13, color: C.neutral3, lineHeight: 19 },
  tapHint:   { fontSize: 12, fontWeight: '600', marginTop: 5, opacity: 0.85 },

  iconBg:    { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon:      { fontSize: 28 },

  expanded:  { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  detailDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0 },

  detailText:{ flex: 1, fontSize: 13, color: C.neutral2, lineHeight: 21 },

  example:   { borderRadius: 11, padding: 11, backgroundColor: C.cardBg, borderLeftWidth: 3, marginTop: 3 },
  exampleLabel:{ fontSize: 11, fontWeight: '800', marginBottom: 4, letterSpacing: 0.3 },
  exampleText:{ fontSize: 12.5, color: C.neutral2, lineHeight: 19 },
});




const ba = StyleSheet.create({
  wrapper:   { marginBottom: 14, gap: 8 },
  title:     { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 4 },
  card:      { backgroundColor: C.white, borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  labelRow:  { marginBottom: 10 },
  labelPill: { alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  labelText: { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 0.3 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  side:      { flex: 1, borderRadius: 10, padding: 10 },
  sideBefore:{ backgroundColor: C.dangerLight },
  sideAfter: { backgroundColor: '#F0FDF4' },
  sideTag:   { fontSize: 10, fontWeight: '700', color: C.neutral3, marginBottom: 4 },
  sideText:  { fontSize: 13, color: C.neutral2, lineHeight: 18, fontWeight: '500' },
  arrow:     { fontSize: 18, color: C.neutral4 },
});

const cl = StyleSheet.create({
  wrapper:           { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title:             { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 12 },
  item:              { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, marginBottom: 8, backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border },
  itemChecked:       { backgroundColor: '#F0FDF4', borderColor: C.successMid },
  box:               { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  boxChecked:        { backgroundColor: C.success, borderColor: C.success },
  tick:              { fontSize: 13, color: C.white, fontWeight: '800' },
  itemText:          { flex: 1, fontSize: 14, color: C.neutral2, lineHeight: 20 },
  itemTextChecked:   { color: C.successDark, fontWeight: '600', textDecorationLine: 'line-through' },
  completeBanner:    { backgroundColor: C.successLight, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  completeBannerText:{ fontSize: 14, fontWeight: '700', color: C.success },
});

const gp = StyleSheet.create({
  wrapper:       { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  title:         { fontSize: 15, fontWeight: '700', color: C.neutral1, marginBottom: 4 },
  subtitle:      { fontSize: 13, color: C.neutral3, marginBottom: 14 },
  goalCard:      { borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cardBg },
  goalCardSelected:{ borderColor: C.primary, backgroundColor: C.primaryLight },
  goalRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon:      { fontSize: 22 },
  goalLabel:     { flex: 1, fontSize: 14, fontWeight: '600', color: C.neutral2 },
  goalLabelSelected:{ color: C.primaryDark },
  checkbox:      { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: C.border, justifyContent: 'center', alignItems: 'center' },
  checkboxSelected:{ backgroundColor: C.primary, borderColor: C.primary },
  checkmark:     { fontSize: 13, color: C.white, fontWeight: '800' },
  goalDetail:    { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.primaryMid },
  goalDetailRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  detailPill:    { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: C.primaryMid },
  detailPillText:{ fontSize: 13, fontWeight: '700', color: C.primary },
  goalTip:       { fontSize: 12, color: C.neutral3, lineHeight: 18, fontStyle: 'italic' },
  summary:       { backgroundColor: C.primaryLight, borderRadius: 14, padding: 16, marginTop: 4 },
  summaryTitle:  { fontSize: 14, fontWeight: '800', color: C.primaryDark, marginBottom: 12 },
  summaryRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  summaryIcon:   { fontSize: 18 },
  summaryLabel:  { flex: 1, fontSize: 13, color: C.neutral2, fontWeight: '500' },
  summaryAmount: { fontSize: 13, fontWeight: '700', color: C.primary },
  summaryDivider:{ height: 1, backgroundColor: C.primaryMid, marginVertical: 8 },
  summaryTotal:  { fontSize: 16, fontWeight: '900', color: C.primary },
});

const ac = StyleSheet.create({
  wrapper:        { marginBottom: 14 },
  title:          { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 4 },
  hint:           { fontSize: 12, color: C.neutral4, marginBottom: 10 },
  card:           { borderRadius: 18, padding: 18, borderWidth: 2, backgroundColor: C.white, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBg:         { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon:           { fontSize: 22 },
  appName:        { fontSize: 16, fontWeight: '800', color: C.neutral1, marginBottom: 2 },
  tagline:        { fontSize: 12, color: C.neutral3, lineHeight: 17 },
  chevron:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.borderLight, justifyContent: 'center', alignItems: 'center' },
  chevronText:    { fontSize: 14, color: C.neutral3, fontWeight: '700' },
  pillRow:        { flexDirection: 'row', gap: 8, marginBottom: 4 },
  pill:           { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:       { fontSize: 12, fontWeight: '700', color: C.white },
  pillOutline:    { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1.5, borderColor: C.border },
  pillOutlineText:{ fontSize: 12, fontWeight: '700' },
  divider:        { height: 1.5, marginVertical: 14, opacity: 0.2 },
  section:        { marginBottom: 12 },
  sectionLabel:   { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 5 },
  sectionText:    { fontSize: 14, color: C.neutral2, lineHeight: 21 },
  sgTip:          { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'flex-start', marginTop: 4 },
  sgTipIcon:      { fontSize: 16 },
  sgTipText:      { flex: 1, fontSize: 12, color: C.neutral2, lineHeight: 18 },
  dots:           { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot:            { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotActive:      { width: 18, backgroundColor: C.primary },
});

const pc = StyleSheet.create({
  wrapper:       { marginBottom: 14 },
  title:         { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 12 },
  chartRow:      { alignItems: 'center', marginBottom: 12 },
  legendWrapper: { gap: 8 },
  legendCard:    { backgroundColor: C.white, borderRadius: 14, borderLeftWidth: 4, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  legendTop:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendIcon:    { fontSize: 22 },
  legendMeta:    { flex: 1 },
  legendPct:     { fontSize: 20, fontWeight: '900', lineHeight: 24 },
  legendLabel:   { fontSize: 13, color: C.neutral2, fontWeight: '600' },
  legendAmount:  { fontSize: 14, fontWeight: '700' },
  legendDesc:    { fontSize: 13, color: C.neutral3, lineHeight: 20, marginTop: 8 },
  note:          { fontSize: 12, color: C.neutral4, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
});

const fd = StyleSheet.create({
  wrapper:      { marginBottom: 14 },
  title:        { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 4 },
  hint:         { fontSize: 12, color: C.neutral4, marginBottom: 10 },
  cardContainer:{ position: 'relative' },
  card:         { position: 'absolute', top: 0, left: 0, borderRadius: 18, padding: 20, justifyContent: 'space-between', backfaceVisibility: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  cardFront:    { backgroundColor: C.dangerLight, borderWidth: 1.5, borderColor: C.dangerMid },
  cardBack:     { backgroundColor: '#F0FDF4', borderWidth: 1.5, borderColor: C.successMid },
  cardTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeFront:   { backgroundColor: C.danger, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeBack:    { backgroundColor: C.success, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:    { fontSize: 11, fontWeight: '800', color: C.white },
  cardNum:      { fontSize: 12, color: C.neutral4, fontWeight: '600' },
  cardTextFront:{ fontSize: 16, fontWeight: '700', color: '#991B1B', lineHeight: 24, flex: 1, paddingVertical: 10 },
  cardTextBack: { fontSize: 16, fontWeight: '700', color: C.successDark, lineHeight: 24, flex: 1, paddingVertical: 10 },
  tapHintFront: { fontSize: 12, color: C.danger, fontWeight: '600', opacity: 0.7 },
  backLabel:    { alignSelf: 'flex-start', backgroundColor: C.successLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  backLabelText:{ fontSize: 11, fontWeight: '700', color: C.success },
  dots:         { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotFlipped:   { backgroundColor: C.success },
});

const tl = StyleSheet.create({
  wrapper:      { marginBottom: 14 },
  title:        { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 12 },
  nodeRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  nodeCol:      { alignItems: 'center', flex: 1 },
  nodeCircle:   { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  nodeIcon:     { fontSize: 18 },
  nodeLabel:    { fontSize: 10, textAlign: 'center', paddingHorizontal: 2 },
  connector:    { height: 2, flex: 1, backgroundColor: C.border, marginTop: 21 },
  panel:        { backgroundColor: C.white, borderRadius: 18, borderWidth: 1.5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  panelHeader:  { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  panelIcon:    { fontSize: 28 },
  panelLabel:   { fontSize: 16, fontWeight: '800', color: C.white },
  panelSublabel:{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  panelBody:    { padding: 16 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  exampleRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  examplePill:  { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1.5 },
  exampleText:  { fontSize: 12, fontWeight: '600' },
  detailRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  detailDot:    { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  detailText:   { flex: 1, fontSize: 14, color: C.neutral2, lineHeight: 21 },
  tip:          { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'flex-start', marginTop: 4 },
  tipIcon:      { fontSize: 16 },
  tipText:      { flex: 1, fontSize: 12, color: C.neutral2, lineHeight: 18 },
  navDots:      { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 4 },
  navDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  swipeHint:    { textAlign: 'center', fontSize: 12, color: C.neutral4, marginBottom: 4 },
});

const bk = StyleSheet.create({
  wrapper:       { marginBottom: 14 },
  title:         { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 4 },
  hint:          { fontSize: 12, color: C.neutral4, marginBottom: 10 },
  topRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBg:        { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  icon:          { fontSize: 22 },
  priorityBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  priorityText:  { fontSize: 13, fontWeight: '800', color: C.white },
  fillTrack:     { height: 8, backgroundColor: C.borderLight, borderRadius: 4, marginBottom: 4, overflow: 'hidden' },
  fillBar:       { height: 8, borderRadius: 4 },
  fillLabel:     { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  divider:       { height: 1.5, marginVertical: 12, opacity: 0.2 },
  detailRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  detailDot:     { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
  detailText:    { flex: 1, fontSize: 14, color: C.neutral2, lineHeight: 21 },
  tip:           { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'flex-start', marginTop: 4 },
  tipIcon:       { fontSize: 16 },
  tipText:       { flex: 1, fontSize: 12, color: C.neutral2, lineHeight: 18 },
});

const tt = StyleSheet.create({
  wrapper:           { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header:            { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  headerIcon:        { fontSize: 28 },
  headerLabel:       { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  headerTitle:       { fontSize: 15, fontWeight: '700', color: C.neutral1 },
  counter:           { fontSize: 13, fontWeight: '700', color: C.neutral3 },
  progressTrack:     { flexDirection: 'row', gap: 4, marginBottom: 12 },
  progressSegment:   { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  progressDone:      { backgroundColor: C.success },
  progressActive:    { backgroundColor: C.primary },
  instruction:       { fontSize: 13, color: C.neutral3, marginBottom: 10, textAlign: 'center' },
  swipeHints:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  hintLeft:          { fontSize: 12, fontWeight: '700', color: C.danger, opacity: 0.5 },
  hintRight:         { fontSize: 12, fontWeight: '700', color: C.success, opacity: 0.5 },
  cardStack:         { height: 170, marginBottom: 16 },
  card:              { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, justifyContent: 'center' },
  cardBehind:        { top: 8, left: 4, right: 4, backgroundColor: '#F5F6FF', borderColor: C.primaryMid, shadowOpacity: 0.04, elevation: 1 },
  cardText:          { fontSize: 15, fontWeight: '600', color: C.neutral1, lineHeight: 24, textAlign: 'center' },
  btnRow:            { flexDirection: 'row', gap: 10 },
  btnLeft:           { flex: 1, backgroundColor: C.dangerLight, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.dangerMid },
  btnLeftText:       { fontSize: 14, fontWeight: '700', color: C.danger },
  btnRight:          { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.successMid },
  btnRightText:      { fontSize: 14, fontWeight: '700', color: C.success },
  scoreScreen:       { alignItems: 'center', paddingVertical: 8 },
  scoreBig:          { fontSize: 52, fontWeight: '900', color: C.primary, lineHeight: 60 },
  scoreEmoji:        { fontSize: 36, marginBottom: 10 },
  scoreMsg:          { fontSize: 15, color: C.neutral2, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  resultsList:       { width: '100%', gap: 8, marginBottom: 16 },
  resultRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1.5 },
  resultCorrect:     { backgroundColor: '#F0FDF4', borderColor: C.successMid },
  resultWrong:       { backgroundColor: C.dangerLight, borderColor: C.dangerMid },
  resultIcon:        { fontSize: 16, fontWeight: '800', marginTop: 2 },
  resultStatement:   { fontSize: 13, fontWeight: '600', color: C.neutral1, marginBottom: 3 },
  resultExplanation: { fontSize: 12, color: C.neutral3, lineHeight: 17 },
  badge:             { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', flexShrink: 0 },
  badgeTrue:         { backgroundColor: C.successLight },
  badgeFalse:        { backgroundColor: C.dangerLight },
  badgeText:         { fontSize: 10, fontWeight: '800', color: C.neutral2 },
  retryBtn:          { backgroundColor: C.borderLight, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  retryBtnText:      { color: C.neutral2, fontSize: 14, fontWeight: '600' },
});

const sc = StyleSheet.create({
  wrapper:          { marginBottom: 14 },
  title:            { fontSize: 14, fontWeight: '700', color: C.neutral1, marginBottom: 4 },
  hint:             { fontSize: 12, color: C.neutral4, marginBottom: 10 },
  card:             { backgroundColor: C.white, borderRadius: 18, padding: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader:       { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  cardIcon:         { fontSize: 28 },
  cardLabel:        { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 0.5, marginBottom: 4 },
  cardSituation:    { fontSize: 14, fontWeight: '700', color: C.neutral1, lineHeight: 20 },
  pickLabel:        { fontSize: 13, color: C.neutral3, marginBottom: 10, fontWeight: '500' },
  option:           { borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.cardBg },
  optionActive:     { borderColor: C.primaryMid, backgroundColor: '#F5F6FF' },
  optionIdeal:      { borderColor: C.success, backgroundColor: '#F0FDF4' },
  optionBias:       { borderColor: C.warning, backgroundColor: C.warningLight },
  optionDimmed:     { opacity: 0.4 },
  optionText:       { fontSize: 13, color: C.neutral2, fontWeight: '500', lineHeight: 19 },
  optionTextIdeal:  { color: C.successDark, fontWeight: '600' },
  optionTextBias:   { color: '#92400E', fontWeight: '600' },
  biasTag:          { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8, marginBottom: 4 },
  biasTagIdeal:     { backgroundColor: C.successLight },
  biasTagBias:      { backgroundColor: C.warningMid },
  biasTagText:      { fontSize: 11, fontWeight: '800' },
  biasTagTextIdeal: { color: C.success },
  biasTagTextBias:  { color: '#D97706' },
  biasExplanation:  { fontSize: 12, color: C.neutral3, lineHeight: 18, fontStyle: 'italic' },
  dots:             { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 },
  dot:              { width: 6, height: 6, borderRadius: 3, backgroundColor: C.border },
  dotDone:          { backgroundColor: C.primary },
  resultsHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  resultsHeaderIcon:  { fontSize: 28 },
  resultsHeaderLabel: { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  resultsHeaderTitle: { fontSize: 15, fontWeight: '700', color: C.neutral1 },
  scoreScreen:        { alignItems: 'center', paddingVertical: 8 },
  scoreBig:           { fontSize: 52, fontWeight: '900', color: C.primary, lineHeight: 60 },
  scoreEmoji:         { fontSize: 36, marginBottom: 10 },
  scoreMsg:           { fontSize: 15, color: C.neutral2, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  resultsList:        { width: '100%', gap: 8, marginBottom: 16 },
  resultRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1.5 },
  resultCorrect:      { backgroundColor: '#F0FDF4', borderColor: C.successMid },
  resultWrong:        { backgroundColor: C.dangerLight, borderColor: C.dangerMid },
  resultIcon:         { fontSize: 16, fontWeight: '800', marginTop: 2 },
  resultStatement:    { fontSize: 13, fontWeight: '600', color: C.neutral1, marginBottom: 3 },
  resultExplanation:  { fontSize: 12, color: C.neutral3, lineHeight: 17 },
});

const ms = StyleSheet.create({
  wrapper:          { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  headerIcon:       { fontSize: 28 },
  headerLabel:      { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  headerTitle:      { fontSize: 15, fontWeight: '700', color: C.neutral1 },
  counter:          { fontSize: 13, fontWeight: '700', color: C.neutral3 },
  progressTrack:    { flexDirection: 'row', gap: 4, marginBottom: 16 },
  progressSegment:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  progressDone:     { backgroundColor: C.success },
  progressActive:   { backgroundColor: C.primary },
  conceptPill:      { alignSelf: 'flex-start', backgroundColor: C.primaryLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  conceptText:      { fontSize: 11, fontWeight: '800', color: C.primary, letterSpacing: 0.3 },
  question:         { fontSize: 15, fontWeight: '600', color: C.neutral1, lineHeight: 22, marginBottom: 14 },
  option:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1.5, borderColor: C.border },
  optionSelected:   { borderColor: C.primary, backgroundColor: C.primaryLight },
  optionCorrect:    { borderColor: C.success, backgroundColor: C.successLight },
  optionWrong:      { borderColor: C.danger, backgroundColor: C.dangerLight },
  optionDot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  optionDotText:    { fontSize: 13, fontWeight: '700', color: C.neutral2 },
  optionText:       { fontSize: 14, color: C.neutral2, lineHeight: 20 },
  optionTextCorrect:{ color: C.successDark, fontWeight: '600' },
  tick:             { fontSize: 16, color: C.success },
  cross:            { fontSize: 16, color: C.danger },
  submitBtn:        { backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled:{ backgroundColor: C.primaryMid },
  submitBtnText:    { color: C.white, fontSize: 15, fontWeight: '700' },
  feedback:         { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 6 },
  feedbackCorrect:  { backgroundColor: C.successLight },
  feedbackWrong:    { backgroundColor: C.dangerLight },
  feedbackIcon:     { fontSize: 18 },
  feedbackText:     { fontSize: 14, fontWeight: '700', color: C.neutral2 },
  explanation:      { fontSize: 13, color: C.neutral3, lineHeight: 20, marginBottom: 10, fontStyle: 'italic' },
  nextBtn:          { backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center' },
  nextBtnText:      { color: C.white, fontSize: 15, fontWeight: '700' },
  scoreScreen:      { alignItems: 'center', paddingVertical: 8 },
  scoreBig:         { fontSize: 52, fontWeight: '900', color: C.primary, lineHeight: 60 },
  scoreEmoji:       { fontSize: 36, marginBottom: 10 },
  scoreMsg:         { fontSize: 15, color: C.neutral2, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  scoreSummary:     { width: '100%', gap: 8, marginBottom: 20 },
  scoreSummaryRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.cardBg, borderRadius: 10, padding: 12 },
  scoreSummaryDot:  { fontSize: 16, fontWeight: '800' },
  scoreSummaryText: { fontSize: 14, color: C.neutral2, fontWeight: '500' },
  retryBtn:         { backgroundColor: C.borderLight, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  retryBtnText:     { color: C.neutral2, fontSize: 14, fontWeight: '600' },
});

const sj = StyleSheet.create({
  wrapper:          { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  headerIcon:       { fontSize: 28 },
  headerLabel:      { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  headerTitle:      { fontSize: 15, fontWeight: '700', color: C.neutral1 },
  counter:          { fontSize: 13, fontWeight: '700', color: C.neutral3 },
  progressTrack:    { flexDirection: 'row', gap: 4, marginBottom: 12 },
  progressSegment:  { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  progressDone:     { backgroundColor: C.success },
  progressActive:   { backgroundColor: C.primary },
  instruction:      { fontSize: 13, color: C.neutral3, marginBottom: 10, textAlign: 'center' },
  swipeHints:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  hintLeft:         { fontSize: 12, fontWeight: '700', color: C.danger, opacity: 0.5 },
  hintRight:        { fontSize: 12, fontWeight: '700', color: C.success, opacity: 0.5 },
  cardStack:        { position: 'relative', alignItems: 'center', marginBottom: 16 },
  card:             { position: 'absolute', top: 0, left: 0, borderRadius: 16, padding: 20, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4, justifyContent: 'center', height: 150 },
  cardBehind:       { top: 8, transform: [{ scale: 0.96 }], backgroundColor: '#F5F6FF', borderColor: C.primaryMid, shadowOpacity: 0.04, elevation: 1 },
  cardText:         { fontSize: 15, fontWeight: '600', color: C.neutral1, lineHeight: 24, textAlign: 'center' },
  cardTip:          { fontSize: 12, color: C.neutral4, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  btnRow:           { flexDirection: 'row', gap: 10 },
  btnLeft:          { flex: 1, backgroundColor: C.dangerLight, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.dangerMid },
  btnLeftText:      { fontSize: 14, fontWeight: '700', color: C.danger },
  btnRight:         { flex: 1, backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: C.successMid },
  btnRightText:     { fontSize: 14, fontWeight: '700', color: C.success },
  scoreScreen:      { alignItems: 'center', paddingVertical: 8 },
  scoreBig:         { fontSize: 52, fontWeight: '900', color: C.primary, lineHeight: 60 },
  scoreEmoji:       { fontSize: 36, marginBottom: 10 },
  scoreMsg:         { fontSize: 15, color: C.neutral2, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  resultsList:      { width: '100%', gap: 8, marginBottom: 16 },
  resultRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 12, borderWidth: 1.5 },
  resultCorrect:    { backgroundColor: '#F0FDF4', borderColor: C.successMid },
  resultWrong:      { backgroundColor: C.dangerLight, borderColor: C.dangerMid },
  resultIcon:       { fontSize: 16, fontWeight: '800', marginTop: 2 },
  resultStatement:  { fontSize: 13, fontWeight: '600', color: C.neutral1, marginBottom: 3 },
  resultExplanation:{ fontSize: 12, color: C.neutral3, lineHeight: 17 },
  smartBadge:       { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', flexShrink: 0 },
  smartBadgeYes:    { backgroundColor: C.successLight },
  smartBadgeNo:     { backgroundColor: C.dangerLight },
  smartBadgeText:   { fontSize: 10, fontWeight: '800', color: C.neutral2 },
  retryBtn:         { backgroundColor: C.borderLight, borderRadius: 12, padding: 14, alignItems: 'center', width: '100%' },
  retryBtnText:     { color: C.neutral2, fontSize: 14, fontWeight: '600' },
});

const ex = StyleSheet.create({
  wrapper:          { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5, borderColor: '#E0E7FF', shadowColor: C.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header:           { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  headerIcon:       { fontSize: 28 },
  headerLabel:      { fontSize: 10, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  headerTitle:      { fontSize: 15, fontWeight: '700', color: C.neutral1 },
  question:         { fontSize: 15, fontWeight: '600', color: C.neutral1, lineHeight: 22, marginBottom: 14 },
  option:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.cardBg, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1.5, borderColor: C.border },
  optionSelected:   { borderColor: C.primary, backgroundColor: C.primaryLight },
  optionCorrect:    { borderColor: C.success, backgroundColor: C.successLight },
  optionWrong:      { borderColor: C.danger, backgroundColor: C.dangerLight },
  optionDot:        { width: 28, height: 28, borderRadius: 14, backgroundColor: C.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  optionDotText:    { fontSize: 13, fontWeight: '700', color: C.neutral2 },
  optionText:       { fontSize: 14, color: C.neutral2, lineHeight: 20 },
  optionTextCorrect:{ color: C.successDark, fontWeight: '600' },
  tick:             { fontSize: 16, color: C.success },
  cross:            { fontSize: 16, color: C.danger },
  submitBtn:        { backgroundColor: C.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled:{ backgroundColor: C.primaryMid },
  submitBtnText:    { color: C.white, fontSize: 15, fontWeight: '700' },
  retryBtn:         { backgroundColor: C.borderLight, borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
  retryBtnText:     { color: C.neutral2, fontSize: 14, fontWeight: '600' },
  result:           { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 8 },
  resultCorrect:    { backgroundColor: C.successLight },
  resultWrong:      { backgroundColor: C.dangerLight },
  resultIcon:       { fontSize: 20 },
  resultText:       { flex: 1, fontSize: 14, fontWeight: '600', color: C.neutral2, lineHeight: 20 },
  explanation:      { fontSize: 13, color: C.neutral3, lineHeight: 20, marginTop: 4, marginBottom: 4, fontStyle: 'italic' },
  sliderValueRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sliderValueLabel: { fontSize: 14, color: C.neutral3 },
  sliderValue:      { fontSize: 22, fontWeight: '800', color: C.primary },
  slider:           { width: '100%', height: 40 },
  sliderMinMax:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sliderMinMaxText: { fontSize: 12, color: C.neutral4 },
  sliderResult:     { gap: 8 },
  sliderResultRow:  { flexDirection: 'column', borderRadius: 10, padding: 12, borderLeftWidth: 4 },
  sliderResultLabel:{ fontSize: 13, color: C.neutral2, fontWeight: '500', lineHeight: 19, marginBottom: 6 },
  sliderResultValue:{ fontSize: 20, fontWeight: '800' },
});