import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  signOutCurrentUser,
  changeOwnPassword,
  getShop,
  submitAccountDeletionRequest,
  getFriendlyErrorMessage,
  subscribeToBarberReviews,
  getRatingStats,
} from '@barber/shared';
import { FormField } from '@/components/FormField';
import { StarRating } from '@/components/StarRating';
import logo from '@/assets/images/logo-circle.png';

export default function Profile() {
  const { profile } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 });

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToBarberReviews(profile.uid, (reviews) => {
      setRatingStats(getRatingStats(reviews));
    });
    return unsubscribe;
  }, [profile?.uid]);

  const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
    { mode: 'light', label: t('profile.light') },
    { mode: 'dark', label: t('profile.dark') },
    { mode: 'auto', label: t('profile.auto') },
  ];

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [shopCode, setShopCode] = useState<string | null>(null);
  const [shopCodeCopied, setShopCodeCopied] = useState(false);

  useEffect(() => {
    if (!profile?.shopId) return;
    getShop(profile.shopId)
      .then((shop) => setShopCode(shop?.shopCode ?? null))
      .catch(() => {});
  }, [profile?.shopId]);

  async function handleCopyCode() {
    if (!profile?.barberCode) return;
    await Clipboard.setStringAsync(profile.barberCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  async function handleCopyShopCode() {
    if (!shopCode) return;
    await Clipboard.setStringAsync(shopCode);
    setShopCodeCopied(true);
    setTimeout(() => setShopCodeCopied(false), 2000);
  }

  async function handleChangePassword() {
    if (!currentPassword || newPassword.length < 6) {
      Alert.alert(t('profile.missingDetails'), t('profile.missingPasswordMsg'));
      return;
    }
    setChangingPassword(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setShowChangePassword(false);
      Alert.alert(t('profile.passwordSaved'), t('profile.passwordSavedMsg'));
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setChangingPassword(false);
    }
  }

  function handleDeleteAccount() {
    if (!profile) return;
    Alert.alert(t('profile.deleteAccountConfirmTitle'), t('profile.deleteAccountConfirmMsg'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('profile.deleteAccountConfirmYes'),
        style: 'destructive',
        onPress: async () => {
          try {
            await submitAccountDeletionRequest({
              senderId: profile.uid,
              senderRole: 'barber',
              senderName: profile.name,
              email: profile.email,
              phone: profile.phone,
              shopId: profile.shopId ?? undefined,
            });
            Alert.alert(t('profile.deleteAccountSentTitle'), t('profile.deleteAccountSentMsg'));
          } catch (err: any) {
            Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
          }
        },
      },
    ]);
  }

  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Image source={logo} style={styles.avatar} resizeMode="contain" />
      <Text style={styles.role}>{t('profile.roleBarber')}</Text>
      <Text style={styles.name}>{profile?.name}</Text>
      <Text style={styles.email}>{profile?.email}</Text>
      <View style={{ marginTop: 6 }}>
        <StarRating average={ratingStats.average} count={ratingStats.count} />
      </View>

      {(!!shopCode || !!profile?.barberCode) && (
        <View style={styles.codeRow}>
          {!!shopCode && (
            <Pressable style={[styles.codeBadge, { flex: 1 }]} onPress={handleCopyShopCode}>
              <Text style={styles.codeBadgeLabel} numberOfLines={1}>
                {t('profile.yourShopCode')}
              </Text>
              <Text style={styles.codeBadgeValue} numberOfLines={1} adjustsFontSizeToFit>
                {shopCode}
              </Text>
              <Text style={styles.codeBadgeHint} numberOfLines={1}>
                {shopCodeCopied ? t('profile.copied') : t('profile.tapToCopy')}
              </Text>
            </Pressable>
          )}
          {!!profile?.barberCode && (
            <Pressable style={[styles.codeBadge, { flex: 1 }]} onPress={handleCopyCode}>
              <Text style={styles.codeBadgeLabel} numberOfLines={1}>
                {t('profile.yourBarberCode')}
              </Text>
              <Text style={styles.codeBadgeValue} numberOfLines={1} adjustsFontSizeToFit>
                {profile.barberCode}
              </Text>
              <Text style={styles.codeBadgeHint} numberOfLines={1}>
                {codeCopied ? t('profile.copied') : t('profile.tapToCopy')}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {!!profile?.barberCode && (
        <View style={styles.qrWrap}>
          <QRCode value={profile.barberCode} size={140} backgroundColor="#ffffff" color="#1a1a1a" />
          <Text style={styles.qrHint}>{t('profile.scanToJoin')}</Text>
        </View>
      )}

      <Pressable style={styles.menuItem} onPress={() => router.push('/barber/availability')}>
        <Text style={styles.menuItemText}>{t('profile.manageAvailability')}</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.menuItem} onPress={() => setShowChangePassword((v) => !v)}>
        <Text style={styles.menuItemText}>{t('profile.changePassword')}</Text>
        <Text style={styles.chevron}>{showChangePassword ? '⌄' : '›'}</Text>
      </Pressable>

      <Pressable style={styles.menuItem} onPress={() => router.push('/barber/reviews')}>
        <Text style={styles.menuItemText}>{t('profile.myReviews')}</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Pressable style={styles.menuItem} onPress={() => router.push('/barber/suggestion')}>
        <Text style={styles.menuItemText}>{t('profile.sendSuggestion')}</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      {showChangePassword && (
        <View style={styles.passwordForm}>
          <FormField
            label={t('profile.currentPassword')}
            colors={colors}
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <FormField
            label={t('profile.newPassword')}
            colors={colors}
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Pressable style={styles.saveBtn} onPress={handleChangePassword} disabled={changingPassword}>
            {changingPassword ? (
              <ActivityIndicator color={colors.primaryText} size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t('profile.savePassword')}</Text>
            )}
          </Pressable>
        </View>
      )}

      <View style={styles.themeSection}>
        <Text style={styles.themeLabel}>{t('profile.appearance')}</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const selected = mode === option.mode;
            return (
              <Pressable
                key={option.mode}
                style={[
                  styles.themeOption,
                  { borderColor: selected ? colors.accent : colors.border },
                  selected && { backgroundColor: colors.accent },
                ]}
                onPress={() => setMode(option.mode)}
              >
                <Text style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600' }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.themeSection}>
        <Text style={styles.themeLabel}>{t('profile.language')}</Text>
        <View style={styles.themeRow}>
          {(['en', 'es'] as const).map((lang) => {
            const selected = language === lang;
            return (
              <Pressable
                key={lang}
                style={[
                  styles.themeOption,
                  { borderColor: selected ? colors.accent : colors.border },
                  selected && { backgroundColor: colors.accent },
                ]}
                onPress={() => setLanguage(lang)}
              >
                <Text style={{ color: selected ? colors.primaryText : colors.text, fontWeight: '600' }}>
                  {lang === 'en' ? t('profile.english') : t('profile.spanish')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.signOutBtn} onPress={() => signOutCurrentUser()}>
        <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
      </Pressable>

      <Pressable style={styles.deleteAccountBtn} onPress={handleDeleteAccount}>
        <Text style={styles.deleteAccountText}>{t('profile.deleteAccount')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { alignItems: 'center', padding: 24, gap: 6 },
    avatar: { width: 84, height: 84, marginTop: 16, marginBottom: 8 },
    role: {
      color: colors.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 12,
    },
    name: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
    email: { fontSize: 14, color: colors.textMuted },
    codeRow: {
      flexDirection: 'row',
      gap: 10,
      width: '100%',
      marginTop: 14,
    },
    codeBadge: {
      alignItems: 'center',
      backgroundColor: colors.accent + '14',
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 8,
    },
    codeBadgeLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    codeBadgeValue: { fontSize: 15, fontWeight: '800', color: colors.accent, marginTop: 2 },
    codeBadgeHint: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
    qrWrap: {
      alignItems: 'center',
      marginTop: 16,
      padding: 12,
      borderRadius: 16,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: colors.border,
    },
    qrHint: { fontSize: 11, color: colors.textMuted, marginTop: 8, textAlign: 'center', maxWidth: 180 },
    menuItem: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 14,
      marginTop: 20,
    },
    menuItemText: { color: colors.text, fontWeight: '600', fontSize: 15 },
    chevron: { color: colors.textMuted, fontSize: 18 },
    passwordForm: { width: '100%', gap: 10, paddingTop: 12 },
    saveBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveBtnText: { color: colors.primaryText, fontWeight: '600' },
    themeSection: { width: '100%', marginTop: 24, gap: 10 },
    themeLabel: { fontWeight: '700', color: colors.text, fontSize: 13 },
    themeRow: { flexDirection: 'row', gap: 10 },
    themeOption: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center',
    },
    signOutBtn: {
      marginTop: 32,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    signOutText: { color: colors.danger, fontWeight: '700' },
    deleteAccountBtn: {
      marginTop: 12,
      paddingVertical: 12,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    deleteAccountText: { color: colors.textMuted, fontWeight: '600', fontSize: 13, textDecorationLine: 'underline' },
  });
}
