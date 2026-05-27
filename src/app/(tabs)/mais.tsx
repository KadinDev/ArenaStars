import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy } from "lucide-react-native";
import { Header } from "@/components/Header";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { clearLocalCache } from "@/storage/cacheService";
import { queryClient } from "@/storage/queryClient";
import { colors } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSetCompetitionChampion, useTeams } from "@/hooks/useCachedQueries";

export default function MaisScreen() {
  const { admin, isAdmin, login, logout } = useAdminAuth();
  const teams = useTeams();
  const setChampion = useSetCompetitionChampion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const currentChampion = useMemo(
    () => (teams.data ?? []).find((team) => team.is_champion),
    [teams.data],
  );
  const [championTeamId, setChampionTeamId] = useState<string | null>(null);
  const [championTitle, setChampionTitle] = useState("");
  const [championCount, setChampionCount] = useState("");

  useEffect(() => {
    if (currentChampion) {
      setChampionTeamId(currentChampion.id);
      setChampionTitle(currentChampion.champion_title ?? "");
      setChampionCount(
        currentChampion.champion_count
          ? String(currentChampion.champion_count)
          : "",
      );
    }
  }, [currentChampion]);

  async function submitLogin() {
    try {
      await login.mutateAsync({ email, password });
      setPassword("");
    } catch (error) {
      Alert.alert(
        "Login recusado",
        error instanceof Error ? error.message : "Confira os dados.",
      );
    }
  }

  async function clearCache() {
    await clearLocalCache();
    queryClient.clear();
    Alert.alert(
      "Cache limpo",
      "Na proxima abertura os dados serao buscados novamente.",
    );
  }

  async function submitChampion() {
    if (!championTeamId) {
      Alert.alert("Escolha o time", "Selecione qual time recebera o destaque.");
      return;
    }

    if (!championTitle.trim()) {
      Alert.alert(
        "Titulo obrigatorio",
        "Informe o titulo, exemplo: Campeao da Copa do Rei.",
      );
      return;
    }

    try {
      await setChampion.mutateAsync({
        teamId: championTeamId,
        title: championTitle.trim(),
        count: Number(championCount) > 0 ? Number(championCount) : null,
      });
      Alert.alert(
        "Campeao definido",
        "A Home e os perfis dos jogadores desse time foram atualizados.",
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
        <Header title="Mais" subtitle="Configuracoes, ajuda e sessao admin." />
        <OrganizationSelector showChangeButton />

        <View className="mb-4 rounded-lg bg-card p-5">
          <Text className="text-lg font-black text-text">
            Economia Supabase
          </Text>
          <Text className="mt-2 text-sm leading-5 text-textSecondary">
            O app usa AsyncStorage e React Query Persist. Cada tela carrega
            cache local primeiro, considera dados frescos por 30 minutos e
            mantem memoria por 24 horas.
          </Text>
        </View>

        <View className="mb-4 rounded-lg bg-card p-5">
          <Text className="text-lg font-black text-text">Ajuda</Text>
          <Text className="mt-2 text-sm leading-5 text-textSecondary">
            Cada organizacao tem jogadores, jogos e ranking proprios. Sem
            realtime, sem polling e com consultas paginadas usando somente
            campos necessarios.
          </Text>
        </View>

        <View className="rounded-lg bg-card p-5">
          <Text className="text-lg font-black text-text">Admin</Text>
          {isAdmin ? (
            <>
              <Text className="mt-2 text-sm text-textSecondary">
                {admin?.email}
              </Text>
              <Pressable
                onPress={() => logout.mutate()}
                className="mt-4 rounded-lg bg-purple py-4"
              >
                <Text className="text-center font-black text-text">
                  Sair do admin
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="mt-4 gap-3">
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="email admin"
                placeholderTextColor="#6B7280"
                className="rounded-lg bg-cardSecondary p-4 text-text"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="senha"
                placeholderTextColor="#6B7280"
                className="rounded-lg bg-cardSecondary p-4 text-text"
              />
              <Pressable
                onPress={submitLogin}
                className="rounded-lg bg-primary py-4"
              >
                <Text className="text-center font-black text-background">
                  {login.isPending ? "Entrando..." : "Entrar"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {isAdmin ? (
          <View className="mt-4 rounded-lg bg-card p-5">
            <View className="mb-4 flex-row items-center">
              <Trophy color={colors.primary} size={20} />
              <Text className="ml-2 text-lg font-black text-text">
                Campeão da competição
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {(teams.data ?? []).map((team) => {
                const active = team.id === championTeamId;
                return (
                  <Pressable
                    key={team.id}
                    onPress={() => setChampionTeamId(team.id)}
                    className={`w-32 rounded-lg border p-3 ${active ? "border-primary bg-cardSecondary" : "border-cardSecondary bg-background"}`}
                  >
                    <View className="h-14 w-14 self-center overflow-hidden rounded-lg bg-card">
                      {team.logo_url ? (
                        <Image
                          source={{ uri: team.logo_url }}
                          style={{ width: 56, height: 56 }}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View className="h-full items-center justify-center">
                          <Trophy color={colors.muted} size={20} />
                        </View>
                      )}
                    </View>
                    <Text
                      className="mt-2 text-center text-sm font-bold text-text"
                      numberOfLines={2}
                    >
                      {team.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <TextInput
              value={championTitle}
              onChangeText={setChampionTitle}
              placeholder="ex: Campeao da Copa do Rei"
              placeholderTextColor="#6B7280"
              className="mt-4 rounded-lg bg-cardSecondary p-4 text-text"
            />
            <TextInput
              value={championCount}
              onChangeText={setChampionCount}
              keyboardType="number-pad"
              placeholder="vezes campeao opcional"
              placeholderTextColor="#6B7280"
              className="mt-3 rounded-lg bg-cardSecondary p-4 text-text"
            />
            <Pressable
              onPress={submitChampion}
              disabled={setChampion.isPending}
              className="mt-3 rounded-lg bg-primary py-4"
            >
              <Text className="text-center font-black text-background">
                {setChampion.isPending ? "Salvando..." : "Salvar destaque"}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <Pressable
          onPress={clearCache}
          className="mt-4 rounded-lg border border-cardSecondary py-4"
        >
          <Text className="text-center font-bold text-textSecondary">
            Limpar cache local
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
