import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert('Login failed', error.message);
    }
  };

  return (
    <View style={styles.container}>

      <View style={styles.logoContainer}>
        <View style={styles.logoBubble}>
          <Text style={styles.logoText}>💰</Text>
        </View>
      </View>

      <Text style={styles.title}>AmpliFI</Text>
      <Text style={styles.subtitle}>Your financial journey starts here</Text>

      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={() => router.push('/register')}>
        <Text style={styles.link}>
          Don't have an account? <Text style={styles.linkBold}>Register</Text>
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBubble: {
    width: 80,
    height: 80,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
  },
  title: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize.xxl,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
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
  button: {
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    alignItems: 'center',
    marginTop: Spacing.xs,
    ...Shadows.soft,
  },
  buttonText: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    fontSize: Typography.fontSize.md,
  },
  link: {
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
  },
  linkBold: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
});