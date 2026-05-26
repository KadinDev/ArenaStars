import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(250)}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} className="mb-3 h-20 rounded-lg bg-cardSecondary opacity-60" />
      ))}
    </Animated.View>
  );
}
