import { useCallback, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, FlatList, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { listServiceCatalog, listServicesForBarber, getFriendlyErrorMessage, type ServiceCatalogItem } from '@barber/shared';

export default function SelectService() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [items, setItems] = useState<ServiceCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const load = useCallback(async () => {
    if (!profile?.shopId || !profile.uid) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [catalog, ownServices] = await Promise.all([
        listServiceCatalog(),
        listServicesForBarber(profile.shopId, profile.uid),
      ]);
      const alreadyAddedNames = new Set(ownServices.map((s) => s.name.toLowerCase()));
      setItems(catalog.filter((item) => !alreadyAddedNames.has(item.name.toLowerCase())));
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

  function pick(item: ServiceCatalogItem) {
    router.push({
      pathname: '/barber/service-form',
      params: { catalogId: item.id },
    });
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.name.toLowerCase().includes(q));
  }, [items, searchQuery]);

  const styles = getStyles(colors);

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => {
                setShowSearch((prev) => !prev);
                setSearchQuery('');
              }}
              hitSlop={10}
            >
              <Text style={styles.searchIcon}>{showSearch ? '✕' : '🔍'}</Text>
            </Pressable>
          ),
        }}
      />

      <Pressable style={styles.customBtn} onPress={() => router.push('/barber/service-form')}>
        <Text style={styles.customBtnText}>{t('selectService.addOwn')}</Text>
      </Pressable>

      {showSearch && (
        <View style={styles.searchRow}>
          <TextInput
            autoFocus
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('selectService.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>
      )}

      {loadError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, paddingTop: 4 }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {searchQuery ? t('selectService.emptySearch') : t('selectService.emptyDefault')}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => pick(item)}>
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Text style={styles.photoPlaceholderText}>✂️</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                {!!item.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    customBtn: {
      margin: 16,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
    },
    customBtnText: { color: colors.primary, fontWeight: '700' },
    searchIcon: { fontSize: 18, color: colors.text, paddingHorizontal: 4 },
    searchRow: { paddingHorizontal: 16, marginBottom: 4 },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 15,
      color: colors.text,
    },
    errorBanner: {
      marginHorizontal: 16,
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
    },
    errorText: { color: colors.danger },
    empty: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center', marginTop: 24 },
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
    photo: { width: 52, height: 52, borderRadius: 8 },
    photoPlaceholder: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    photoPlaceholderText: { fontSize: 20 },
    name: { fontSize: 16, fontWeight: '700', color: colors.text },
    description: { color: colors.textMuted, marginTop: 2, fontSize: 12 },
    chevron: { fontSize: 22, color: colors.textMuted },
  });
}
