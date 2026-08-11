import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, Modal, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Calendar } from 'react-native-calendars';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  subscribeToBarberBookings,
  updateBookingStatus,
  ensureChat,
  formatTime12h,
  markBookingsViewed,
  getFriendlyErrorMessage,
  type Booking,
} from '@barber/shared';

type BookingFilter = 'pending' | 'confirmed' | 'completed';

export default function Bookings() {
  const { profile } = useAuth();
  const { colors, scheme } = useTheme();
  const { t } = useLanguage();
  const FILTERS: { key: BookingFilter; label: string; empty: string }[] = [
    { key: 'pending', label: t('bookings.pending'), empty: t('bookings.emptyPending') },
    { key: 'confirmed', label: t('bookings.confirmed'), empty: t('bookings.emptyConfirmed') },
    { key: 'completed', label: t('bookings.completed'), empty: t('bookings.emptyCompleted') },
  ];
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);
  const { filter: filterParam } = useLocalSearchParams<{ filter?: string }>();
  const [filter, setFilter] = useState<BookingFilter>('pending');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (filterParam === 'pending' || filterParam === 'confirmed' || filterParam === 'completed') {
      setFilter(filterParam);
    }
  }, [filterParam]);

  async function openChatWith(booking: Booking) {
    if (!profile?.uid || !profile.name) return;
    setOpeningChatId(booking.id);
    try {
      const chatId = await ensureChat({
        barberId: profile.uid,
        customerId: booking.customerId,
        shopId: booking.shopId,
        barberName: profile.name,
        customerName: booking.customerName,
      });
      router.push({ pathname: '/barber/chat-thread', params: { chatId, customerName: booking.customerName } });
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setOpeningChatId(null);
    }
  }

  useEffect(() => {
    if (!profile?.shopId || !profile.uid) return;
    setLoading(true);
    setLoadError(null);
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

  async function respond(booking: Booking, status: 'confirmed' | 'rejected' | 'cancelled' | 'completed') {
    setRespondingId(booking.id);
    try {
      await updateBookingStatus(booking.shopId, booking.id, status);
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setRespondingId(null);
    }
  }

  function confirmCancel(booking: Booking) {
    Alert.alert(t('bookings.cancelTitle'), t('bookings.cancelMsg', { name: booking.customerName }), [
      { text: t('bookings.no'), style: 'cancel' },
      { text: t('bookings.yesCancel'), style: 'destructive', onPress: () => respond(booking, 'cancelled') },
    ]);
  }

  useFocusEffect(
    useCallback(() => {
      if (!profile?.shopId) return;
      const unviewedIds = bookings.filter((b) => b.status === 'pending' && !b.viewedByBarber).map((b) => b.id);
      if (unviewedIds.length > 0) {
        markBookingsViewed(profile.shopId, unviewedIds).catch(() => {});
      }
    }, [profile?.shopId, bookings])
  );

  const pending = bookings.filter((b) => b.status === 'pending');
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const completed = bookings.filter((b) => b.status === 'completed');
  const listByFilter: Record<BookingFilter, Booking[]> = { pending, confirmed, completed };
  const countByFilter: Record<BookingFilter, number> = {
    pending: pending.length,
    confirmed: confirmed.length,
    completed: completed.length,
  };
  const activeList = listByFilter[filter];
  const activeMeta = FILTERS.find((f) => f.key === filter)!;

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    for (const b of confirmed) {
      marks[b.date] = { marked: true, dotColor: colors.accent };
    }
    if (selectedDate) {
      marks[selectedDate] = { ...(marks[selectedDate] ?? {}), selected: true, selectedColor: colors.accent };
    }
    return marks;
  }, [confirmed, selectedDate, colors.accent]);

  const selectedDateBookings = selectedDate ? confirmed.filter((b) => b.date === selectedDate) : [];

  function closeCalendar() {
    setCalendarVisible(false);
    setSelectedDate(null);
  }

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
    <View style={styles.container}>
      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      <View style={styles.segmentWrap}>
        <BlurView intensity={70} tint={blurTint} style={StyleSheet.absoluteFill} />
        {FILTERS.map((f, i) => (
          <View key={f.key} style={styles.segmentItem}>
            <Pressable style={styles.segmentBtn} onPress={() => setFilter(f.key)}>
              <Text style={[styles.segmentText, { color: colors.textMuted }, filter === f.key && { color: colors.accent }]}>
                {f.label} ({countByFilter[f.key]})
              </Text>
              {filter === f.key && <View style={[styles.segmentIndicator, { backgroundColor: colors.accent }]} />}
            </Pressable>
            {i < FILTERS.length - 1 && <View style={[styles.segmentDivider, { backgroundColor: colors.border }]} />}
          </View>
        ))}
      </View>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={[{ padding: 16 }, activeList.length === 0 && styles.emptyContentContainer]}
        data={activeList}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{activeMeta.empty}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.customerName}</Text>
            <Text style={styles.cardMeta}>{item.serviceName} — ${item.price}</Text>
            <Text style={styles.cardMeta}>
              {item.date} at {formatTime12h(item.timeSlot)}
            </Text>
            {filter === 'pending' && <Text style={styles.cardPhone}>{item.customerPhone}</Text>}

            <View style={styles.actionRow}>
              {filter === 'pending' && (
                <>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => respond(item, 'confirmed')}
                    disabled={respondingId === item.id}
                  >
                    {respondingId === item.id ? (
                      <ActivityIndicator color={colors.primaryText} size="small" />
                    ) : (
                      <Text style={styles.actionText}>{t('bookings.approve')}</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.danger }]}
                    onPress={() => respond(item, 'rejected')}
                    disabled={respondingId === item.id}
                  >
                    {respondingId === item.id ? (
                      <ActivityIndicator color={colors.primaryText} size="small" />
                    ) : (
                      <Text style={styles.actionText}>{t('bookings.reject')}</Text>
                    )}
                  </Pressable>
                </>
              )}

              {filter === 'confirmed' && (
                <>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.success }]}
                    onPress={() => respond(item, 'completed')}
                    disabled={respondingId === item.id}
                  >
                    {respondingId === item.id ? (
                      <ActivityIndicator color={colors.primaryText} size="small" />
                    ) : (
                      <Text style={styles.actionText}>{t('bookings.markCompleted')}</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.cancelBtn}
                    onPress={() => confirmCancel(item)}
                    disabled={respondingId === item.id}
                  >
                    {respondingId === item.id ? (
                      <ActivityIndicator color={colors.danger} size="small" />
                    ) : (
                      <Text style={styles.cancelText}>{t('bookings.cancel')}</Text>
                    )}
                  </Pressable>
                </>
              )}

              <Pressable
                style={styles.messageBtn}
                onPress={() => openChatWith(item)}
                disabled={openingChatId === item.id}
              >
                {openingChatId === item.id ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : (
                  <Ionicons name="chatbubble-outline" size={18} color={colors.accent} />
                )}
              </Pressable>
            </View>

            {filter === 'completed' && (
              <View style={styles.completedOverlay}>
                <BlurView intensity={35} tint={blurTint} style={StyleSheet.absoluteFill} />
                <Ionicons name="checkmark-circle" size={30} color={colors.success} />
                <Text style={styles.completedOverlayText}>{t('bookings.completedBadge')}</Text>
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={closeCalendar}>
        <Pressable style={styles.modalBackdrop} onPress={closeCalendar}>
          <Pressable style={styles.calendarCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.calendarHandle} />
            <Calendar
              current={new Date().toISOString().slice(0, 10)}
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              theme={{
                calendarBackground: 'transparent',
                dayTextColor: colors.text,
                monthTextColor: colors.text,
                textDisabledColor: colors.border,
                arrowColor: colors.accent,
                todayTextColor: colors.accent,
                selectedDayBackgroundColor: colors.accent,
                selectedDayTextColor: colors.primaryText,
                textSectionTitleColor: colors.textMuted,
              }}
            />

            <View style={styles.calendarDivider} />

            {selectedDate ? (
              <ScrollView style={styles.dayDetails}>
                <Text style={styles.dayDetailsTitle}>{selectedDate}</Text>
                {selectedDateBookings.length === 0 ? (
                  <Text style={styles.dayDetailsEmpty}>{t('bookings.noAppointmentsDate')}</Text>
                ) : (
                  selectedDateBookings.map((b) => (
                    <View key={b.id} style={styles.dayBookingRow}>
                      <Text style={styles.dayBookingName}>{b.customerName}</Text>
                      <Text style={styles.dayBookingMeta}>
                        {formatTime12h(b.timeSlot)} · {b.serviceName}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            ) : (
              <Text style={styles.dayDetailsHint}>{t('bookings.tapDateHint')}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <Pressable style={styles.fab} onPress={() => setCalendarVisible(true)}>
        <Ionicons name="calendar-outline" size={24} color={colors.primaryText} />
      </Pressable>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    errorBanner: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      margin: 16,
      marginBottom: 0,
    },
    errorText: { color: colors.danger },
    segmentWrap: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentItem: { flex: 1, flexDirection: 'row' },
    segmentBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
    segmentText: { fontSize: 13, fontWeight: '700' },
    segmentIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 2, borderRadius: 1 },
    segmentDivider: { width: 1, marginVertical: 10 },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
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
      gap: 2,
      position: 'relative',
      overflow: 'hidden',
    },
    completedOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    completedOverlayText: { fontSize: 15, fontWeight: '800', color: colors.success },
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    cardMeta: { color: colors.text },
    cardPhone: { color: colors.textMuted },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
    actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
    actionText: { color: '#fff', fontWeight: '600' },
    cancelBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.danger },
    cancelText: { color: colors.danger, fontWeight: '600' },
    messageBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent + '1A',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    calendarCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingTop: 10,
      paddingBottom: 16,
      paddingHorizontal: 12,
      maxHeight: '80%',
    },
    calendarHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 8,
    },
    calendarDivider: { height: 1, backgroundColor: colors.border, marginTop: 8 },
    dayDetails: { marginTop: 10, maxHeight: 180 },
    dayDetailsTitle: { fontWeight: '700', color: colors.text, marginBottom: 6 },
    dayDetailsEmpty: { color: colors.textMuted, fontStyle: 'italic' },
    dayDetailsHint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 12 },
    dayBookingRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: 8,
    },
    dayBookingName: { fontWeight: '700', color: colors.text },
    dayBookingMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  });
}
