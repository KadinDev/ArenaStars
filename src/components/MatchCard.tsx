import { Text, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Trophy } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { Match, Team } from "@/types/database";
import { dayLabel, formatFullDate } from "@/utils/date";

type MatchCardProps = {
  match: Match;
  teams?: Team[];
};

function TeamBadge({ name, team }: { name: string; team?: Team }) {
  return (
    <View className="w-28 items-center">
      <View className="mb-2 h-14 w-14 overflow-hidden rounded-lg bg-cardSecondary">
        {team?.logo_url ? (
          <Image
            source={{ uri: team.logo_url }}
            style={{ width: 56, height: 56 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View className="h-full items-center justify-center">
            <Trophy color={colors.muted} size={20} />
          </View>
        )}
      </View>
      <Text
        className="text-center text-sm font-bold text-text"
        numberOfLines={2}
      >
        {name}
      </Text>
    </View>
  );
}

export function MatchCard({ match, teams = [] }: MatchCardProps) {
  const teamA = teams.find((team) => team.id === match.team_a_id);
  const teamB = teams.find((team) => team.id === match.team_b_id);

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className="mb-3 rounded-lg bg-card p-4"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs uppercase tracking-widest text-primary">
          {dayLabel(match.training_day)}
        </Text>
        <Text className="text-xs text-textSecondary">
          {formatFullDate(match.played_at)}
        </Text>
      </View>
      <View className="flex-row items-center justify-between">
        <TeamBadge name={match.team_a_name} team={teamA} />
        <View className="flex-row items-center rounded-lg bg-cardSecondary px-3 py-2">
          <Text className="text-2xl font-black text-text">
            {match.team_a_score}
          </Text>
          <Trophy
            color={colors.primary}
            size={18}
            style={{ marginHorizontal: 10 }}
          />
          <Text className="text-2xl font-black text-text">
            {match.team_b_score}
          </Text>
        </View>
        <TeamBadge name={match.team_b_name} team={teamB} />
      </View>
    </Animated.View>
  );
}
