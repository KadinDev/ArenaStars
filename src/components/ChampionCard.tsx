import { Image } from "expo-image";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Trophy } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { Team } from "@/types/database";

type ChampionCardProps = {
  team: Team;
};

export function ChampionCard({ team }: ChampionCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(350)}
      className="mb-5 overflow-hidden rounded-lg border border-primary bg-card p-5"
    >
      <View className="absolute bottom-0 left-0 h-24 w-full bg-cardSecondary" />
      <View className="flex-row items-center justify-center">
        <Trophy color={colors.primary} size={24} />
        <Text
          className="mx-3 flex-1 text-center text-lg font-black uppercase tracking-widest text-primary"
          numberOfLines={2}
        >
          {team.champion_title ?? "Campeao"}
        </Text>
        <Trophy color={colors.primary} size={24} />
      </View>
      {team.champion_count && team.champion_count > 1 ? (
        <Text className="mt-2 text-center text-xs font-black uppercase tracking-widest text-textSecondary">
          {team.champion_count} vezes campeao
        </Text>
      ) : null}
      <View className="mt-5 items-center">
        <View className="h-24 w-24 overflow-hidden rounded-lg border border-primary bg-background">
          {team.logo_url ? (
            <Image
              source={{ uri: team.logo_url }}
              style={{ width: 96, height: 96 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="h-full items-center justify-center">
              <Trophy color={colors.primary} size={38} />
            </View>
          )}
        </View>
        <Text className="mt-3 text-2xl font-black text-text" numberOfLines={2}>
          {team.name}
        </Text>
      </View>
    </Animated.View>
  );
}
