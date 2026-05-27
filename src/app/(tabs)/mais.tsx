import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { OrganizationSelector } from "@/components/OrganizationSelector";
import { clearLocalCache } from "@/storage/cacheService";
import { queryClient } from "@/storage/queryClient";
import { useAdminAuth } from "@/hooks/useAdminAuth";

export default function MaisScreen() {
  const { admin, isAdmin, login, logout } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submitLogin() {
    try {
      await login.mutateAsync({ email, password });
      setPassword("");
    } catch (error) {
      Alert.alert("Login recusado", error instanceof Error ? error.message : "Confira os dados.");
    }
  }

  async function clearCache() {
    await clearLocalCache();
    queryClient.clear();
    Alert.alert("Cache limpo", "Na proxima abertura os dados serao buscados novamente.");
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 110 }}>
        <Header title="Mais" subtitle="Configuracoes, ajuda e sessao admin." />
        <OrganizationSelector />

        <View className="mb-4 rounded-lg bg-card p-5">
          <Text className="text-lg font-black text-text">Economia Supabase</Text>
          <Text className="mt-2 text-sm leading-5 text-textSecondary">
            O app usa AsyncStorage e React Query Persist. Cada tela carrega cache local primeiro, considera dados frescos por 12 horas e mantem memoria por 24 horas.
          </Text>
        </View>

        <View className="mb-4 rounded-lg bg-card p-5">
          <Text className="text-lg font-black text-text">Ajuda</Text>
          <Text className="mt-2 text-sm leading-5 text-textSecondary">
            Cada organizacao tem jogadores, jogos e ranking proprios. Sem realtime, sem polling e com consultas paginadas usando somente campos necessarios.
          </Text>
        </View>

        <View className="rounded-lg bg-card p-5">
          <Text className="text-lg font-black text-text">Admin</Text>
          {isAdmin ? (
            <>
              <Text className="mt-2 text-sm text-textSecondary">{admin?.email}</Text>
              <Pressable onPress={() => logout.mutate()} className="mt-4 rounded-lg bg-purple py-4">
                <Text className="text-center font-black text-text">Sair do admin</Text>
              </Pressable>
            </>
          ) : (
            <View className="mt-4 gap-3">
              <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="email admin" placeholderTextColor="#6B7280" className="rounded-lg bg-cardSecondary p-4 text-text" />
              <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="senha" placeholderTextColor="#6B7280" className="rounded-lg bg-cardSecondary p-4 text-text" />
              <Pressable onPress={submitLogin} className="rounded-lg bg-primary py-4">
                <Text className="text-center font-black text-background">{login.isPending ? "Entrando..." : "Entrar"}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <Pressable onPress={clearCache} className="mt-4 rounded-lg border border-cardSecondary py-4">
          <Text className="text-center font-bold text-textSecondary">Limpar cache local</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
