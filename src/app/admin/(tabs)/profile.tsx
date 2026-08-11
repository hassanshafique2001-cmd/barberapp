import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { signOutCurrentUser } from '@barber/shared';

export default function Profile() {
  const { profile } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const styles = getStyles(colors);

  const THEME_OPTIONS: { mode: ThemeMode; label: string }[] = [
    { mode: 'light', label: t('profile.light') },
    { mode: 'dark', label: t('profile.dark') },
    { mode: 'auto', label: t('profile.auto') },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(profile?.name ?? '?').charAt(0).toUpperCase()}</Text>
      </View>
      <Text style={styles.role}>{t('profile.roleSuperAdmin')}</Text>
      <Text style={styles.name}>{profile?.name}</Text>
      <Text style={styles.email}>{profile?.email}</Text>

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
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, alignItems: 'center', padding: 24, gap: 6, backgroundColor: colors.background },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    avatarText: { color: colors.primaryText, fontSize: 32, fontWeight: '800' },
    role: {
      color: colors.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: 12,
    },
    name: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 4 },
    email: { fontSize: 14, color: colors.textMuted },
    themeSection: { width: '100%', marginTop: 32, gap: 10 },
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
      marginTop: 40,
      borderWidth: 1,
      borderColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 32,
      width: '100%',
      alignItems: 'center',
    },
    signOutText: { color: colors.danger, fontWeight: '700' },
  });
}
