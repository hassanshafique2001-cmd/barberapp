import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { Text, View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { HeaderLogoTitle } from '@/components/HeaderLogoTitle';
import { subscribeToSuggestions, subscribeToAccountDeletionRequests } from '@barber/shared';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;
}

function AdminNotificationBell() {
  const { colors } = useTheme();
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [suggestionsUnviewed, setSuggestionsUnviewed] = useState(0);
  const [requestsUnviewed, setRequestsUnviewed] = useState(0);

  useEffect(() => {
    const unsubSuggestions = subscribeToSuggestions((items) => {
      setSuggestionsUnviewed(items.filter((s) => !s.viewedByAdmin).length);
    });
    const unsubRequests = subscribeToAccountDeletionRequests((items) => {
      setRequestsUnviewed(items.filter((r) => !r.viewedByAdmin).length);
    });
    return () => {
      unsubSuggestions();
      unsubRequests();
    };
  }, []);

  useEffect(() => {
    setUnviewedCount(suggestionsUnviewed + requestsUnviewed);
  }, [suggestionsUnviewed, requestsUnviewed]);

  return (
    <Pressable style={styles.bellBtn} onPress={() => router.push('/admin/inbox')} hitSlop={10}>
      <Ionicons name="notifications" size={22} color={colors.text} />
      {unviewedCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unviewedCount > 9 ? '9+' : unviewedCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

export default function AdminTabsLayout() {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTitle: () => <HeaderLogoTitle color={colors.text} title="Admin Panel" />,
        headerRight: () => <AdminNotificationBell />,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: t('tabs.dashboard'), tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} /> }}
      />
      <Tabs.Screen
        name="stores"
        options={{ title: t('tabs.stores'), tabBarIcon: ({ focused }) => <TabIcon emoji="🏪" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('tabs.profile'), tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bellBtn: { marginRight: 16, padding: 4 },
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
});
