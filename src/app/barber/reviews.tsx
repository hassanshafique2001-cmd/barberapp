import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { StarRating } from '@/components/StarRating';
import { subscribeToBarberReviews, getRatingStats, type Review } from '@barber/shared';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Reviews() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToBarberReviews(profile.uid, (data) => {
      setReviews(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.uid]);

  const stats = getRatingStats(reviews);
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
      <View style={styles.summaryCard}>
        <StarRating average={stats.average} count={stats.count} size={20} />
      </View>
      <FlatList
        contentContainerStyle={[{ padding: 16 }, reviews.length === 0 && styles.emptyContentContainer]}
        data={reviews}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t('reviews.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('reviews.emptySubtitle')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <Text style={styles.name}>{item.customerName}</Text>
              <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
            </View>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Ionicons
                  key={i}
                  name={i <= item.rating ? 'star' : 'star-outline'}
                  size={16}
                  color={colors.accent}
                />
              ))}
            </View>
            <Text style={styles.service}>{item.serviceName}</Text>
            <Text style={styles.comment}>{item.comment || t('reviews.noComment')}</Text>
          </View>
        )}
      />
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    summaryCard: {
      margin: 16,
      marginBottom: 0,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    emptyContentContainer: { flexGrow: 1, justifyContent: 'center' },
    emptyWrap: { alignItems: 'center' },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
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
    name: { fontSize: 15, fontWeight: '700', color: colors.text },
    time: { fontSize: 11, color: colors.textMuted },
    starsRow: { flexDirection: 'row', gap: 2 },
    service: { fontSize: 12, color: colors.accent, fontWeight: '600' },
    comment: { color: colors.text, fontSize: 14 },
  });
}
