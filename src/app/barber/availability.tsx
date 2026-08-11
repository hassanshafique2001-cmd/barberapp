import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getAvailability, setAvailability, getFriendlyErrorMessage, type WorkingHours } from '@barber/shared';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { FormField } from '@/components/FormField';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function defaultHours(): WorkingHours {
  const hours: WorkingHours = {};
  for (let d = 0; d < 7; d++) {
    hours[d] = d === 0 ? null : { start: '09:00', end: '17:00' };
  }
  return hours;
}

export default function Availability() {
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const WEEKDAYS = [
    t('availability.sunday'),
    t('availability.monday'),
    t('availability.tuesday'),
    t('availability.wednesday'),
    t('availability.thursday'),
    t('availability.friday'),
    t('availability.saturday'),
  ];
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultHours());
  const [slotDuration, setSlotDuration] = useState('30');
  const [blockedDatesText, setBlockedDatesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!profile?.shopId || !profile.uid) return;
      let cancelled = false;
      setLoading(true);
      setLoadError(null);
      getAvailability(profile.shopId, profile.uid)
        .then((existing) => {
          if (cancelled) return;
          if (existing) {
            setWorkingHours(existing.workingHours);
            setSlotDuration(String(existing.slotDurationMinutes));
            setBlockedDatesText(existing.blockedDates.join(', '));
          }
        })
        .catch((err) => {
          if (!cancelled) setLoadError(getFriendlyErrorMessage(err));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [profile?.shopId, profile?.uid])
  );

  function toggleDay(day: number, enabled: boolean) {
    setWorkingHours((prev) => ({
      ...prev,
      [day]: enabled ? prev[day] ?? { start: '09:00', end: '17:00' } : null,
    }));
  }

  function updateTime(day: number, field: 'start' | 'end', value: string) {
    setWorkingHours((prev) => {
      const current = prev[day];
      if (!current) return prev;
      return { ...prev, [day]: { ...current, [field]: value } };
    });
  }

  async function handleSave() {
    if (!profile?.shopId || !profile.uid) return;
    const duration = Number(slotDuration);
    if (!duration || duration <= 0) {
      Alert.alert(t('availability.invalidDuration'), t('availability.invalidDurationMsg'));
      return;
    }

    for (const [day, hours] of Object.entries(workingHours)) {
      if (!hours) continue;
      if (!TIME_PATTERN.test(hours.start) || !TIME_PATTERN.test(hours.end)) {
        Alert.alert(t('availability.invalidTime'), `${WEEKDAYS[Number(day)]}: times must be in HH:mm format (e.g. 09:00).`);
        return;
      }
      if (hours.start >= hours.end) {
        Alert.alert(t('availability.invalidTime'), `${WEEKDAYS[Number(day)]}: start time must be before end time.`);
        return;
      }
    }

    const blockedDates = blockedDatesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSaving(true);
    try {
      await setAvailability(profile.shopId, profile.uid, {
        barberId: profile.uid,
        shopId: profile.shopId,
        workingHours,
        slotDurationMinutes: duration,
        blockedDates,
      });
      Alert.alert(t('availability.saved'), t('availability.savedMsg'));
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
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
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, gap: 12 }}>
      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      <FormField
        label={t('availability.slotDuration')}
        placeholder="e.g. 30"
        colors={colors}
        keyboardType="numeric"
        value={slotDuration}
        onChangeText={setSlotDuration}
      />

      <Text style={styles.sectionTitle}>{t('availability.workingHours')}</Text>
      {WEEKDAYS.map((label, day) => {
        const hours = workingHours[day];
        return (
          <View key={day} style={styles.dayRow}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayLabel}>{label}</Text>
              <Switch value={!!hours} onValueChange={(v) => toggleDay(day, v)} />
            </View>
            {hours && (
              <View style={styles.timeRow}>
                <View style={styles.timeInput}>
                  <FormField
                    label={t('availability.startTime')}
                    placeholder="e.g. 09:00"
                    colors={colors}
                    value={hours.start}
                    onChangeText={(v) => updateTime(day, 'start', v)}
                  />
                </View>
                <Text style={styles.toLabel}>{t('availability.to')}</Text>
                <View style={styles.timeInput}>
                  <FormField
                    label={t('availability.endTime')}
                    placeholder="e.g. 17:00"
                    colors={colors}
                    value={hours.end}
                    onChangeText={(v) => updateTime(day, 'end', v)}
                  />
                </View>
              </View>
            )}
          </View>
        );
      })}

      <FormField
        label={t('availability.blockedDates')}
        placeholder="e.g. 2026-08-14, 2026-12-25"
        colors={colors}
        value={blockedDatesText}
        onChangeText={setBlockedDatesText}
      />

      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveBtnText}>{saving ? t('availability.saving') : t('availability.save')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 8, color: colors.text },
    errorBanner: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
    },
    errorText: { color: colors.danger },
    dayRow: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, gap: 6 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dayLabel: { fontWeight: '600', color: colors.text },
    timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    timeInput: { flex: 1 },
    toLabel: { color: colors.textMuted, paddingBottom: 10 },
    saveBtn: { backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    saveBtnText: { color: colors.primaryText, fontWeight: '600' },
  });
}
