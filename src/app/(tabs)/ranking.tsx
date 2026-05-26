import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { RankingItem } from "@/components/RankingItem";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { useRanking } from "@/hooks/useCachedQueries";

type RankingTab = "geral" | "gols" | "assistencias";

const tabs: Array<{ key: RankingTab; label: string }> = [
  { key: "geral", label: "Geral" },
  { key: "gols", label: "Gols" },
  { key: "assistencias", label: "Assistencia" }
];

export default function RankingScreen() {
  const [tab, setTab] = useState<RankingTab>("geral");
  const ranking = useRanking("geral");
  const rankingData = useMemo(() => {
    const data = [...(ranking.data ?? [])];
    if (tab === "gols") {
      return data.sort((a, b) => b.goals - a.goals || b.score - a.score);
    }
    if (tab === "assistencias") {
      return data.sort((a, b) => b.assists - a.assists || b.score - a.score);
    }
    return data;
  }, [ranking.data, tab]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 110 }}>
        <Header title="Ranking" subtitle="Geral por pontuacao, artilharia e assistencias somando todos os treinos." />
        <View className="mb-5 flex-row rounded-lg bg-card p-1">
          {tabs.map((item) => {
            const active = item.key === tab;
            return (
              <Pressable key={item.key} onPress={() => setTab(item.key)} className={`flex-1 rounded-lg py-3 ${active ? "bg-purple" : ""}`}>
                <Text className={`text-center text-sm font-bold ${active ? "text-text" : "text-textSecondary"}`}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {ranking.isLoading ? <ListSkeleton /> : null}
        {rankingData.map((item, index) => <RankingItem key={`${item.player_id}-${tab}`} item={item} index={index} />)}
        {!ranking.isLoading && !rankingData.length ? <EmptyState title="Ranking vazio" message="Os dados ficam em cache local e atualizam de forma silenciosa." /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
