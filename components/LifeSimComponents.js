// components/LifeSimComponents.js
//
// Shared UI components used across all 5 life simulation stage screens.
// Import from here — don't redefine in individual stage files.
//
// Exports:
//   FinBubble           — Fin's message bubble (white bg, no purple)
//   WalletUnlockModal   — full-screen celebratory modal when a new wallet unlocks
//   StageHeader         — sticky top bar with back button + live wallet balances
//   DualAmount          — renders "$X,XXX · XX🪙" in a consistent style

import { useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, Animated, ActivityIndicator, ScrollView,
} from 'react-native';
import { Colors, Fonts, Spacing, Radii, Shadows } from '../constants/theme';
// Avatar system removed — outfits scrapped in favour of narrative progression
import { formatDual } from '../constants/lifeSimStages';
import { ADVISOR } from '../constants/simulation';

// ─── FinBubble ────────────────────────────────────────────────────────────────
// Fin's message bubble. Always white background — never purple.
// Props:
//   text      string   — message to display
//   loading   bool     — show spinner instead of text
//   small     bool     — compact variant (smaller font, less padding)

export function FinBubble({ text, loading = false, small = false }) {
  return (
    <View style={fb.wrap}>
      <Text style={[fb.emoji, small && { fontSize: 20 }]}>🦉</Text>
      <View style={[fb.bubble, small && fb.bubbleSmall]}>
        {loading
          ? (
            <View style={fb.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={fb.loadingText}>Fin is thinking…</Text>
            </View>
          )
          : <Text style={[fb.text, small && fb.textSmall]}>{text}</Text>
        }
      </View>
    </View>
  );
}

const fb = StyleSheet.create({
  wrap:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: Spacing.md },
  emoji:       { fontSize: 26, marginTop: 2 },
  bubble:      { flex: 1, backgroundColor: Colors.white, borderRadius: Radii.lg, borderTopLeftRadius: 4, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, ...Shadows.soft },
  bubbleSmall: { padding: Spacing.sm },
  text:        { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  textSmall:   { fontSize: 12, lineHeight: 18 },
  loadingRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  loadingText: { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted },
});

// ─── DualAmount ───────────────────────────────────────────────────────────────
// Renders an SGD + FinCoin dual-currency display.
// Props:
//   sgd       number   — amount in SGD
//   size      'sm'|'md'|'lg'  — text size preset (default 'md')
//   color     string   — override text color (default textPrimary)

export function DualAmount({ sgd, size = 'md', color }) {
  const dual    = formatDual(sgd ?? 0);
  const sizes   = { sm: [13, 11], md: [18, 12], lg: [26, 14] };
  const [sgdSz, coinSz] = sizes[size] ?? sizes.md;

  return (
    <View style={da.wrap}>
      <Text style={[da.sgd, { fontSize: sgdSz, color: color ?? Colors.textPrimary }]}>
        {dual.sgd}
      </Text>
      <Text style={[da.coins, { fontSize: coinSz }]}>
        {dual.coins}
      </Text>
    </View>
  );
}

const da = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  sgd:   { fontFamily: Fonts.extraBold },
  coins: { fontFamily: Fonts.regular, color: Colors.textMuted },
});

// ─── StageHeader ──────────────────────────────────────────────────────────────
// Sticky header bar for all stage screens.
// Shows: back button, stage title, and compact wallet balance chips.
// Props:
//   title     string   — stage title
//   color     string   — accent color for the stage
//   sim       object   — simProgress object (for wallet balances)
//   onBack    fn       — back button handler

export function StageHeader({ title, color, sim, onBack }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bankWallet = (sim?.wallets ?? []).find(w => w.type === 'bank');
  const fundWallet = (sim?.wallets ?? []).find(w => w.id === 'emergency-fund');

  // Safe back: use provided onBack, otherwise try router.back() with fallback
  const handleBack = () => {
    if (onBack) { onBack(); return; }
    try {
      if (router.canGoBack?.()) {
        router.back();
      } else {
        router.replace('/(tabs)/simulate');
      }
    } catch {
      router.replace('/(tabs)/simulate');
    }
  };

  return (
    <View style={[sh.bar, { borderBottomColor: color + '30', paddingTop: insets.top + 10 }]}>
      <TouchableOpacity onPress={handleBack} style={sh.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={[sh.backText, { color }]}>← Back</Text>
      </TouchableOpacity>

      <Text style={sh.title} numberOfLines={1}>{title}</Text>

      {/* Live wallet chips — only rendered if wallets exist */}
      <View style={sh.chips}>
        {bankWallet && (
          <View style={[sh.chip, { borderColor: color + '40' }]}>
            <Text style={sh.chipIcon}>{bankWallet.icon}</Text>
            <Text style={[sh.chipVal, { color }]}>{formatDual(bankWallet.balance).sgd}</Text>
          </View>
        )}
        {fundWallet && (
          <View style={[sh.chip, { borderColor: Colors.successDark + '40' }]}>
            <Text style={sh.chipIcon}>{fundWallet.icon}</Text>
            <Text style={[sh.chipVal, { color: Colors.successDark }]}>
              {formatDual(fundWallet.balance).sgd}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const sh = StyleSheet.create({
  bar:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, backgroundColor: Colors.white, borderBottomWidth: 1, ...Shadows.soft, zIndex: 10 },
  backBtn: { marginRight: Spacing.sm },
  backText:{ fontFamily: Fonts.semiBold, fontSize: 14 },
  title:   { fontFamily: Fonts.bold, fontSize: 15, color: Colors.textPrimary, flex: 1 },
  chips:   { flexDirection: 'row', gap: 6 },
  chip:    { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
  chipIcon:{ fontSize: 12 },
  chipVal: { fontFamily: Fonts.bold, fontSize: 11 },
});

// ─── WalletUnlockModal ────────────────────────────────────────────────────────
// Full-screen celebratory modal that fires when a new account is unlocked.
// Spring animation, avatar in 'celebrating' state, outfit badge, "Start →" CTA.
// Props:
//   visible         bool
//   wallet          object   — the newly unlocked wallet
//   avatarId        string
//   unlockedOutfits string[] — outfit ids (including newly unlocked one)
//   outfitItem      object   — the new outfit item (from OUTFIT_UNLOCKS), or null
//   onContinue      fn       — called when user taps "Start building it →"

export function WalletUnlockModal({
  visible,
  wallet,
  avatarId = 'alex',
  unlockedOutfits = [],
  outfitItem = null,
  onContinue,
}) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const op    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.6);
    op.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(op,    { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!wallet) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={wu.backdrop}>
        <Animated.View style={[wu.card, { opacity: op, transform: [{ scale }] }]}>

          {/* Avatar celebrating */}
          <View style={wu.avatarWrap}>
            <AvatarDisplay
              avatarId={avatarId}
              state="celebrating"
              size={88}
              unlockedOutfits={unlockedOutfits}
              showName={false}
            />
          </View>

          {/* Unlock badge */}
          <View style={wu.badge}>
            <Text style={wu.badgeText}>🎉  New Account Unlocked</Text>
          </View>

          {/* Wallet identity */}
          <View style={[wu.walletCard, { borderColor: (wallet.color ?? Colors.primary) + '40' }]}>
            <Text style={wu.walletIcon}>{wallet.icon}</Text>
            <Text style={[wu.walletName, { color: wallet.color ?? Colors.primary }]}>
              {wallet.label}
            </Text>
            {wallet.institution && (
              <Text style={wu.walletInstitution}>{wallet.institution}</Text>
            )}
            <Text style={wu.walletBody}>{wallet.unlockBody}</Text>

            {/* Interest rate if applicable */}
            {wallet.interestRate > 0 && (
              <View style={wu.rateRow}>
                <Text style={wu.rateLabel}>Interest rate</Text>
                <Text style={[wu.rateValue, { color: wallet.color ?? Colors.primary }]}>
                  {(wallet.interestRate * 100).toFixed(2)}% p.a.
                </Text>
              </View>
            )}

            {/* Target if fund */}
            {wallet.target > 0 && (
              <View style={wu.rateRow}>
                <Text style={wu.rateLabel}>Target</Text>
                <Text style={[wu.rateValue, { color: wallet.color ?? Colors.primary }]}>
                  {formatDual(wallet.target).sgd}
                </Text>
              </View>
            )}
          </View>

          {/* New outfit item */}
          {outfitItem && (
            <View style={wu.outfitRow}>
              <Text style={wu.outfitEmoji}>{outfitItem.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={wu.outfitLabel}>New look: {outfitItem.label}</Text>
                <Text style={wu.outfitDesc}>{outfitItem.description}</Text>
              </View>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[wu.btn, { backgroundColor: wallet.color ?? Colors.primary }]}
            onPress={onContinue}
            activeOpacity={0.85}
          >
            <Text style={wu.btnText}>Start building it →</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
}

const wu = StyleSheet.create({
  backdrop:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card:             { backgroundColor: Colors.white, borderRadius: 28, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.medium },
  avatarWrap:       { marginBottom: Spacing.lg },
  badge:            { backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 16, paddingVertical: 7, marginBottom: Spacing.lg },
  badgeText:        { fontFamily: Fonts.bold, fontSize: 13, color: Colors.warningDark },
  walletCard:       { width: '100%', borderWidth: 1.5, borderRadius: Radii.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md },
  walletIcon:       { fontSize: 36, marginBottom: 8 },
  walletName:       { fontFamily: Fonts.extraBold, fontSize: 20, marginBottom: 2 },
  walletInstitution:{ fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted, marginBottom: Spacing.sm },
  walletBody:       { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: 'center', marginBottom: Spacing.sm },
  rateRow:          { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingTop: 8, borderTopWidth: 0.5, borderTopColor: Colors.border, marginTop: 4 },
  rateLabel:        { fontFamily: Fonts.regular, fontSize: 12, color: Colors.textMuted },
  rateValue:        { fontFamily: Fonts.bold, fontSize: 12 },
  outfitRow:        { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.warningLight, borderRadius: Radii.md, padding: Spacing.md, width: '100%', marginBottom: Spacing.md },
  outfitEmoji:      { fontSize: 28 },
  outfitLabel:      { fontFamily: Fonts.bold, fontSize: 13, color: Colors.warningDark, marginBottom: 2 },
  outfitDesc:       { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  btn:              { borderRadius: Radii.lg, paddingVertical: 14, paddingHorizontal: Spacing.xl, alignItems: 'center', width: '100%' },
  btnText:          { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});

// ─── ProgressBar ─────────────────────────────────────────────────────────────
// Simple labelled progress bar. Used in Stage 5 for the emergency fund meter.
// Props:
//   current   number
//   target    number
//   color     string
//   label     string   — e.g. "Emergency Fund"
//   showPct   bool

export function ProgressBar({ current, target, color, label, showPct = true }) {
  const pct    = target > 0 ? Math.min(current / target, 1) : 0;
  const dual   = formatDual(current);
  const tDual  = formatDual(target);

  return (
    <View style={pb.wrap}>
      <View style={pb.labelRow}>
        <Text style={pb.label}>{label}</Text>
        <Text style={[pb.value, { color }]}>
          {dual.sgd} / {tDual.sgd}{showPct ? ` · ${Math.round(pct * 100)}%` : ''}
        </Text>
      </View>
      <View style={pb.track}>
        <View style={[pb.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
        {/* 1-month marker */}
        {target > 0 && (
          <View style={[pb.marker, { left: `${(1/3) * 100}%` }]} />
        )}
      </View>
      <Text style={pb.hint}>Target: {tDual.combined} · 3 months of expenses</Text>
    </View>
  );
}

const pb = StyleSheet.create({
  wrap:     { backgroundColor: Colors.white, borderRadius: Radii.md, padding: Spacing.md, marginBottom: Spacing.md, ...Shadows.soft },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label:    { fontFamily: Fonts.bold, fontSize: 13, color: Colors.textPrimary },
  value:    { fontFamily: Fonts.bold, fontSize: 13 },
  track:    { height: 10, backgroundColor: Colors.lightGray, borderRadius: 5, overflow: 'visible', marginBottom: 6, position: 'relative' },
  fill:     { height: 10, borderRadius: 5, position: 'absolute', left: 0, top: 0 },
  marker:   { position: 'absolute', top: -3, width: 2, height: 16, backgroundColor: Colors.border, borderRadius: 1 },
  hint:     { fontFamily: Fonts.regular, fontSize: 11, color: Colors.textMuted },
});

// ─── StageCompleteModal ───────────────────────────────────────────────────────
// Fires when a stage is completed. Shows avatar celebrating + outfit unlock.
// Props:
//   visible         bool
//   stageTitle      string
//   outfitItem      object | null
//   avatarId        string
//   unlockedOutfits string[]
//   onContinue      fn

// ─── StageCompleteModal ───────────────────────────────────────────────────────
// Chapter complete celebration. Clean, no avatar/outfit references.
// Props:
//   visible      bool
//   stageTitle   string
//   chapterNum   number   — shown as "Chapter N complete"
//   onContinue   fn
//
// outfitItem / avatarId / unlockedOutfits props accepted but ignored
// (kept for call-site compatibility while we migrate stage screens)

export function StageCompleteModal({
  visible,
  stageTitle,
  chapterNum,
  onContinue,
  // legacy props — accepted but unused
  outfitItem,
  avatarId,
  unlockedOutfits,
}) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const op    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.7);
    op.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
      Animated.timing(op,    { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={sc.backdrop}>
        <Animated.View style={[sc.card, { opacity: op, transform: [{ scale }] }]}>

          <View style={sc.emojiWrap}>
            <Text style={sc.emoji}>🎉</Text>
          </View>

          {chapterNum != null && (
            <Text style={sc.chapter}>Chapter {chapterNum}</Text>
          )}
          <Text style={sc.title}>Complete!</Text>
          <Text style={sc.subtitle}>{stageTitle}</Text>

          <View style={sc.coinRow}>
            <Text style={sc.coinText}>+50 🪙 FinCoins earned</Text>
          </View>

          <Text style={sc.returnHint}>Fin is waiting to tell you what's next.</Text>

          <TouchableOpacity style={sc.btn} onPress={onContinue}>
            <Text style={sc.btnText}>Back to simulation →</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sc = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  card:        { backgroundColor: Colors.white, borderRadius: 28, padding: Spacing.xl, width: '100%', alignItems: 'center', ...Shadows.medium },
  emojiWrap:   { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.warningLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  emoji:       { fontSize: 36 },
  chapter:     { fontFamily: Fonts.bold, fontSize: 12, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  title:       { fontFamily: Fonts.extraBold, fontSize: 32, color: Colors.textPrimary, marginBottom: 4 },
  subtitle:    { fontFamily: Fonts.regular, fontSize: 14, color: Colors.textMuted, marginBottom: Spacing.lg, textAlign: 'center' },
  coinRow:     { backgroundColor: Colors.warningLight, borderRadius: Radii.full, paddingHorizontal: 20, paddingVertical: 8, marginBottom: Spacing.sm },
  coinText:    { fontFamily: Fonts.bold, fontSize: 14, color: Colors.warningDark },
  returnHint:  { fontFamily: Fonts.regular, fontSize: 13, color: Colors.textMuted, marginBottom: Spacing.lg, textAlign: 'center' },
  btn:         { backgroundColor: Colors.primary, borderRadius: Radii.lg, paddingVertical: 14, paddingHorizontal: Spacing.xl, alignItems: 'center', width: '100%' },
  btnText:     { fontFamily: Fonts.bold, fontSize: 15, color: Colors.white },
});