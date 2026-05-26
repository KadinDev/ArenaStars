import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, UserPlus } from "lucide-react-native";
import { Header } from "@/components/Header";
import { PlayerCard } from "@/components/PlayerCard";
import { EmptyState } from "@/components/EmptyState";
import { ListSkeleton } from "@/components/Skeletons";
import { colors } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useCreatePlayer,
  usePlayers,
  useUpdatePlayer,
  useUpdatePlayerPhoto,
} from "@/hooks/useCachedQueries";
import { uploadPlayerPhoto } from "@/services/storage";
import type { Player } from "@/types/database";

export default function JogadoresScreen() {
  const { isAdmin } = useAdminAuth();
  const players = usePlayers();
  const createPlayer = useCreatePlayer();
  const updatePlayer = useUpdatePlayer();
  const updatePhoto = useUpdatePlayerPhoto();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [position, setPosition] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const filteredPlayers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return players.data ?? [];
    return (players.data ?? []).filter((player) =>
      [player.name, player.nickname, player.position]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term)),
    );
  }, [players.data, search]);

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
    setPhotoUri(null);
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
    setPhotoUri(null);
    setShowForm(true);
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
            ...(publicUrl ? { photo_url: publicUrl } : {}),
          },
        });
      } else {
        const player = await createPlayer.mutateAsync({
          name: name.trim(),
          nickname: nickname.trim() || undefined,
          position: position.trim() || undefined,
        });

        if (photoUri) {
          const publicUrl = await uploadPlayerPhoto(photoUri, player.id);
          await updatePhoto.mutateAsync({
            playerId: player.id,
            photoUrl: publicUrl,
          });
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
              <Pressable
                onPress={startCreate}
                className="h-12 w-12 items-center justify-center rounded-lg bg-primary"
              >
                <UserPlus color={colors.background} size={22} />
              </Pressable>
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
      </ScrollView>
    </SafeAreaView>
  );
}
