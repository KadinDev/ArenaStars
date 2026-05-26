import { Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

type StatCardProps = {
  label: string;
  value: string | number;
  accent?: "primary" | "purple";
};

export function StatCard({ label, value, accent = "primary" }: StatCardProps) {
  const accentClass = accent === "primary" ? "text-primary" : "text-purple";

  return (
    <Animated.View entering={FadeIn.duration(300)} className="min-h-24 flex-1 rounded-lg bg-card p-4">
      <Text className={`text-3xl font-black ${accentClass}`}>{value}</Text>
      <Text className="mt-2 text-xs uppercase tracking-widest text-textSecondary">{label}</Text>
    </Animated.View>
  );
}
