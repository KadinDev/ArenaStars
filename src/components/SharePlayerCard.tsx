import { Image } from "expo-image";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import {
  Footprints,
  Goal,
  Shield,
  Shirt,
  Trophy,
  UserRound,
} from "lucide-react-native";
import { colors } from "@/constants/theme";
import type { PlayerStats } from "@/types/database";

type SharePlayerCardProps = {
  data: PlayerStats;
  competitionName: string;
  title: string;
  isChampion: boolean;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="mb-2 flex-row items-center rounded-lg border border-[#114B73] bg-[#07111F]/90 px-3 py-2">
      <View className="h-7 w-7 items-center justify-center rounded-md bg-[#0B1A2E]">
        {icon}
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-[9px] font-black uppercase text-[#29CFFF]">
          {label}
        </Text>
        <Text
          className="text-sm font-black uppercase text-text"
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatBlock({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-[9px] font-black uppercase text-[#65D7FF]" numberOfLines={1}>
        {label}
      </Text>
      <Text className="mt-1 text-4xl font-black text-[#20BFFF]" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function SharePlayerCard({
  data,
  competitionName,
  title,
  isChampion,
}: SharePlayerCardProps) {
  const number = data.player.jersey_number
    ? String(data.player.jersey_number)
    : "--";
  const firstName = data.player.name.split(" ")[0] ?? data.player.name;
  const lastName =
    data.player.name.split(" ").slice(1).join(" ") ||
    data.player.nickname ||
    "";

  return (
    <View
      style={{ width: 390, height: 640 }}
      className="overflow-hidden bg-[#030813] p-4"
    >
      <View className="absolute left-0 top-0 h-full w-full bg-[#051A3D]" />
      {data.player.photo_url ? (
        <Image
          source={{ uri: data.player.photo_url }}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            opacity: 0.18,
          }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : null}
      <View className="absolute left-0 top-0 h-full w-full bg-[#020611]/75" />
      <View className="absolute right-0 top-0 h-full w-48 bg-[#0B42A0]" />
      <View className="absolute bottom-0 left-0 h-36 w-full bg-[#020611]" />

      <View className="relative flex-1 overflow-hidden rounded-lg border border-[#2CCBFF] bg-[#050B18]/95 p-4">
        <View className="absolute right-4 top-4">
          <Text className="text-6xl font-black text-[#2CCBFF]/20">
            {number}
          </Text>
        </View>

        <View className="flex-row items-center">
          {isChampion ? (
            <Trophy color={colors.primary} size={18} />
          ) : (
            <Shield color={colors.primary} size={18} />
          )}
          <Text
            className="ml-2 flex-1 text-[10px] font-black uppercase tracking-widest text-primary"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        <View className="mt-4 flex-row">
          <View className="flex-1 pr-2">
            <Text
              className="text-2xl font-black uppercase text-text"
              numberOfLines={1}
            >
              {firstName}
            </Text>
            <Text
              adjustsFontSizeToFit
              className="text-4xl font-black uppercase text-[#21C8FF]"
              numberOfLines={2}
            >
              {lastName || firstName}
            </Text>
            <View className="mt-3 self-start rounded-lg border border-[#2CCBFF] bg-[#061426] px-4 py-2">
              <Text className="text-xl font-black text-[#21C8FF]">
                #{number}
              </Text>
            </View>
          </View>

          <View className="h-40 w-28 overflow-hidden rounded-lg border border-[#2CCBFF] bg-[#07111F]">
            {data.player.photo_url ? (
              <Image
                source={{ uri: data.player.photo_url }}
                style={{ width: 112, height: 160 }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View className="h-full items-center justify-center">
                <UserRound color={colors.textSecondary} size={42} />
              </View>
            )}
          </View>
        </View>

        <View className="mt-3 w-52">
          <InfoRow
            icon={<UserRound color={colors.text} size={16} />}
            label="Apelido"
            value={data.player.nickname ?? "Jogador"}
          />
          <InfoRow
            icon={<Goal color={colors.text} size={16} />}
            label="Posicao"
            value={data.player.position ?? "Jogador"}
          />
          <InfoRow
            icon={<Footprints color={colors.text} size={16} />}
            label="Perna"
            value={data.player.dominant_foot ?? "Nao informado"}
          />
          <InfoRow
            icon={<Shirt color={colors.text} size={16} />}
            label="Numero"
            value={number}
          />
          <InfoRow
            icon={<Shield color={colors.text} size={16} />}
            label="Time"
            value={data.team?.name ?? "Sem time"}
          />
        </View>

        <View className="mt-auto min-h-28 rounded-lg border border-[#2CCBFF] bg-[#041027]/95 p-3">
          <Text
            className="mb-2 text-center text-[10px] font-black uppercase tracking-widest text-primary"
            numberOfLines={1}
          >
            {competitionName}
          </Text>
          <View className="flex-row flex-1 items-center">
            <StatBlock label="Gols" value={data.goals} />
            <View className="mx-2 h-14 w-px bg-[#2CCBFF]" />
            <StatBlock label="Jogos" value={data.matches} />
            <View className="mx-2 h-14 w-px bg-[#2CCBFF]" />
            <StatBlock label="Assist." value={data.assists} />
          </View>
        </View>
      </View>
    </View>
  );
}
