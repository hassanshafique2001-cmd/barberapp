import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { subscribeToBarberChats, type Chat } from '@barber/shared';

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function Chats() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToBarberChats(profile.uid, (data) => {
      setChats(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [profile?.uid]);

  function openChat(chat: Chat) {
    router.push({
      pathname: '/barber/chat-thread',
      params: { chatId: chat.id, customerName: chat.customerName },
    });
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
        contentContainerStyle={[{ padding: 16 }, chats.length === 0 && styles.emptyContentContainer]}
        data={chats}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t('chats.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('chats.emptySubtitle')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => openChat(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.customerName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.customerName}</Text>
                <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
              </View>
              <Text style={styles.preview} numberOfLines={1}>
                {item.lastMessage || t('chats.sayHello')}
              </Text>
            </View>
            {item.unreadForBarber > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadForBarber}</Text>
              </View>
            )}
          </Pressable>
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
    emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    emptySubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    row: {
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
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: colors.primaryText, fontWeight: '700', fontSize: 17 },
    rowTop: { flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontSize: 15, fontWeight: '700', color: colors.text },
    time: { fontSize: 11, color: colors.textMuted },
    preview: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  });
}
