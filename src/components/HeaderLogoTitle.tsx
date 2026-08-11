import { View, Image, Text, StyleSheet } from 'react-native';
import logo from '@/assets/images/logo-circle.png';

interface HeaderLogoTitleProps {
  color?: string;
  title?: string;
}

export function HeaderLogoTitle({ color = '#1a1a1a', title = 'Barbers Panel' }: HeaderLogoTitleProps) {
  return (
    <View style={styles.row}>
      <Image source={logo} style={styles.logo} resizeMode="contain" />
      <Text style={[styles.title, { color }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30 },
  title: { fontSize: 17, fontWeight: '700' },
});
