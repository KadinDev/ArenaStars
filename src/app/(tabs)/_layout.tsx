import { Tabs } from "expo-router";
import { CalendarDays, Home, Menu, Trophy, UsersRound } from "lucide-react-native";
import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardSecondary,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" }
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="jogos" options={{ title: "Jogos", tabBarIcon: ({ color }) => <CalendarDays color={color} size={22} /> }} />
      <Tabs.Screen name="jogadores" options={{ title: "Jogadores", tabBarIcon: ({ color }) => <UsersRound color={color} size={22} /> }} />
      <Tabs.Screen name="ranking" options={{ title: "Ranking", tabBarIcon: ({ color }) => <Trophy color={color} size={22} /> }} />
      <Tabs.Screen name="mais" options={{ title: "Mais", tabBarIcon: ({ color }) => <Menu color={color} size={22} /> }} />
      <Tabs.Screen name="registrar-jogo" options={{ href: null }} />
    </Tabs>
  );
}
