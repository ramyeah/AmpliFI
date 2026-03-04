import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useRouter } from 'expo-router';

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
      router.replace('/home');
    } catch (error) {
      Alert.alert('Error saving profile', error.message);
    }
  };

  const OptionSelector = ({ label, options, selected, onSelect }) => (
    <View style={styles.selectorContainer}>
      <Text style={styles.label}>{label}</Text>
      {options.map(option => (
        <TouchableOpacity
          key={option}
          style={[styles.option, selected === option && styles.optionSelected]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.optionText, selected === option && styles.optionTextSelected]}>
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Let's get to know you</Text>
      <Text style={styles.subtitle}>This helps us personalise your financial journey</Text>

      <Text style={styles.label}>Your name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Ramya"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Your age</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 22"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <OptionSelector
        label="Income bracket"
        options={INCOME_OPTIONS}
        selected={income}
        onSelect={setIncome}
      />

      <OptionSelector
        label="Family status"
        options={FAMILY_OPTIONS}
        selected={family}
        onSelect={setFamily}
      />

      <OptionSelector
        label="Primary financial goal"
        options={GOAL_OPTIONS}
        selected={goal}
        onSelect={setGoal}
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Start my journey →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F4E79', marginBottom: 8, marginTop: 48 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 8 },
  selectorContainer: { marginBottom: 8 },
  option: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 8 },
  optionSelected: { borderColor: '#1F4E79', backgroundColor: '#D6E4F0' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextSelected: { color: '#1F4E79', fontWeight: '600' },
  button: { backgroundColor: '#1F4E79', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 32 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});