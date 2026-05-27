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
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, UserPlus, UsersRound, X } from "lucide-react-native";
import { Header } from "@/components/Header";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { colors } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useCreatePlayer,
  useAddPlayerToOrganization,
  useAllPlayers,
  useAssignPlayerToTeam,
  useCreateTeam,
  usePlayers,
  useTeamPlayers,
  useTeams,
  useUpdatePlayer,
  useUpdatePlayerPhoto,
} from "@/hooks/useCachedQueries";
import { uploadPlayerPhoto } from "@/services/storage";
import type { DominantFoot, Player } from "@/types/database";

const footOptions: Array<{ value: DominantFoot; label: string }> = [
  { value: "direito", label: "Direito" },
  { value: "esquerdo", label: "Esquerdo" },
  { value: "ambos", label: "Ambos" }
];

export default function JogadoresScreen() {
  const { isAdmin } = useAdminAuth();
  const players = usePlayers();
  const allPlayers = useAllPlayers();
  const teams = useTeams();
  const teamPlayers = useTeamPlayers();
  const addPlayerToOrganization = useAddPlayerToOrganization();
  const assignPlayerToTeam = useAssignPlayerToTeam();
  const createTeam = useCreateTeam();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const updatePhoto = useUpdatePlayerPhoto();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [addExistingVisible, setAddExistingVisible] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [dominantFoot, setDominantFoot] = useState<DominantFoot | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [addExistingTeamId, setAddExistingTeamId] = useState<string | null>(null);

  const teamByPlayerId = useMemo(
    () => new Map((teamPlayers.data ?? []).map((item) => [item.player_id, item.team_id])),
    [teamPlayers.data],
  );

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players.data ?? [];
    return (players.data ?? []).filter((player) =>
      [player.name, player.nickname, player.position]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [players.data, search]);

  const availablePlayers = useMemo(() => {
    const currentIds = new Set((players.data ?? []).map((player) => player.id));
    return (allPlayers.data ?? []).filter((player) => !currentIds.has(player.id));
  }, [allPlayers.data, players.data]);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setPhotoUri(result.assets[0]?.uri ?? null);
  }

  function resetForm() {
    setEditingPlayerId(null);
    setName("");
    setNickname("");
    setPosition("");
    setJerseyNumber("");
    setDominantFoot(null);
    setPhotoUri(null);
    setTeamId(null);
  }

  function startCreate() {
    resetForm();
    setShowForm((value) => !value);
  }

  function startEdit(player: Player) {
    setEditingPlayerId(player.id);
    setName(player.name);
    setNickname(player.nickname ?? "");
    setPosition(player.position ?? "");
    setJerseyNumber(player.jersey_number ? String(player.jersey_number) : "");
    setDominantFoot(player.dominant_foot);
    setTeamId(teamByPlayerId.get(player.id) ?? null);
    setPhotoUri(null);
    setShowForm(true);
  }

  async function submitTeam() {
    if (!newTeamName.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome do time.");
      return;
    }

    try {
      await createTeam.mutateAsync({ name: newTeamName });
      setNewTeamName("");
    } catch (error) {
      Alert.alert("Nao foi possivel criar time", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  async function submitPlayer() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome do jogador.");
      return;
    }

    try {
      const wasEditing = Boolean(editingPlayerId);
      if (editingPlayerId) {
        let publicUrl: string | undefined;
        if (photoUri) {
          publicUrl = await uploadPlayerPhoto(photoUri, editingPlayerId);
        }

        await updatePlayer.mutateAsync({
          playerId: editingPlayerId,
          data: {
            name: name.trim(),
            nickname: nickname.trim() || undefined,
            position: position.trim() || undefined,
            jersey_number: jerseyNumber.trim() ? Number(jerseyNumber) : null,
            dominant_foot: dominantFoot,
            ...(publicUrl ? { photo_url: publicUrl } : {}),
          },
        });
        await assignPlayerToTeam.mutateAsync({ playerId: editingPlayerId, teamId });
      } else {
        const player = await createPlayer.mutateAsync({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          position: position.trim() || undefined,
          jersey_number: jerseyNumber.trim() ? Number(jerseyNumber) : null,
          dominant_foot: dominantFoot,
        });

        if (photoUri) {
          const publicUrl = await uploadPlayerPhoto(photoUri, player.id);
          await updatePhoto.mutateAsync({
            playerId: player.id,
            photoUrl: publicUrl,
          });
        }
        if (teamId) {
          await assignPlayerToTeam.mutateAsync({ playerId: player.id, teamId });
        }
      }

      resetForm();
      setShowForm(false);
      Alert.alert(
        wasEditing ? "Jogador atualizado" : "Jogador cadastrado",
        "A lista local sera atualizada em background.",
      );
    } catch (error) {
      Alert.alert(
        "Nao foi possivel salvar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  async function addExistingPlayer(player: Player) {
    try {
      await addPlayerToOrganization.mutateAsync({
        playerId: player.id,
        profile: {
          position: player.position,
          jersey_number: player.jersey_number,
          dominant_foot: player.dominant_foot,
        },
      });
      if (addExistingTeamId) {
        await assignPlayerToTeam.mutateAsync({ playerId: player.id, teamId: addExistingTeamId });
      }
      setAddExistingVisible(false);
      Alert.alert("Jogador adicionado", `${player.name} agora faz parte desta competicao.`);
    } catch (error) {
      Alert.alert("Nao foi possivel adicionar", error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        <Header
          title="Jogadores"
          subtitle="Cadastro, perfil e estatisticas individuais."
          right={
            isAdmin ? (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setAddExistingVisible(true)}
                  className="h-12 w-12 items-center justify-center rounded-lg bg-card"
                >
                  <UsersRound color={colors.text} size={22} />
                </Pressable>
                <Pressable
                  onPress={startCreate}
                  className="h-12 w-12 items-center justify-center rounded-lg bg-primary"
                >
                  <UserPlus color={colors.background} size={22} />
                </Pressable>
              </View>
            ) : null
          }
        />

        <View className="mb-4 flex-row items-center rounded-lg bg-card px-4">
          <Search color={colors.muted} size={18} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="buscar jogador"
            placeholderTextColor="#6B7280"
            className="ml-3 flex-1 py-4 text-text"
          />
        </View>

        {isAdmin ? (
          <View className="mb-4 rounded-lg bg-card p-4">
            <Text className="mb-3 text-lg font-black text-text">Times da competicao</Text>
            <View className="mb-3 flex-row gap-2">
              <TextInput
                value={newTeamName}
                onChangeText={setNewTeamName}
                placeholder="novo time"
                placeholderTextColor="#6B7280"
                className="flex-1 rounded-lg bg-cardSecondary p-4 text-text"
              />
              <Pressable onPress={submitTeam} disabled={createTeam.isPending} className="rounded-lg bg-primary px-4 justify-center">
                <Text className="font-black text-background">{createTeam.isPending ? "..." : "Criar"}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {(teams.data ?? []).map((team) => (
                <View key={team.id} className="rounded-lg bg-cardSecondary px-4 py-3">
                  <Text className="font-bold text-text">{team.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {showForm ? (
          <View className="mb-5 rounded-lg bg-card p-5">
            <Text className="mb-4 text-lg font-black text-text">
              {editingPlayerId ? "Editar jogador" : "Novo jogador"}
            </Text>
            <View className="gap-3">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="nome"
                placeholderTextColor="#6B7280"
                className="rounded-lg bg-cardSecondary p-4 text-text"
              />
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="apelido opcional"
                placeholderTextColor="#6B7280"
                className="rounded-lg bg-cardSecondary p-4 text-text"
              />
              <TextInput
                value={position}
                onChangeText={setPosition}
                placeholder="posicao opcional"
                placeholderTextColor="#6B7280"
                className="rounded-lg bg-cardSecondary p-4 text-text"
              />
              <TextInput
                value={jerseyNumber}
                onChangeText={setJerseyNumber}
                keyboardType="number-pad"
                placeholder="numero da camisa opcional"
                placeholderTextColor="#6B7280"
                className="rounded-lg bg-cardSecondary p-4 text-text"
              />
              <View className="flex-row gap-2">
                {footOptions.map((option) => {
                  const active = dominantFoot === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setDominantFoot(active ? null : option.value)}
                      className={`flex-1 rounded-lg py-3 ${active ? "bg-primary" : "bg-cardSecondary"}`}
                    >
                      <Text className={`text-center text-xs font-black ${active ? "text-background" : "text-textSecondary"}`}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-xs font-black uppercase tracking-widest text-textSecondary">Time nesta competicao</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <Pressable onPress={() => setTeamId(null)} className={`rounded-lg px-4 py-3 ${!teamId ? "bg-primary" : "bg-cardSecondary"}`}>
                  <Text className={`font-bold ${!teamId ? "text-background" : "text-textSecondary"}`}>Sem time</Text>
                </Pressable>
                {(teams.data ?? []).map((team) => {
                  const active = team.id === teamId;
                  return (
                    <Pressable key={team.id} onPress={() => setTeamId(team.id)} className={`rounded-lg px-4 py-3 ${active ? "bg-primary" : "bg-cardSecondary"}`}>
                      <Text className={`font-bold ${active ? "text-background" : "text-textSecondary"}`}>{team.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={pickPhoto}
                className="rounded-lg border border-cardSecondary py-4"
              >
                <Text className="text-center font-bold text-textSecondary">
                  {photoUri
                    ? "Nova foto selecionada"
                    : editingPlayerId
                      ? "Trocar foto"
                      : "Selecionar foto"}
                </Text>
              </Pressable>
              <View className="flex-row gap-3">
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
                  onPress={submitPlayer}
                  disabled={
                    createPlayer.isPending ||
                    updatePhoto.isPending ||
                    updatePlayer.isPending
                  }
                  className="flex-1 rounded-lg bg-primary py-4"
                >
                  <Text className="text-center font-black text-background">
                    {createPlayer.isPending ||
                    updatePhoto.isPending ||
                    updatePlayer.isPending
                      ? "Salvando..."
                      : editingPlayerId
                        ? "Salvar"
                        : "Cadastrar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {players.isLoading ? <ListSkeleton /> : null}
        {filteredPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={isAdmin ? () => startEdit(player) : undefined}
          />
        ))}
        {!players.isLoading && !filteredPlayers.length ? (
          <EmptyState
            title="Nenhum jogador"
            message={
              isAdmin
                ? "Toque no botao de adicionar para cadastrar."
                : "Os jogadores cadastrados vao aparecer aqui."
            }
          />
        ) : null}

        <Modal transparent visible={addExistingVisible} animationType="fade" onRequestClose={() => setAddExistingVisible(false)}>
          <View className="flex-1 justify-end bg-black/70">
            <View className="max-h-[80%] rounded-t-lg bg-background p-5">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-2xl font-black text-text">Adicionar jogador</Text>
                <Pressable onPress={() => setAddExistingVisible(false)} className="h-11 w-11 items-center justify-center rounded-lg bg-card">
                  <X color={colors.text} size={20} />
                </Pressable>
              </View>
              <ScrollView>
                <Text className="mb-2 text-xs font-black uppercase tracking-widest text-textSecondary">Time ao adicionar</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                  <Pressable onPress={() => setAddExistingTeamId(null)} className={`rounded-lg px-4 py-3 ${!addExistingTeamId ? "bg-primary" : "bg-card"}`}>
                    <Text className={`font-bold ${!addExistingTeamId ? "text-background" : "text-textSecondary"}`}>Sem time</Text>
                  </Pressable>
                  {(teams.data ?? []).map((team) => {
                    const active = team.id === addExistingTeamId;
                    return (
                      <Pressable key={team.id} onPress={() => setAddExistingTeamId(team.id)} className={`rounded-lg px-4 py-3 ${active ? "bg-primary" : "bg-card"}`}>
                        <Text className={`font-bold ${active ? "text-background" : "text-textSecondary"}`}>{team.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {availablePlayers.map((player) => (
                  <Pressable key={player.id} onPress={() => addExistingPlayer(player)} className="mb-2 flex-row items-center rounded-lg bg-card p-3">
                    <View className="h-12 w-12 overflow-hidden rounded-lg bg-cardSecondary">
                      {player.photo_url ? (
                        <Image source={{ uri: player.photo_url }} style={{ width: 48, height: 48 }} contentFit="cover" cachePolicy="memory-disk" />
                      ) : (
                        <View className="h-full items-center justify-center">
                          <UsersRound color={colors.muted} size={20} />
                        </View>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-text" numberOfLines={1}>{player.name}</Text>
                      <Text className="mt-1 text-xs text-textSecondary" numberOfLines={1}>{player.nickname || "Sem apelido"} - {player.position || "Jogador"}</Text>
                    </View>
                  </Pressable>
                ))}
                {!availablePlayers.length ? <EmptyState title="Sem jogadores disponiveis" message="Todos os jogadores ja estao nesta competicao." /> : null}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}
