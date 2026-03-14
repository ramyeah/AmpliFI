import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';

const INCOME_OPTIONS = ['Student', 'Entry-level (<$3k/month)', 'Mid-level ($3k-$6k/month)', 'Senior ($6k+/month)'];
const FAMILY_OPTIONS = ['Single', 'Married', 'Married with kids'];
const GOAL_OPTIONS = ['Grow my investments', 'Plan for retirement', 'Build wealth', 'Learn investing basics'];

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [income, setIncome] = useState('');
  const [family, setFamily] = useState('');
  const [goal, setGoal] = useState('');
  const router = useRouter();

  const handleSave = async () => {
    if (!name || !age || !income || !family || !goal) {
      Alert.alert('Please fill in all fields');
      return;
    }
    try {
      const uid = auth.currentUser.uid;
      await setDoc(doc(db, 'users', uid), {
        name,
        age: parseInt(age),
        income,
        familyStatus: family,
        goal,
        createdAt: new Date().toISOString(),
        finCoins: 0,
        xp: 0,
        streak: 0,
      });
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Error saving profile', error.message);
    }
  };

  const OptionSelector = ({ label, options, selected, onSelect }) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.sectionHint}>Select one</Text>
      {options.map(option => {
        const isSelected = selected === option;
        return (
          <TouchableOpacity
            key={option}
            style={[styles.option, isSelected && styles.optionSelected]}
            onPress={() => onSelect(option)}
            activeOpacity={0.7}
          >
            {/* Checkbox circle on the left */}
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoBubble}>
          <Text style={styles.logoText}>✨</Text>
        </View>
        <Text style={styles.title}>Let's get to know you</Text>
        <Text style={styles.subtitle}>This helps us personalise your financial journey</Text>
      </View>

      {/* Name & Age card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Info</Text>

        <Text style={styles.sectionLabel}>Your name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ramya"
          placeholderTextColor={Colors.textMuted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionLabel}>Your age</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 22"
          placeholderTextColor={Colors.textMuted}
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"
        />
      </View>

      {/* Income card */}
      <View style={styles.card}>
        <OptionSelector
          label="Income bracket"
          options={INCOME_OPTIONS}
          selected={income}
          onSelect={setIncome}
        />
      </View>

      {/* Family card */}
      <View style={styles.card}>
        <OptionSelector
          label="Family status"
          options={FAMILY_OPTIONS}
          selected={family}
          onSelect={setFamily}
        />
      </View>

      {/* Goal card */}
      <View style={styles.card}>
        <OptionSelector
          label="Primary financial goal"
          options={GOAL_OPTIONS}
          selected={goal}
          onSelect={setGoal}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Start my journey →</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xxxl,
    marginBottom: Spacing.xl,
  },
  logoBubble: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    backgroundColor: Colors.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  logoText: {
    fontSize: 32,
  },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },

  // Cards
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionHint: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.lightGray,
  },

  // Option selector
  selectorContainer: {
    marginBottom: Spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.lightGray,
  },
  optionSelected: {
    borderColor: Colors.skyBlue,
    backgroundColor: '#EAF6FA',  // very light sky blue tint
  },

  // Checkbox
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radii.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Colors.skyBlue,
    backgroundColor: Colors.skyBlue,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
  },

  optionText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },

  // Button
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadows.medium,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    fontSize: Typography.fontSize.md,
  },
});