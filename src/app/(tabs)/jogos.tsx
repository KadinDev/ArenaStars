import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Edit3, Plus, Trash2, UsersRound, X } from "lucide-react-native";
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
  useTeamPlayers,
  useTeams,
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

type PlayerDraft = Record<
  string,
  { selected: boolean; team_id: string | null; goals: number; assists: number }
>;

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
  const teams = useTeams();
  const teamPlayers = useTeamPlayers();
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
  const [teamAId, setTeamAId] = useState<string | null>(null);
  const [teamBId, setTeamBId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [draft, setDraft] = useState<PlayerDraft>({});
  const [playersModalVisible, setPlayersModalVisible] = useState(false);
  const computedTrainingDay = dayFromDate(toDateFromBr(playedAt));

  const selectedCount = useMemo(
    () => Object.values(draft).filter((item) => item.selected).length,
    [draft],
  );
  const selectedPlayers = useMemo(
    () => (players.data ?? []).filter((player) => draft[player.id]?.selected),
    [draft, players.data],
  );
  const teamById = useMemo(
    () => new Map((teams.data ?? []).map((team) => [team.id, team])),
    [teams.data],
  );
  const teamByPlayerId = useMemo(
    () =>
      new Map(
        (teamPlayers.data ?? []).map((item) => [item.player_id, item.team_id]),
      ),
    [teamPlayers.data],
  );
  const renderMatchTeam = (name: string, teamId: string | null) => {
    const team = teamId ? teamById.get(teamId) : null;
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
              <UsersRound color={colors.muted} size={20} />
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
  };

  function resetForm() {
    setEditingId(null);
    setPlayedAt(brDateOnly(new Date()));
    setPlayedTime(timeOnly(new Date()));
    setTeamA("Time A");
    setTeamB("Time B");
    setTeamAId(null);
    setTeamBId(null);
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
        team_id: teamByPlayerId.get(playerId) ?? null,
        goals: 0,
        assists: 0,
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
      setTeamAId(match.team_a_id);
      setTeamBId(match.team_b_id);
      setScoreA(String(match.team_a_score));
      setScoreB(String(match.team_b_score));
      setDraft(
        Object.fromEntries(
          Object.entries(stats).map(([playerId]) => [
            playerId,
            {
              selected: true,
              team_id: stats[playerId].team_id,
              goals: stats[playerId].goals,
              assists: stats[playerId].assists,
            },
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
      .map(([playerId, item]) => ({
        player_id: playerId,
        team_id: item.team_id ?? teamByPlayerId.get(playerId) ?? null,
        goals: item.goals,
        assists: item.assists,
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
        team_a_id: teamAId,
        team_b_id: teamBId,
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
            {(teams.data ?? []).length ? (
              <>
                <Text className="mb-2 mt-4 text-xs font-black uppercase tracking-widest text-textSecondary">
                  Times do jogo
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {(teams.data ?? []).map((team) => {
                    const active = team.id === teamAId;
                    return (
                      <Pressable
                        key={`a-${team.id}`}
                        onPress={() => {
                          setTeamAId(team.id);
                          setTeamA(team.name);
                        }}
                        className={`rounded-lg px-4 py-3 ${active ? "bg-primary" : "bg-cardSecondary"}`}
                      >
                        <Text
                          className={`font-bold ${active ? "text-background" : "text-textSecondary"}`}
                        >
                          A: {team.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingTop: 8 }}
                >
                  {(teams.data ?? []).map((team) => {
                    const active = team.id === teamBId;
                    return (
                      <Pressable
                        key={`b-${team.id}`}
                        onPress={() => {
                          setTeamBId(team.id);
                          setTeamB(team.name);
                        }}
                        className={`rounded-lg px-4 py-3 ${active ? "bg-purple" : "bg-cardSecondary"}`}
                      >
                        <Text
                          className={`font-bold ${active ? "text-text" : "text-textSecondary"}`}
                        >
                          B: {team.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            ) : null}

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
            <Pressable
              onPress={() => setPlayersModalVisible(true)}
              className="rounded-lg bg-cardSecondary p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-black text-text">
                  Selecionar jogadores
                </Text>
                <UsersRound color={colors.primary} size={20} />
              </View>
              <Text className="mt-2 text-sm text-textSecondary">
                {selectedCount
                  ? `${selectedCount} jogadores selecionados`
                  : "Toque para escolher quem jogou"}
              </Text>
            </Pressable>
            {selectedPlayers.length ? (
              <View className="mt-3 gap-2">
                {selectedPlayers.map((player) => (
                  <View
                    key={player.id}
                    className="flex-row items-center rounded-lg bg-cardSecondary p-2"
                  >
                    <View className="h-10 w-10 overflow-hidden rounded-lg bg-card">
                      {player.photo_url ? (
                        <Image
                          source={{ uri: player.photo_url }}
                          style={{ width: 40, height: 40 }}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View className="h-full items-center justify-center">
                          <UsersRound color={colors.muted} size={18} />
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-text" numberOfLines={1}>
                        {player.name}
                      </Text>
                      <Text
                        className="mt-1 text-xs text-primary"
                        numberOfLines={1}
                      >
                        {teamById.get(
                          draft[player.id]?.team_id ??
                            teamByPlayerId.get(player.id) ??
                            "",
                        )?.name ?? "Sem time"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

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

        <Modal
          transparent
          visible={playersModalVisible}
          animationType="fade"
          onRequestClose={() => setPlayersModalVisible(false)}
        >
          <View className="flex-1 justify-end bg-black/70">
            <View className="max-h-[82%] rounded-t-lg bg-background p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-2xl font-black text-text">
                  Quem jogou?
                </Text>
                <Pressable
                  onPress={() => setPlayersModalVisible(false)}
                  className="h-11 w-11 items-center justify-center rounded-lg bg-card"
                >
                  <X color={colors.text} size={20} />
                </Pressable>
              </View>
              <ScrollView>
                {(players.data ?? []).map((player) => {
                  const selected = Boolean(draft[player.id]?.selected);
                  const playerTeamId =
                    draft[player.id]?.team_id ??
                    teamByPlayerId.get(player.id) ??
                    null;
                  const playerTeam = playerTeamId
                    ? teamById.get(playerTeamId)
                    : null;
                  return (
                    <Pressable
                      key={player.id}
                      onPress={() =>
                        updatePlayerDraft(player.id, { selected: !selected })
                      }
                      className={`mb-2 flex-row items-center rounded-lg border p-3 ${selected ? "border-primary bg-cardSecondary" : "border-cardSecondary bg-card"}`}
                    >
                      <View className="h-12 w-12 overflow-hidden rounded-lg bg-cardSecondary">
                        {player.photo_url ? (
                          <Image
                            source={{ uri: player.photo_url }}
                            style={{ width: 48, height: 48 }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <View className="h-full items-center justify-center">
                            <UsersRound color={colors.muted} size={20} />
                          </View>
                        )}
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-bold text-text" numberOfLines={1}>
                          {player.name}
                        </Text>
                        <Text
                          className="mt-1 text-xs text-textSecondary"
                          numberOfLines={1}
                        >
                          {player.nickname || "Sem apelido"} -{" "}
                          {player.position || "Jogador"}
                        </Text>
                        <Text
                          className="mt-1 text-xs text-primary"
                          numberOfLines={1}
                        >
                          {playerTeam?.name ?? "Sem time"}
                        </Text>
                      </View>
                      <Text
                        className={`font-black ${selected ? "text-primary" : "text-muted"}`}
                      >
                        {selected ? "Jogou" : "Fora"}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={() => setPlayersModalVisible(false)}
                className="mt-4 rounded-lg bg-primary py-4"
              >
                <Text className="text-center font-black text-background">
                  Concluir
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

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
              {renderMatchTeam(match.team_a_name, match.team_a_id)}
              <Text className="text-2xl font-black text-text">
                {match.team_a_score} x {match.team_b_score}
              </Text>
              {renderMatchTeam(match.team_b_name, match.team_b_id)}
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
