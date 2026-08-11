import { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Linking, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { subscribeToBarberBookings, ensureChat, getFriendlyErrorMessage, type Booking } from '@barber/shared';

interface CustomerEntry {
  customerId: string;
  customerName: string;
  customerPhone: string;
}

export default function Customers() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.shopId || !profile.uid) return;
    const unsubscribe = subscribeToBarberBookings(
      profile.shopId,
      profile.uid,
      (data) => {
        setBookings(data);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsubscribe;
  }, [profile?.shopId, profile?.uid]);

  const customers = useMemo(() => {
    const seen = new Map<string, CustomerEntry>();
    for (const b of bookings) {
      if (!seen.has(b.customerId)) {
        seen.set(b.customerId, {
          customerId: b.customerId,
          customerName: b.customerName,
          customerPhone: b.customerPhone,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.customerName.localeCompare(b.customerName));
  }, [bookings]);

  function callCustomer(customer: CustomerEntry) {
    if (!customer.customerPhone) return;
    Linking.openURL(`tel:${customer.customerPhone}`).catch(() => {});
  }

  async function messageCustomer(customer: CustomerEntry) {
    if (!profile?.uid || !profile.name || !profile.shopId) return;
    setOpeningChatId(customer.customerId);
    try {
      const chatId = await ensureChat({
        barberId: profile.uid,
        customerId: customer.customerId,
        shopId: profile.shopId,
        barberName: profile.name,
        customerName: customer.customerName,
      });
      router.push({ pathname: '/barber/chat-thread', params: { chatId, customerName: customer.customerName } });
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setOpeningChatId(null);
    }
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
      <FlatList
        contentContainerStyle={[{ padding: 16 }, customers.length === 0 && styles.emptyContentContainer]}
        data={customers}
        keyExtractor={(item) => item.customerId}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t('customers.emptyTitle')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color={colors.accent} />
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {item.customerName}
            </Text>
            <View style={styles.actionColumn}>
              <Pressable style={styles.iconBubble} onPress={() => callCustomer(item)} hitSlop={6}>
                <Ionicons name="call-outline" size={15} color={colors.success} />
              </Pressable>
              <Pressable
                style={[styles.iconBubble, styles.iconBubbleAccent]}
                onPress={() => messageCustomer(item)}
                disabled={openingChatId === item.customerId}
                hitSlop={6}
              >
                {openingChatId === item.customerId ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Ionicons name="chatbubble-outline" size={15} color={colors.accent} />
                )}
              </Pressable>
            </View>
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
    emptyContentContainer: { flexGrow: 1, justifyContent: 'center' },
    emptyWrap: { alignItems: 'center' },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.textMuted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.accent + '1A',
      alignItems: 'center',
      justifyContent: 'center',
    },
    name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
    actionColumn: { gap: 8 },
    iconBubble: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.success + '1A',
    },
    iconBubbleAccent: { backgroundColor: colors.accent + '1A' },
  });
}
