import { useEffect, useState } from 'react';
import { View, Text, Image, Pressable, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { FormField } from '@/components/FormField';
import {
  getService,
  getCatalogItem,
  createService,
  updateService,
  uploadServicePhoto,
  deleteServicePhoto,
  getFriendlyErrorMessage,
} from '@barber/shared';

const HERO_HEIGHT = 200;
const AVATAR_SIZE = 96;

export default function ServiceForm() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { serviceId, catalogId } = useLocalSearchParams<{
    serviceId?: string;
    catalogId?: string;
  }>();
  const isEditing = !!serviceId;
  const isFromCatalog = !isEditing && !!catalogId;
  const isLocked = isEditing || isFromCatalog;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditing || isFromCatalog);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing && profile?.shopId && serviceId) {
      getService(profile.shopId, serviceId)
        .then((service) => {
          if (!service) return;
          setName(service.name);
          setDescription(service.description ?? '');
          setPrice(String(service.price));
          setDuration(String(service.durationMinutes));
          setExistingPhotoUrl(service.photoUrl ?? null);
        })
        .finally(() => setLoading(false));
      return;
    }
    if (isFromCatalog && catalogId) {
      getCatalogItem(catalogId)
        .then((item) => {
          if (!item) return;
          setName(item.name);
          setDescription(item.description ?? '');
          setExistingPhotoUrl(item.photoUrl ?? null);
        })
        .finally(() => setLoading(false));
    }
  }, [isEditing, isFromCatalog, profile?.shopId, serviceId, catalogId]);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('serviceForm.permissionNeeded'), t('serviceForm.permissionMsg'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleSave() {
    if (!profile?.shopId || !profile.uid) return;
    const priceNum = Number(price);
    const durationNum = Number(duration);
    if (!name.trim() || !priceNum || priceNum <= 0 || !durationNum || durationNum <= 0) {
      Alert.alert(t('serviceForm.missingDetails'), t('serviceForm.missingDetailsMsg'));
      return;
    }
    setSaving(true);
    try {
      let photoUrl = existingPhotoUrl ?? undefined;
      if (photoUri) {
        photoUrl = await uploadServicePhoto(profile.shopId, profile.uid, photoUri);
        if (existingPhotoUrl) await deleteServicePhoto(existingPhotoUrl);
      }

      if (isEditing && serviceId) {
        await updateService(profile.shopId, serviceId, {
          name: name.trim(),
          description: description.trim(),
          price: priceNum,
          durationMinutes: durationNum,
          ...(photoUrl ? { photoUrl } : {}),
        });
      } else {
        await createService(profile.shopId, {
          barberId: profile.uid,
          name: name.trim(),
          description: description.trim() || undefined,
          price: priceNum,
          durationMinutes: durationNum,
          ...(photoUrl ? { photoUrl } : {}),
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert(t('common.error'), getFriendlyErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const styles = getStyles(colors);
  const displayedPhoto = photoUri ?? existingPhotoUrl;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {displayedPhoto ? (
        <Image source={{ uri: displayedPhoto }} style={styles.hero} blurRadius={22} resizeMode="cover" />
      ) : (
        <View style={[styles.hero, styles.heroFallback]} />
      )}
      <View style={styles.heroOverlay} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
            {displayedPhoto ? (
              <Image source={{ uri: displayedPhoto }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarPlaceholderText}>📷</Text>
              </View>
            )}
          </Pressable>

          {isLocked ? (
            <View style={styles.readonlyField}>
              <Text style={styles.readonlyLabel}>{t('serviceForm.serviceNameReadonly')}</Text>
              <Text style={styles.readonlyValue}>{name}</Text>
            </View>
          ) : (
            <FormField
              label={t('serviceForm.serviceName')}
              placeholder={t('serviceForm.namePlaceholder')}
              colors={colors}
              value={name}
              onChangeText={setName}
            />
          )}

          {isLocked ? (
            !!description && (
              <View style={styles.readonlyField}>
                <Text style={styles.readonlyLabel}>{t('serviceForm.description')}</Text>
                <Text style={styles.readonlyValueMuted}>{description}</Text>
              </View>
            )
          ) : (
            <FormField
              label={t('serviceForm.descriptionLabel')}
              placeholder={t('serviceForm.descriptionPlaceholder')}
              colors={colors}
              multiline
              textAlignVertical="top"
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
            />
          )}

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <FormField
                label={t('serviceForm.price')}
                placeholder="25"
                colors={colors}
                keyboardType="numeric"
                style={styles.bubbleInput}
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={{ flex: 1 }}>
              <FormField
                label={t('serviceForm.duration')}
                placeholder="30"
                colors={colors}
                keyboardType="numeric"
                style={styles.bubbleInput}
                value={duration}
                onChangeText={setDuration}
              />
            </View>
          </View>

          <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={styles.saveBtnText}>{isEditing ? t('serviceForm.update') : t('serviceForm.add')}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
    hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT },
    heroFallback: { backgroundColor: colors.border },
    heroOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: HERO_HEIGHT,
      backgroundColor: 'rgba(0,0,0,0.18)',
    },
    scrollContent: { paddingTop: HERO_HEIGHT / 2, paddingBottom: 32 },
    card: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 14,
      minHeight: 400,
    },
    avatarWrap: { marginTop: -(AVATAR_SIZE / 2) },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 4,
      borderColor: colors.card,
    },
    avatarPlaceholder: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    avatarPlaceholderText: { fontSize: 28 },
    readonlyField: {
      width: '100%',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: 14,
      padding: 12,
    },
    readonlyLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
    readonlyValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    readonlyValueMuted: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    descriptionInput: { height: 70, textAlignVertical: 'top', width: '100%' },
    row: { flexDirection: 'row', gap: 12, width: '100%' },
    bubbleInput: { borderRadius: 999, textAlign: 'center' },
    saveBtn: {
      backgroundColor: colors.primary,
      paddingHorizontal: 40,
      paddingVertical: 12,
      borderRadius: 999,
      alignItems: 'center',
      alignSelf: 'center',
      marginTop: 8,
    },
    saveBtnText: { color: colors.primaryText, fontWeight: '600' },
  });
}
