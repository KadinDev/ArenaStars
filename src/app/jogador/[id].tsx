import { useEffect, useMemo, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Shield, Star } from "lucide-react-native";
import { MatchCard } from "@/components/MatchCard";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { colors } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useMatches,
  usePlayerStats,
  useRecordPlayerEvent,
} from "@/hooks/useCachedQueries";
import { dayLabel, formatFullDate } from "@/utils/date";

export default function JogadorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAdmin } = useAdminAuth();
  const stats = usePlayerStats(id);
  const matches = useMatches(0);
  const recordEvent = useRecordPlayerEvent(id);
  const data = stats.data;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [goalQuantity, setGoalQuantity] = useState("1");
  const [assistQuantity, setAssistQuantity] = useState("1");
  const recentMatches = useMemo(() => {
    const playerHistoryIds = new Set(data?.history.map((match) => match.id) ?? []);
    const allMatches = matches.data ?? [];
    const participated = allMatches.filter((match) => playerHistoryIds.has(match.id));
    return (participated.length ? participated : allMatches).slice(0, 8);
  }, [matches.data]);
  const selectedMatch = recentMatches.find((match) => match.id === selectedMatchId) ?? recentMatches[0];
  const playerMeta = [data?.player.nickname, data?.player.position].filter(Boolean).join(" - ") || "Jogador";

  useEffect(() => {
    if (!selectedMatchId && recentMatches[0]) {
      setSelectedMatchId(recentMatches[0].id);
    }
  }, [recentMatches, selectedMatchId]);

  async function register(
    type: "participation" | "goal" | "assist",
    quantity = 1,
  ) {
    if (!selectedMatch) {
      Alert.alert(
        "Sem treino cadastrado",
        "Cadastre um jogo na tela Jogos antes de adicionar estatisticas.",
      );
      return;
    }

    if (type !== "participation" && quantity < 1) {
      Alert.alert("Informe a quantidade", "Use um numero maior que zero.");
      return;
    }

    try {
      await recordEvent.mutateAsync({
        matchId: selectedMatch.id,
        type,
        quantity,
      });
      const label =
        type === "goal"
          ? "Gol"
          : type === "assist"
            ? "Assistencia"
            : "Participacao";
      Alert.alert(
        `${label} registrado`,
        "Perfil e ranking serao atualizados em background.",
      );
    } catch (error) {
      Alert.alert(
        "Nao foi possivel registrar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View className="mb-5 flex-row justify-end">
          <Pressable
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-lg bg-card"
          >
            <ArrowLeft color={colors.text} size={22} />
          </Pressable>
        </View>
        {stats.isLoading ? <ListSkeleton count={3} /> : null}
        {data ? (
          <>
            <View className="mb-5 overflow-hidden rounded-lg bg-card">
              <View className="absolute left-0 top-0 h-full w-2 bg-primary" />
              <View className="absolute right-0 top-0 h-20 w-20 rounded-bl-lg bg-purple" />
              <View className="px-5 pt-5">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Shield color={colors.primary} size={20} />
                    <Text className="ml-2 text-xs font-black uppercase tracking-widest text-primary">
                      Nossa Champions
                    </Text>
                  </View>
                  <Star color={colors.text} size={18} />
                </View>
              </View>
              <View className="mt-4 flex-row items-end px-5 pb-5">
                <View className="h-36 w-32 overflow-hidden rounded-lg bg-cardSecondary">
                  {data.player.photo_url ? (
                    <Image
                      source={{ uri: data.player.photo_url }}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View className="h-full items-center justify-center">
                      <Text className="text-textSecondary">Sem foto</Text>
                    </View>
                  )}
                </View>
                <View className="ml-4 flex-1">
                  <Text
                    className="text-4xl font-black text-text"
                    numberOfLines={2}
                  >
                    {data.player.name}
                  </Text>
                  <Text className="mt-2 text-sm font-bold uppercase tracking-widest text-textSecondary" numberOfLines={2}>
                    {playerMeta}
                  </Text>
                  <Text className="mt-4 text-5xl font-black text-primary">
                    {data.goals + data.assists + data.matches}
                  </Text>
                  <Text className="text-xs uppercase tracking-widest text-textSecondary">
                    overall
                  </Text>
                </View>
              </View>
            </View>
            <View className="mb-6 flex-row gap-3">
              <StatCard label="Jogos" value={data.matches} />
              <StatCard label="Gols" value={data.goals} accent="purple" />
              <StatCard label="Ast" value={data.assists} />
            </View>

            {isAdmin ? (
              <View className="mb-6 rounded-lg bg-card p-4">
                <Text className="text-lg font-black text-text">
                  Registrar por treino
                </Text>
                <Text className="mt-1 text-sm text-textSecondary">
                  Escolha o jogo pelo dia, data e hora antes de registrar.
                </Text>
                <View className="mt-4 gap-2">
                  {recentMatches.map((match) => {
                    const active = match.id === selectedMatch?.id;
                    return (
                      <Pressable
                        key={match.id}
                        onPress={() => setSelectedMatchId(match.id)}
                        className={`rounded-lg border p-3 ${active ? "border-primary bg-cardSecondary" : "border-cardSecondary"}`}
                      >
                        <Text className="text-sm font-black text-text">
                          {dayLabel(match.training_day)}
                        </Text>
                        <Text className="mt-1 text-xs text-textSecondary">
                          {formatFullDate(match.played_at)}
                        </Text>
                        <Text className="mt-1 text-xs text-muted" numberOfLines={1}>
                          {match.team_a_name} {match.team_a_score} x {match.team_b_score} {match.team_b_name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  onPress={() => register("participation")}
                  disabled={recordEvent.isPending}
                  className="mt-4 rounded-lg bg-cardSecondary py-4"
                >
                  <Text className="text-center text-sm font-black text-text">
                    Participou do treino
                  </Text>
                </Pressable>

                <View className="mt-3 flex-row gap-3">
                  <View className="flex-1 rounded-lg bg-cardSecondary p-3">
                    <Text className="mb-2 text-xs font-black uppercase tracking-widest text-primary">
                      Gols
                    </Text>
                    <TextInput
                      value={goalQuantity}
                      onChangeText={setGoalQuantity}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      className="rounded-lg bg-card p-3 text-center text-xl font-black text-text"
                    />
                    <Pressable
                      onPress={() =>
                        register("goal", Number(goalQuantity) || 0)
                      }
                      disabled={recordEvent.isPending}
                      className="mt-3 rounded-lg bg-primary py-3"
                    >
                      <Text className="text-center text-xs font-black text-background">
                        Salvar gols
                      </Text>
                    </Pressable>
                  </View>

                  <View className="flex-1 rounded-lg bg-cardSecondary p-3">
                    <Text className="mb-2 text-xs font-black uppercase tracking-widest text-purple">
                      Assist.
                    </Text>
                    <TextInput
                      value={assistQuantity}
                      onChangeText={setAssistQuantity}
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      className="rounded-lg bg-card p-3 text-center text-xl font-black text-text"
                    />
                    <Pressable
                      onPress={() =>
                        register("assist", Number(assistQuantity) || 0)
                      }
                      disabled={recordEvent.isPending}
                      className="mt-3 rounded-lg bg-purple py-3"
                    >
                      <Text className="text-center text-xs font-black text-text">
                        Salvar assist.
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            <Text className="mb-3 text-lg font-black text-text">Historico</Text>
            {data.history.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
            {!data.history.length ? (
              <EmptyState
                title="Sem historico"
                message="Participacoes recentes vao aparecer aqui."
              />
            ) : null}
          </>
        ) : !stats.isLoading ? (
          <EmptyState
            title="Jogador nao encontrado"
            message="Confira se o cadastro ainda esta ativo."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
