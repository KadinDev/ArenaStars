import { Link } from "expo-router";
import { Image } from "expo-image";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { RankingPlayer } from "@/types/database";

type RankingItemProps = {
  item: RankingPlayer;
  index: number;
};

export function RankingItem({ item, index }: RankingItemProps) {
  return (
    <Link href={`/jogador/${item.player_id}`} asChild>
      <TouchableOpacity activeOpacity={0.8}>
        <Animated.View
          entering={FadeInDown.delay(index * 25).duration(300)}
          className="mb-3 flex-row items-center rounded-lg bg-card p-3"
        >
          <Text className="w-8 text-lg font-black text-primary">
            {index + 1}
          </Text>
          <View className="h-12 w-12 overflow-hidden rounded-lg bg-cardSecondary">
            {item.photo_url ? (
              <Image
                source={{ uri: item.photo_url }}
                style={{ width: 48, height: 48 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : null}
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-bold text-text" numberOfLines={1}>
              {item.name || item.nickname}
            </Text>
            <Text className="text-xs text-textSecondary">
              {item.matches} jogos • {item.goals} gols • {item.assists} ast
            </Text>
          </View>
          <Text className="text-xl font-black text-purple">{item.score}</Text>
        </Animated.View>
      </TouchableOpacity>
    </Link>
  );
}
