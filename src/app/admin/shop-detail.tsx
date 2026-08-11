import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, Alert, ActivityIndicator, Switch } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {
  getShop,
  updateShop,
  deleteShop,
  listBarbersForShop,
  setBarberActive,
  updateBarberInfo,
  deleteBarberAccount,
  resetBarberPassword,
  getFriendlyErrorMessage,
  type Shop,
  type UserProfile,
} from '@barber/shared';
import { useTheme } from '@/context/ThemeContext';
import { FormField } from '@/components/FormField';

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function ShopDetail() {
  const { colors } = useTheme();
  const { shopId } = useLocalSearchParams<{ shopId: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [barbers, setBarbers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingShop, setDeletingShop] = useState(false);
  const [editingBarberId, setEditingBarberId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState('');
  const [barberPhone, setBarberPhone] = useState('');
  const [savingBarber, setSavingBarber] = useState(false);
  const [removingBarberId, setRemovingBarberId] = useState<string | null>(null);
  const [changingPasswordFor, setChangingPasswordFor] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSetFor, setPasswordSetFor] = useState<{ uid: string; password: string } | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const load = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [shopData, barberList] = await Promise.all([getShop(shopId), listBarbersForShop(shopId)]);
      setShop(shopData);
      setName(shopData?.name ?? '');
      setAddress(shopData?.address ?? '');
      setBarbers(barberList);
    } catch (err: any) {
      setLoadError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleSaveName() {
    if (!shopId || !name.trim()) return;
    setSavingName(true);
    try {
      await updateShop(shopId, { name: name.trim(), address: address.trim() });
      setEditingName(false);
      await load();
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setSavingName(false);
    }
  }

  function handleDeleteShop() {
    if (!shop) return;
    Alert.alert(
      'Delete shop',
      `This permanently deletes "${shop.name}", its services, availability and bookings. Barber accounts are kept. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingShop(true);
            try {
              await deleteShop(shop.id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', getFriendlyErrorMessage(err));
              setDeletingShop(false);
            }
          },
        },
      ]
    );
  }

  async function toggleBarber(barber: UserProfile, nextActive: boolean) {
    setTogglingId(barber.uid);
    try {
      await setBarberActive(barber.uid, nextActive);
      await load();
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setTogglingId(null);
    }
  }

  function startEditBarber(barber: UserProfile) {
    setEditingBarberId(barber.uid);
    setBarberName(barber.name);
    setBarberPhone(barber.phone ?? '');
  }

  async function handleSaveBarber() {
    if (!editingBarberId || !barberName.trim()) return;
    setSavingBarber(true);
    try {
      await updateBarberInfo(editingBarberId, { name: barberName.trim(), phone: barberPhone.trim() });
      setEditingBarberId(null);
      await load();
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setSavingBarber(false);
    }
  }

  function startChangePassword(barber: UserProfile) {
    setChangingPasswordFor(barber.uid);
    setNewPassword(generatePassword());
    setPasswordSetFor(null);
  }

  async function handleSavePassword(barber: UserProfile) {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await resetBarberPassword(barber.uid, newPassword);
      setPasswordSetFor({ uid: barber.uid, password: newPassword });
      setChangingPasswordFor(null);
    } catch (err: any) {
      Alert.alert('Error', getFriendlyErrorMessage(err));
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleCopyPassword(barber: UserProfile) {
    if (!passwordSetFor) return;
    await Clipboard.setStringAsync(
      `We Barbers login\nEmail: ${barber.email}\nPassword: ${passwordSetFor.password}`
    );
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  }

  function handleRemoveBarber(barber: UserProfile) {
    Alert.alert('Remove barber', `Permanently remove "${barber.name}"? This deletes their login too.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setRemovingBarberId(barber.uid);
          try {
            await deleteBarberAccount(barber.uid);
            await load();
          } catch (err: any) {
            Alert.alert('Error', getFriendlyErrorMessage(err));
          } finally {
            setRemovingBarberId(null);
          }
        },
      },
    ]);
  }

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (loadError || !shop) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{loadError ?? 'Shop not found.'}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={barbers}
      keyExtractor={(item) => item.uid}
      ListHeaderComponent={
        <View style={{ gap: 12, marginBottom: 8 }}>
          <View style={styles.infoCard}>
            {editingName ? (
              <>
                <FormField label="Shop Name" colors={colors} value={name} onChangeText={setName} />
                <FormField
                  label="Address (for your own records)"
                  placeholder="e.g. 123 Main St, Springfield"
                  colors={colors}
                  value={address}
                  onChangeText={setAddress}
                />
                <View style={styles.editRow}>
                  <Pressable style={styles.saveBtn} onPress={handleSaveName} disabled={savingName}>
                    {savingName ? (
                      <ActivityIndicator color={colors.primaryText} size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => {
                      setName(shop.name);
                      setAddress(shop.address ?? '');
                      setEditingName(false);
                    }}
                  >
                    <Text style={{ color: colors.text }}>Cancel</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.infoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{shop.name}</Text>
                  <Text style={styles.shopCode}>Code: {shop.shopCode} (customers use this to find you)</Text>
                  {!!shop.address && <Text style={styles.shopAddress}>{shop.address}</Text>}
                </View>
                <Pressable onPress={() => setEditingName(true)}>
                  <Text style={styles.editLink}>Edit</Text>
                </Pressable>
              </View>
            )}
          </View>

          <Pressable style={styles.deleteShopBtn} onPress={handleDeleteShop} disabled={deletingShop}>
            {deletingShop ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <Text style={styles.deleteShopText}>Delete Shop</Text>
            )}
          </Pressable>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Barbers ({barbers.length})</Text>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/admin/create-barber', params: { shopId: shop.id, shopName: shop.name } })
              }
            >
              <Text style={styles.editLink}>+ Add Barber</Text>
            </Pressable>
          </View>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>No barbers yet — add one above.</Text>}
      renderItem={({ item }) => {
        if (editingBarberId === item.uid) {
          return (
            <View style={styles.barberEditCard}>
              <FormField label="Full Name" colors={colors} value={barberName} onChangeText={setBarberName} />
              <FormField
                label="Phone"
                colors={colors}
                value={barberPhone}
                onChangeText={setBarberPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.editRow}>
                <Pressable style={styles.saveBtn} onPress={handleSaveBarber} disabled={savingBarber}>
                  {savingBarber ? (
                    <ActivityIndicator color={colors.primaryText} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save</Text>
                  )}
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setEditingBarberId(null)}>
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          );
        }

        if (changingPasswordFor === item.uid) {
          return (
            <View style={styles.barberEditCard}>
              <Text style={styles.hint}>Set a new password for {item.name}:</Text>
              <FormField label="New Password" colors={colors} value={newPassword} onChangeText={setNewPassword} />
              <Pressable onPress={() => setNewPassword(generatePassword())}>
                <Text style={styles.editLink}>Generate a new password</Text>
              </Pressable>
              <View style={styles.editRow}>
                <Pressable style={styles.saveBtn} onPress={() => handleSavePassword(item)} disabled={savingPassword}>
                  {savingPassword ? (
                    <ActivityIndicator color={colors.primaryText} size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Set Password</Text>
                  )}
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setChangingPasswordFor(null)}>
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          );
        }

        return (
          <View>
            <View style={styles.barberCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.barberName}>{item.name}</Text>
                <Text style={styles.barberMeta}>{item.email}</Text>
                {!!item.phone && <Text style={styles.barberMeta}>{item.phone}</Text>}
                <View style={styles.barberActionsRow}>
                  <Pressable onPress={() => startEditBarber(item)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => startChangePassword(item)}>
                    <Text style={styles.editLink}>Change Password</Text>
                  </Pressable>
                  <Pressable onPress={() => handleRemoveBarber(item)} disabled={removingBarberId === item.uid}>
                    {removingBarberId === item.uid ? (
                      <ActivityIndicator size="small" color={colors.danger} />
                    ) : (
                      <Text style={styles.removeLink}>Remove</Text>
                    )}
                  </Pressable>
                </View>
              </View>
              <View style={styles.statusColumn}>
                <Text style={[styles.statusLabel, { color: item.isActive ? colors.success : colors.textMuted }]}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Text>
                {togglingId === item.uid ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Switch value={item.isActive} onValueChange={(v) => toggleBarber(item, v)} />
                )}
              </View>
            </View>

            {passwordSetFor?.uid === item.uid && (
              <View style={styles.credsBox}>
                <Text style={styles.hint}>New password set — share it securely:</Text>
                <Text selectable style={styles.credsText}>Password: {passwordSetFor.password}</Text>
                <Pressable style={styles.copyBtn} onPress={() => handleCopyPassword(item)}>
                  <Text style={styles.copyBtnText}>{copiedPassword ? 'Copied!' : 'Copy Email & Password'}</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    errorText: { color: colors.danger },
    infoCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      gap: 10,
      backgroundColor: colors.card,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    hint: { color: colors.textMuted, fontSize: 13 },
    credsBox: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      padding: 12,
      gap: 6,
      backgroundColor: colors.card,
      marginTop: -4,
      marginBottom: 10,
    },
    credsText: { fontSize: 16, color: colors.text },
    copyBtn: { borderWidth: 1, borderColor: colors.accent, padding: 10, borderRadius: 8, alignItems: 'center' },
    copyBtnText: { color: colors.accent, fontWeight: '700' },
    shopName: { fontSize: 20, fontWeight: '700', color: colors.text },
    shopCode: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
    shopAddress: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
    editLink: { color: colors.accent, fontWeight: '600' },
    removeLink: { color: colors.danger, fontWeight: '600' },
    editRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    saveBtn: { backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
    saveBtnText: { color: colors.primaryText, fontWeight: '600' },
    cancelBtn: { padding: 10 },
    deleteShopBtn: {
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 8,
      padding: 10,
      alignItems: 'center',
    },
    deleteShopText: { color: colors.danger, fontWeight: '700' },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    empty: { color: colors.textMuted, fontStyle: 'italic', paddingVertical: 8 },
    barberCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      backgroundColor: colors.card,
    },
    barberEditCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      gap: 8,
      backgroundColor: colors.card,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
    barberName: { fontWeight: '700', color: colors.text },
    barberMeta: { color: colors.textMuted, fontSize: 13 },
    barberActionsRow: { flexDirection: 'row', gap: 16, marginTop: 6 },
    statusColumn: { alignItems: 'center', gap: 4 },
    statusLabel: { fontSize: 11, fontWeight: '700' },
  });
}
