import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Trophy } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { Match } from "@/types/database";
import { dayLabel, formatFullDate } from "@/utils/date";

type MatchCardProps = {
  match: Match;
};

export function MatchCard({ match }: MatchCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} className="mb-3 rounded-lg bg-card p-4">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs uppercase tracking-widest text-primary">{dayLabel(match.training_day)}</Text>
        <Text className="text-xs text-textSecondary">{formatFullDate(match.played_at)}</Text>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="w-28 text-base font-bold text-text" numberOfLines={1}>{match.team_a_name}</Text>
        <View className="flex-row items-center rounded-lg bg-cardSecondary px-3 py-2">
          <Text className="text-2xl font-black text-text">{match.team_a_score}</Text>
          <Trophy color={colors.primary} size={18} style={{ marginHorizontal: 10 }} />
          <Text className="text-2xl font-black text-text">{match.team_b_score}</Text>
        </View>
        <Text className="w-28 text-right text-base font-bold text-text" numberOfLines={1}>{match.team_b_name}</Text>
      </View>
    </Animated.View>
  );
}
