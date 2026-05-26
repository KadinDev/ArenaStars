import { Text, View } from "react-native";
import { CircleOff } from "lucide-react-native";
import { colors } from "@/constants/theme";

type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View className="items-center rounded-lg bg-card p-8">
      <CircleOff color={colors.muted} size={32} />
      <Text className="mt-4 text-lg font-bold text-text">{title}</Text>
      <Text className="mt-2 text-center text-sm text-textSecondary">{message}</Text>
    </View>
  );
}
