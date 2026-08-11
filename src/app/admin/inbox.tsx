import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  subscribeToSuggestions,
  subscribeToAccountDeletionRequests,
  markSuggestionsViewed,
  markDeletionRequestsViewed,
  markDeletionRequestHandled,
  type Suggestion,
  type AccountDeletionRequest,
} from '@barber/shared';

type InboxTab = 'suggestions' | 'deletion';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export default function AdminInbox() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [tab, setTab] = useState<InboxTab>('suggestions');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubSuggestions = subscribeToSuggestions((items) => {
      setSuggestions(items);
      setLoading(false);
    });
    const unsubRequests = subscribeToAccountDeletionRequests((items) => {
      setRequests(items);
      setLoading(false);
    });
    return () => {
      unsubSuggestions();
      unsubRequests();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unviewedSuggestionIds = suggestions.filter((s) => !s.viewedByAdmin).map((s) => s.id);
      const unviewedRequestIds = requests.filter((r) => !r.viewedByAdmin).map((r) => r.id);
      if (unviewedSuggestionIds.length > 0) markSuggestionsViewed(unviewedSuggestionIds).catch(() => {});
      if (unviewedRequestIds.length > 0) markDeletionRequestsViewed(unviewedRequestIds).catch(() => {});
    }, [suggestions, requests])
  );

  async function handleMarkHandled(id: string) {
    await markDeletionRequestHandled(id);
  }

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.segmentWrap}>
        <Pressable style={styles.segmentBtn} onPress={() => setTab('suggestions')}>
          <Text style={[styles.segmentText, { color: colors.textMuted }, tab === 'suggestions' && { color: colors.accent }]}>
            {t('admin.suggestionsTab')} ({suggestions.length})
          </Text>
          {tab === 'suggestions' && <View style={[styles.segmentIndicator, { backgroundColor: colors.accent }]} />}
        </Pressable>
        <View style={[styles.segmentDivider, { backgroundColor: colors.border }]} />
        <Pressable style={styles.segmentBtn} onPress={() => setTab('deletion')}>
          <Text style={[styles.segmentText, { color: colors.textMuted }, tab === 'deletion' && { color: colors.accent }]}>
            {t('admin.deletionRequestsTab')} ({requests.length})
          </Text>
          {tab === 'deletion' && <View style={[styles.segmentIndicator, { backgroundColor: colors.accent }]} />}
        </Pressable>
      </View>

      {tab === 'suggestions' ? (
        <FlatList
          contentContainerStyle={[{ padding: 16 }, suggestions.length === 0 && styles.emptyContentContainer]}
          data={suggestions}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{t('admin.emptySuggestions')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.senderLine}>
                {item.senderName} · {item.senderRole === 'barber' ? t('admin.fromBarber') : t('admin.fromCustomer')}
              </Text>
              <Text style={styles.details}>{item.details}</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          contentContainerStyle={[{ padding: 16 }, requests.length === 0 && styles.emptyContentContainer]}
          data={requests}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{t('admin.emptyDeletionRequests')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle}>{item.senderName}</Text>
                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
              </View>
              <Text style={styles.senderLine}>
                {item.senderRole === 'barber' ? t('admin.fromBarber') : t('admin.fromCustomer')}
                {!!item.email && ` · ${item.email}`}
                {!!item.phone && ` · ${item.phone}`}
              </Text>
              <View style={styles.rowTop}>
                <Text style={[styles.statusBadge, item.status === 'handled' ? styles.statusHandled : styles.statusPending]}>
                  {item.status === 'handled' ? t('admin.handled') : t('admin.pending')}
                </Text>
                {item.status !== 'handled' && (
                  <Pressable style={styles.handleBtn} onPress={() => handleMarkHandled(item.id)}>
                    <Text style={styles.handleBtnText}>{t('admin.markHandled')}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    segmentWrap: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    segmentText: { fontSize: 13, fontWeight: '700' },
    segmentIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, borderRadius: 1 },
    segmentDivider: { width: 1, marginVertical: 10 },
    emptyContentContainer: { flexGrow: 1, justifyContent: 'center' },
    emptyWrap: { alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
    card: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
      gap: 6,
    },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
    time: { fontSize: 11, color: colors.textMuted },
    senderLine: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    details: { color: colors.text, fontSize: 14 },
    statusBadge: { fontSize: 11, fontWeight: '700', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 6, overflow: 'hidden' },
    statusPending: { color: colors.danger, backgroundColor: colors.dangerBg },
    statusHandled: { color: colors.success, backgroundColor: colors.success + '1A' },
    handleBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: colors.primary },
    handleBtnText: { color: colors.primaryText, fontWeight: '700', fontSize: 12 },
  });
}
