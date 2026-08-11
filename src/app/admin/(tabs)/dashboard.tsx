import { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { listShops, listAllBarbers, countCustomers, getFriendlyErrorMessage, type Shop, type UserProfile } from '@barber/shared';
import { useTheme } from '@/context/ThemeContext';
import { MiniBarChart } from '@/components/MiniBarChart';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function bucketByMonth(items: { createdAt?: number }[], year: number) {
  const counts = new Array(12).fill(0);
  for (const item of items) {
    if (!item.createdAt) continue;
    const d = new Date(item.createdAt);
    if (d.getFullYear() === year) counts[d.getMonth()]++;
  }
  return MONTH_LABELS.map((label, i) => ({ label, value: counts[i] }));
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [shops, setShops] = useState<Shop[]>([]);
  const [barbers, setBarbers] = useState<UserProfile[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [shopList, barberList, customers] = await Promise.all([
        listShops(),
        listAllBarbers(),
        countCustomers(),
      ]);
      setShops(shopList);
      setBarbers(barberList);
      setCustomerCount(customers);
    } catch (err: any) {
      setLoadError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const activeBarbers = barbers.filter((b) => b.isActive).length;
  const inactiveBarbers = barbers.length - activeBarbers;
  const year = new Date().getFullYear();

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      <View style={styles.grid}>
        <View style={[styles.statCard, { backgroundColor: colors.primary }]}>
          <Text style={[styles.statValue, { color: colors.primaryText }]}>{shops.length}</Text>
          <Text style={[styles.statLabel, { color: colors.primaryText }]}>Total Shops</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.accent }]}>
          <Text style={[styles.statValue, { color: colors.primaryText }]}>{barbers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.primaryText }]}>Total Barbers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.success }]}>
          <Text style={[styles.statValue, { color: colors.primaryText }]}>{activeBarbers}</Text>
          <Text style={[styles.statLabel, { color: colors.primaryText }]}>Active Barbers</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.danger }]}>
          <Text style={[styles.statValue, { color: colors.primaryText }]}>{inactiveBarbers}</Text>
          <Text style={[styles.statLabel, { color: colors.primaryText }]}>Inactive Barbers</Text>
        </View>
      </View>

      <View style={[styles.statCard, styles.wideCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
        <Text style={[styles.statValue, { color: colors.text }]}>{customerCount}</Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Customers of the App</Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Shops Created ({year})</Text>
        <MiniBarChart
          data={bucketByMonth(shops, year)}
          color={colors.primary}
          textColor={colors.text}
          textMutedColor={colors.textMuted}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Barbers Added ({year})</Text>
        <MiniBarChart
          data={bucketByMonth(barbers, year)}
          color={colors.accent}
          textColor={colors.text}
          textMutedColor={colors.textMuted}
        />
      </View>
    </ScrollView>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    errorBanner: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
    },
    errorText: { color: colors.danger },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flexBasis: '47%',
      flexGrow: 1,
      borderRadius: 12,
      paddingVertical: 18,
      alignItems: 'center',
    },
    wideCard: { flexBasis: '100%' },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, marginTop: 4, textAlign: 'center' },
    chartCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      gap: 10,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  });
}
