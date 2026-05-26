import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Edit3, Plus, Trash2 } from "lucide-react-native";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { colors } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useDeleteMatch,
  useMatches,
  usePlayers,
  useSaveMatchWithStats,
} from "@/hooks/useCachedQueries";
import { fetchMatchPlayerStats } from "@/services/queries";
import type { Match, TrainingDay } from "@/types/database";
import {
  dayFromDate,
  dayLabel,
  formatFullDate,
  formatTime,
} from "@/utils/date";

const filters: Array<TrainingDay | "todos"> = [
  "todos",
  "domingo",
  "segunda",
  "terca",
  "quarta",
  "quinta",
  "sexta",
  "sabado",
];

type PlayerDraft = Record<string, { selected: boolean }>;

function brDateOnly(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function timeOnly(value: string | Date) {
  return formatTime(value);
}

function toDateFromBr(date: string) {
  const [day, month, year] = date.split("/").map(Number);
  if (!day || !month || !year) return new Date();
  return new Date(year, month - 1, day, 12, 0, 0);
}

function toPlayedAt(date: string, time: string) {
  const [day, month, year] = date.split("/").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!day || !month || !year) return new Date().toISOString();
  return new Date(
    year,
    month - 1,
    day,
    hour || 0,
    minute || 0,
    0,
  ).toISOString();
}

export default function JogosScreen() {
  const { isAdmin } = useAdminAuth();
  const players = usePlayers();
  const saveMatch = useSaveMatchWithStats();
  const deleteMatch = useDeleteMatch();
  const [filter, setFilter] = useState<TrainingDay | "todos">("todos");
  const matches = useMatches(0, filter === "todos" ? undefined : filter);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [playedAt, setPlayedAt] = useState(brDateOnly(new Date()));
  const [playedTime, setPlayedTime] = useState(timeOnly(new Date()));
  const [teamA, setTeamA] = useState("Time A");
  const [teamB, setTeamB] = useState("Time B");
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [draft, setDraft] = useState<PlayerDraft>({});
  const computedTrainingDay = dayFromDate(toDateFromBr(playedAt));

  const selectedCount = useMemo(
    () => Object.values(draft).filter((item) => item.selected).length,
    [draft],
  );

  function resetForm() {
    setEditingId(null);
    setPlayedAt(brDateOnly(new Date()));
    setPlayedTime(timeOnly(new Date()));
    setTeamA("Time A");
    setTeamB("Time B");
    setScoreA("0");
    setScoreB("0");
    setDraft({});
  }

  function updatePlayerDraft(
    playerId: string,
    patch: Partial<PlayerDraft[string]>,
  ) {
    setDraft((current) => ({
      ...current,
      [playerId]: {
        ...current[playerId],
        selected: false,
        ...patch,
      },
    }));
  }

  async function startEdit(match: Match) {
    try {
      const stats = await fetchMatchPlayerStats(match.id);
      setEditingId(match.id);
      setPlayedAt(brDateOnly(match.played_at));
      setPlayedTime(timeOnly(match.played_at));
      setTeamA(match.team_a_name);
      setTeamB(match.team_b_name);
      setScoreA(String(match.team_a_score));
      setScoreB(String(match.team_b_score));
      setDraft(
        Object.fromEntries(
          Object.entries(stats).map(([playerId]) => [
            playerId,
            { selected: true },
          ]),
        ),
      );
      setShowForm(true);
    } catch (error) {
      Alert.alert(
        "Nao foi possivel editar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function submitMatch() {
    const selectedPlayers = Object.entries(draft)
      .filter(([, item]) => item.selected)
      .map(([playerId]) => ({
        player_id: playerId,
        goals: 0,
        assists: 0,
      }));

    if (!selectedPlayers.length) {
      Alert.alert(
        "Escolha os jogadores",
        "Marque quem participou antes de salvar.",
      );
      return;
    }

    try {
      await saveMatch.mutateAsync({
        id: editingId ?? undefined,
        training_day: computedTrainingDay,
        played_at: toPlayedAt(playedAt, playedTime),
        team_a_name: teamA.trim() || "Time A",
        team_b_name: teamB.trim() || "Time B",
        team_a_score: Number(scoreA) || 0,
        team_b_score: Number(scoreB) || 0,
        players: selectedPlayers,
      });
      Alert.alert(
        editingId ? "Jogo atualizado" : "Jogo cadastrado",
        "Ranking e perfis serao revalidados em background.",
      );
      resetForm();
      setShowForm(false);
    } catch (error) {
      Alert.alert(
        "Nao foi possivel salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
      console.log(error);
    }
  }

  function confirmDelete(match: Match) {
    Alert.alert("Excluir jogo", `${match.team_a_name} x ${match.team_b_name}`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMatch.mutateAsync(match.id);
          } catch (error) {
            Alert.alert(
              "Nao foi possivel excluir",
              error instanceof Error ? error.message : "Tente novamente.",
            );
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Header
          title="Jogos"
          subtitle="Cadastre partidas e marque quem participou."
          right={
            isAdmin ? (
              <Pressable
                onPress={() => {
                  resetForm();
                  setShowForm((value) => !value);
                }}
                className="h-12 w-12 items-center justify-center rounded-lg bg-primary"
              >
                <Plus color={colors.background} size={24} />
              </Pressable>
            ) : null
          }
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-5"
          contentContainerStyle={{ gap: 8 }}
        >
          {filters.map((item) => {
            const active = item === filter;
            return (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                className={`rounded-lg px-4 py-3 ${active ? "bg-primary" : "bg-card"}`}
              >
                <Text
                  className={`text-center text-sm font-bold ${active ? "text-background" : "text-textSecondary"}`}
                >
                  {item === "todos" ? "Todos" : dayLabel(item)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showForm ? (
          <View className="mb-5 rounded-lg bg-card p-4">
            <Text className="text-xl font-black text-text">
              {editingId ? "Editar jogo" : "Novo jogo"}
            </Text>
            <View className="mt-4 rounded-lg bg-cardSecondary p-4">
              <Text className="text-xs font-black uppercase tracking-widest text-primary">
                Dia detectado automaticamente
              </Text>
              <Text className="mt-1 text-2xl font-black text-text">
                {dayLabel(computedTrainingDay)}
              </Text>
            </View>
            <View className="mt-3 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-2 text-xs font-black uppercase tracking-widest text-textSecondary">
                  Data
                </Text>
                <TextInput
                  value={playedAt}
                  onChangeText={setPlayedAt}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#6B7280"
                  className="rounded-lg bg-cardSecondary p-4 text-text"
                />
              </View>
              <View className="w-32">
                <Text className="mb-2 text-xs font-black uppercase tracking-widest text-textSecondary">
                  Hora
                </Text>
                <TextInput
                  value={playedTime}
                  onChangeText={setPlayedTime}
                  placeholder="HH:MM"
                  placeholderTextColor="#6B7280"
                  className="rounded-lg bg-cardSecondary p-4 text-center text-text"
                />
              </View>
            </View>
            <View className="mt-3 flex-row gap-3">
              <TextInput
                value={teamA}
                onChangeText={setTeamA}
                placeholder="Time A"
                placeholderTextColor="#6B7280"
                className="flex-1 rounded-lg bg-cardSecondary p-4 text-text"
              />
              <TextInput
                value={scoreA}
                onChangeText={setScoreA}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B7280"
                className="w-20 rounded-lg bg-cardSecondary p-4 text-center text-text"
              />
            </View>
            <View className="mt-3 flex-row gap-3">
              <TextInput
                value={teamB}
                onChangeText={setTeamB}
                placeholder="Time B"
                placeholderTextColor="#6B7280"
                className="flex-1 rounded-lg bg-cardSecondary p-4 text-text"
              />
              <TextInput
                value={scoreB}
                onChangeText={setScoreB}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#6B7280"
                className="w-20 rounded-lg bg-cardSecondary p-4 text-center text-text"
              />
            </View>

            <Text className="mb-2 mt-5 text-base font-black text-text">
              Jogadores ({selectedCount})
            </Text>
            {(players.data ?? []).map((player) => {
              const item = draft[player.id] ?? { selected: false };
              return (
                <View
                  key={player.id}
                  className="mb-2 rounded-lg bg-cardSecondary p-3"
                >
                  <Pressable
                    onPress={() =>
                      updatePlayerDraft(player.id, { selected: !item.selected })
                    }
                    className="flex-row items-center justify-between"
                  >
                    <Text
                      className="flex-1 font-bold text-text"
                      numberOfLines={1}
                    >
                      {player.nickname || player.name}
                    </Text>
                    <Text
                      className={`font-black ${item.selected ? "text-primary" : "text-muted"}`}
                    >
                      {item.selected ? "Jogou" : "Fora"}
                    </Text>
                  </Pressable>
                </View>
              );
            })}

            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPress={() => {
                  resetForm();
                  setShowForm(false);
                }}
                className="flex-1 rounded-lg border border-cardSecondary py-4"
              >
                <Text className="text-center font-black text-textSecondary">
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={submitMatch}
                disabled={saveMatch.isPending}
                className="flex-1 rounded-lg bg-primary py-4"
              >
                <Text className="text-center font-black text-background">
                  {saveMatch.isPending ? "Salvando..." : "Salvar"}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {matches.isLoading ? <ListSkeleton /> : null}
        {(matches.data ?? []).map((match) => (
          <View key={match.id} className="mb-3 rounded-lg bg-card p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-widest text-primary">
                {dayLabel(match.training_day)}
              </Text>
              <Text className="text-xs text-textSecondary">
                {formatFullDate(match.played_at)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text
                className="w-28 text-base font-bold text-text"
                numberOfLines={1}
              >
                {match.team_a_name}
              </Text>
              <Text className="text-2xl font-black text-text">
                {match.team_a_score} x {match.team_b_score}
              </Text>
              <Text
                className="w-28 text-right text-base font-bold text-text"
                numberOfLines={1}
              >
                {match.team_b_name}
              </Text>
            </View>
            {isAdmin ? (
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => startEdit(match)}
                  className="flex-1 flex-row items-center justify-center rounded-lg bg-cardSecondary py-3"
                >
                  <Edit3 color={colors.text} size={16} />
                  <Text className="ml-2 font-bold text-text">Editar</Text>
                </Pressable>
                <Pressable
                  onPress={() => confirmDelete(match)}
                  className="flex-1 flex-row items-center justify-center rounded-lg bg-cardSecondary py-3"
                >
                  <Trash2 color={colors.textSecondary} size={16} />
                  <Text className="ml-2 font-bold text-textSecondary">
                    Excluir
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ))}
        {!matches.isLoading && !matches.data?.length ? (
          <EmptyState
            title="Sem jogos"
            message="Nenhum jogo encontrado para este filtro."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
