import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { HeaderLogoTitle } from '@/components/HeaderLogoTitle';
import { subscribeToBarberChats, subscribeToBarberBookings } from '@barber/shared';

function ChatHeaderButton() {
  const { profile } = useAuth();
  const { colors } = useTheme();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsubscribe = subscribeToBarberChats(profile.uid, (chats) => {
      setUnread(chats.reduce((sum, c) => sum + c.unreadForBarber, 0));
    });
    return unsubscribe;
  }, [profile?.uid]);

  return (
    <Pressable style={styles.chatBtn} onPress={() => router.push('/barber/chats')} hitSlop={10}>
      <Ionicons name="chatbubbles" size={22} color={colors.text} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      )}
    </Pressable>
  );
}

function useHasUnviewedPending() {
  const { profile } = useAuth();
  const [hasUnviewed, setHasUnviewed] = useState(false);

  useEffect(() => {
    if (!profile?.shopId || !profile.uid) return;
    const unsubscribe = subscribeToBarberBookings(profile.shopId, profile.uid, (bookings) => {
      setHasUnviewed(bookings.some((b) => b.status === 'pending' && !b.viewedByBarber));
    });
    return unsubscribe;
  }, [profile?.shopId, profile?.uid]);

  return hasUnviewed;
}

export default function BarberTabsLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const hasUnviewedPending = useHasUnviewedPending();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTitle: () => <HeaderLogoTitle color={colors.text} />,
        headerRight: () => <ChatHeaderButton />,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t('tabs.services'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t('tabs.bookings'),
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="calendar" size={size} color={color} />
              {hasUnviewedPending && <View style={styles.tabDot} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  chatBtn: { marginRight: 16, padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0342b',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  tabDot: {
    position: 'absolute',
    top: -1,
    right: -6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#2ecc71',
  },
});
