import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function AdminStack() {
  const { user, profile, loading } = useAuth();
  const { colors } = useTheme();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile || profile.role !== 'superadmin') {
      router.replace('/login');
    }
  }, [loading, user, profile]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { color: colors.text },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="create-shop" options={{ title: 'New Shop' }} />
      <Stack.Screen name="shop-detail" options={{ title: 'Shop Details' }} />
      <Stack.Screen name="create-barber" options={{ title: 'Add Barber' }} />
      <Stack.Screen name="inbox" options={{ title: 'Inbox' }} />
    </Stack>
  );
}

export default function AdminLayout() {
  return (
    <ThemeProvider>
      <AdminStack />
    </ThemeProvider>
  );
}
