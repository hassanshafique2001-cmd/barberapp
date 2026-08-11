import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { signInStaff, getFriendlyErrorMessage } from '@barber/shared';
import { COLORS } from '@/constants/theme';
import { FormField } from '@/components/FormField';
import { useLanguage } from '@/context/LanguageContext';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await signInStaff(email.trim(), password);
      router.replace('/');
    } catch (err: any) {
      Alert.alert('Login failed', getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{t('login.brand')}</Text>
      <Text style={styles.title}>{t('login.title')}</Text>

      <FormField
        label={t('login.email')}
        placeholder={t('login.emailPlaceholder')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label={t('login.password')}
        placeholder={t('login.passwordPlaceholder')}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={handleLogin} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color={COLORS.primaryText} />
        ) : (
          <Text style={styles.buttonText}>{t('login.button')}</Text>
        )}
      </Pressable>
      <Text style={styles.hint}>{t('login.hint')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12, backgroundColor: COLORS.background },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    color: COLORS.accent,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: COLORS.primaryText, fontSize: 16, fontWeight: '600' },
  hint: { textAlign: 'center', color: COLORS.textMuted, marginTop: 16, fontSize: 13 },
});
