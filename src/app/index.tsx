import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) {
      router.replace('/login');
    } else if (profile.role === 'superadmin') {
      router.replace('/admin/dashboard');
    } else {
      router.replace('/barber/dashboard');
    }
  }, [loading, user, profile]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
