import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

function BarberStack() {
  const { user, profile, loading } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile || profile.role !== 'barber') {
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
      <Stack.Screen name="availability" options={{ title: t('stackTitles.availability') }} />
      <Stack.Screen name="select-service" options={{ title: '' }} />
      <Stack.Screen name="service-form" options={{ title: t('stackTitles.service') }} />
      <Stack.Screen name="chats" options={{ title: t('stackTitles.messages') }} />
      <Stack.Screen name="chat-thread" options={{ title: t('stackTitles.chat') }} />
      <Stack.Screen name="customers" options={{ title: t('stackTitles.customers') }} />
      <Stack.Screen name="suggestion" options={{ title: t('stackTitles.suggestion') }} />
      <Stack.Screen name="reviews" options={{ title: t('stackTitles.reviews') }} />
    </Stack>
  );
}

export default function BarberLayout() {
  return (
    <ThemeProvider>
      <BarberStack />
    </ThemeProvider>
  );
}
