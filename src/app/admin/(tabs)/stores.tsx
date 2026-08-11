import { useCallback, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { listShops, listBarbersForShop, getFriendlyErrorMessage, type Shop, type UserProfile } from '@barber/shared';
import { useTheme } from '@/context/ThemeContext';

export default function Stores() {
  const { colors } = useTheme();
  const [shops, setShops] = useState<Shop[]>([]);
  const [barbersByShop, setBarbersByShop] = useState<Record<string, UserProfile[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const list = await listShops();
      setShops(list);
      const entries = await Promise.all(
        list.map(async (shop) => [shop.id, await listBarbersForShop(shop.id)] as const)
      );
      setBarbersByShop(Object.fromEntries(entries));
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

  const styles = getStyles(colors);

  return (
    <View style={styles.screen}>
      <FlatList
        style={styles.container}
        contentContainerStyle={{ padding: 16 }}
        data={shops}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 12 }}>
            {loadError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{loadError}</Text>
              </View>
            )}
            <Text style={styles.sectionTitle}>All Shops</Text>
          </View>
        }
        ListEmptyComponent={!loading ? <Text style={styles.empty}>No shops yet — tap + to create one.</Text> : null}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 24 }} /> : null}
        renderItem={({ item }) => {
          const barbers = barbersByShop[item.id] ?? [];
          const activeCount = barbers.filter((b) => b.isActive).length;
          return (
            <Pressable
              style={[styles.shopCard, { borderLeftColor: item.primaryColor ?? colors.accent }]}
              onPress={() => router.push({ pathname: '/admin/shop-detail', params: { shopId: item.id } })}
            >
              <View style={[styles.shopIcon, { backgroundColor: item.primaryColor ?? colors.accent }]}>
                <Text style={styles.shopIconText}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{item.name}</Text>
                <Text style={styles.shopCode}>Code: {item.shopCode}</Text>
                <Text style={styles.shopMeta}>
                  {barbers.length} barber{barbers.length === 1 ? '' : 's'} · {activeCount} active
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          );
        }}
      />

      <Pressable style={styles.fab} onPress={() => router.push('/admin/create-shop')}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    empty: { color: colors.textMuted, fontStyle: 'italic' },
    errorBanner: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
    },
    errorText: { color: colors.danger },
    shopCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 5,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    shopIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shopIconText: { color: colors.primaryText, fontWeight: '700', fontSize: 16 },
    shopName: { fontSize: 16, fontWeight: '700', color: colors.text },
    shopCode: { color: colors.textMuted, marginTop: 2 },
    shopMeta: { color: colors.textMuted, marginTop: 2, fontSize: 12 },
    chevron: { fontSize: 24, color: colors.textMuted },
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
