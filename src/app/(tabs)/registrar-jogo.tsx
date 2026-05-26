import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useCreateMatch } from "@/hooks/useCachedQueries";
import type { TrainingDay } from "@/types/database";

export default function RegistrarJogoScreen() {
  const { isAdmin } = useAdminAuth();
  const mutation = useCreateMatch();
  const [trainingDay, setTrainingDay] = useState<TrainingDay>("quinta");
  const [teamA, setTeamA] = useState("Time A");
  const [teamB, setTeamB] = useState("Time B");
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");

  async function submit() {
    try {
      await mutation.mutateAsync({
        training_day: trainingDay,
        played_at: new Date().toISOString(),
        team_a_name: teamA.trim(),
        team_b_name: teamB.trim(),
        team_a_score: Number(scoreA) || 0,
        team_b_score: Number(scoreB) || 0
      });
      Alert.alert("Jogo salvo", "O cache sera invalidado e atualizado em background.");
    } catch (error) {
      Alert.alert("Nao foi possivel salvar", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 110 }}>
        <Header title="Registrar jogo" subtitle="Area admin, sem realtime e sem polling." />
        {!isAdmin ? (
          <View className="rounded-lg bg-card p-5">
            <Text className="text-xl font-black text-text">Login admin necessario</Text>
            <Text className="mt-2 text-sm text-textSecondary">Entre na aba Mais para liberar cadastro de jogadores, partidas e estatisticas.</Text>
          </View>
        ) : (
          <View className="gap-4">
            <View className="flex-row rounded-lg bg-card p-1">
              {(["quinta", "sabado"] as TrainingDay[]).map((day) => (
                <Pressable key={day} onPress={() => setTrainingDay(day)} className={`flex-1 rounded-lg py-3 ${trainingDay === day ? "bg-primary" : ""}`}>
                  <Text className={`text-center font-bold ${trainingDay === day ? "text-background" : "text-textSecondary"}`}>{day === "quinta" ? "Quinta" : "Sabado"}</Text>
                </Pressable>
              ))}
            </View>
            <TextInput value={teamA} onChangeText={setTeamA} placeholder="Time A" placeholderTextColor="#6B7280" className="rounded-lg bg-card p-4 text-text" />
            <TextInput value={scoreA} onChangeText={setScoreA} keyboardType="number-pad" placeholder="Gols Time A" placeholderTextColor="#6B7280" className="rounded-lg bg-card p-4 text-text" />
            <TextInput value={teamB} onChangeText={setTeamB} placeholder="Time B" placeholderTextColor="#6B7280" className="rounded-lg bg-card p-4 text-text" />
            <TextInput value={scoreB} onChangeText={setScoreB} keyboardType="number-pad" placeholder="Gols Time B" placeholderTextColor="#6B7280" className="rounded-lg bg-card p-4 text-text" />
            <Pressable onPress={submit} disabled={mutation.isPending} className="rounded-lg bg-primary py-4">
              <Text className="text-center text-base font-black text-background">{mutation.isPending ? "Salvando..." : "Salvar jogo"}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
