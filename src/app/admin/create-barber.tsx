import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { createBarberAccount, getFriendlyErrorMessage } from '@barber/shared';
import { useTheme } from '@/context/ThemeContext';
import { FormField } from '@/components/FormField';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const BARBER_CODE_PATTERN = /^[A-Z0-9]{3,8}$/;

function suggestBarberCode(name: string) {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${base}${suffix}`.slice(0, 8);
}

export default function CreateBarber() {
  const { colors } = useTheme();
  const { shopId, shopName } = useLocalSearchParams<{ shopId: string; shopName: string }>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState(generatePassword());
  const [barberCode, setBarberCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; barberCode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    const trimmedCode = barberCode.trim().toUpperCase();
    if (!shopId || !name.trim() || !email.trim() || !password || !trimmedCode) {
      Alert.alert('Missing details', 'Enter a name, email, password and barber code.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (!BARBER_CODE_PATTERN.test(trimmedCode)) {
      Alert.alert('Invalid barber code', 'Barber code must be 3-8 letters/numbers only.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBarberAccount({
        shopId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        barberCode: trimmedCode,
      });
      setCreated({ email: result.email, password: result.password, barberCode: result.barberCode });
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const styles = getStyles(colors);

  async function handleCopy() {
    if (!created) return;
    await Clipboard.setStringAsync(
      `We Barbers login\nEmail: ${created.email}\nPassword: ${created.password}\nBarber Code: ${created.barberCode}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (created) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Barber account created</Text>
        <Text style={styles.hint}>Share these credentials with {name || 'the barber'} securely:</Text>
        <View style={styles.credsBox}>
          <Text selectable style={styles.credsText}>Email: {created.email}</Text>
          <Text selectable style={styles.credsText}>Password: {created.password}</Text>
          <Text selectable style={styles.credsText}>Barber Code: {created.barberCode}</Text>
        </View>
        <Pressable style={styles.copyBtn} onPress={handleCopy}>
          <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy Credentials'}</Text>
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={() => router.back()}>
          <Text style={styles.saveBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Add barber to {shopName}</Text>

      <FormField
        label="Barber's Full Name"
        placeholder="e.g. Ali Raza"
        colors={colors}
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (!barberCode) setBarberCode(suggestBarberCode(v));
        }}
      />
      <FormField
        label="Email Address"
        placeholder="e.g. ali@gmail.com"
        colors={colors}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <FormField
        label="Phone Number (optional)"
        placeholder="e.g. 03001234567"
        colors={colors}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <FormField
        label="Password"
        placeholder="Auto-generated — edit if you'd like"
        colors={colors}
        value={password}
        onChangeText={setPassword}
      />
      <Pressable onPress={() => setPassword(generatePassword())}>
        <Text style={styles.regenerate}>Generate a new password</Text>
      </Pressable>
      <FormField
        label="Barber Code (unique — customers can use this to book directly)"
        placeholder="e.g. ALI42"
        colors={colors}
        autoCapitalize="characters"
        value={barberCode}
        onChangeText={setBarberCode}
      />
      <Pressable onPress={() => setBarberCode(suggestBarberCode(name))}>
        <Text style={styles.regenerate}>Generate a new code</Text>
      </Pressable>
      <Pressable style={styles.saveBtn} onPress={handleCreate} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.primaryText} /> : <Text style={styles.saveBtnText}>Create Barber Account</Text>}
      </Pressable>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 10, backgroundColor: colors.background },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    hint: { color: colors.textMuted },
    regenerate: { color: colors.accent },
    copyBtn: {
      borderWidth: 1,
      borderColor: colors.accent,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    copyBtnText: { color: colors.accent, fontWeight: '700' },
    saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: colors.primaryText, fontWeight: '600' },
    credsBox: { borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8, padding: 14, gap: 6, backgroundColor: colors.card },
    credsText: { fontSize: 16, color: colors.text },
  });
}
