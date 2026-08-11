import { View, Text } from 'react-native';

interface MiniBarChartProps {
  data: { label: string; value: number }[];
  color: string;
  textColor: string;
  textMutedColor: string;
  height?: number;
}

/** Simple dependency-free vertical bar chart (12 bars for a yearly view). */
export function MiniBarChart({ data, color, textColor, textMutedColor, height = 120 }: MiniBarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: height + 24, gap: 4 }}>
      {data.map((d) => (
        <View key={d.label} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          {d.value > 0 && <Text style={{ fontSize: 9, color: textColor }}>{d.value}</Text>}
          <View
            style={{
              width: '100%',
              height: Math.max(3, (d.value / max) * height),
              backgroundColor: color,
              borderRadius: 3,
            }}
          />
          <Text style={{ fontSize: 9, color: textMutedColor }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}
