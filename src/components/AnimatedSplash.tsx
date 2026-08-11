import { useEffect, useRef } from 'react';
import { View, Image, Animated, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import splashLogo from '@/assets/images/splash-icon.png';
import poweredByAccent from '@/assets/images/powered-by-accent.png';

interface AnimatedSplashProps {
  onFinish: () => void;
}

export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const groupTranslateY = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const poweredByOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      Animated.delay(700),
      Animated.timing(groupTranslateY, { toValue: -160, duration: 550, useNativeDriver: true }),
      Animated.timing(wordmarkOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.delay(250),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(250),
      Animated.timing(poweredByOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(900),
    ]).start(() => onFinish());
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.centerGroup, { transform: [{ translateY: groupTranslateY }] }]}>
        <Animated.Image source={splashLogo} resizeMode="contain" style={styles.logo} />
        <Animated.View style={{ opacity: wordmarkOpacity }}>
          <Animated.Text style={styles.wordmark}>
            <Animated.Text style={styles.wordmarkWe}>We </Animated.Text>
            <Animated.Text style={styles.wordmarkBarbers}>Barbers</Animated.Text>
          </Animated.Text>
        </Animated.View>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          Manage barber services
        </Animated.Text>
      </Animated.View>
      <Animated.View style={[styles.poweredByRow, { opacity: poweredByOpacity }]}>
        <Image source={poweredByAccent} style={styles.poweredByAccent} resizeMode="contain" />
        <Animated.Text style={styles.poweredBy}>Powered by Sheikh Group</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  centerGroup: { alignItems: 'center', gap: 4 },
  logo: { width: 150, height: 150 },
  wordmark: { fontSize: 30, fontWeight: '800' },
  wordmarkWe: { color: '#b8860b' },
  wordmarkBarbers: { color: '#ffffff' },
  tagline: { color: '#cfcfcf', fontSize: 13, marginTop: 4, letterSpacing: 0.5 },
  poweredByRow: {
    position: 'absolute',
    bottom: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  poweredByAccent: { width: 22, height: 22 },
  poweredBy: {
    color: '#f0e2b8',
    fontSize: 13,
    fontWeight: '700',
  },
});
