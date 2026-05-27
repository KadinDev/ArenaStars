import { useEffect, useState } from "react";
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
import { Trophy, X } from "lucide-react-native";
import { colors } from "@/constants/theme";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  useCreateOrganization,
  useOrganizations,
} from "@/hooks/useCachedQueries";
import { uploadCompetitionLogo } from "@/services/storage";
import { useOrganizationStore } from "@/stores/organizationStore";

export function OrganizationSelector() {
  const organizations = useOrganizations();
  const { isAdmin } = useAdminAuth();
  const createOrganization = useCreateOrganization();
  const selectedOrganization = useOrganizationStore(
    (state) => state.selectedOrganization,
  );
  const setSelectedOrganization = useOrganizationStore(
    (state) => state.setSelectedOrganization,
  );
  const [name, setName] = useState("");
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!selectedOrganization && organizations.data?.[0]) {
      setSelectedOrganization(organizations.data[0]);
    }
  }, [organizations.data, selectedOrganization, setSelectedOrganization]);

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) setLogoUri(result.assets[0]?.uri ?? null);
  }

  async function submit() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatorio", "Informe o nome da competicao.");
      return;
    }

    try {
      const logoUrl = logoUri ? await uploadCompetitionLogo(logoUri) : null;
      await createOrganization.mutateAsync({ name, logo_url: logoUrl });
      setName("");
      setLogoUri(null);
      setModalVisible(false);
    } catch (error) {
      Alert.alert(
        "Nao foi possivel criar",
        error instanceof Error ? error.message : "Tente novamente.",
      );
    }
  }

  return (
    <View className="mb-4 rounded-lg bg-card p-4">
      <View className="mb-3 flex-row items-center">
        <Trophy color={colors.primary} size={20} />
        <Text className="ml-2 text-lg font-black text-text">Competicao</Text>
      </View>

      <Pressable
        onPress={() => setModalVisible(true)}
        className="flex-row items-center rounded-lg bg-cardSecondary p-3"
      >
        <View className="h-12 w-12 overflow-hidden rounded-lg bg-card">
          {selectedOrganization?.logo_url ? (
            <Image
              source={{ uri: selectedOrganization.logo_url }}
              style={{ width: 48, height: 48 }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View className="h-full items-center justify-center">
              <Trophy color={colors.primary} size={22} />
            </View>
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className="font-black text-text" numberOfLines={1}>
            {selectedOrganization?.name ?? "Selecionar competicao"}
          </Text>
          <Text className="mt-1 text-xs text-textSecondary">
            Toque para trocar
          </Text>
        </View>
      </Pressable>

      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/70">
          <View className="max-h-[85%] rounded-t-lg bg-background p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-2xl font-black text-text">Competicões</Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                className="h-11 w-11 items-center justify-center rounded-lg bg-card"
              >
                <X color={colors.text} size={20} />
              </Pressable>
            </View>

            <ScrollView className="max-h-80">
              {(organizations.data ?? []).map((organization) => {
                const active = organization.id === selectedOrganization?.id;
                return (
                  <Pressable
                    key={organization.id}
                    onPress={() => {
                      setSelectedOrganization(organization);
                      setModalVisible(false);
                    }}
                    className={`mb-2 flex-row items-center rounded-lg border p-3 ${active ? "border-primary bg-cardSecondary" : "border-cardSecondary bg-card"}`}
                  >
                    <View className="h-12 w-12 overflow-hidden rounded-lg bg-cardSecondary">
                      {organization.logo_url ? (
                        <Image
                          source={{ uri: organization.logo_url }}
                          style={{ width: 48, height: 48 }}
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
                      className="ml-3 flex-1 font-bold text-text"
                      numberOfLines={1}
                    >
                      {organization.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {isAdmin ? (
              <View className="mt-4 rounded-lg bg-card p-4">
                <Text className="mb-3 text-lg font-black text-text">
                  Nova competicao
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="nome da competicao"
                  placeholderTextColor="#6B7280"
                  className="rounded-lg bg-cardSecondary p-4 text-text"
                />
                <Pressable
                  onPress={pickLogo}
                  className="mt-3 rounded-lg border border-cardSecondary py-4"
                >
                  <Text className="text-center font-bold text-textSecondary">
                    {logoUri ? "Logo selecionada" : "Selecionar logo opcional"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={submit}
                  disabled={createOrganization.isPending}
                  className="mt-3 rounded-lg bg-primary py-4"
                >
                  <Text className="text-center font-black text-background">
                    {createOrganization.isPending
                      ? "Criando..."
                      : "Criar competicao"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
