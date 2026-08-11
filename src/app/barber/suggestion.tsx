import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { submitSuggestion, getFriendlyErrorMessage } from '@barber/shared';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

export default function SuggestionScreen() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    if (!profile) return;
    if (!title.trim() || !details.trim()) {
      Alert.alert(t('common.error'), t('suggestion.missing'));
      return;
    }
    setSending(true);
    try {
      await submitSuggestion({
        senderId: profile.uid,
        senderRole: 'barber',
        senderName: profile.name,
        shopId: profile.shopId ?? undefined,
        title,
        details,
      });
      Alert.alert(t('suggestion.sentTitle'), t('suggestion.sentMsg'), [{ text: t('common.save'), onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  const styles = getStyles(colors);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{t('suggestion.heading')}</Text>
      <Text style={styles.subheading}>{t('suggestion.subheading')}</Text>

      <Text style={styles.label}>{t('suggestion.titleLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('suggestion.titlePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>{t('suggestion.detailsLabel')}</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder={t('suggestion.detailsPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={details}
        onChangeText={setDetails}
        multiline
        textAlignVertical="top"
      />

      <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={sending}>
        {sending ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <Text style={styles.submitBtnText}>{t('suggestion.submit')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, gap: 6 },
    heading: { fontSize: 20, fontWeight: '800', color: colors.text },
    subheading: { color: colors.textMuted, marginBottom: 16 },
    label: { fontWeight: '700', color: colors.text, marginTop: 12, marginBottom: 6 },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.text,
    },
    textArea: { height: 160 },
    submitBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 24,
    },
    submitBtnText: { color: colors.primaryText, fontSize: 16, fontWeight: '700' },
  });
}
