import { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { MiniBarChart } from '@/components/MiniBarChart';
import {
  subscribeToBarberBookings,
  listServicesForBarber,
  getShop,
  getFriendlyErrorMessage,
  type Booking,
  type Service,
} from '@barber/shared';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function bucketByMonth(items: { createdAt: number }[], year: number) {
  const counts = new Array(12).fill(0);
  for (const item of items) {
    const d = new Date(item.createdAt);
    if (d.getFullYear() === year) counts[d.getMonth()]++;
  }
  return MONTH_LABELS.map((label, i) => ({ label, value: counts[i] }));
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { colors, scheme } = useTheme();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [shopName, setShopName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.shopId) return;
    getShop(profile.shopId)
      .then((shop) => setShopName(shop?.name ?? null))
      .catch(() => {});
  }, [profile?.shopId]);

  useEffect(() => {
    if (!profile?.shopId || !profile.uid) return;
    const unsubscribe = subscribeToBarberBookings(
      profile.shopId,
      profile.uid,
      (data) => {
        setBookings(data);
        setLoading(false);
      },
      (err) => {
        setLoadError(getFriendlyErrorMessage(err));
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [profile?.shopId, profile?.uid]);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.shopId || !profile.uid) return;
      listServicesForBarber(profile.shopId, profile.uid)
        .then(setServices)
        .catch(() => {});
    }, [profile?.shopId, profile?.uid])
  );

  const totalCustomers = new Set(bookings.map((b) => b.customerId)).size;
  const totalAppointments = bookings.filter((b) => b.status === 'confirmed').length;
  const totalServices = services.length;
  const rejectedBookings = bookings.filter((b) => b.status === 'rejected');
  const year = new Date().getFullYear();

  const styles = getStyles(colors);
  const blurTint = scheme === 'dark' ? 'dark' : 'light';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {!!shopName && (
        <View style={styles.shopBanner}>
          <Ionicons name="storefront" size={26} color={colors.accent} />
          <Text style={styles.shopBannerText}>{shopName}</Text>
        </View>
      )}

      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      <View style={styles.grid}>
        <View style={styles.statCard}>
          <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[colors.primary + 'B3', colors.accent + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable style={styles.eyeBtn} onPress={() => router.push('/barber/customers')} hitSlop={8}>
            <Ionicons name="eye-outline" size={16} color="#fff" />
          </Pressable>
          <Text style={styles.statValue}>{totalCustomers}</Text>
          <Text style={styles.statLabel}>{t('dashboard.totalCustomers')}</Text>
        </View>
        <View style={styles.statCard}>
          <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[colors.accent + 'B3', colors.success + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Pressable
            style={styles.eyeBtn}
            onPress={() => router.push({ pathname: '/barber/bookings', params: { filter: 'confirmed' } })}
            hitSlop={8}
          >
            <Ionicons name="eye-outline" size={16} color="#fff" />
          </Pressable>
          <Text style={styles.statValue}>{totalAppointments}</Text>
          <Text style={styles.statLabel}>{t('dashboard.appointmentsBooked')}</Text>
        </View>
        <View style={[styles.statCard, styles.wideCard]}>
          <BlurView intensity={60} tint={blurTint} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[colors.success + 'B3', colors.primary + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.statValue}>{totalServices}</Text>
          <Text style={styles.statLabel}>{t('dashboard.activeServices')}</Text>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>{t('dashboard.monthlyAppointments')} ({year})</Text>
        <MiniBarChart
          data={bucketByMonth(bookings, year)}
          color={colors.accent}
          textColor={colors.text}
          textMutedColor={colors.textMuted}
        />
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>{t('dashboard.rejectedBookings')} ({year})</Text>
        <MiniBarChart
          data={bucketByMonth(rejectedBookings, year)}
          color={colors.danger}
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
    shopBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      backgroundColor: colors.accent + '1A',
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    shopBannerText: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: 0.3 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    statCard: {
      flexBasis: '47%',
      flexGrow: 1,
      borderRadius: 16,
      paddingVertical: 22,
      alignItems: 'center',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    wideCard: { flexBasis: '100%' },
    eyeBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
    statValue: { fontSize: 30, fontWeight: '800', color: '#ffffff' },
    statLabel: { fontSize: 13, marginTop: 4, textAlign: 'center', color: '#ffffff' },
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
