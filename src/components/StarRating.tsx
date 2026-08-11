import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';

interface StarRatingProps {
  average: number;
  count: number;
  size?: number;
}

/** Read-only 5-star display for a barber's average rating. */
export function StarRating({ average, count, size = 14 }: StarRatingProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  if (count === 0) {
    return <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: size - 1 }]}>{t('rating.noRatingsYet')}</Text>;
  }

  const rounded = Math.round(average);
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= rounded ? 'star' : 'star-outline'} size={size} color={colors.accent} />
      ))}
      <Text style={[styles.text, { color: colors.textMuted, fontSize: size - 1 }]}>
        {average.toFixed(1)} {t('rating.count', { count })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  text: { marginLeft: 4, fontWeight: '600' },
  emptyText: { fontStyle: 'italic' },
});
