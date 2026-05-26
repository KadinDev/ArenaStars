import { Link } from "expo-router";
import { Image } from "expo-image";
import { Pressable, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Pencil, UserRound } from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { Player } from "@/types/database";

type PlayerCardProps = {
  player: Player;
  onEdit?: () => void;
};

export function PlayerCard({ player, onEdit }: PlayerCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      className="mb-3 flex-row items-center rounded-lg bg-card p-3"
    >
      <Link href={`/jogador/${player.id}`} asChild>
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-1 flex-row items-center"
        >
          <View className="h-14 w-14 overflow-hidden rounded-lg bg-cardSecondary">
            {player.photo_url ? (
              <Image
                source={{ uri: player.photo_url }}
                style={{ height: 56, width: 56 }}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={150}
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <UserRound color={colors.muted} size={24} />
              </View>
            )}
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-text" numberOfLines={1}>
              {player.name || player.nickname}
            </Text>
            <Text className="mt-1 text-xs text-textSecondary" numberOfLines={1}>
              {player.position || "Jogador"} - {player.nickname}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>

      {onEdit ? (
        <Pressable
          onPress={onEdit}
          className="ml-3 h-11 w-11 items-center justify-center rounded-lg bg-cardSecondary"
        >
          <Pencil color={colors.text} size={18} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
