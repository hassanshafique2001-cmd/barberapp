import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { COLORS } from '@/constants/theme';

interface FormFieldColors {
  text: string;
  textMuted: string;
  inputBorder: string;
}

interface FormFieldProps extends TextInputProps {
  label: string;
  colors?: FormFieldColors;
}

export function FormField({ label, style, colors = COLORS, ...inputProps }: FormFieldProps) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13 }}>{label}</Text>
      <TextInput
        style={[
          {
            borderWidth: 1,
            borderColor: colors.inputBorder,
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            color: colors.text,
          },
          style,
        ]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
    </View>
  );
}
