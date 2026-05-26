import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { MatchCard } from "@/components/MatchCard";
import { RankingItem } from "@/components/RankingItem";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { supabaseConfigWarning } from "@/services/supabase";
import { useMatches, usePlayers, useRanking } from "@/hooks/useCachedQueries";
import { dayLabel, formatShortDate, nextTrainings } from "@/utils/date";

export default function HomeScreen() {
  const players = usePlayers();
  const matches = useMatches(0);
  const ranking = useRanking("geral");
  const trainings = nextTrainings(2);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Header
          title="Nossa Pelada"
          subtitle="Ranking leve, cacheado e sem consultas desnecessarias."
        />

        {supabaseConfigWarning ? (
          <View className="mb-4 rounded-lg bg-cardSecondary p-4">
            <Text className="text-sm text-textSecondary">
              {supabaseConfigWarning}
            </Text>
          </View>
        ) : null}

        <View className="mb-5 flex-row gap-3">
          <StatCard label="Jogadores" value={players.data?.length ?? 0} />
          <StatCard
            label="Jogos salvos"
            value={matches.data?.length ?? 0}
            accent="purple"
          />
        </View>

        <Text className="mb-3 text-lg font-black text-text">
          Ranking rapido
        </Text>
        {ranking.isLoading ? <ListSkeleton count={3} /> : null}
        {(ranking.data ?? []).slice(0, 3).map((item, index) => (
          <RankingItem key={item.player_id} item={item} index={index} />
        ))}
        {!ranking.isLoading && !ranking.data?.length ? (
          <EmptyState
            title="Sem ranking ainda"
            message="Registre jogos para gerar destaques."
          />
        ) : null}

        <Text className="mb-3 mt-6 text-lg font-black text-text">
          Ultimo jogo
        </Text>
        {matches.data?.[0] ? (
          <MatchCard match={matches.data[0]} />
        ) : (
          <EmptyState
            title="Nenhum jogo"
            message="O historico vai aparecer aqui depois do primeiro registro."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
