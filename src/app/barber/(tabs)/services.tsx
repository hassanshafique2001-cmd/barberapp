import { useCallback, useState } from 'react';
import { View, Text, Image, Pressable, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  listServicesForBarber,
  deleteService,
  deleteServicePhoto,
  getFriendlyErrorMessage,
  type Service,
} from '@barber/shared';

export default function Services() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.shopId || !profile.uid) return;
    setLoading(true);
    setLoadError(null);
    try {
      setServices(await listServicesForBarber(profile.shopId, profile.uid));
    } catch (err: any) {
      setLoadError(getFriendlyErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [profile?.shopId, profile?.uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function remove(service: Service) {
    if (!profile?.shopId) return;
    Alert.alert(t('services.deleteTitle'), t('services.deleteMsg', { name: service.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('services.delete'),
        style: 'destructive',
        onPress: async () => {
          setDeletingId(service.id);
          try {
            await deleteService(profile.shopId!, service.id);
            if (service.photoUrl) await deleteServicePhoto(service.photoUrl);
            await load();
          } catch (err: any) {
            Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  const styles = getStyles(colors);

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.container}
        contentContainerStyle={[{ padding: 16 }, services.length === 0 && !loading && styles.emptyContentContainer]}
        data={services}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          loadError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{loadError}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>{t('services.emptyTitle')}</Text>
              <Text style={styles.emptySubtitle}>{t('services.emptySubtitle')}</Text>
            </View>
          ) : null
        }
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 24 }} /> : null}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.photoUrl ? (
              <Image source={{ uri: item.photoUrl }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.photoPlaceholderText}>✂️</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                <Text style={styles.price}>${item.price}</Text>
                <Text style={styles.metaDot}> · </Text>
                <Text style={styles.duration}>{item.durationMinutes} min</Text>
              </Text>
              {!!item.description && (
                <Text style={styles.description} numberOfLines={2}>
                  {item.description}
                </Text>
              )}
            </View>
            <View style={styles.iconColumn}>
              <Pressable
                style={styles.iconBubble}
                onPress={() => router.push({ pathname: '/barber/service-form', params: { serviceId: item.id } })}
                hitSlop={8}
              >
                <Feather name="edit-2" size={15} color={colors.accent} />
              </Pressable>
              <Pressable
                style={[styles.iconBubble, styles.iconBubbleDanger]}
                onPress={() => remove(item)}
                disabled={deletingId === item.id}
                hitSlop={8}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Feather name="trash-2" size={15} color={colors.danger} />
                )}
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/barber/select-service')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    emptyContentContainer: { flexGrow: 1, justifyContent: 'center' },
    emptyWrap: { alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    errorBanner: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      marginBottom: 12,
    },
    errorText: { color: colors.danger },
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
    photo: { width: 74, height: 74, borderRadius: 12 },
    photoPlaceholder: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    photoPlaceholderText: { fontSize: 26 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { marginTop: 2, fontSize: 14 },
    price: { color: colors.success, fontWeight: '700' },
    metaDot: { color: colors.textMuted },
    duration: { color: colors.accent, fontWeight: '700' },
    description: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
    iconColumn: { justifyContent: 'center', gap: 10 },
    iconBubble: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent + '1A',
    },
    iconBubbleDanger: { backgroundColor: colors.dangerBg },
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
    fabText: { color: colors.primaryText, fontSize: 30, fontWeight: '400', marginTop: -2 },
  });
}
