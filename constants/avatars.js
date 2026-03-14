// constants/avatars.js
//
// Avatar system for AmpliFI life simulation.
//
// PLACEHOLDER BUILD: avatars currently render as coloured circles with emoji +
// initial. When illustrated assets are ready, swap the `image` field on each
// avatar and update AvatarDisplay to use <Image> instead of the circle.
// Every consumer of AvatarDisplay stays unchanged.
//
// Usage:
//   import { AvatarDisplay, getAvatarState, AVATARS, OUTFIT_UNLOCKS } from '../constants/avatars';
//   <AvatarDisplay avatarId="priya" state="happy" size={64} unlockedOutfits={['lanyard']} />

import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { Colors, Fonts, Radii } from './theme';

// ─── Avatar Definitions ───────────────────────────────────────────────────────

export const AVATARS = [
  {
    id:          'alex',
    name:        'Alex',
    emoji:       '🧑',
    initial:     'A',
    color:       '#3AAECC',   // module-1 teal
    colorLight:  '#E0F5FB',
    major:       'Computer Science',
    from:        'Malaysia',
    backstory:   'Second-year CS student at NTU. Analytical and methodical — loves spreadsheets but has never applied that rigour to his own money.',
  },
  {
    id:          'priya',
    name:        'Priya',
    emoji:       '👩',
    initial:     'P',
    color:       '#F5883A',   // module-2 orange
    colorLight:  '#FFF0E3',
    major:       'Business',
    from:        'India',
    backstory:   'Final-year Business student. Ambitious and goal-driven — has big plans but her GrabFood habit quietly drains her allowance every month.',
  },
  {
    id:          'wei',
    name:        'Wei',
    emoji:       '🧑',
    initial:     'W',
    color:       '#5BBF8A',   // module-3 mint
    colorLight:  '#E4F7EE',
    major:       'Engineering',
    from:        'China',
    backstory:   'Third-year Engineering student. Careful and risk-averse — keeps all his money in a basic savings account because investing feels too uncertain.',
  },
  {
    id:          'jasmine',
    name:        'Jasmine',
    emoji:       '👩',
    initial:     'J',
    color:       '#F97B8B',   // primary coral
    colorLight:  '#FFD6DC',
    major:       'Communications',
    from:        'Indonesia',
    backstory:   'First-year Comms student. Creative and social — spends freely on experiences and often wonders where her allowance went by mid-month.',
  },
  {
    id:          'rajan',
    name:        'Rajan',
    emoji:       '🧑',
    initial:     'R',
    color:       '#8B6FD4',   // module-4 purple
    colorLight:  '#F0EBFC',
    major:       'Medicine',
    from:        'Sri Lanka',
    backstory:   'Third-year Medicine student. Long time horizon and cautious — already thinking about retirement but unsure where to start.',
  },
  {
    id:          'sofia',
    name:        'Sofia',
    emoji:       '👩',
    initial:     'S',
    color:       '#E6A800',   // warningDark amber
    colorLight:  '#FFFBEB',
    major:       'Design',
    from:        'Vietnam',
    backstory:   'Second-year Design student. Intuitive and visual — understands money better when she can see it, which is why the sim suits her perfectly.',
  },
];

// ─── Avatar State Machine ─────────────────────────────────────────────────────
//
// Five emotional states, each with an emoji overlay and a background ring color.
// getAvatarState() is a pure function — no side effects.
// Pass in a context object describing what's happening in the sim right now.
//
// Context shape (all fields optional — only pass what's relevant):
// {
//   screen:        'budget' | 'goals' | 'spending' | 'bank' | 'emergency' | 'stagemap' | 'unlock',
//   savingsPct:    number,   // 0–100, current savings slider value
//   totalPct:      number,   // 0–100, total allocation so far
//   overspent:     boolean,  // did actual spending exceed budget?
//   goalSet:       boolean,  // has the FFN been set?
//   stageComplete: boolean,  // is a stage just finishing?
//   newUnlock:     boolean,  // is a new wallet/account just unlocking?
//   eventHit:      boolean,  // did a random expense event just fire?
//   fundPct:       number,   // 0–1, emergency fund progress toward target
// }

export const AVATAR_STATES = {
  neutral:     { emoji: '😊', ring: Colors.border,       label: 'neutral'     },
  happy:       { emoji: '😄', ring: Colors.successDark,  label: 'happy'       },
  celebrating: { emoji: '🥳', ring: Colors.warningDark,  label: 'celebrating' },
  stressed:    { emoji: '😰', ring: Colors.danger,       label: 'stressed'    },
  thinking:    { emoji: '🤔', ring: Colors.primary,      label: 'thinking'    },
};

export function getAvatarState(ctx = {}) {
  const {
    screen, savingsPct, totalPct, overspent,
    goalSet, stageComplete, newUnlock, eventHit, fundPct,
  } = ctx;

  // Celebrating — highest priority, overrides everything
  if (stageComplete || newUnlock) return 'celebrating';

  // Screen-specific logic
  switch (screen) {

    case 'goals':
      if (goalSet) return 'happy';
      return 'thinking';

    case 'budget':
      // Stressed if savings is 0 and total is 100 (locked in with nothing to savings)
      if (totalPct === 100 && savingsPct === 0) return 'stressed';
      // Happy when they've arrived at 20%+ savings
      if (savingsPct >= 20 && totalPct === 100) return 'happy';
      // Thinking while they're still dragging
      if (totalPct > 0 && totalPct < 100) return 'thinking';
      return 'neutral';

    case 'spending':
      if (overspent) return 'stressed';
      return 'thinking';

    case 'bank':
      // Opening an account is a positive moment
      return 'happy';

    case 'emergency':
      if (eventHit) return 'stressed';
      if (fundPct >= 1) return 'celebrating';
      if (fundPct >= 0.33) return 'happy';
      return 'thinking';

    case 'unlock':
      return 'celebrating';

    case 'stagemap':
    default:
      return 'neutral';
  }
}

// ─── Outfit Unlocks ───────────────────────────────────────────────────────────
//
// Cosmetic items that accumulate on the avatar as stages are completed.
// Rendered as small emoji badges stacked below the avatar circle.
// Real illustrated overlay assets swap in via the `asset` field later.

export const OUTFIT_UNLOCKS = [
  {
    id:          'lanyard',
    emoji:       '🪪',
    label:       'NTU Lanyard',
    description: 'You\'ve set your financial goals. Every NTU journey starts somewhere.',
    unlocksAt:   'stage-1',   // stage id from lifeSimStages.js
    asset:       null,        // swap to require('../assets/outfits/lanyard.png') later
  },
  {
    id:          'notebook',
    emoji:       '📒',
    label:       'Budget Notebook',
    description: 'You\'ve set your first budget. Knowledge written down becomes a plan.',
    unlocksAt:   'stage-2',
    asset:       null,
  },
  {
    id:          'magnifier',
    emoji:       '🔍',
    label:       'Receipt Magnifier',
    description: 'You tracked your spending. Most people never look this closely.',
    unlocksAt:   'stage-3',
    asset:       null,
  },
  {
    id:          'card',
    emoji:       '💳',
    label:       'Bank Card',
    description: 'Your money has a home. This is where it all starts.',
    unlocksAt:   'stage-4',
    asset:       null,
  },
  {
    id:          'shield',
    emoji:       '🛡️',
    label:       'Shield Pin',
    description: 'Your first month of emergency fund is built. You\'re protected.',
    unlocksAt:   'stage-5',
    asset:       null,
  },
];

// Helper — get all outfit items unlocked up to and including a given stage
export function getUnlockedOutfits(completedStageIds = []) {
  return OUTFIT_UNLOCKS.filter(o => completedStageIds.includes(o.unlocksAt));
}

// Helper — get the outfit item that just unlocked for a given stage
export function getNewOutfit(stageId) {
  return OUTFIT_UNLOCKS.find(o => o.unlocksAt === stageId) ?? null;
}

// Helper — get avatar definition by id, with fallback to first avatar
export function getAvatar(avatarId) {
  return AVATARS.find(a => a.id === avatarId) ?? AVATARS[0];
}

// ─── AvatarDisplay Component ──────────────────────────────────────────────────
//
// Props:
//   avatarId        string   — one of the AVATARS ids
//   state           string   — one of the AVATAR_STATES keys (or pass context obj to getAvatarState)
//   size            number   — diameter in px (default 64)
//   unlockedOutfits string[] — array of outfit ids to render as badges
//   animate         boolean  — whether to spring-animate on state change (default true)
//   showName        boolean  — render avatar name below circle (default false)

export function AvatarDisplay({
  avatarId,
  state = 'neutral',
  size = 64,
  unlockedOutfits = [],
  animate = true,
  showName = false,
}) {
  const avatar    = getAvatar(avatarId);
  const stateInfo = AVATAR_STATES[state] ?? AVATAR_STATES.neutral;

  // Spring scale animation on state change
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.12, friction: 4, tension: 200, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1,    friction: 6, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [state]);

  const circleSize   = size;
  const fontSize     = Math.round(size * 0.42);
  const ringWidth    = Math.round(size * 0.055);
  const badgeSize    = Math.max(18, Math.round(size * 0.28));
  const badgeFontSize= Math.max(10, Math.round(size * 0.18));
  const emojiSize    = Math.max(12, Math.round(size * 0.25));

  // Show max 3 outfit badges to avoid overcrowding
  const visibleOutfits = OUTFIT_UNLOCKS
    .filter(o => unlockedOutfits.includes(o.id))
    .slice(-3);

  return (
    <View style={av.wrap}>
      <Animated.View style={[
        av.ring,
        {
          width:        circleSize + ringWidth * 2,
          height:       circleSize + ringWidth * 2,
          borderRadius: (circleSize + ringWidth * 2) / 2,
          borderWidth:  ringWidth,
          borderColor:  stateInfo.ring,
          transform:    [{ scale }],
        },
      ]}>
        {/* Base avatar circle */}
        <View style={[
          av.circle,
          {
            width:           circleSize,
            height:          circleSize,
            borderRadius:    circleSize / 2,
            backgroundColor: avatar.color,
          },
        ]}>
          {/* Initial */}
          <Text style={[av.initial, { fontSize, color: Colors.white }]}>
            {avatar.initial}
          </Text>
        </View>

        {/* Emotional state emoji — bottom-right overlay */}
        <View style={[
          av.stateEmoji,
          {
            bottom:      -2,
            right:       -2,
            width:       emojiSize + 4,
            height:      emojiSize + 4,
            borderRadius:(emojiSize + 4) / 2,
          },
        ]}>
          <Text style={{ fontSize: emojiSize, lineHeight: emojiSize + 2 }}>
            {stateInfo.emoji}
          </Text>
        </View>
      </Animated.View>

      {/* Outfit badge row */}
      {visibleOutfits.length > 0 && (
        <View style={av.badgeRow}>
          {visibleOutfits.map(outfit => (
            <View
              key={outfit.id}
              style={[av.badge, { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 }]}
            >
              <Text style={{ fontSize: badgeFontSize }}>{outfit.emoji}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Optional name label */}
      {showName && (
        <Text style={[av.name, { color: avatar.color }]}>{avatar.name}</Text>
      )}
    </View>
  );
}

const av = StyleSheet.create({
  wrap:       { alignItems: 'center' },
  ring:       { alignItems: 'center', justifyContent: 'center' },
  circle:     { alignItems: 'center', justifyContent: 'center' },
  initial:    { fontFamily: Fonts.extraBold, textAlign: 'center' },
  stateEmoji: {
    position:        'absolute',
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1.5,
    borderColor:     Colors.border,
  },
  badgeRow: {
    flexDirection:  'row',
    gap:            4,
    marginTop:      6,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: Colors.white,
    alignItems:      'center',
    justifyContent:  'center',
    borderWidth:     1,
    borderColor:     Colors.border,
  },
  name: {
    fontFamily: Fonts.bold,
    fontSize:   13,
    marginTop:  6,
  },
});