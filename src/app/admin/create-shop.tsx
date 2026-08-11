import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert, ActivityIndicator, Text } from 'react-native';
import { router } from 'expo-router';
import { createShop, getFriendlyErrorMessage } from '@barber/shared';
import { useTheme } from '@/context/ThemeContext';
import { FormField } from '@/components/FormField';

const SHOP_CODE_PATTERN = /^[A-Z0-9]{3,8}$/;

function suggestCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
}

export default function CreateShop() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [shopCode, setShopCode] = useState('');
  const [address, setAddress] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    const trimmedCode = shopCode.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) {
      Alert.alert('Missing details', 'Enter a shop name and shop code.');
      return;
    }
    if (!SHOP_CODE_PATTERN.test(trimmedCode)) {
      Alert.alert('Invalid shop code', 'Shop code must be 3-8 letters/numbers only.');
      return;
    }
    setCreating(true);
    try {
      await createShop({ name: trimmedName, shopCode: trimmedCode, address: address.trim() || undefined });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setCreating(false);
    }
  }

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <FormField
        label="Shop Name"
        placeholder="e.g. Saloon X"
        colors={colors}
        value={name}
        onChangeText={(v) => {
          setName(v);
          if (!shopCode) setShopCode(suggestCode(v));
        }}
      />
      <FormField
        label="Shop Code"
        placeholder="e.g. SALOONX — customers use this to find you"
        colors={colors}
        autoCapitalize="characters"
        value={shopCode}
        onChangeText={setShopCode}
      />
      <FormField
        label="Address (for your own records)"
        placeholder="e.g. 123 Main St, Springfield"
        colors={colors}
        value={address}
        onChangeText={setAddress}
      />

      <Pressable style={styles.saveBtn} onPress={handleCreate} disabled={creating}>
        {creating ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={styles.saveBtnText}>Create Shop</Text>
        )}
      </Pressable>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, padding: 16, gap: 12, backgroundColor: colors.background },
    saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: colors.primaryText, fontWeight: '600' },
  });
}
