import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

type HeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

export function Header({ title, subtitle, right }: HeaderProps) {
  return (
    <Animated.View entering={FadeInDown.duration(350)} className="mb-5 flex-row items-center justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-3xl font-black text-text">{title}</Text>
        {subtitle ? <Text className="mt-1 text-sm text-textSecondary">{subtitle}</Text> : null}
      </View>
      {right}
    </Animated.View>
  );
}
